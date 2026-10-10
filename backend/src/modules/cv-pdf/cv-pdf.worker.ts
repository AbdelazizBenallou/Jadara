import type { Prisma } from "@prisma/client";
import { env } from "../../../framework/config/env.js";
import logger from "../../../framework/config/logger.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { cvPdfRepository } from "./cv-pdf.repository.js";
import { cvAudit } from "./cv-pdf.audit.js";
import { CV_REQUEST_STATUS, TEMPLATE_VERSION } from "./cv-pdf.constants.js";
import {
  buildTemplateData,
  computeDataHash,
  computeSectionHashes,
  renderLatexCv,
  toSnapshot,
  type CvJobSnapshot,
  type CvSnapshotData,
} from "./cv-pdf.render.js";
import { buildSourceText, detectLanguage, translateSnapshot } from "./cv-pdf.translate.js";

const WORKER_ID = `cv-worker-${process.pid}-${Date.now()}`;

function fileNameFor(data: CvSnapshotData): string {
  const p = data.profile;
  return `cv-${p?.first_name || "user"}-${p?.last_name || ""}.pdf`
    .replace(/\s+/g, "-")
    .toLowerCase();
}

async function resolveSnapshot(jobUserId: number, raw: unknown): Promise<CvJobSnapshot> {
  const wrapper = raw as CvJobSnapshot | null;
  if (wrapper && wrapper.data) return wrapper;
  const auditId = await cvAudit.latestId(jobUserId);
  return {
    audit_id: auditId,
    data: toSnapshot(await cvPdfRepository.getAllCvData(jobUserId)),
  };
}

async function processJob(requestId: number): Promise<void> {
  const job = await cvPdfRepository.getRequestById(requestId);
  if (!job || job.status !== CV_REQUEST_STATUS.PROCESSING) return;

  // A newer queued/processing/completed job for the same language wins.
  if (await cvPdfRepository.hasNewerActiveJob(job.user_id, job.language, job.id)) {
    await cvPdfRepository.markSuperseded(job.id);
    return;
  }

  try {
    const snapshot = await resolveSnapshot(job.user_id, job.cv_snapshot);
    const sourceLang = job.source_lang ?? detectLanguage(buildSourceText(snapshot.data));
    const rendered = await translateSnapshot(snapshot.data, sourceLang, job.language);
    const templateData = buildTemplateData(rendered, job.language);
    const pdf = renderLatexCv(templateData, job.language);

    const { objectName, fileSize } = await storage.uploadBuffer(
      BUCKETS.documents,
      "cv-pdfs",
      job.user_id,
      pdf,
      fileNameFor(snapshot.data),
      "application/pdf",
    );

    const dataHash = job.data_hash ?? computeDataHash(snapshot.data);
    const sectionHashes = (job.section_hashes as Prisma.InputJsonValue | null) ??
      computeSectionHashes(snapshot.data);

    const completed = await cvPdfRepository.completeRequest(job.id, {
      fileUrl: objectName,
      fileSize,
      dataHash,
      sectionHashes,
      templateVersion: TEMPLATE_VERSION,
      sourceLang: job.source_lang,
    });

    if (completed === 0) {
      // A superseding job won the race; discard this PDF so we don't keep
      // orphaned objects or mark stale data as the current version.
      await storage.delete(BUCKETS.documents, objectName);
      logger.info({ requestId: job.id }, "CV job superseded during generation; discarded");
      return;
    }

    await cvPdfRepository.createVersion(job.user_id, job.language, {
      fileUrl: objectName,
      fileSize,
      dataHash,
      sectionHashes,
      templateVersion: TEMPLATE_VERSION,
      lastAuditId: snapshot.audit_id,
    });

    logger.info(
      { requestId: job.id, userId: job.user_id, language: job.language },
      "CV generation completed",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (job.attempts < env.CV_JOB_MAX_ATTEMPTS) {
      await cvPdfRepository.requeue(job.id, message);
      logger.warn({ requestId: job.id, attempts: job.attempts, err: message }, "CV generation retry");
    } else {
      await cvPdfRepository.failRequest(job.id, message);
      logger.error({ requestId: job.id, err: message }, "CV generation failed");
    }
  }
}

let ticking = false;

async function tick(): Promise<void> {
  if (ticking) return;
  ticking = true;
  try {
    await cvPdfRepository.recoverStaleJobs(env.CV_JOB_STALE_MS, env.CV_JOB_MAX_ATTEMPTS);
    const ids = await cvPdfRepository.claimQueued(WORKER_ID, env.CV_WORKER_CONCURRENCY);
    if (ids.length > 0) {
      await Promise.all(ids.map((id) => processJob(id)));
    }
  } catch (err) {
    logger.error({ err }, "CV worker tick failed");
  } finally {
    ticking = false;
  }
}

let timer: NodeJS.Timeout | null = null;

export function startCvWorker(): void {
  if (!env.CV_WORKER_ENABLED) {
    logger.info("CV worker disabled (CV_WORKER_ENABLED=false)");
    return;
  }
  if (timer) return;
  logger.info(
    { intervalMs: env.CV_WORKER_INTERVAL_MS, concurrency: env.CV_WORKER_CONCURRENCY },
    "CV worker started",
  );
  timer = setInterval(() => {
    void tick();
  }, env.CV_WORKER_INTERVAL_MS);
  void tick();
}

export function stopCvWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

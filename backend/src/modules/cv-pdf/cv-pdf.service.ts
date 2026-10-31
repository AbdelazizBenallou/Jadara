import type { CVLanguage, Prisma } from "@prisma/client";
import { AppError } from "../../../framework/utils/AppError.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { cvPdfRepository } from "./cv-pdf.repository.js";
import { cvAudit } from "./cv-pdf.audit.js";
import {
  CV_ACTIVE_LANGUAGES,
  CV_REQUEST_STATUS,
  DEFAULT_CV_LANGUAGE,
  TEMPLATE_VERSION,
  type CvActiveLanguage,
} from "./cv-pdf.constants.js";
import {
  computeDataHash,
  computeSectionHashes,
  sectionsEqual,
  toSnapshot,
  type CvJobSnapshot,
} from "./cv-pdf.render.js";
import { buildSourceText, detectLanguage } from "./cv-pdf.translate.js";
import { v4 as uuid } from "uuid";

const presign = (objectName: string): Promise<string> =>
  storage.getPresignedUrl(BUCKETS.documents, objectName);

export type CvEnqueueJob = {
  id: number;
  language: CVLanguage;
  status: "queued" | "completed";
  cached: boolean;
  download_url: string | null;
};

export type CvEnqueueResult = {
  request_group: string;
  jobs: CvEnqueueJob[];
};

export const cvPdfService = {
  /**
   * Resolves the requested languages, then for each: serves the stored version
   * when it is up to date, otherwise enqueues an async generation job.
   */
  async enqueue(userId: number, languages?: CVLanguage[]): Promise<CvEnqueueResult> {
    const requested = languages?.length ? languages : [...CV_ACTIVE_LANGUAGES];
    const unique = [...new Set(requested)];

    for (const language of unique) {
      if (!CV_ACTIVE_LANGUAGES.includes(language as CvActiveLanguage)) {
        throw new AppError(`Language not supported yet: ${language}`, 400);
      }
    }

    // Read the audit cursor before the data so a concurrent mutation can never
    // make us mark stale data as fresh (worst case: one extra regeneration).
    const auditId = await cvAudit.latestId(userId);
    const snapshot = toSnapshot(await cvPdfRepository.getAllCvData(userId));
    const sectionHashes = computeSectionHashes(snapshot);
    const dataHash = computeDataHash(snapshot);
    const sourceLang = detectLanguage(buildSourceText(snapshot));
    const requestGroup = uuid();

    const jobs: CvEnqueueJob[] = [];

    for (const language of unique) {
      const version = await cvPdfRepository.getLatestVersion(userId, language);
      const fresh =
        version !== null &&
        version.template_version === TEMPLATE_VERSION &&
        version.last_audit_id >= auditId &&
        sectionsEqual(version.section_hashes as Record<string, string> | null, sectionHashes);

      if (fresh && version) {
        jobs.push({
          id: version.id,
          language,
          status: "completed",
          cached: true,
          download_url: await presign(version.file_url),
        });
        continue;
      }

      await cvPdfRepository.supersedeOutstanding(userId, language);

      const jobSnapshot: CvJobSnapshot = { audit_id: auditId, data: snapshot };
      const row = await cvPdfRepository.createQueued(userId, language, {
        requestGroup,
        dataHash,
        sectionHashes,
        templateVersion: TEMPLATE_VERSION,
        snapshot: jobSnapshot as unknown as Prisma.InputJsonValue,
        sourceLang,
      });

      jobs.push({
        id: row.id,
        language,
        status: CV_REQUEST_STATUS.QUEUED,
        cached: false,
        download_url: null,
      });
    }

    return { request_group: requestGroup, jobs };
  },

  async getStatus(userId: number, language?: CVLanguage) {
    const job = await cvPdfRepository.getLatestRequestFull(userId, language);
    if (!job) return null;

    let downloadUrl: string | null = null;
    if (job.status === CV_REQUEST_STATUS.COMPLETED && job.file_url) {
      downloadUrl = await presign(job.file_url);
    }

    return {
      id: job.id,
      status: job.status,
      language: job.language,
      request_group: job.request_group,
      missing_fields: job.missing_fields,
      file_size: job.file_size,
      error_message: job.error_message,
      download_url: downloadUrl,
      created_at: job.created_at,
      updated_at: job.updated_at,
    };
  },

  async getHistory(userId: number, query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(query.limit) || 5));

    const { requests, total } = await cvPdfRepository.getRequests(userId, page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      requests: await Promise.all(
        requests.map(async (r) => ({
          id: r.id,
          status: r.status,
          language: r.language,
          request_group: r.request_group,
          missing_fields: r.missing_fields,
          file_size: r.file_size,
          error_message: r.error_message,
          download_url:
            r.status === CV_REQUEST_STATUS.COMPLETED && r.file_url
              ? await presign(r.file_url)
              : null,
          created_at: r.created_at,
        })),
      ),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  /** Latest status for every active language (for the CV builder dashboard). */
  async getStatusAll(userId: number) {
    const results = await Promise.all(
      CV_ACTIVE_LANGUAGES.map((language) => this.getStatus(userId, language)),
    );
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },

  defaultLanguage: DEFAULT_CV_LANGUAGE,
};

export type CvPdfService = typeof cvPdfService;
export type { CvJobSnapshot };

import { Prisma, type CVLanguage } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";

const cvGenRequestSelect = {
  id: true,
  status: true,
  language: true,
  missing_fields: true,
  data_hash: true,
  file_url: true,
  file_size: true,
  error_message: true,
  request_group: true,
  template_version: true,
  source_lang: true,
  created_at: true,
  updated_at: true,
};

export type CvGenRequestFull = Prisma.cv_generation_requestsGetPayload<object>;

export const cvPdfRepository = {
  async getLatestRequest(userId: number, language?: CVLanguage) {
    return prisma.cv_generation_requests.findFirst({
      where: {
        user_id: userId,
        ...(language ? { language } : {}),
      },
      select: cvGenRequestSelect,
      orderBy: { id: "desc" },
    });
  },

  async getLatestCompleted(userId: number, language?: CVLanguage) {
    return prisma.cv_generation_requests.findFirst({
      where: {
        user_id: userId,
        status: "completed",
        ...(language ? { language } : {}),
      },
      select: cvGenRequestSelect,
      orderBy: { id: "desc" },
    });
  },

  async createRequest(
    userId: number,
    status: string,
    missingFields?: string[],
    dataHash?: string,
    language: CVLanguage = "EN",
  ) {
    return prisma.cv_generation_requests.create({
      data: {
        user_id: userId,
        status,
        language,
        missing_fields: missingFields ?? undefined,
        data_hash: dataHash ?? undefined,
      },
      select: cvGenRequestSelect,
    });
  },

  async updateRequest(
    id: number,
    data: {
      status?: string;
      file_url?: string;
      file_size?: number;
      error_message?: string;
      data_hash?: string;
    },
  ) {
    return prisma.cv_generation_requests.update({
      where: { id },
      data,
      select: cvGenRequestSelect,
    });
  },

  async getRequests(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.cv_generation_requests.findMany({
        where: { user_id: userId },
        select: cvGenRequestSelect,
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.cv_generation_requests.count({ where: { user_id: userId } }),
    ]);

    return { requests, total };
  },

  // ─── Job queue (async worker) ───────────────────────────
  async getRequestById(id: number): Promise<CvGenRequestFull | null> {
    return prisma.cv_generation_requests.findUnique({ where: { id } });
  },

  async getLatestRequestFull(userId: number, language?: CVLanguage) {
    return prisma.cv_generation_requests.findFirst({
      where: { user_id: userId, ...(language ? { language } : {}) },
      orderBy: { id: "desc" },
    });
  },

  async getActiveRequest(userId: number) {
    return prisma.cv_generation_requests.findFirst({
      where: { user_id: userId, status: { in: ["queued", "processing"] } },
      orderBy: { id: "desc" },
    });
  },

  async createQueued(
    userId: number,
    language: CVLanguage,
    data: {
      requestGroup: string;
      dataHash: string;
      sectionHashes: Prisma.InputJsonValue;
      templateVersion: string;
      snapshot: Prisma.InputJsonValue;
      sourceLang?: string | null;
    },
  ) {
    return prisma.cv_generation_requests.create({
      data: {
        user_id: userId,
        language,
        status: "queued",
        data_hash: data.dataHash,
        section_hashes: data.sectionHashes,
        template_version: data.templateVersion,
        cv_snapshot: data.snapshot,
        source_lang: data.sourceLang ?? null,
        request_group: data.requestGroup,
      },
      select: cvGenRequestSelect,
    });
  },

  async supersedeOutstanding(userId: number, language: CVLanguage) {
    const result = await prisma.cv_generation_requests.updateMany({
      where: {
        user_id: userId,
        language,
        status: { in: ["queued", "processing", "incomplete"] },
      },
      data: { status: "superseded", updated_at: new Date() },
    });
    return result.count;
  },

  async markSuperseded(id: number) {
    await prisma.cv_generation_requests.updateMany({
      where: { id, status: { in: ["queued", "processing"] } },
      data: { status: "superseded", finished_at: new Date(), updated_at: new Date() },
    });
  },

  /** True when a newer non-terminal job exists for the same user + language. */
  async hasNewerActiveJob(userId: number, language: CVLanguage, thanId: number) {
    const row = await prisma.cv_generation_requests.findFirst({
      where: {
        user_id: userId,
        language,
        id: { gt: thanId },
        status: { in: ["queued", "processing", "completed"] },
      },
      select: { id: true },
      orderBy: { id: "desc" },
    });
    return row !== null;
  },

  /** Requeue only when the job is still processing (never clobbers superseded). */
  async requeue(id: number, errorMessage?: string) {
    const result = await prisma.cv_generation_requests.updateMany({
      where: { id, status: "processing" },
      data: {
        status: "queued",
        worker_id: null,
        error_message: errorMessage ?? null,
        updated_at: new Date(),
      },
    });
    return result.count;
  },

  /** Complete only when still processing; returns 0 if it was superseded. */
  async completeRequest(
    id: number,
    data: {
      fileUrl: string;
      fileSize: number;
      dataHash: string;
      sectionHashes: Prisma.InputJsonValue;
      templateVersion: string;
      sourceLang?: string | null;
    },
  ) {
    const result = await prisma.cv_generation_requests.updateMany({
      where: { id, status: "processing" },
      data: {
        status: "completed",
        file_url: data.fileUrl,
        file_size: data.fileSize,
        data_hash: data.dataHash,
        section_hashes: data.sectionHashes,
        template_version: data.templateVersion,
        source_lang: data.sourceLang ?? null,
        error_message: null,
        finished_at: new Date(),
        updated_at: new Date(),
      },
    });
    return result.count;
  },

  async failRequest(id: number, errorMessage: string) {
    const result = await prisma.cv_generation_requests.updateMany({
      where: { id, status: "processing" },
      data: {
        status: "failed",
        error_message: errorMessage.slice(0, 2000),
        finished_at: new Date(),
        updated_at: new Date(),
      },
    });
    return result.count;
  },

  /** Atomically claim up to `limit` queued jobs for this worker. */
  async claimQueued(workerId: string, limit: number): Promise<number[]> {
    const rows = await prisma.$queryRaw<Array<{ id: number }>>`
      UPDATE cv_generation_requests
      SET status = 'processing',
          worker_id = ${workerId},
          started_at = now(),
          attempts = attempts + 1,
          updated_at = now()
      WHERE id IN (
        SELECT id FROM cv_generation_requests
        WHERE status = 'queued'
        ORDER BY id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}::int
      )
      RETURNING id
    `;
    return rows.map((r) => r.id);
  },

  /** Requeue or fail jobs left `processing` by a crashed worker. */
  async recoverStaleJobs(staleMs: number, maxAttempts: number): Promise<number> {
    const failed = await prisma.$executeRaw`
      UPDATE cv_generation_requests
      SET status = 'failed',
          error_message = 'Timed out while processing',
          finished_at = now(),
          updated_at = now()
      WHERE status = 'processing'
        AND started_at < now() - (${staleMs}::int * interval '1 millisecond')
        AND attempts >= ${maxAttempts}::int
    `;
    const requeued = await prisma.$executeRaw`
      UPDATE cv_generation_requests
      SET status = 'queued',
          worker_id = NULL,
          updated_at = now()
      WHERE status = 'processing'
        AND started_at < now() - (${staleMs}::int * interval '1 millisecond')
        AND attempts < ${maxAttempts}::int
    `;
    return failed + requeued;
  },

  // ─── Stored versions ────────────────────────────────────
  async getLatestVersion(userId: number, language: CVLanguage) {
    return prisma.cv_versions.findFirst({
      where: { user_id: userId, language },
      orderBy: { version: "desc" },
    });
  },

  async createVersion(
    userId: number,
    language: CVLanguage,
    data: {
      fileUrl: string;
      fileSize: number;
      dataHash: string;
      sectionHashes: Prisma.InputJsonValue;
      templateVersion: string;
      lastAuditId: number;
    },
  ) {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const last = await tx.cv_versions.findFirst({
            where: { user_id: userId, language },
            orderBy: { version: "desc" },
            select: { version: true },
          });
          return tx.cv_versions.create({
            data: {
              user_id: userId,
              language,
              version: (last?.version ?? 0) + 1,
              last_audit_id: data.lastAuditId,
              file_url: data.fileUrl,
              file_size: data.fileSize,
              data_hash: data.dataHash,
              section_hashes: data.sectionHashes,
              template_version: data.templateVersion,
            },
          });
        });
      } catch (err) {
        lastErr = err;
        const isConflict =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!isConflict) throw err;
      }
    }
    throw lastErr;
  },

  // ─── Fetch all CV data for PDF generation ───────────────
  async getAllCvData(userId: number) {
    const [
      user,
      profile,
      education,
      workExperience,
      skills,
      languages,
      certifications,
      projects,
      volunteering,
    ] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: { email: true },
      }),
      prisma.profiles.findUnique({
        where: { user_id: userId },
        select: {
          first_name: true,
          last_name: true,
          phone: true,
          date_of_birth: true,
          gender: true,
          bio: true,
          location: true,
        },
      }),
      prisma.education.findMany({
        where: { user_id: userId },
        select: {
          school: true,
          degree: true,
          field_of_study: true,
          description: true,
          start_date: true,
          end_date: true,
          is_current: true,
        },
        orderBy: { start_date: "desc" },
      }),
      prisma.work_experience.findMany({
        where: { user_id: userId },
        select: {
          company: true,
          job_title: true,
          description: true,
          start_date: true,
          end_date: true,
          is_current: true,
        },
        orderBy: { start_date: "desc" },
      }),
      prisma.user_skills.findMany({
        where: { user_id: userId },
        select: {
          level: true,
          skills: {
            select: {
              name: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.user_languages.findMany({
        where: { user_id: userId },
        select: {
          proficiency: true,
          languages: { select: { name: true } },
        },
      }),
      prisma.certifications.findMany({
        where: { user_id: userId },
        select: {
          name: true,
          issuer: true,
          issue_date: true,
          expiry_date: true,
        },
        orderBy: { issue_date: "desc" },
      }),
      prisma.projects.findMany({
        where: { user_id: userId, status: "verified" },
        select: {
          title: true,
          description: true,
          github_url: true,
          live_url: true,
          figma_url: true,
          start_date: true,
          end_date: true,
          created_at: true,
          sub_domain: { select: { id: true, name: true } },
        },
        orderBy: [{ start_date: { sort: "desc", nulls: "last" } }, { created_at: "desc" }],
      }),
      prisma.user_completed_volunteering.findMany({
        where: { user_id: userId },
        select: {
          completed_at: true,
          activity: {
            select: { title: true, location: true, start_date: true, end_date: true },
          },
          organization: { select: { name: true } },
        },
        orderBy: { completed_at: "desc" },
      }),
    ]);

    return {
      user,
      profile,
      education,
      workExperience,
      skills,
      languages,
      certifications,
      projects,
      volunteering,
    };
  },
};

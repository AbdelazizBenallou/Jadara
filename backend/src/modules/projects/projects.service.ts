import { AppError } from "../../../framework/utils/AppError.js";
import prisma from "../../../framework/config/prisma.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";
import { projectRepository } from "./projects.repository.js";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.validator.js";

export const projectService = {
  async getAll(userId: number, query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { projects, total } = await projectRepository.findAllByUserId(userId, page, limit);
    const totalPages = Math.ceil(total / limit);
    const summary = await projectRepository.ratingsSummary(projects.map((p) => p.id));

    return {
      projects: projects.map((p) => ({
        ...p,
        evidence_count: p.evidence.length,
        rating: summary.get(p.id)
          ? { average: summary.get(p.id)!.average, count: summary.get(p.id)!.count }
          : null,
      })),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  async getAllAdmin(query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { projects, total } = await projectRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);
    const summary = await projectRepository.ratingsSummary(projects.map((p) => p.id));

    return {
      projects: projects.map((p) => ({
        ...p,
        evidence_count: p.evidence.length,
        rating: summary.get(p.id)
          ? { average: summary.get(p.id)!.average, count: summary.get(p.id)!.count }
          : null,
      })),
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  async getById(userId: number, projectId: number) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    if (project.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }
    const summary = await projectRepository.ratingsSummary([projectId]);
    const { project_reviews, ...projectData } = project;
    return {
      ...projectData,
      rating: summary.get(projectId)
        ? { average: summary.get(projectId)!.average, count: summary.get(projectId)!.count }
        : null,
      reviews: project_reviews,
      evidence: await Promise.all(
        project.evidence.map(async (e) => ({
          ...e,
          download_url: e.file_url
            ? await storage.getPresignedUrl(BUCKETS.evidence, e.file_url)
            : null,
        })),
      ),
    };
  },

  async getByIdAdmin(projectId: number) {
    const project = await projectRepository.findByIdWithUser(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    const summary = await projectRepository.ratingsSummary([projectId]);
    const { project_reviews, ...projectData } = project;
    return {
      ...projectData,
      rating: summary.get(projectId)
        ? { average: summary.get(projectId)!.average, count: summary.get(projectId)!.count }
        : null,
      reviews: project_reviews,
    };
  },

  async create(userId: number, data: CreateProjectInput) {
    if (data.domain_id !== undefined && data.domain_id !== null) {
      const domain = await projectRepository.findExistingDomain(data.domain_id);
      if (!domain) {
        throw new AppError(`Domain not found: ${data.domain_id}`, 400);
      }
    }

    const project = await projectRepository.create(userId, {
      title: data.title,
      description: data.description,
      github_url: data.github_url,
      live_url: data.live_url,
      figma_url: data.figma_url,
      domain_id: data.domain_id,
    });

    return this.getById(userId, project.id);
  },

  async update(userId: number, projectId: number, data: UpdateProjectInput) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    if (project.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }
    if (project.status === "under_review" || project.status === "verified") {
      throw new AppError("Cannot edit a project that is under review or verified", 400);
    }

    if (data.domain_id !== undefined && data.domain_id !== null) {
      const domain = await projectRepository.findExistingDomain(data.domain_id);
      if (!domain) {
        throw new AppError(`Domain not found: ${data.domain_id}`, 400);
      }
    }

    await projectRepository.update(projectId, {
      title: data.title,
      description: data.description,
      github_url: data.github_url,
      live_url: data.live_url,
      figma_url: data.figma_url,
      domain_id: data.domain_id,
    });

    return this.getById(userId, projectId);
  },

  async delete(userId: number, projectId: number) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    if (project.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }
    if (project.status === "under_review" || project.status === "verified") {
      throw new AppError("Cannot delete a project that is under review or verified", 400);
    }

    for (const e of project.evidence) {
      if (e.file_url) {
        await storage.delete(BUCKETS.evidence, e.file_url);
      }
    }

    await projectRepository.delete(projectId);
  },

  async deleteAdmin(projectId: number) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    for (const e of project.evidence) {
      if (e.file_url) {
        await storage.delete(BUCKETS.evidence, e.file_url);
      }
    }
    await projectRepository.delete(projectId);
  },

  async submit(userId: number, projectId: number) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    if (project.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }
    if (project.status !== "draft" && project.status !== "submitted") {
      throw new AppError("Only draft projects can be submitted", 400);
    }

    await projectRepository.updateStatus(projectId, "under_review");

    return {
      project_id: projectId,
      status: "under_review",
    };
  },

  async uploadEvidence(
    userId: number,
    projectId: number,
    file: Express.Multer.File,
    data: { type: string; title: string; description?: string },
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    if (project.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }

    const result = await storage.upload(BUCKETS.evidence, "evidence", file, userId);

    const evidence = await projectRepository.addEvidence(projectId, {
      type: data.type,
      title: data.title,
      description: data.description,
      file_url: result.objectName,
    });

    return evidence;
  },

  async linkEvidence(userId: number, projectId: number, documentId: number) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    if (project.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }

    const doc = await prisma.documents.findUnique({
      where: { id: documentId },
      select: { id: true, user_id: true, name: true, file_url: true, mime_type: true },
    });
    if (!doc) {
      throw new AppError("Document not found", 404);
    }
    if (doc.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }

    const evidence = await projectRepository.addEvidence(projectId, {
      type: "linked_document",
      title: doc.name,
      description: `Linked from document #${doc.id}`,
      external_url: `document:${doc.id}`,
    });

    return evidence;
  },

  async removeEvidence(userId: number, projectId: number, evidenceId: number) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    if (project.user_id !== userId) {
      throw new AppError("Forbidden", 403);
    }

    const evidenceItem = await projectRepository.findEvidenceById(evidenceId);
    if (!evidenceItem || evidenceItem.project_id !== projectId) {
      throw new AppError("Evidence not found", 404);
    }

    if (evidenceItem.file_url && !evidenceItem.file_url.startsWith("document:")) {
      await storage.delete(BUCKETS.evidence, evidenceItem.file_url);
    }

    const deleted = await projectRepository.removeEvidence(evidenceId, projectId);
    if (deleted === 0) {
      throw new AppError("Evidence not found", 404);
    }
  },

  async forceStatus(projectId: number, status: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    return projectRepository.updateStatus(
      projectId,
      status as "draft" | "submitted" | "under_review" | "verified",
    );
  },
};

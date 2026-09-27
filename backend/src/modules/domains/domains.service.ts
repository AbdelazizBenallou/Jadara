import { AppError } from "../../../framework/utils/AppError.js";
import { domainRepository } from "./domains.repository.js";
import type {
  AssignSkillInput,
  CreateDomainInput,
  UpdateDomainInput,
} from "./domains.validator.js";

export const domainService = {
  async getAll(query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { domains, total } = await domainRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      domains,
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  async getById(id: number) {
    const domain = await domainRepository.findById(id);
    if (!domain) {
      throw new AppError("Domain not found", 404);
    }
    return domain;
  },

  async create(data: CreateDomainInput) {
    const existing = await domainRepository.findByName(data.name);
    if (existing) {
      throw new AppError("Domain name already exists", 409);
    }
    return domainRepository.create(data.name, data.description);
  },

  async update(id: number, data: UpdateDomainInput) {
    const domain = await domainRepository.findById(id);
    if (!domain) {
      throw new AppError("Domain not found", 404);
    }

    if (data.name !== undefined && data.name !== domain.name) {
      const duplicate = await domainRepository.findByName(data.name);
      if (duplicate) {
        throw new AppError("Domain name already exists", 409);
      }
    }

    return domainRepository.update(id, {
      name: data.name,
      description: data.description,
    });
  },

  async getSkillsByDomainId(id: number) {
    const domain = await domainRepository.findById(id);
    if (!domain) {
      throw new AppError("Domain not found", 404);
    }
    return domainRepository.getSkillsByDomainId(id);
  },

  async getReviewersByDomainId(id: number) {
    const domain = await domainRepository.findById(id);
    if (!domain) {
      throw new AppError("Domain not found", 404);
    }
    return {
      id: domain.id,
      name: domain.name,
      reviewers: await domainRepository.findReviewersByDomainId(id),
    };
  },

  async getAllReviewers() {
    return domainRepository.findAllReviewers();
  },

  async addSkillsToDomain(id: number, data: AssignSkillInput) {
    const domain = await domainRepository.findById(id);
    if (!domain) {
      throw new AppError("Domain not found", 404);
    }

    const requestedIds = data.skill_ids;

    const existingIds = new Set(await domainRepository.findExistingSkillIds(requestedIds));
    const linkedIds = new Set(await domainRepository.findLinkedSkillIds(requestedIds, id));

    const addedIds: number[] = [];
    const alreadyLinkedIds: number[] = [];
    const notFoundIds: number[] = [];

    for (const skillId of requestedIds) {
      if (!existingIds.has(skillId)) {
        notFoundIds.push(skillId);
      } else if (linkedIds.has(skillId)) {
        alreadyLinkedIds.push(skillId);
      } else {
        addedIds.push(skillId);
      }
    }

    if (addedIds.length > 0) {
      await domainRepository.addSkillsToDomain(addedIds, id);
    }

    const skills = await domainRepository.getSkillsByDomainId(id);
    return {
      added: addedIds,
      already_linked: alreadyLinkedIds,
      not_found: notFoundIds,
      skills,
    };
  },

  async remove(id: number) {
    const domain = await domainRepository.findById(id);
    if (!domain) {
      throw new AppError("Domain not found", 404);
    }

    const skillsCount = await domainRepository.countSkillsByDomainId(id);
    if (skillsCount > 0) {
      throw new AppError("Cannot delete domain with linked skills", 409);
    }

    const projectsCount = await domainRepository.countProjectsByDomainId(id);
    if (projectsCount > 0) {
      throw new AppError("Cannot delete domain with linked projects", 409);
    }

    await domainRepository.remove(id);
  },
};

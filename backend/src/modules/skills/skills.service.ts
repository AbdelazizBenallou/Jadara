import { AppError } from "../../../framework/utils/AppError.js";
import { skillRepository } from "./skills.repository.js";
import { skillCategoryRepository } from "./skill-categories.repository.js";
import type {
  CreateSkillInput,
  UpdateSkillInput,
  CreateSkillCategoryInput,
} from "./skills.validator.js";

export const skillService = {
  // ── Categories ────────────────────────────────────────────────
  async getAllCategories(query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { categories, total } = await skillCategoryRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      categories,
      meta: {
        total,
        page,
        limit,
        totalPages,
        nextCursor: page < totalPages ? page + 1 : null,
      },
    };
  },

  async createCategory(data: CreateSkillCategoryInput) {
    const existing = await skillCategoryRepository.findByName(data.name);
    if (existing) {
      throw new AppError("Skill category name already exists", 409);
    }

    return skillCategoryRepository.create(data.name, data.description);
  },

  async removeCategory(id: number) {
    const category = await skillCategoryRepository.findById(id);
    if (!category) {
      throw new AppError("Skill category not found", 404);
    }

    const linkedSkillsCount = await skillCategoryRepository.countSkillsByCategoryId(id);
    if (linkedSkillsCount > 0) {
      throw new AppError(
        `Cannot delete skill category: linked to ${linkedSkillsCount} skill(s). Unlink or reassign them first.`,
        409,
      );
    }

    await skillCategoryRepository.remove(id);
  },

  // ── Skills ────────────────────────────────────────────────────
  async getAll(query: { page?: string; limit?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { skills, total } = await skillRepository.findAll(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      skills,
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
    const skill = await skillRepository.findById(id);
    if (!skill) {
      throw new AppError("Skill not found", 404);
    }
    return skill;
  },

  async create(data: CreateSkillInput) {
    const category = await skillCategoryRepository.findById(data.category_id);
    if (!category) {
      throw new AppError("Skill category not found", 404);
    }

    const existing = await skillRepository.findByName(data.name);
    if (existing) {
      throw new AppError("Skill name already exists", 409);
    }

    return skillRepository.create(
      data.name,
      data.category_id,
      data.description,
      data.status,
    );
  },

  async update(id: number, data: UpdateSkillInput) {
    const skill = await skillRepository.findById(id);
    if (!skill) {
      throw new AppError("Skill not found", 404);
    }

    if (data.name !== undefined && data.name !== skill.name) {
      const duplicate = await skillRepository.findByName(data.name);
      if (duplicate) {
        throw new AppError("Skill name already exists", 409);
      }
    }

    if (data.category_id !== undefined) {
      const category = await skillCategoryRepository.findById(data.category_id);
      if (!category) {
        throw new AppError("Skill category not found", 404);
      }
    }

    return skillRepository.update(id, {
      name: data.name,
      description: data.description,
      status: data.status,
      category_id: data.category_id,
    });
  },

  async remove(id: number) {
    const skill = await skillRepository.findById(id);
    if (!skill) {
      throw new AppError("Skill not found", 404);
    }

    const [userSkills, domainLinks] = await Promise.all([
      skillRepository.countUserSkills(id),
      skillRepository.countDomainLinks(id),
    ]);

    const total = userSkills + domainLinks;
    if (total > 0) {
      const parts: string[] = [];
      if (userSkills) parts.push(`${userSkills} user(s)`);
      if (domainLinks) parts.push(`${domainLinks} domain(s)`);

      throw new AppError(
        `Cannot delete skill: linked to ${parts.join(", ")}. Unlink them first.`,
        409,
      );
    }

    await skillRepository.remove(id);
  },
};

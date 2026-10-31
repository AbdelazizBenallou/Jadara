import { AppError } from "../../../framework/utils/AppError.js";
import { activityCategoryRepository } from "./categories.repository.js";
import type {
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "./categories.validation.js";

export const activityCategoryService = {
  async getAll(query: ListCategoriesInput) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { categories, total } = await activityCategoryRepository.findAll({
      page,
      limit,
      q: query.q,
    });
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

  async create(data: CreateCategoryInput) {
    const existing = await activityCategoryRepository.findByName(data.name);
    if (existing) {
      throw new AppError("Activity category name already exists", 409);
    }

    return activityCategoryRepository.create(data.name, data.description);
  },

  async update(id: number, data: UpdateCategoryInput) {
    const category = await activityCategoryRepository.findById(id);
    if (!category) {
      throw new AppError("Activity category not found", 404);
    }

    if (data.name !== undefined && data.name !== category.name) {
      const existing = await activityCategoryRepository.findByName(data.name);
      if (existing) {
        throw new AppError("Activity category name already exists", 409);
      }
    }

    return activityCategoryRepository.update(id, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    });
  },

  /**
   * The FK is ON DELETE SET NULL, so the delete would be safe - but it would
   * silently clear the category from every activity using it, so it is blocked
   * instead and the caller reassigns first.
   */
  async remove(id: number) {
    const category = await activityCategoryRepository.findById(id);
    if (!category) {
      throw new AppError("Activity category not found", 404);
    }

    const linked = await activityCategoryRepository.countActivitiesByCategoryId(id);
    if (linked > 0) {
      throw new AppError(
        `Cannot delete category: linked to ${linked} ${linked === 1 ? "activity" : "activities"}. Reassign them first.`,
        400,
      );
    }

    await activityCategoryRepository.remove(id);
    return { deleted: true };
  },
};

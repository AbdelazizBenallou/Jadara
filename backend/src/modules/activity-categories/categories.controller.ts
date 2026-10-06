import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { activityCategoryService } from "./categories.service.js";
import type {
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "./categories.validation.js";

// Returns the numeric route param, or null after answering with a 400.
function readId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!req.params.id || Number.isNaN(id)) {
    response.error(res, "Invalid activity category ID", 400);
    return null;
  }
  return id;
}

export const activityCategoryController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const result = await activityCategoryService.getAll(
      req.query as ListCategoriesInput & Record<string, unknown>,
    );
    response.paginated(
      res,
      result.categories,
      result.meta,
      "Activity categories fetched successfully",
    );
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateCategoryInput;
    const category = await activityCategoryService.create(data);
    response.success(res, category, "Activity category created successfully", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const data = req.body as UpdateCategoryInput;
    const category = await activityCategoryService.update(id, data);
    response.success(res, category, "Activity category updated successfully");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = readId(req, res);
    if (id === null) return;

    const result = await activityCategoryService.remove(id);
    response.success(res, result, "Activity category deleted successfully");
  }),
};

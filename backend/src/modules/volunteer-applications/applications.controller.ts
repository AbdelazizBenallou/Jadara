import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { applicationsService } from "./applications.service.js";
import type {
  CompletedQueryInput,
  ListApplicationsInput,
  ListMyApplicationsInput,
} from "./applications.validation.js";

function readActivityId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!req.params.id || Number.isNaN(id)) {
    response.error(res, "Invalid activity ID", 400);
    return null;
  }
  return id;
}

function readApplicationId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!req.params.id || Number.isNaN(id)) {
    response.error(res, "Invalid application ID", 400);
    return null;
  }
  return id;
}

export const applicationsController = {
  apply: asyncHandler(async (req: Request, res: Response) => {
    const activityId = readActivityId(req, res);
    if (activityId === null) return;

    const application = await applicationsService.apply(
      req.user!.userId,
      req.user!.role,
      activityId,
    );
    response.success(res, application, "Application submitted", 201);
  }),

  getMine: asyncHandler(async (req: Request, res: Response) => {
    const result = await applicationsService.getMine(
      req.user!.userId,
      req.query as ListMyApplicationsInput & Record<string, string | undefined>,
    );
    response.paginated(res, result.applications, result.meta, "Applications fetched successfully");
  }),

  listForActivity: asyncHandler(async (req: Request, res: Response) => {
    const activityId = readActivityId(req, res);
    if (activityId === null) return;

    const result = await applicationsService.listForActivity(
      req.user!.userId,
      req.user!.role,
      activityId,
      req.query as ListApplicationsInput & Record<string, string | undefined>,
    );
    response.paginated(res, result.applications, result.meta, "Applications fetched successfully");
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const applicationId = readApplicationId(req, res);
    if (applicationId === null) return;

    const application = await applicationsService.accept(
      req.user!.userId,
      req.user!.role,
      applicationId,
    );
    response.success(res, application, "Application accepted");
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const applicationId = readApplicationId(req, res);
    if (applicationId === null) return;

    const application = await applicationsService.reject(
      req.user!.userId,
      req.user!.role,
      applicationId,
    );
    response.success(res, application, "Application rejected");
  }),

  participants: asyncHandler(async (req: Request, res: Response) => {
    const activityId = readActivityId(req, res);
    if (activityId === null) return;

    const participants = await applicationsService.participants(
      req.user!.userId,
      req.user!.role,
      activityId,
    );
    response.success(res, participants, "Participants fetched successfully");
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const applicationId = readApplicationId(req, res);
    if (applicationId === null) return;

    const application = await applicationsService.complete(
      req.user!.userId,
      req.user!.role,
      applicationId,
    );
    response.success(res, application, "Volunteer completion confirmed");
  }),

  completed: asyncHandler(async (req: Request, res: Response) => {
    const result = await applicationsService.listCompleted(
      req.user!.userId,
      req.query as CompletedQueryInput & Record<string, string | undefined>,
    );
    response.paginated(res, result.applications, result.meta, "Completed volunteering fetched successfully");
  }),
};
import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { opportunityService } from "./opportunities.service.js";
import type {
  CreateOpportunityDraftInput,
  ListOpportunitiesQuery,
  UpdateOpportunityInput,
  BrowsePublishedQuery,
  ListMyRegistrationsQuery,
  ListOpportunityRegistrantsQuery,
} from "./opportunities.validator.js";

function parseOpportunityId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!req.params.id || Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
    response.error(res, "Invalid opportunity ID", 400);
    return null;
  }
  return id;
}

export const opportunityController = {
  createDraft: asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateOpportunityDraftInput;
    const opportunity = await opportunityService.createDraft(req.user!.userId, data);
    response.success(res, opportunity, "Opportunity draft created successfully", 201);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListOpportunitiesQuery;
    const result = await opportunityService.listMine(req.user!.userId, query);
    response.paginated(
      res,
      result.opportunities,
      result.meta,
      "Opportunities fetched successfully",
    );
  }),

  getMineById: asyncHandler(async (req: Request, res: Response) => {
    const id = parseOpportunityId(req, res);
    if (id === null) return;

    const opportunity = await opportunityService.getMineById(req.user!.userId, id);
    response.success(res, opportunity, "Opportunity fetched successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = parseOpportunityId(req, res);
    if (id === null) return;

    const data = req.body as UpdateOpportunityInput;
    const opportunity = await opportunityService.update(req.user!.userId, id, data);
    response.success(res, opportunity, "Opportunity updated successfully");
  }),

  deleteDraft: asyncHandler(async (req: Request, res: Response) => {
    const id = parseOpportunityId(req, res);
    if (id === null) return;

    await opportunityService.deleteDraft(req.user!.userId, id);
    response.success(res, null, "Opportunity draft deleted successfully");
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const id = parseOpportunityId(req, res);
    if (id === null) return;

    const opportunity = await opportunityService.publish(req.user!.userId, id);
    response.success(res, opportunity, "Opportunity published successfully");
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const id = parseOpportunityId(req, res);
    if (id === null) return;

    const opportunity = await opportunityService.close(req.user!.userId, id);
    response.success(res, opportunity, "Opportunity closed successfully");
  }),

  browse: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as BrowsePublishedQuery;
    const result = await opportunityService.browse(query);
    response.paginated(
      res,
      result.opportunities,
      result.meta,
      "Opportunities fetched successfully",
    );
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const id = parseOpportunityId(req, res);
    if (id === null) return;

    const registration = await opportunityService.register(req.user!.userId, id);
    response.success(res, registration, "Successfully registered for the opportunity", 201);
  }),

  listMyRegistrations: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListMyRegistrationsQuery;
    const result = await opportunityService.listMyRegistrations(req.user!.userId, query);
    response.paginated(
      res,
      result.registrations,
      result.meta,
      "Registrations fetched successfully",
    );
  }),

  listOpportunityRegistrants: asyncHandler(async (req: Request, res: Response) => {
    const id = parseOpportunityId(req, res);
    if (id === null) return;

    const query = req.query as unknown as ListOpportunityRegistrantsQuery;
    const result = await opportunityService.listOpportunityRegistrants(
      req.user!.userId,
      id,
      query,
    );
    response.paginated(
      res,
      result.registrants,
      result.meta,
      "Registrants fetched successfully",
    );
  }),
};

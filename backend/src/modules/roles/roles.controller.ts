import type { Request, Response } from "express";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { response } from "../../../framework/utils/response.js";
import { roleService } from "./roles.service.js";

export const roleController = {
  // ── Roles ─────────────────────────────────────────────────

  findAll: asyncHandler(async (_req: Request, res: Response) => {
    const data = await roleService.findAll();
    response.success(res, data, "Roles fetched successfully");
  }),

  findById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid role ID", 400);
      return;
    }
    const data = await roleService.findById(id);
    response.success(res, data, "Role fetched successfully");
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await roleService.create(req.body);
    response.success(res, data, "Role created successfully", 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid role ID", 400);
      return;
    }
    const data = await roleService.update(id, req.body);
    response.success(res, data, "Role updated successfully");
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid role ID", 400);
      return;
    }
    await roleService.delete(id);
    response.success(res, null, "Role deleted successfully");
  }),

  // ── Role ↔ Permissions ─────────────────────────────────────

  getPermissionsByRoleId: asyncHandler(async (req: Request, res: Response) => {
    const roleId = Number(req.params.id);
    if (isNaN(roleId)) {
      response.error(res, "Invalid role ID", 400);
      return;
    }
    const data = await roleService.getPermissionsByRoleId(roleId);
    response.success(res, data, "Permissions fetched successfully");
  }),

  addPermissionToRole: asyncHandler(async (req: Request, res: Response) => {
    const roleId = Number(req.params.id);
    if (isNaN(roleId)) {
      response.error(res, "Invalid role ID", 400);
      return;
    }
    const data = await roleService.addPermissionToRole(roleId, req.body);
    response.success(res, data, "Permission assigned successfully");
  }),

  removePermissionFromRole: asyncHandler(async (req: Request, res: Response) => {
    const roleId = Number(req.params.id);
    if (isNaN(roleId)) {
      response.error(res, "Invalid role ID", 400);
      return;
    }
    const permissionId = Number(req.params.permissionId);
    if (isNaN(permissionId)) {
      response.error(res, "Invalid permission ID", 400);
      return;
    }
    const data = await roleService.removePermissionFromRole(roleId, permissionId);
    response.success(res, data, "Permission removed successfully");
  }),

  // ── Role → Users ──────────────────────────────────────────

  getUsersByRoleId: asyncHandler(async (req: Request, res: Response) => {
    const roleId = Number(req.params.id);
    if (isNaN(roleId)) {
      response.error(res, "Invalid role ID", 400);
      return;
    }
    const data = await roleService.getUsersByRoleId(roleId);
    response.success(res, data, "Users fetched successfully");
  }),

  // ── Permissions ───────────────────────────────────────────

  findAllPermissions: asyncHandler(async (_req: Request, res: Response) => {
    const data = await roleService.findAllPermissions();
    response.success(res, data, "Permissions fetched successfully");
  }),

  findPermissionById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid permission ID", 400);
      return;
    }
    const data = await roleService.findPermissionById(id);
    response.success(res, data, "Permission fetched successfully");
  }),

  createPermission: asyncHandler(async (req: Request, res: Response) => {
    const data = await roleService.createPermission(req.body);
    response.success(res, data, "Permission created successfully", 201);
  }),

  updatePermission: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid permission ID", 400);
      return;
    }
    const data = await roleService.updatePermission(id, req.body);
    response.success(res, data, "Permission updated successfully");
  }),

  deletePermission: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      response.error(res, "Invalid permission ID", 400);
      return;
    }
    await roleService.deletePermission(id);
    response.success(res, null, "Permission deleted successfully");
  }),

  getRolesByPermissionId: asyncHandler(async (req: Request, res: Response) => {
    const permissionId = Number(req.params.id);
    if (isNaN(permissionId)) {
      response.error(res, "Invalid permission ID", 400);
      return;
    }
    const data = await roleService.getRolesByPermissionId(permissionId);
    response.success(res, data, "Roles fetched successfully");
  }),
};

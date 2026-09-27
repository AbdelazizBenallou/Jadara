import { AppError } from "../../../framework/utils/AppError.js";
import { roleRepository } from "./roles.repository.js";
import type {
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  UpdatePermissionInput,
  AssignPermissionInput,
} from "./roles.validator.js";

export const roleService = {
  // ── Roles ─────────────────────────────────────────────────

  async findAll() {
    return roleRepository.findAll();
  },

  async findById(id: number) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    return role;
  },

  async create(data: CreateRoleInput) {
    const existing = await roleRepository.findByName(data.name);
    if (existing) {
      throw new AppError("Role name already exists", 409);
    }
    return roleRepository.create(data.name);
  },

  async update(id: number, data: UpdateRoleInput) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    const duplicate = await roleRepository.findByName(data.name);
    if (duplicate && duplicate.id !== id) {
      throw new AppError("Role name already exists", 409);
    }
    return roleRepository.update(id, data.name);
  },

  async delete(id: number) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    const usersCount = await roleRepository.countUsersByRoleId(id);
    if (usersCount > 0) {
      throw new AppError("Cannot delete role with assigned users", 409);
    }
    await roleRepository.delete(id);
  },

  // ── Permissions ────────────────────────────────────────────

  async findAllPermissions() {
    return roleRepository.findAllPermissions();
  },

  async findPermissionById(id: number) {
    const permission = await roleRepository.findPermissionById(id);
    if (!permission) {
      throw new AppError("Permission not found", 404);
    }
    return permission;
  },

  async createPermission(data: CreatePermissionInput) {
    const existing = await roleRepository.findPermissionByName(data.name);
    if (existing) {
      throw new AppError("Permission name already exists", 409);
    }
    return roleRepository.createPermission(data.name);
  },

  async updatePermission(id: number, data: UpdatePermissionInput) {
    const permission = await roleRepository.findPermissionById(id);
    if (!permission) {
      throw new AppError("Permission not found", 404);
    }
    const duplicate = await roleRepository.findPermissionByName(data.name);
    if (duplicate && duplicate.id !== id) {
      throw new AppError("Permission name already exists", 409);
    }
    return roleRepository.updatePermission(id, data.name);
  },

  async deletePermission(id: number) {
    const permission = await roleRepository.findPermissionById(id);
    if (!permission) {
      throw new AppError("Permission not found", 404);
    }
    const rolesCount = await roleRepository.countRolesByPermissionId(id);
    if (rolesCount > 0) {
      throw new AppError("Cannot delete permission assigned to roles", 409);
    }
    await roleRepository.deletePermission(id);
  },

  // ── Role ↔ Permissions ─────────────────────────────────────

  async getPermissionsByRoleId(roleId: number) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    return roleRepository.getPermissionsByRoleId(roleId);
  },

  async addPermissionToRole(roleId: number, data: AssignPermissionInput) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    const permission = await roleRepository.findPermissionById(data.permission_id);
    if (!permission) {
      throw new AppError("Permission not found", 404);
    }
    const alreadyAssigned = await roleRepository.isPermissionAssignedToRole(
      roleId,
      data.permission_id,
    );
    if (alreadyAssigned) {
      throw new AppError("Permission already assigned to this role", 409);
    }
    await roleRepository.addPermissionToRole(roleId, data.permission_id);
    return roleRepository.getPermissionsByRoleId(roleId);
  },

  async removePermissionFromRole(roleId: number, permissionId: number) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    const permission = await roleRepository.findPermissionById(permissionId);
    if (!permission) {
      throw new AppError("Permission not found", 404);
    }
    const alreadyAssigned = await roleRepository.isPermissionAssignedToRole(roleId, permissionId);
    if (!alreadyAssigned) {
      throw new AppError("Permission is not assigned to this role", 404);
    }
    await roleRepository.removePermissionFromRole(roleId, permissionId);
    return roleRepository.getPermissionsByRoleId(roleId);
  },

  // ── Users by Role ──────────────────────────────────────────

  async getUsersByRoleId(roleId: number) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    return roleRepository.findUsersByRoleId(roleId);
  },

  async getRolesByPermissionId(permissionId: number) {
    const permission = await roleRepository.findPermissionById(permissionId);
    if (!permission) {
      throw new AppError("Permission not found", 404);
    }
    return roleRepository.findRolesByPermissionId(permissionId);
  },
};

import prisma from "../../../framework/config/prisma.js";
import { DEMAND_ROLES, DIRECT_REGISTRATION_ROLES } from "../demands/demands.constants.js";

export const roleRepository = {
  // Public catalog: roles you can either register with directly or request
  // through a demand. `is_selectable` marks the direct ones. Internal-only
  // roles (Admin) are neither, so they stay off this endpoint.
  async findAll() {
    const listable = [...DIRECT_REGISTRATION_ROLES, ...DEMAND_ROLES];
    return prisma.roles.findMany({
      where: { name: { in: listable } },
      select: { id: true, name: true, is_selectable: true },
      orderBy: { id: "asc" },
    });
  },

  async findById(id: number) {
    return prisma.roles.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  async findByName(name: string) {
    return prisma.roles.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async create(name: string) {
    return prisma.roles.create({
      data: { name },
      select: { id: true, name: true },
    });
  },

  async update(id: number, name: string) {
    return prisma.roles.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
  },

  async countUsersByRoleId(id: number) {
    return prisma.users.count({ where: { role_id: id } });
  },

  async delete(id: number) {
    await prisma.roles.delete({ where: { id } });
  },

  // ── Permissions ────────────────────────────────────────────

  async findAllPermissions() {
    return prisma.permissions.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
  },

  async findPermissionById(id: number) {
    return prisma.permissions.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  async findPermissionByName(name: string) {
    return prisma.permissions.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  async createPermission(name: string) {
    return prisma.permissions.create({
      data: { name },
      select: { id: true, name: true },
    });
  },

  async updatePermission(id: number, name: string) {
    return prisma.permissions.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
  },

  async countRolesByPermissionId(id: number) {
    return prisma.role_permissions.count({ where: { permission_id: id } });
  },

  async deletePermission(id: number) {
    await prisma.permissions.delete({ where: { id } });
  },

  // ── Role ↔ Permissions ─────────────────────────────────────

  async getPermissionsByRoleId(roleId: number) {
    const rolePermissions = await prisma.role_permissions.findMany({
      where: { role_id: roleId },
      include: { permissions: { select: { id: true, name: true } } },
    });
    return rolePermissions.map((rp) => rp.permissions);
  },

  async addPermissionToRole(roleId: number, permissionId: number) {
    await prisma.role_permissions.create({
      data: { role_id: roleId, permission_id: permissionId },
    });
  },

  async removePermissionFromRole(roleId: number, permissionId: number) {
    await prisma.role_permissions.delete({
      where: { role_id_permission_id: { role_id: roleId, permission_id: permissionId } },
    });
  },

  async isPermissionAssignedToRole(roleId: number, permissionId: number) {
    const rp = await prisma.role_permissions.findUnique({
      where: { role_id_permission_id: { role_id: roleId, permission_id: permissionId } },
    });
    return rp !== null;
  },

  async findRolesByPermissionId(permissionId: number) {
    const rolePermissions = await prisma.role_permissions.findMany({
      where: { permission_id: permissionId },
      include: { roles: { select: { id: true, name: true } } },
    });
    return rolePermissions.map((rp) => rp.roles);
  },

  // ── Users by Role ──────────────────────────────────────────

  async findUsersByRoleId(roleId: number) {
    const users = await prisma.users.findMany({
      where: { role_id: roleId },
      select: {
        id: true,
        email: true,
        profiles: { select: { first_name: true, last_name: true } },
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.profiles?.first_name ?? null,
      last_name: u.profiles?.last_name ?? null,
    }));
  },
};

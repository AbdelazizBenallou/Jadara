import { deleteData, getData, getPaginated, patchData, postData } from "./http";
import type { Permission, RoleRecord, RoleUser } from "@/types/role";

export type RoleId = number | string;

export function listRoles(): Promise<RoleRecord[]> {
  return getData<RoleRecord[]>("/roles");
}

export function getRole(id: RoleId): Promise<RoleRecord> {
  return getData<RoleRecord>(`/roles/${id}`);
}

export function getRoleUsers(id: RoleId): Promise<RoleUser[]> {
  return getData<RoleUser[]>(`/roles/${id}/users`);
}

export function getRolePermissions(id: RoleId): Promise<Permission[]> {
  return getData<Permission[]>(`/roles/${id}/permissions`);
}

export function assignPermission(
  roleId: RoleId,
  permissionId: number,
): Promise<void> {
  return postData<void>(`/roles/${roleId}/permissions`, {
    permission_id: permissionId,
  });
}

export function removePermission(
  roleId: RoleId,
  permissionId: RoleId,
): Promise<void> {
  return deleteData(`/roles/${roleId}/permissions/${permissionId}`);
}

export async function listPermissions(): Promise<Permission[]> {
  const result = await getPaginated<Permission>("/permissions", { params: { limit: 100 } });
  return result.items;
}

export function getPermission(id: RoleId): Promise<Permission> {
  return getData<Permission>(`/permissions/${id}`);
}

export function createPermission(data: { name: string }): Promise<Permission> {
  return postData<Permission>("/permissions", data);
}

export function updatePermission(id: RoleId, data: { name: string }): Promise<Permission> {
  return patchData<Permission>(`/permissions/${id}`, data);
}

export function deletePermission(id: RoleId): Promise<void> {
  return deleteData(`/permissions/${id}`);
}

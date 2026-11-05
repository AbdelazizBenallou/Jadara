import type { Role } from "@/constants/roles";

export interface RoleRecord {
  id: number;
  name: Role | string;
  description?: string | null;
  is_selectable?: boolean;
}

export interface Permission {
  id: number;
  name: string;
  description?: string | null;
}

export interface RoleUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

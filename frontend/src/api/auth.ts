import { getData, postData } from "./http";
import { normalizeUser } from "@/lib/normalize-user";
import type { LoginCredentials, User, UserPayload } from "@/types/user";

export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id: number;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const data = await postData<{ user: UserPayload }>(
    "/auth/login",
    credentials,
  );
  return normalizeUser(data.user);
}

export async function getCurrentUser(): Promise<User> {
  const data = await getData<UserPayload>("/users/me/profile");
  return normalizeUser(data);
}

export async function register(input: RegisterInput): Promise<void> {
  await postData<null>("/auth/register", { ...input });
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  await postData<null>("/auth/change-password", { ...input });
}

export async function logout(): Promise<void> {
  try {
    await postData<null>("/auth/logout");
  } catch {
    return;
  }
}

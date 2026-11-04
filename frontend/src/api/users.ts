import type { AxiosRequestConfig } from "axios";
import { deleteData, getData, getPaginated, patchData, postData } from "./http";
import { normalizeUser } from "@/lib/normalize-user";
import type { PaginatedResult } from "@/types/api";
import type { Domain } from "@/types/domain";
import type { UserSkill } from "@/types/skill";
import type { PublicUserProfile, User, UserAnalytics, UserPayload } from "@/types/user";
import type {
  Certification,
  Education,
  EducationInput,
  UserLanguage,
  UserLanguageInput,
  WorkExperience,
  WorkExperienceInput,
} from "@/types/cv";

export type UserId = number | string;

export interface UserFilters {
  limit?: number;
  page?: number;
  search?: string;
  role?: string;
}

export interface UserUpdateInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  role_id?: number;
  status?: string;
}

export interface SocialPlatform {
  id: number;
  name: string;
}

export interface SocialInput {
  platform_id: number;
  url: string;
}

export function listWorkExperience(): Promise<WorkExperience[]> {
  return getData<WorkExperience[]>("/users/me/work-experience");
}

export function createWorkExperience(
  input: WorkExperienceInput,
): Promise<WorkExperience> {
  return postData<WorkExperience>("/users/me/work-experience", { ...input });
}

export function updateWorkExperience(
  id: UserId,
  input: Partial<WorkExperienceInput>,
): Promise<WorkExperience> {
  return patchData<WorkExperience>(`/users/me/work-experience/${id}`, {
    ...input,
  });
}

export function removeWorkExperience(id: UserId): Promise<void> {
  return deleteData(`/users/me/work-experience/${id}`);
}

export function listEducation(): Promise<Education[]> {
  return getData<Education[]>("/users/me/education");
}

export function createEducation(input: EducationInput): Promise<Education> {
  return postData<Education>("/users/me/education", { ...input });
}

export function updateEducation(
  id: UserId,
  input: Partial<EducationInput>,
): Promise<Education> {
  return patchData<Education>(`/users/me/education/${id}`, { ...input });
}

export function removeEducation(id: UserId): Promise<void> {
  return deleteData(`/users/me/education/${id}`);
}

export function listCertifications(): Promise<Certification[]> {
  return getData<Certification[]>("/users/me/certifications");
}

export function createCertification(
  formData: FormData,
): Promise<Certification> {
  return postData<Certification>("/users/me/certifications", formData);
}

export function updateCertification(
  id: UserId,
  formData: FormData,
): Promise<Certification> {
  return patchData<Certification>(`/users/me/certifications/${id}`, formData);
}

export function removeCertification(id: UserId): Promise<void> {
  return deleteData(`/users/me/certifications/${id}`);
}

export function listMyLanguages(): Promise<UserLanguage[]> {
  return getData<UserLanguage[]>("/users/me/languages");
}

export function createMyLanguage(
  input: UserLanguageInput,
): Promise<UserLanguage> {
  return postData<UserLanguage>("/users/me/languages", { ...input });
}

export function updateMyLanguage(
  id: UserId,
  input: Pick<UserLanguageInput, "proficiency">,
): Promise<UserLanguage> {
  return patchData<UserLanguage>(`/users/me/languages/${id}`, { ...input });
}

export function removeMyLanguage(id: UserId): Promise<void> {
  return deleteData(`/users/me/languages/${id}`);
}

export async function getMyProfile(): Promise<User> {
  return normalizeUser(await getData<UserPayload>("/users/me/profile"));
}

export async function updateMyProfile(formData: FormData): Promise<void> {
  await patchData<unknown>("/users/me/profile", formData);
}

export function getMyActivity(): Promise<unknown> {
  return getData<unknown>("/users/me/activity");
}

export function listSocialPlatforms(): Promise<SocialPlatform[]> {
  return getData<SocialPlatform[]>("/users/me/socials/platforms");
}

export function addMySocial(input: SocialInput): Promise<unknown> {
  return postData<unknown>("/users/me/socials", { ...input });
}

export function removeMySocial(socialId: UserId): Promise<void> {
  return deleteData(`/users/me/socials/${socialId}`);
}

export async function listUsers(
  filters?: UserFilters,
  config?: AxiosRequestConfig,
): Promise<PaginatedResult<User>> {
  const result = await getPaginated<UserPayload>("/users", {
    ...config,
    params: filters,
  });
  return { ...result, items: result.items.map(normalizeUser) };
}

export async function getUser(id: UserId): Promise<User> {
  return normalizeUser(await getData<UserPayload>(`/users/${id}`));
}

export async function updateUser(
  id: UserId,
  input: UserUpdateInput,
): Promise<User> {
  return normalizeUser(
    await patchData<UserPayload>(`/users/${id}`, { ...input }),
  );
}

export function deleteUser(id: UserId): Promise<void> {
  return deleteData(`/users/${id}`);
}

export function getUserSkills(id: UserId): Promise<UserSkill[]> {
  return getData<UserSkill[]>(`/users/${id}/skills`);
}

export function getUserReviewDomains(id: UserId): Promise<Domain | null> {
  return getData<Domain | null>(`/users/${id}/review-domains`);
}

export function getPublicProfile(id: UserId): Promise<PublicUserProfile> {
  return getData<PublicUserProfile>(`/users/${id}/profile`);
}

export function getUserAnalytics(): Promise<UserAnalytics> {
  return getData<UserAnalytics>("/users/analytics");
}

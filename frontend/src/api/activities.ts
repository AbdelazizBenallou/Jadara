import { deleteData, getData, getPaginated, patchData, postData } from "./http";
import type { PaginatedResult } from "@/types/api";

export interface AcceptedVolunteerPreview {
  id: number;
  name: string;
  avatar?: string | null;
}

export interface ActivitySkill {
  id: number;
  name: string;
  description?: string | null;
}

export interface ActivityParticipant {
  id: number;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  skills: string[];
}

export interface VolunteerApplication {
  id: number;
  activity_id: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  application_date?: string;
  activity?: Activity;
}

export interface Activity {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  start_date: string;
  end_date: string;
  capacity?: number;
  required_volunteers: number;
  requirements?: string | null;
  registration_deadline?: string | null;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  organization_id?: number;
  organization?: {
    id: number;
    name: string;
    email?: string | null;
    website?: string | null;
    location?: string | null;
    logo_url?: string | null;
  } | null;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  accepted_count?: number;
  available_places?: number;
  accepted_volunteers?: AcceptedVolunteerPreview[];
  required_skills?: ActivitySkill[];
  my_application?: { id: number; status: string } | null;
  [key: string]: unknown;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}

export interface PublishedActivityFilters {
  page?: number;
  limit?: number;
  q?: string;
  search?: string;
  category_id?: number;
  location?: string;
  organization_id?: number;
  required_skill_id?: number;
  start_date?: string;
  end_date?: string;
}

export async function listActivitiesAdmin(
  filters?: ActivityFilters,
): Promise<PaginatedResult<Activity>> {
  return getPaginated<Activity>("/activities/all", {
    params: { limit: 50, ...filters },
  });
}

export async function listPublishedActivities(
  filters?: PublishedActivityFilters,
): Promise<PaginatedResult<Activity>> {
  return getPaginated<Activity>("/activities/published", {
    params: filters,
  });
}

export async function listMyActivities(
  filters?: ActivityFilters,
): Promise<PaginatedResult<Activity>> {
  return getPaginated<Activity>("/activities", {
    params: filters,
  });
}

export function getActivity(id: number): Promise<Activity> {
  return getData<Activity>(`/activities/${id}`);
}

export function getActivityParticipants(activityId: number): Promise<ActivityParticipant[]> {
  return getData<ActivityParticipant[]>(`/activities/${activityId}/participants`);
}

export function applyToActivity(activityId: number): Promise<VolunteerApplication> {
  return postData<VolunteerApplication>(`/activities/${activityId}/applications`, {});
}

export function createActivity(formData: FormData): Promise<Activity> {
  return postData<Activity>("/activities", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function approveActivity(id: number, review_note?: string): Promise<Activity> {
  return postData<Activity>(`/activities/${id}/approve`, review_note ? { review_note } : {});
}

export function rejectActivity(id: number, review_note?: string): Promise<Activity> {
  return postData<Activity>(`/activities/${id}/reject`, review_note ? { review_note } : {});
}

export function publishActivity(id: number): Promise<Activity> {
  return postData<Activity>(`/activities/${id}/publish`, {});
}

export function archiveActivity(id: number): Promise<Activity> {
  return postData<Activity>(`/activities/${id}/archive`, {});
}

export function cancelActivity(id: number): Promise<Activity> {
  return postData<Activity>(`/activities/${id}/cancel`, {});
}

export function activateActivity(id: number): Promise<Activity> {
  return patchData<Activity>(`/activities/${id}/activate`, {});
}

export function deactivateActivity(id: number): Promise<Activity> {
  return patchData<Activity>(`/activities/${id}/deactivate`, {});
}

export function deleteActivity(id: number): Promise<void> {
  return deleteData(`/activities/${id}`);
}

export function listMyApplications(
  filters?: { page?: number; limit?: number; status?: string },
): Promise<PaginatedResult<VolunteerApplication>> {
  return getPaginated<VolunteerApplication>("/volunteer-applications/me", {
    params: filters,
  });
}

export const getMyVolunteerApplications = listMyApplications;

export function listMyCompletedVolunteering(
  filters?: { page?: number; limit?: number },
): Promise<PaginatedResult<any>> {
  return getPaginated<any>("/volunteer-applications/completed", {
    params: filters,
  });
}

export function acceptApplication(applicationId: number): Promise<any> {
  return postData(`/volunteer-applications/${applicationId}/accept`, {});
}

export function rejectApplication(applicationId: number): Promise<any> {
  return postData(`/volunteer-applications/${applicationId}/reject`, {});
}

export function completeApplication(applicationId: number): Promise<any> {
  return postData(`/volunteer-applications/${applicationId}/complete`, {});
}

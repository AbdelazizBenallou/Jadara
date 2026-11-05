import { getData, getPaginated, postData, putData } from "./http";
import type {
  AvailableReview,
  DetailedProjectReview,
  HistoryReview,
  ReviewProject,
  ReviewRatingInput,
  ReviewUser,
} from "@/types/review";
import type { Domain } from "@/types/domain";

export type ReviewId = number | string;

type ReviewProjectPayload = Omit<ReviewProject, "user"> & {
  user?: ReviewUser | null;
  users?: {
    id: number;
    email: string;
    profile?: ReviewUser["profile"];
    profiles?: ReviewUser["profile"];
  } | null;
};

function normalizeReviewProject(project: ReviewProjectPayload): ReviewProject {
  if (project.user) {
    return { ...project, user: project.user };
  }

  if (project.users) {
    return {
      ...project,
      user: {
        id: project.users.id,
        email: project.users.email,
        profile: project.users.profile ?? project.users.profiles ?? null,
      },
    };
  }

  return {
    ...project,
    user: { id: 0, email: "", profile: null },
  };
}

function normalizeReview(data: DetailedProjectReview): DetailedProjectReview {
  return {
    ...data,
    project: normalizeReviewProject(
      data.project as unknown as ReviewProjectPayload,
    ),
  };
}

export async function getAvailableReviews(): Promise<AvailableReview[]> {
  const result = await getPaginated<AvailableReview>("/reviews/available", {
    params: { limit: 100 },
  });
  return result.items;
}

export async function getReviewHistory(): Promise<HistoryReview[]> {
  const result = await getPaginated<HistoryReview>("/reviews/history", {
    params: { limit: 100 },
  });
  return result.items;
}

export async function getMyReviewDomains(): Promise<Domain[]> {
  const data = await getData<Domain | Domain[] | null>("/reviews/domains");
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

export async function getReview(
  id: ReviewId,
): Promise<DetailedProjectReview> {
  return normalizeReview(
    await getData<DetailedProjectReview>(`/reviews/${id}`),
  );
}

export function submitRating(
  id: ReviewId,
  input: ReviewRatingInput,
): Promise<void> {
  return postData<void>(`/reviews/${id}/rate`, { ...input });
}

export function updateRating(
  id: ReviewId,
  input: ReviewRatingInput,
): Promise<void> {
  return putData<void>(`/reviews/${id}/rate`, { ...input });
}

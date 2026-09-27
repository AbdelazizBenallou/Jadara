export interface ReviewerDomain {
  id: number;
  name: string;
  description?: string | null;
}

export interface ReviewProjectUser {
  id: number;
  email: string;
  profile: {
    first_name: string;
    last_name: string;
    headline?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface ReviewProjectDomain {
  id: number;
  name: string;
}

export interface ReviewProjectDetail {
  id: number;
  title: string;
  description: string;
  status?: string;
  created_at?: string | null;
  user: ReviewProjectUser;
  domain?: ReviewProjectDomain | null;
  evidence?: ReviewProjectEvidence[];
}

export interface ReviewProjectEvidence {
  id: number;
  project_id: number;
  type: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  download_url?: string | null;
}

export interface ReviewRatingSummary {
  average: number | null;
  count: number;
}

export interface AvailableReview {
  id: number;
  project_id: number;
  status: string;
  submitted_at: string;
  rating: ReviewRatingSummary;
  project: ReviewProjectDetail;
}

export interface HistoryReview {
  id: number;
  project_id: number;
  rating: number;
  feedback?: string | null;
  created_at: string;
  updated_at?: string | null;
  project_average: number | null;
  project_rating_count: number;
  project: ReviewProjectDetail;
}

export interface DetailedProjectReview {
  id: number;
  project_id: number;
  status: string;
  rating: ReviewRatingSummary;
  reviews: {
    id: number;
    rating: number;
    feedback: string | null;
    created_at: string;
    reviewer: ReviewProjectUser;
  }[];
  project: ReviewProjectDetail;
}

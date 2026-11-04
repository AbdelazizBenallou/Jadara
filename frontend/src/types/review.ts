export interface ReviewUser {
  id: number;
  email: string;
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
    headline?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    location?: string | null;
  } | null;
}

export interface ReviewEvidence {
  id: number;
  project_id: number;
  type: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  download_url?: string | null;
}

export interface ReviewProject {
  id: number;
  title: string;
  description: string;
  status?: string;
  created_at?: string | null;
  user: ReviewUser;
  domain?: { id: number; name: string } | null;
  evidence?: ReviewEvidence[];
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
  project: ReviewProject;
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
  project: ReviewProject;
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
    reviewer: ReviewUser;
  }[];
  project: ReviewProject;
}

export interface ReviewRatingInput {
  rating: number;
  feedback?: string;
}

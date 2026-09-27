import { createFileRoute } from "@tanstack/react-router";
import ReviewDetails from "@/features/reviewer/ReviewDetails";

export const Route = createFileRoute("/reviewer/review-details/$reviewId")({
  component: ReviewDetails,
});

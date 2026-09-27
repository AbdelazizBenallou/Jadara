import { createFileRoute } from "@tanstack/react-router";
import { ReviewerRegisterPage } from "@/features/auth/ReviewerRegisterPage";

export const Route = createFileRoute("/register/reviewer")({
  head: () => ({ meta: [{ title: "Apply as Reviewer — Jadara" }] }),
  component: ReviewerRegisterPage,
});

import { createFileRoute } from "@tanstack/react-router";

import VerificationQueue from "@/features/reviewer/VerificationQueue";

export const Route = createFileRoute("/reviewer/queue")({
  component: VerificationQueue,
});
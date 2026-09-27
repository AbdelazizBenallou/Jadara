export const STATUS = {
  VERIFIED: "verified",
  UNDER_REVIEW: "under_review",
  UPLOADED: "uploaded",
  PENDING: "pending",
  APPROVED: "approved",
  ACTIVE: "active",
  DISABLED: "disabled",
  LEARNING: "learning",
  COMPLETED: "completed",
  DRAFT: "draft",
  PUBLISHED: "published",
  CHANGES_REQUESTED: "changes_requested",
} as const;

export type StatusType = (typeof STATUS)[keyof typeof STATUS];

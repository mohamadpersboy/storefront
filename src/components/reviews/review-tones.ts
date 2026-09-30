import type { ReviewStatus } from "@/lib/reviews/constants";

export const STATUS_TONE: Record<ReviewStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

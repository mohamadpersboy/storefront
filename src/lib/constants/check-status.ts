/**
 * Status catalog for `Check`. Only "not_registered" / "registered" /
 * "returned" / "transferred" are reachable through Phase 1 UI/API
 * actions — the remaining values exist so the architecture doesn't
 * need a breaking change when future phases add collection/bounce
 * handling (see Master Prompt — Financial Management, بند ۵).
 */
export type CheckStatus =
  | "not_registered"
  | "registered"
  | "pending_collection"
  | "collected"
  | "bounced"
  | "returned"
  | "transferred"
  | "voided";

export const CHECK_STATUSES: CheckStatus[] = [
  "not_registered",
  "registered",
  "pending_collection",
  "collected",
  "bounced",
  "returned",
  "transferred",
  "voided",
];

/** Statuses actually usable when creating/editing a check in Phase 1. */
export const ACTIVE_PHASE1_STATUSES: CheckStatus[] = ["not_registered", "registered"];

const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  not_registered: "ثبت نشده",
  registered: "ثبت شده",
  pending_collection: "در انتظار وصول",
  collected: "وصول شده",
  bounced: "برگشتی",
  returned: "عودت داده شده",
  transferred: "انتقال داده شده",
  voided: "باطل شده",
};

export function checkStatusLabel(status: CheckStatus): string {
  return CHECK_STATUS_LABELS[status] ?? "نامشخص";
}

/**
 * A check may be returned to its issuer only if it is currently
 * "registered" — never twice, never once collected, never while
 * already transferred/voided (Master Prompt بند ۸ و ۱۵).
 */
export function canReturnCheck(status: CheckStatus): boolean {
  return status === "registered";
}

/**
 * A check may be transferred only while "registered" — a returned or
 * already-transferred check must not be reassigned (بند ۱۵).
 */
export function canTransferCheck(status: CheckStatus): boolean {
  return status === "registered";
}

/** A check may only be picked as payment for an order while registered. */
export function canAssignCheckToOrder(status: CheckStatus): boolean {
  return status === "registered";
}

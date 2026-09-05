import { Badge } from "@/components/ui/badge";
import { checkStatusLabel, type CheckStatus } from "@/lib/constants/check-status";

const TONE_MAP: Record<CheckStatus, "neutral" | "success" | "warning" | "danger" | "primary"> = {
  not_registered: "neutral",
  registered: "primary",
  pending_collection: "warning",
  collected: "success",
  bounced: "danger",
  returned: "danger",
  transferred: "neutral",
  voided: "neutral",
};

export function CheckStatusBadge({ status }: { status: CheckStatus }) {
  return <Badge tone={TONE_MAP[status] ?? "neutral"}>{checkStatusLabel(status)}</Badge>;
}

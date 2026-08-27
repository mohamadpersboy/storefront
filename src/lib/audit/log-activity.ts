import { ActivityLog } from "@/models/ActivityLog";
import type { UserDocument } from "@/models/User";

/**
 * Records one audit-trail entry. Always best-effort — mirrors the SMS
 * notification pattern already used elsewhere in this project: a
 * logging failure must never fail or roll back the sensitive action
 * it was trying to record.
 */
export async function logActivity(params: {
  actor: Pick<UserDocument, "id" | "fullName" | "phoneNumber">;
  action: string;
  targetType: string;
  targetId?: string | null;
  description: string;
}): Promise<void> {
  try {
    await ActivityLog.create({
      actor: params.actor.id,
      actorName: params.actor.fullName?.trim() || params.actor.phoneNumber,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      description: params.description,
    });
  } catch (error) {
    console.error("Failed to record activity log:", error);
  }
}

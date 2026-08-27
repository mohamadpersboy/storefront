import mongoose, { Schema, type Model, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";

/**
 * Append-only audit trail for sensitive Dashboard actions (§53:
 * "Admin X changed user role"). Deliberately Minimal per the spec's
 * own allowance — one flat collection, no categorization beyond a
 * free-text `action` key, no edit/delete API. It exists to answer
 * "who changed what, when", not to be a full event-sourcing system.
 */
export interface IActivityLog {
  actor: Types.ObjectId;
  // Snapshotted, not populated live — so the log stays readable even
  // if the acting user's account is later renamed or removed.
  actorName: string;
  action: string; // e.g. "user.role_changed", "order.status_changed"
  targetType: string; // e.g. "User", "Order", "Coupon"
  targetId: Types.ObjectId | null;
  description: string; // ready-to-display Persian sentence
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  actorName: { type: String, required: true },
  action: { type: String, required: true, index: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, default: null },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

ActivityLogSchema.plugin(mongoosePaginate);

type ActivityLogModel = Model<IActivityLog> & PaginateModel<IActivityLog>;

export const ActivityLog: ActivityLogModel =
  (mongoose.models.ActivityLog as ActivityLogModel) ||
  mongoose.model<IActivityLog, ActivityLogModel>("ActivityLog", ActivityLogSchema);

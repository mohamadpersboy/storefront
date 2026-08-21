import mongoose, {
  Schema,
  type Model,
  type HydratedDocument,
  type PaginateModel,
} from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { ROLES, type Role } from "@/lib/constants/rbac";
// Side-effect import: augments the `mongoose` module with paginate types.
import "mongoose-paginate-v2";

export interface IUser {
  phoneNumber: string; // E.164-ish, normalized, unique
  fullName?: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: Date;
  deletedAt?: Date | null; // soft delete
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const UserSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fullName: { type: String, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

UserSchema.plugin(mongoosePaginate);

// Default queries should exclude soft-deleted users unless explicitly requested.
UserSchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

type UserModel = Model<IUser> & PaginateModel<IUser>;

export const User: UserModel =
  (mongoose.models.User as UserModel) ||
  mongoose.model<IUser, UserModel>("User", UserSchema);

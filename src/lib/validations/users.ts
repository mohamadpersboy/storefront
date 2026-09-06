import { z } from "zod";
import { ROLES } from "@/lib/constants/rbac";

export const usersListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).optional(),
  role: z.enum(Object.values(ROLES) as [string, ...string[]]).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(Object.values(ROLES) as [string, ...string[]]),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserNameSchema = z.object({
  fullName: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد").max(100),
});

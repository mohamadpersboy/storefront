import { getCurrentUser } from "@/lib/auth/current-user";
import { roleHasPermission, type Permission } from "@/lib/constants/rbac";
import { apiError } from "@/lib/utils/api-response";
import type { UserDocument } from "@/models/User";

/**
 * Use at the top of any protected Route Handler:
 *
 *   const guard = await requireApiUser(PERMISSIONS.USERS_UPDATE);
 *   if (guard.response) return guard.response;
 *   const { user } = guard;
 *
 * This is the real authorization boundary for the API — proxy.ts and
 * the dashboard layout only gate page navigation, not individual
 * requests, so every mutating/sensitive route must call this itself.
 */
export async function requireApiUser(
  permission: Permission,
): Promise<
  { user: UserDocument; response: null } | { user: null; response: Response }
> {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, response: apiError("ابتدا وارد شوید", { status: 401 }) };
  }

  if (!roleHasPermission(user.role, permission)) {
    return {
      user: null,
      response: apiError("شما به این بخش دسترسی ندارید", { status: 403 }),
    };
  }

  return { user, response: null };
}

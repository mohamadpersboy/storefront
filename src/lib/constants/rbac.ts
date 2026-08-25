/**
 * Role & Permission catalog.
 *
 * Roles are just named permission bundles — the source of truth for
 * "can this user do X" is always the PERMISSION check, never the role
 * name itself. This lets new roles be introduced later (e.g. a
 * "Warehouse Staff" role) without touching authorization logic anywhere
 * except this file.
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  STAFF: "staff",
  CUSTOMER: "customer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  PRODUCTS_READ: "products.read",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  CATEGORIES_READ: "categories.read",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_UPDATE: "categories.update",
  CATEGORIES_DELETE: "categories.delete",

  ORDERS_READ: "orders.read",
  ORDERS_UPDATE: "orders.update",

  PAYMENTS_READ: "payments.read",
  PAYMENTS_MANAGE: "payments.manage",

  CUSTOMERS_READ: "customers.read",

  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",

  DISCOUNTS_READ: "discounts.read",
  DISCOUNTS_MANAGE: "discounts.manage",

  DASHBOARD_READ: "dashboard.read",

  COLORS_READ: "colors.read",
  COLORS_MANAGE: "colors.manage",

  SETTINGS_MANAGE: "settings.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const STAFF_PERMISSIONS: Permission[] = [
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.PRODUCTS_UPDATE,
  PERMISSIONS.CATEGORIES_READ,
  PERMISSIONS.COLORS_READ,
  PERMISSIONS.ORDERS_READ,
  PERMISSIONS.ORDERS_UPDATE,
  PERMISSIONS.PAYMENTS_READ,
  PERMISSIONS.PAYMENTS_MANAGE,
  PERMISSIONS.CUSTOMERS_READ,
  PERMISSIONS.DASHBOARD_READ,
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...STAFF_PERMISSIONS,
  PERMISSIONS.PRODUCTS_CREATE,
  PERMISSIONS.PRODUCTS_DELETE,
  PERMISSIONS.CATEGORIES_CREATE,
  PERMISSIONS.CATEGORIES_UPDATE,
  PERMISSIONS.CATEGORIES_DELETE,
  PERMISSIONS.COLORS_MANAGE,
  PERMISSIONS.DISCOUNTS_READ,
  PERMISSIONS.DISCOUNTS_MANAGE,
  PERMISSIONS.USERS_READ,
  PERMISSIONS.USERS_UPDATE,
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.STAFF]: STAFF_PERMISSIONS,
  [ROLES.CUSTOMER]: [],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Only a Super Admin may grant the "admin" or "super_admin" role.
 * An Admin can only assign "staff" or "customer" — otherwise an Admin
 * could promote an arbitrary account (including their own, if the
 * self-change guard were ever removed) to Admin/Super Admin.
 */
export function canAssignRole(actorRole: Role, targetRole: Role): boolean {
  if (targetRole === ROLES.ADMIN || targetRole === ROLES.SUPER_ADMIN) {
    return actorRole === ROLES.SUPER_ADMIN;
  }
  return actorRole === ROLES.SUPER_ADMIN || actorRole === ROLES.ADMIN;
}

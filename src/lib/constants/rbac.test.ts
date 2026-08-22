import { describe, it, expect } from "vitest";
import { canAssignRole, ROLES } from "@/lib/constants/rbac";

describe("canAssignRole", () => {
  it("allows super_admin to assign any role", () => {
    expect(canAssignRole(ROLES.SUPER_ADMIN, ROLES.SUPER_ADMIN)).toBe(true);
    expect(canAssignRole(ROLES.SUPER_ADMIN, ROLES.ADMIN)).toBe(true);
    expect(canAssignRole(ROLES.SUPER_ADMIN, ROLES.STAFF)).toBe(true);
    expect(canAssignRole(ROLES.SUPER_ADMIN, ROLES.CUSTOMER)).toBe(true);
  });

  it("allows admin to assign staff or customer", () => {
    expect(canAssignRole(ROLES.ADMIN, ROLES.STAFF)).toBe(true);
    expect(canAssignRole(ROLES.ADMIN, ROLES.CUSTOMER)).toBe(true);
  });

  it("never allows admin to grant admin or super_admin (privilege escalation)", () => {
    expect(canAssignRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(false);
    expect(canAssignRole(ROLES.ADMIN, ROLES.SUPER_ADMIN)).toBe(false);
  });

  it("never allows staff or customer to assign any role", () => {
    for (const target of Object.values(ROLES)) {
      expect(canAssignRole(ROLES.STAFF, target)).toBe(false);
      expect(canAssignRole(ROLES.CUSTOMER, target)).toBe(false);
    }
  });
});

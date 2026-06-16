import { canAccess, RBACUser } from "../src/lib/rbac";

describe("RBAC Utility Tests", () => {
  describe("canAccess with null/undefined inputs", () => {
    it("should return false if user is null or undefined", () => {
      expect(canAccess(null, "accounting", "read")).toBe(false);
      expect(canAccess(undefined, "accounting", "read")).toBe(false);
    });

    it("should return false if user has no roles or roles is not an array", () => {
      const userNoRoles = { id: "u1", permissions: [] } as any;
      expect(canAccess(userNoRoles, "accounting", "read")).toBe(false);

      const userInvalidRoles = { id: "u1", roles: "NOT_AN_ARRAY", permissions: [] } as any;
      expect(canAccess(userInvalidRoles, "accounting", "read")).toBe(false);
    });
  });

  describe("SUPER_ADMIN role access", () => {
    const admin: RBACUser = {
      id: "admin-id",
      roles: ["SUPER_ADMIN"],
      permissions: []
    };

    it("should allow SUPER_ADMIN access to all resources and actions", () => {
      expect(canAccess(admin, "accounting", "read")).toBe(true);
      expect(canAccess(admin, "accounting", "write")).toBe(true);
      expect(canAccess(admin, "bank", "sign")).toBe(true);
      expect(canAccess(admin, "backups", "restore")).toBe(true);
      expect(canAccess(admin, "expenses", "approve")).toBe(true);
      expect(canAccess(admin, "projects", "distribute_roi")).toBe(true);
    });
  });

  describe("ACCOUNTANT role access", () => {
    const accountant: RBACUser = {
      id: "acct-id",
      roles: ["ACCOUNTANT"],
      permissions: []
    };

    it("should allow read/write for accounting, bank, members, deposits, expenses, projects, reports", () => {
      expect(canAccess(accountant, "accounting", "read")).toBe(true);
      expect(canAccess(accountant, "accounting", "write")).toBe(true);
      expect(canAccess(accountant, "bank", "read")).toBe(true);
      expect(canAccess(accountant, "bank", "write")).toBe(true);
      expect(canAccess(accountant, "members", "read")).toBe(true);
      expect(canAccess(accountant, "members", "write")).toBe(true);
      expect(canAccess(accountant, "deposits", "read")).toBe(true);
      expect(canAccess(accountant, "deposits", "write")).toBe(true);
      expect(canAccess(accountant, "expenses", "read")).toBe(true);
      expect(canAccess(accountant, "expenses", "write")).toBe(true);
      expect(canAccess(accountant, "projects", "read")).toBe(true);
      expect(canAccess(accountant, "projects", "write")).toBe(true);
      expect(canAccess(accountant, "reports", "read")).toBe(true);
    });

    it("should deny backups access and execution/signing actions", () => {
      expect(canAccess(accountant, "backups", "read")).toBe(false);
      expect(canAccess(accountant, "backups", "restore")).toBe(false);
      expect(canAccess(accountant, "bank", "sign")).toBe(false);
      expect(canAccess(accountant, "expenses", "approve")).toBe(false);
      expect(canAccess(accountant, "accounting", "execute_distribution")).toBe(false);
    });
  });

  describe("PRESIDENT, SECRETARY, TREASURER roles access", () => {
    const roles = ["PRESIDENT", "SECRETARY", "TREASURER"];

    it("should allow read-only accesses and bank signing, expense approval/rejection", () => {
      for (const roleName of roles) {
        const user: RBACUser = { id: "u-id", roles: [roleName], permissions: [] };

        expect(canAccess(user, "accounting", "read")).toBe(true);
        expect(canAccess(user, "accounting", "write")).toBe(false);

        expect(canAccess(user, "bank", "read")).toBe(true);
        expect(canAccess(user, "bank", "write")).toBe(true);
        expect(canAccess(user, "bank", "sign")).toBe(true);

        expect(canAccess(user, "members", "read")).toBe(true);
        expect(canAccess(user, "members", "write")).toBe(false);

        expect(canAccess(user, "deposits", "read")).toBe(true);
        expect(canAccess(user, "deposits", "write")).toBe(false);

        expect(canAccess(user, "expenses", "read")).toBe(true);
        expect(canAccess(user, "expenses", "approve")).toBe(true);
        expect(canAccess(user, "expenses", "reject")).toBe(true);

        expect(canAccess(user, "projects", "read")).toBe(true);
        expect(canAccess(user, "projects", "write")).toBe(false);

        expect(canAccess(user, "backups", "read")).toBe(false);
        expect(canAccess(user, "reports", "read")).toBe(true);
      }
    });
  });

  describe("MEMBER role access", () => {
    const member: RBACUser = {
      id: "member-id",
      roles: ["MEMBER"],
      permissions: []
    };

    it("should allow only read on members, deposits, projects, reports and invest on projects", () => {
      expect(canAccess(member, "members", "read")).toBe(true);
      expect(canAccess(member, "deposits", "read")).toBe(true);
      expect(canAccess(member, "projects", "read")).toBe(true);
      expect(canAccess(member, "projects", "invest")).toBe(true);
      expect(canAccess(member, "reports", "read")).toBe(true);

      // Blocked
      expect(canAccess(member, "accounting", "read")).toBe(false);
      expect(canAccess(member, "bank", "read")).toBe(false);
      expect(canAccess(member, "expenses", "read")).toBe(false);
      expect(canAccess(member, "backups", "read")).toBe(false);
      expect(canAccess(member, "members", "write")).toBe(false);
      expect(canAccess(member, "deposits", "write")).toBe(false);
    });
  });

  describe("Multiple roles combination", () => {
    it("should aggregate permissions from all assigned roles", () => {
      const mixedUser: RBACUser = {
        id: "mixed-id",
        roles: ["MEMBER", "ACCOUNTANT"],
        permissions: []
      };

      // Accountant has banking read, Member doesn't. Combined should allow.
      expect(canAccess(mixedUser, "bank", "read")).toBe(true);
      // Neither has backups access, so should deny.
      expect(canAccess(mixedUser, "backups", "read")).toBe(false);
    });
  });
});

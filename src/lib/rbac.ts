export type Resource =
  | "accounting"
  | "bank"
  | "members"
  | "deposits"
  | "expenses"
  | "projects"
  | "backups"
  | "reports"
  | "loans";

export type Action =
  | "read"
  | "write"
  | "delete"
  | "sign"
  | "approve"
  | "reject"
  | "restore"
  | "invest"
  | "distribute_roi"
  | "execute_distribution";

export interface RBACUser {
  id: string;
  roles: string[]; // e.g., ["SUPER_ADMIN"]
  permissions: string[]; // e.g., ["CREATE_MEMBER"]
  memberId?: string | null;
}

// Flat mapping of permissions permitted per Role
const ROLE_PERMISSIONS: Record<string, Partial<Record<Resource, Action[]>>> = {
  SUPER_ADMIN: {
    accounting: ["read", "write", "execute_distribution"],
    bank: ["read", "write", "sign"],
    members: ["read", "write", "delete"],
    deposits: ["read", "write"],
    expenses: ["read", "write", "approve", "reject"],
    projects: ["read", "write", "invest", "distribute_roi"],
    backups: ["read", "write", "restore"],
    reports: ["read"],
    loans: ["read", "write", "approve", "reject"],
  },
  ACCOUNTANT: {
    accounting: ["read", "write"],
    bank: ["read", "write"],
    members: ["read", "write"],
    deposits: ["read", "write"],
    expenses: ["read", "write"],
    projects: ["read", "write"],
    backups: [],
    reports: ["read"],
    loans: ["read", "write", "approve"],
  },
  PRESIDENT: {
    accounting: ["read"],
    bank: ["read", "write", "sign"],
    members: ["read"],
    deposits: ["read"],
    expenses: ["read", "approve", "reject"],
    projects: ["read"],
    backups: [],
    reports: ["read"],
    loans: ["read", "approve", "reject"],
  },
  SECRETARY: {
    accounting: ["read"],
    bank: ["read", "write", "sign"],
    members: ["read"],
    deposits: ["read"],
    expenses: ["read", "approve", "reject"],
    projects: ["read"],
    backups: [],
    reports: ["read"],
    loans: ["read", "approve", "reject"],
  },
  TREASURER: {
    accounting: ["read"],
    bank: ["read", "write", "sign"],
    members: ["read"],
    deposits: ["read"],
    expenses: ["read", "approve", "reject"],
    projects: ["read"],
    backups: [],
    reports: ["read"],
    loans: ["read", "approve", "reject"],
  },
  MEMBER: {
    accounting: [],
    bank: [],
    members: ["read"], // Checked dynamically for owned profiles in the route logic
    deposits: ["read"], // Checked dynamically for owned deposits in the route logic
    expenses: [],
    projects: ["read", "invest"],
    backups: [],
    reports: ["read"], // Checked dynamically for owned statement in the route logic
    loans: ["read", "write"],
  },
};

/**
 * Centered RBAC validator function.
 * Evaluates whether any user role possesses authorization for the specified resource action.
 */
export function canAccess(user: RBACUser | null | undefined, resource: Resource, action: Action): boolean {
  if (!user) {
    return false;
  }

  const roles = user.roles || [];
  const permissions = user.permissions || [];

  // SUPER_ADMIN automatically has access to all actions on all resources
  if (roles.includes("SUPER_ADMIN") || permissions.includes("*:*") || permissions.includes("SUPER_ADMIN")) {
    return true;
  }

  // 1. Check direct dynamic database permissions (e.g. "deposits:read" or "deposits:all")
  if (permissions.includes(`${resource}:${action}`) || permissions.includes(`${resource}:all`)) {
    return true;
  }

  // 2. Fallback to static role-based permissions (for compatibility/default seed users)
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (rolePerms && rolePerms[resource]?.includes(action)) {
      return true;
    }
  }

  return false;
}

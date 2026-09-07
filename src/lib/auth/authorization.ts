import { ADMIN_ROLES, USER_ROLES, isSuperAdminUser } from "@/types/roles";
import type { UserRole } from "@/types/roles";

const ROLE_LEVEL: Record<UserRole, number> = {
  BANNED: 0,
  SUSPENDED: 0,
  STUDENT: 1,
  VERIFIED_STUDENT: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function normalizeRole(role: string | null | undefined): UserRole | null {
  const normalized = role?.trim().toUpperCase();
  return normalized && (USER_ROLES as readonly string[]).includes(normalized)
    ? (normalized as UserRole)
    : null;
}

/** Single source of truth for server-side role resolution. */
export function getEffectiveRole(userId: string, databaseRole?: string | null): UserRole | null {
  if (isSuperAdminUser(userId)) return "SUPER_ADMIN";
  return normalizeRole(databaseRole);
}

export function hasRoleAtLeast(role: UserRole | null, required: UserRole): boolean {
  if (!role) return false;
  return ROLE_LEVEL[role] >= ROLE_LEVEL[required];
}

export function canAccessAdmin(role: UserRole | null): boolean {
  return Boolean(role && ADMIN_ROLES.includes(role));
}

export function canPerformAdminAction(role: UserRole | null, minimumRole: UserRole = "MODERATOR"): boolean {
  return hasRoleAtLeast(role, minimumRole);
}

export function canManageRole(actorRole: UserRole | null, targetRole: UserRole | null): boolean {
  if (!actorRole || !targetRole) return false;
  return ROLE_LEVEL[actorRole] > ROLE_LEVEL[targetRole];
}

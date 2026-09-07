import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, isSuperAdminUser } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { routes } from "@/config/routes";

export interface AdminUser {
  id: string;
  role: UserRole;
}

const ADMIN_ROLE_RANK: Record<"SUPER_ADMIN" | "ADMIN" | "MODERATOR", number> = {
  MODERATOR: 10,
  ADMIN: 20,
  SUPER_ADMIN: 30,
};

export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(routes.login);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const hasAdminRole = Boolean(profile?.role && ADMIN_ROLES.includes(profile.role));
  const hasOwnerIdentity = isSuperAdminUser(user.id);

  if (error || (!hasAdminRole && !hasOwnerIdentity)) {
    redirect(routes.app);
  }

  return {
    id: user.id,
    role: hasOwnerIdentity ? "SUPER_ADMIN" : profile!.role,
  };
}

/**
 * Require an explicit privilege level for sensitive admin operations.
 * MODERATOR intentionally cannot satisfy ADMIN or SUPER_ADMIN requirements.
 */
export async function requireAdminRole(
  minimumRole: "ADMIN" | "SUPER_ADMIN",
): Promise<AdminUser> {
  const admin = await requireAdmin();

  if (ADMIN_ROLE_RANK[admin.role as keyof typeof ADMIN_ROLE_RANK] < ADMIN_ROLE_RANK[minimumRole]) {
    redirect(routes.app);
  }

  return admin;
}

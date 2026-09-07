import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canAccessAdmin, getEffectiveRole, hasRoleAtLeast } from "@/lib/auth/authorization";
import type { UserRole } from "@/types/roles";
import { routes } from "@/config/routes";

export interface AdminUser {
  id: string;
  role: UserRole;
}

/** Server-only admin gate. All role policy decisions come from authorization.ts. */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(routes.login);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = error ? null : getEffectiveRole(user.id, profile?.role);
  if (!canAccessAdmin(role)) redirect(routes.app);

  return { id: user.id, role: role! };
}

/** Require an explicit privilege level for sensitive admin operations. */
export async function requireAdminRole(
  minimumRole: "ADMIN" | "SUPER_ADMIN",
): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!hasRoleAtLeast(admin.role, minimumRole)) redirect(routes.app);
  return admin;
}

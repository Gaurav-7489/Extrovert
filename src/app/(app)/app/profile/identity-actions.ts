"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";
import { routes } from "@/config/routes";

export type IdentityUpdateState = { error?: string; success?: boolean };
const VALID_GENDERS = new Set(["man", "woman", "non-binary", "other", "prefer-not-to-say"]);
const MAX_NAME = 80;

export async function updateProfileIdentity(_prev: IdentityUpdateState, formData: FormData): Promise<IdentityUpdateState> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const { data: identity, error: identityError } = await supabase.from("extrovert_profiles")
    .select("id,display_name,date_of_birth,gender,identity_type,institution_name,field_of_study,department,academic_year,job_title,employer_name,role_description,trust_state")
    .eq("id", user.id).maybeSingle();
  if (identityError || !identity || identity.trust_state === "banned") return { error: "Your Extrovert profile could not be loaded." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  if (!displayName || displayName.length > MAX_NAME) return { error: "Enter a valid name." };
  if (!VALID_GENDERS.has(gender)) return { error: "Choose a valid gender." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return { error: "Enter a valid date of birth." };

  const age = calculateAge(new Date(`${dateOfBirth}T00:00:00`));
  if (age === null || age < 18 || age > 100) return { error: "You must be 18 or older to use Extrovert." };

  const cleanOptional = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max) || null;
  const update = {
    display_name: displayName,
    gender,
    date_of_birth: dateOfBirth,
    institution_name: cleanOptional("institution_name", 160),
    field_of_study: cleanOptional("field_of_study", 120),
    department: cleanOptional("department", 120),
    academic_year: cleanOptional("academic_year", 40),
    job_title: cleanOptional("job_title", 120),
    employer_name: cleanOptional("employer_name", 160),
    role_description: cleanOptional("role_description", 500),
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase.from("extrovert_profiles").update(update).eq("id", user.id);
  if (updateError) return { error: "We could not save those details. Please try again." };

  const { error: mirrorError } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (mirrorError) return { error: "Your profile was saved, but the dating profile could not be synced. Please retry." };

  revalidatePath(routes.profile);
  revalidatePath(routes.profileSetup);
  revalidatePath(routes.discover);
  return { success: true };
}

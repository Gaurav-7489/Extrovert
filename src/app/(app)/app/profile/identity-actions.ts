"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/utils";
import { routes } from "@/config/routes";

export type IdentityUpdateState = { error?: string; success?: boolean };

const VALID_GENDERS = new Set(["man", "woman", "non-binary"]);
const MAX_NAME = 80;

export async function updateProfileIdentity(_prev: IdentityUpdateState, formData: FormData): Promise<IdentityUpdateState> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const { data: identity, error: identityError } = await supabase
    .from("extrovert_profiles")
    .select("id,display_name,date_of_birth,gender,identity_type,institution_name,field_of_study,department,academic_year,job_title,employer_name,role_description,verification_status,trust_state")
    .eq("id", user.id)
    .maybeSingle();
  if (identityError || !identity || identity.trust_state === "banned") return { error: "Your Extrovert identity could not be loaded." };

  const verified = identity.verification_status === "verified";
  const displayName = String(formData.get("display_name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  if (!verified && (!displayName || displayName.length > MAX_NAME)) return { error: "Enter a valid name." };
  if (!verified && !VALID_GENDERS.has(gender)) return { error: "Choose a valid gender." };
  if (!verified && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return { error: "Enter a valid date of birth." };

  const effectiveDob = verified ? String(identity.date_of_birth ?? "") : dateOfBirth;
  const age = effectiveDob ? calculateAge(new Date(`${effectiveDob}T00:00:00`)) : null;
  if (age === null || age < 18) return { error: "You must be 18 or older to use Extrovert." };

  const cleanOptional = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max) || null;
  const update = {
    ...(verified ? {} : { display_name: displayName, gender, date_of_birth: dateOfBirth }),
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

  const { error: mirrorError } = await supabase.from("profiles").update({
    ...(verified ? {} : { display_name: displayName, gender, date_of_birth: dateOfBirth }),
    institution_name: update.institution_name,
    field_of_study: update.field_of_study,
    department: update.department,
    academic_year: update.academic_year,
    job_title: update.job_title,
    employer_name: update.employer_name,
    role_description: update.role_description,
    updated_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (mirrorError) return { error: "Identity saved, but the dating profile mirror could not be updated. Please retry." };

  revalidatePath(routes.profile);
  revalidatePath(routes.profileSetup);
  revalidatePath(routes.discover);
  return { success: true };
}

"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routes } from "@/config/routes";

const MAX_NAME = 80;
const MAX_DEPARTMENT = 100;
const MAX_INSTITUTION = 160;
const IDENTITY_TYPES = new Set(["student", "professional", "other"]);
const GENDERS = new Set(["man", "woman", "non-binary", "other", "prefer-not-to-say"]);
const ACADEMIC_YEARS = new Set(["1st-year", "2nd-year", "3rd-year", "4th-year", "5th-year", "postgraduate"]);

function ageFromDob(value: string) {
  const dob = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const month = now.getUTCMonth() - dob.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

export async function saveIdentity(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const { data: existingIdentity, error: identityReadError } = await supabase
    .from("extrovert_profiles")
    .select("verification_status, display_name, date_of_birth, gender")
    .eq("id", user.id)
    .maybeSingle();

  if (identityReadError) throw new Error("We could not load your identity. Please try again.");

  const isVerified = existingIdentity?.verification_status === "verified";
  const submittedDisplayName = String(formData.get("display_name") ?? "").trim();
  const submittedDateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  const submittedGender = String(formData.get("gender") ?? "").trim();

  // A face check can happen before the identity form is complete. Once a
  // verified identity field already exists, keep it immutable; otherwise use
  // the required value the user is submitting now.
  const displayName = isVerified && existingIdentity?.display_name
    ? String(existingIdentity.display_name).trim()
    : submittedDisplayName;
  const dateOfBirth = isVerified && existingIdentity?.date_of_birth
    ? String(existingIdentity.date_of_birth).trim()
    : submittedDateOfBirth;
  const gender = isVerified && existingIdentity?.gender
    ? String(existingIdentity.gender).trim()
    : submittedGender;

  const identityType = String(formData.get("identity_type") ?? "student").trim();
  const department = String(formData.get("department") ?? "").trim();
  const academicYear = String(formData.get("academic_year") ?? "postgraduate").trim();
  const institutionName = String(formData.get("institution_name") ?? "").trim();

  if (!displayName || displayName.length > MAX_NAME) throw new Error("Please enter a valid display name.");
  if (!GENDERS.has(gender)) throw new Error("Please select a valid gender.");
  if (!IDENTITY_TYPES.has(identityType)) throw new Error("Please select a valid identity type.");
  if (!ACADEMIC_YEARS.has(academicYear)) throw new Error("Please select a valid academic year.");
  if (department.length > MAX_DEPARTMENT || institutionName.length > MAX_INSTITUTION) throw new Error("One of the fields is too long.");

  const age = ageFromDob(dateOfBirth);
  if (age === null || age < 18 || age > 100) throw new Error("You must be 18 or older to use Extrovert.");

  // The action authenticates the user first and validates every mutable field.
  // Use the service client for this final identity write so the onboarding
  // action cannot be blocked by client-role RLS/upsert behavior while protected
  // verification/trust fields remain untouched.
  const admin = createAdminClient();
  const { error: identityWriteError } = await admin.from("extrovert_profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      date_of_birth: dateOfBirth,
      gender,
      identity_type: identityType,
      department: department || "General",
      academic_year: academicYear,
      institution_name: institutionName || null,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (identityWriteError) {
    console.error("[onboarding] identity write failed", {
      code: identityWriteError.code,
      message: identityWriteError.message,
    });
    throw new Error("We could not save your Extrovert identity. Please try again.");
  }

  redirect(routes.app);
}

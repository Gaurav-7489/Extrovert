"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { isUuid } from "@/lib/validation";
import { calculateAge } from "@/lib/utils";

export type ProfileFormState = { error?: string; fieldErrors?: Record<string, string> };
const INTERESTED_IN_OPTIONS = ["men", "women", "nonbinary", "other", "everyone"] as const;
const MINIMUM_AGE = 18;
const MAXIMUM_AGE = 60;
const MAX_PHOTOS = 6;
const MAX_INTERESTS = 20;

export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const { data: identity } = await supabase
    .from("extrovert_profiles")
    .select(
      "id,display_name,date_of_birth,gender,department,academic_year,identity_type,institution_name,field_of_study,job_title,employer_name,role_description,profile_completed,trust_state"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!identity || !identity.profile_completed || identity.trust_state === "banned") {
    return { error: "Complete your Extrovert identity before creating a dating profile." };
  }

  const dob = String(identity.date_of_birth ?? "");
  const age = dob ? calculateAge(new Date(`${dob}T00:00:00`)) : null;
  if (age === null || age < MINIMUM_AGE) {
    return { error: "You must be 18 or older to use Extrovert." };
  }

  const bio = String(formData.get("bio") ?? "").trim();
  const campusResidency = String(formData.get("campus_residency") ?? "").trim();
  const campusHangout = String(formData.get("campus_hangout") ?? "").trim();
  const relationshipGoal = String(formData.get("relationship_goal") ?? "").trim();
  const zodiac = String(formData.get("zodiac") ?? "").trim();
  const sleepHabit = String(formData.get("sleep_habit") ?? "").trim();
  const caffeinePref = String(formData.get("caffeine_pref") ?? "").trim();
  const weekendVibe = String(formData.get("weekend_vibe") ?? "").trim();
  const promptQuestion = String(formData.get("prompt_question") ?? "").trim();
  const promptAnswer = String(formData.get("prompt_answer") ?? "").trim();

  const photoPaths = Array.from(
    new Set(
      formData
        .getAll("photo_paths")
        .map(String)
        .map((x) => x.trim())
        .filter(Boolean)
    )
  ).filter((x) => x.startsWith(`${user.id}/`));

  const interestIds = Array.from(
    new Set(
      formData
        .getAll("interests")
        .map(String)
        .map((x) => x.trim())
        .filter(Boolean)
    )
  );

  const interestedIn = String(formData.get("interested_in") ?? "").trim();
  const minAge = Number.parseInt(String(formData.get("min_age") ?? ""), 10);
  const maxAge = Number.parseInt(String(formData.get("max_age") ?? ""), 10);

  const errors: Record<string, string> = {};
  if (bio.length > 500) errors.bio = "Bio must be 500 characters or less.";
  if (promptAnswer.length > 300)
    errors.prompt_answer = "Prompt answer must be 300 characters or less.";
  if (!photoPaths.length) errors.photo_paths = "Add your main profile photo to continue.";
  else if (photoPaths.length > MAX_PHOTOS)
    errors.photo_paths = `You can save up to ${MAX_PHOTOS} photos.`;

  if (!interestIds.length) errors.interests = "Select at least one interest.";
  else if (interestIds.length > MAX_INTERESTS || interestIds.some((x) => !isUuid(x)))
    errors.interests = "Please choose valid interests.";

  if (!INTERESTED_IN_OPTIONS.includes(interestedIn as (typeof INTERESTED_IN_OPTIONS)[number]))
    errors.interested_in = "Please select who you are interested in.";

  if (!Number.isInteger(minAge) || minAge < MINIMUM_AGE || minAge > MAXIMUM_AGE)
    errors.min_age = "Minimum age must be between 18 and 60.";
  if (!Number.isInteger(maxAge) || maxAge < MINIMUM_AGE || maxAge > MAXIMUM_AGE)
    errors.max_age = "Maximum age must be between 18 and 60.";
  if (minAge > maxAge) {
    errors.min_age = "Minimum age cannot be greater than maximum age.";
    errors.max_age = "Maximum age cannot be less than minimum age.";
  }

  if (Object.keys(errors).length) return { fieldErrors: errors };

  const interestedInArray =
    interestedIn === "everyone"
      ? ["men", "women", "nonbinary", "other", "everyone"]
      : [interestedIn];

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: identity.display_name,
      date_of_birth: identity.date_of_birth,
      gender: identity.gender,
      department: identity.department,
      academic_year: identity.academic_year,
      identity_type: identity.identity_type,
      institution_name: identity.institution_name,
      field_of_study: identity.field_of_study,
      job_title: identity.job_title,
      employer_name: identity.employer_name,
      role_description: identity.role_description,
      bio: bio || null,
      campus_residency: campusResidency || null,
      campus_hangout: campusHangout || null,
      relationship_goal: relationshipGoal || null,
      zodiac: zodiac || null,
      sleep_habit: sleepHabit || null,
      caffeine_pref: caffeinePref || null,
      weekend_vibe: weekendVibe || null,
      prompt_question: promptQuestion || null,
      prompt_answer: promptAnswer || null,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return { error: "We could not save your dating profile. Please try again." };
  }

  const { data: existingPhotos } = await supabase
    .from("profile_photos")
    .select("id,storage_path,display_order,is_primary")
    .eq("profile_id", user.id)
    .order("display_order", { ascending: true });

  const existing = existingPhotos ?? [];
  const keep = new Set(photoPaths);
  const removed = existing.filter((p) => !keep.has(p.storage_path));

  if (removed.length) {
    const { error: e } = await supabase
      .from("profile_photos")
      .delete()
      .in(
        "id",
        removed.map((p) => p.id)
      );
    if (e) return { error: "We could not update your photos. Please try again." };
    await supabase.storage.from("profile-photos").remove(removed.map((p) => p.storage_path));
  }

  const existingPaths = new Set(existing.map((p) => p.storage_path));
  const newRows = photoPaths
    .filter((p) => !existingPaths.has(p))
    .map((storage_path) => ({
      profile_id: user.id,
      storage_path,
      display_order: photoPaths.indexOf(storage_path),
      is_primary: photoPaths.indexOf(storage_path) === 0,
    }));

  if (newRows.length) {
    const { error: e } = await supabase.from("profile_photos").insert(newRows);
    if (e) return { error: "We could not save your new photos. Please try again." };
  }

  const currentByPath = new Map(existing.map((p) => [p.storage_path, p]));
  for (let i = 0; i < photoPaths.length; i++) {
    const row = currentByPath.get(photoPaths[i]);
    if (row && (row.display_order !== i || row.is_primary !== (i === 0))) {
      await supabase
        .from("profile_photos")
        .update({ display_order: i, is_primary: i === 0 })
        .eq("id", row.id);
    }
  }

  const { error: deleteInterestError } = await supabase
    .from("profile_interests")
    .delete()
    .eq("profile_id", user.id);

  if (deleteInterestError) {
    return { error: "We could not update your interests. Please try again." };
  }

  if (interestIds.length) {
    const { error: e } = await supabase
      .from("profile_interests")
      .insert(interestIds.map((interest_id) => ({ profile_id: user.id, interest_id })));
    if (e) return { error: "We could not save your interests. Please try again." };
  }

  const { error: prefError } = await supabase.from("dating_preferences").upsert(
    {
      user_id: user.id,
      interested_in: interestedInArray,
      min_age: minAge,
      max_age: maxAge,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (prefError) {
    return { error: "We could not save your dating preferences. Please try again." };
  }

  revalidatePath(routes.discover, "page");
  revalidatePath(routes.app, "layout");
  revalidatePath(routes.profile, "page");
  redirect(routes.discover);
}

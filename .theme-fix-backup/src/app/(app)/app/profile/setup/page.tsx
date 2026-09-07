import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { ProfileFormLoader } from "./profile-form-loader";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Dating Profile | DateBu" };
export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const supabase = await createServerSupabaseClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId =
    typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) redirect(routes.login);

  const [
    { data: interests },
    { data: existingProfile },
    { data: existingPhotos },
    { data: existingPi },
    { data: existingPreferences },
    { data: identity },
  ] = await Promise.all([
    supabase.from("interests").select("id,name").order("name"),
    supabase
      .from("profiles")
      .select(
        "bio,campus_residency,campus_hangout,relationship_goal,zodiac,sleep_habit,caffeine_pref,weekend_vibe,prompt_question,prompt_answer"
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("profile_photos")
      .select("storage_path,display_order,is_primary")
      .eq("profile_id", userId)
      .order("display_order"),
    supabase
      .from("profile_interests")
      .select("interest_id")
      .eq("profile_id", userId),
    supabase
      .from("dating_preferences")
      .select("interested_in,min_age,max_age,preferred_department")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("extrovert_profiles")
      .select(
        "display_name,date_of_birth,gender,department,academic_year,identity_type,institution_name,field_of_study,job_title,employer_name,role_description,area_id,profile_completed,trust_state,verification_status,area_verification_status"
      )
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (!identity) redirect(`${routes.login}?error=extrovert_identity_required`);

  const paths = (existingPhotos ?? []).map((p) => p.storage_path);
  const urls = paths.flatMap((p) => {
    const u = getProfilePhotoUrl(p, 320);
    return u ? [u] : [];
  });
  const interestIds = (existingPi ?? []).map((r) => r.interest_id);

  const { data: area } = identity.area_id
    ? await supabase
        .from("extrovert_areas")
        .select("name")
        .eq("id", identity.area_id)
        .maybeSingle()
    : { data: null };

  const context =
    identity.identity_type === "student"
      ? `${identity.institution_name || "College / university"} · ${
          identity.department || "Student"
        }${identity.academic_year ? ` · ${identity.academic_year}` : ""}`
      : identity.identity_type === "professional"
      ? `${identity.job_title || "Professional"}${
          identity.employer_name ? ` · ${identity.employer_name}` : ""
        }`
      : identity.role_description || "Current role";

  const complete = Boolean(identity.profile_completed);

  return (
    <main className="mx-auto w-full max-w-md px-3.5 pb-28 pt-4 font-sans text-zinc-950 transition-colors dark:text-zinc-50 sm:px-4">
      <header className="mb-4">
        <Link
          href={routes.profile}
          className="mb-2.5 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 shadow-2xs transition hover:border-[#550000]/30 hover:text-[#550000] active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-300 dark:hover:border-[#550000]/40 dark:hover:text-red-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Profile</span>
        </Link>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
              DATEBU PROFILE
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              Make your profile yours
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#550000]/20 bg-[#550000]/5 px-2.5 py-1 text-[10px] font-bold text-[#550000] shadow-2xs dark:border-[#550000]/35 dark:bg-[#550000]/15 dark:text-red-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy-first</span>
          </div>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Build the authentic version people meet in Discover. Verified identity
          details are locked to preserve trust; dating preferences shape your
          visibility.
        </p>
      </header>

      {/* Identity Summary Card */}
      <section className="mb-5 flex flex-col gap-3 rounded-[1.75rem] border border-[#550000]/20 bg-[#550000]/5 p-4 shadow-2xs transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/15 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#550000] text-white shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
                Verified identity
              </p>
              <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {identity.display_name || "DateBu member"}
              </p>
            </div>
          </div>
          <p className="mt-2 truncate text-xs text-zinc-600 dark:text-zinc-300">
            {context} · {area?.name || "Area not set"}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start rounded-xl border border-zinc-200/80 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-[#181820] dark:text-zinc-300 sm:self-center">
          <CheckCircle2
            className={`h-3.5 w-3.5 ${
              complete ? "text-[#550000] dark:text-red-400" : "text-zinc-300 dark:text-zinc-600"
            }`}
          />
          <span>{complete ? "Profile live" : "Setup in progress"}</span>
        </div>
      </section>

      {/* Main Profile Setup Form Loader */}
      <ProfileFormLoader
        userId={userId}
        interests={interests ?? []}
        existingProfile={existingProfile}
        existingPhotoUrls={urls}
        existingPhotoPaths={paths}
        existingInterestIds={interestIds}
        existingPreferences={existingPreferences}
        identity={{
          displayName: identity.display_name ?? "",
          dateOfBirth: identity.date_of_birth ?? "",
          gender: identity.gender ?? "",
          department: identity.department,
          academicYear: identity.academic_year,
          identityType: identity.identity_type ?? "student",
          institutionName: identity.institution_name,
          fieldOfStudy: identity.field_of_study,
          jobTitle: identity.job_title,
          employerName: identity.employer_name,
          roleDescription: identity.role_description,
          areaName: area?.name ?? "",
          verificationStatus: identity.verification_status,
        }}
      />
    </main>
  );
}
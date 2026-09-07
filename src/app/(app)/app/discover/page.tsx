import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import DiscoverMode from "./discover-mode";
import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Discover | DateBu" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DISCOVER_BATCH_SIZE = 20;
const DISCOVER_CANDIDATE_SIZE = 50;
const DISCOVER_IMAGE_WIDTH = 768;

type DiscoverProfile = {
  id: string;
  display_name: string;
  date_of_birth: string;
  gender: string;
  department: string;
  academic_year: string;
  identity_type?: string;
  institution_name?: string | null;
  field_of_study?: string | null;
  job_title?: string | null;
  employer_name?: string | null;
  role_description?: string | null;
  bio: string | null;
  ghost_mode: boolean;
  created_at: string;
  profile_photos: Array<{
    storage_path: string;
    display_order: number;
    is_primary: boolean;
  }> | null;
  profile_interests: Array<{
    interests: { id: string; name: string } | null;
  }> | null;
  verification_status: string;
  area_verification_status: string;
  area_name: string | null;
  profile_photo_path: string | null;
  is_beyond: boolean;
};

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;
  if (!userId) return null;

  const [
    { data: myProfile },
    { data: identity },
    { data: myPrefs },
    { data: isPro },
    { data: myPhotos },
    { data: myInterests },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id,profile_completed,display_name,date_of_birth,gender,department,academic_year,area_name,bio"
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("extrovert_profiles")
      .select("id,display_name,date_of_birth,gender,profile_completed")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("dating_preferences")
      .select("preferred_department,interested_in,min_age,max_age")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.rpc("is_datebu_pro"),
    supabase
      .from("profile_photos")
      .select("id")
      .eq("profile_id", userId)
      .limit(1),
    supabase
      .from("profile_interests")
      .select("interest_id")
      .eq("profile_id", userId)
      .limit(1),
  ]);

  const effectiveDisplayName =
    myProfile?.display_name?.trim() || identity?.display_name?.trim() || "";
  const effectiveDob = myProfile?.date_of_birth || identity?.date_of_birth || "";
  const effectiveGender = myProfile?.gender || identity?.gender || "";

  const hasPhotos = (myPhotos?.length ?? 0) > 0;
  const hasInterests = (myInterests?.length ?? 0) > 0;

  const hasInterestedIn = Array.isArray(myPrefs?.interested_in)
    ? myPrefs.interested_in.length > 0
    : typeof myPrefs?.interested_in === "string" &&
      Boolean((myPrefs.interested_in as string).trim());

  // Canonical completion logic:
  // 1. If explicit profiles.profile_completed is true AND basic identity exists, profile is complete.
  // 2. Or if identity, photos, interests and dating preference are present.
  const isProfileMarkedCompleted = Boolean(myProfile?.profile_completed);

  const actualDatingDataComplete =
    (isProfileMarkedCompleted && Boolean(effectiveDisplayName && effectiveDob && effectiveGender)) ||
    Boolean(
      effectiveDisplayName &&
        effectiveDob &&
        effectiveGender &&
        hasPhotos &&
        hasInterests &&
        hasInterestedIn
    );

  // Auto-heal profiles.profile_completed flag if data is complete
  if (actualDatingDataComplete && !myProfile?.profile_completed) {
    await supabase
      .from("profiles")
      .update({ profile_completed: true, updated_at: new Date().toISOString() })
      .eq("id", userId);
  }

  if (!actualDatingDataComplete) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-140px)] w-full max-w-md flex-col items-center justify-center px-4 py-8 text-center">
        <Card className="w-full border-zinc-200/90 bg-white p-7 shadow-lg dark:border-white/10 dark:bg-[#121216] dark:shadow-2xl sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] shadow-2xs dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
            Complete your dating profile
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-sm">
            Set up your dating details and photos so nearby people can find you.
            You can always explore other sections in the meantime.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href={routes.profileSetup} className="w-full sm:w-auto">
              <Button className="w-full gap-2 rounded-2xl border border-[#550000]/40 bg-[#550000] px-6 py-3 font-semibold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95 sm:w-auto">
                Set up profile <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const wanted = Array.isArray(myPrefs?.interested_in)
    ? myPrefs.interested_in
    : typeof myPrefs?.interested_in === "string" && myPrefs.interested_in
    ? [myPrefs.interested_in]
    : ["men", "women", "nonbinary", "other", "everyone"];

  const prefDept = myPrefs?.preferred_department?.trim() || null;
  const { data: rawProfiles, error } = await supabase.rpc(
    "get_discover_profiles_v2",
    {
      p_excluded_ids: [userId],
      p_limit: DISCOVER_CANDIDATE_SIZE,
      p_interested_in: wanted,
      p_preferred_department: prefDept,
    }
  );

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-140px)] w-full max-w-md flex-col items-center justify-center px-4 py-8 text-center">
        <Card className="w-full border-zinc-200/90 bg-white p-7 shadow-lg dark:border-white/10 dark:bg-[#121216] dark:shadow-2xl sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Discovery is taking a moment
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            We couldn&apos;t load people nearby right now. Please refresh to try again.
          </p>
        </Card>
      </div>
    );
  }

  const normalized = (rawProfiles ?? []) as DiscoverProfile[];
  const ranked = normalized.slice(0, DISCOVER_BATCH_SIZE);
  const profilesWithPhotoUrls = ranked.map((profile) => {
    const photos = [...(profile.profile_photos ?? [])]
      .sort(
        (a, b) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          a.display_order - b.display_order
      )
      .slice(0, 5)
      .map((photo) => ({
        ...photo,
        url: getProfilePhotoUrl(photo.storage_path, DISCOVER_IMAGE_WIDTH),
      }));

    const sharedPhoto = getProfilePhotoUrl(
      profile.profile_photo_path,
      DISCOVER_IMAGE_WIDTH
    );
    const context =
      profile.job_title ||
      profile.field_of_study ||
      profile.department ||
      (profile.identity_type === "student"
        ? "Student"
        : profile.identity_type === "professional"
        ? "Professional"
        : "DateBu member");

    return {
      ...profile,
      profile_photo_url: photos[0]?.url ?? sharedPhoto,
      profile_photos: photos,
      verification_status: profile.verification_status,
      area_verification_status: profile.area_verification_status,
      area_name: profile.area_name,
      bio: profile.bio ?? null,
      identity_context: context,
    };
  });

  const nearbyArea = myProfile?.area_name ?? null;
  return (
    <DiscoverMode
      profiles={profilesWithPhotoUrls}
      isPro={Boolean(isPro)}
      nearbyArea={nearbyArea}
    />
  );
}

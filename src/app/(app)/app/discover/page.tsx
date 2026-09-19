import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import DiscoverMode from "./discover-mode";
import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";

export const metadata: Metadata = { title: "Discover | Extrovert" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DISCOVER_BATCH_SIZE = 12;
const NEARBY_BATCH_SIZE = 30;
const DISCOVER_IMAGE_WIDTH = 640;

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

function hydrateProfiles(profiles: DiscoverProfile[]) {
  return profiles.map((profile) => {
    const photos = [...(profile.profile_photos ?? [])]
      .sort(
        (a, b) =>
          Number(b.is_primary) - Number(a.is_primary) ||
          a.display_order - b.display_order
      )
      .slice(0, 1)
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
        : "Extrovert member");

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
}

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
        "id,profile_completed,display_name,date_of_birth,gender,department,academic_year,bio,experience_mode"
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("extrovert_profiles")
      .select(
        "id,display_name,date_of_birth,gender,profile_completed,area_id,area_verification_status"
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("dating_preferences")
      .select("preferred_department,interested_in,min_age,max_age")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.rpc("is_datebu_pro"),
    supabase.from("profile_photos").select("id").eq("profile_id", userId).limit(1),
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
      Boolean(myPrefs.interested_in.trim());

  const actualDatingDataComplete = Boolean(
    effectiveDisplayName &&
      effectiveDob &&
      effectiveGender &&
      hasPhotos &&
      hasInterests &&
      hasInterestedIn
  );

  if (!actualDatingDataComplete) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-140px)] w-full max-w-md flex-col items-center justify-center px-4 py-8 text-center supports-[height:100dvh]:min-h-[calc(100dvh-140px)]">
        <Card className="w-full border-white/10 bg-[#121216] p-7 shadow-2xl sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgb(var(--brand-red)/.3)] bg-[rgb(var(--brand-red)/.16)] text-[rgb(var(--brand-red))]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
            Complete your dating profile
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Add your dating details, interests and photos before you discover people.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href={routes.profileSetup} className="w-full sm:w-auto">
              <Button className="w-full gap-2 rounded-2xl px-6 py-3 font-semibold sm:w-auto">
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
    : ["everyone"];

  const prefDept = myPrefs?.preferred_department?.trim() || null;
  const minAge = Math.max(18, Math.min(99, Number(myPrefs?.min_age ?? 18)));
  const maxAge = Math.max(minAge, Math.min(99, Number(myPrefs?.max_age ?? 99)));
  const verifiedAreaId =
    identity?.area_verification_status === "verified"
      ? identity?.area_id ?? null
      : null;

  const areaPromise = verifiedAreaId
    ? supabase
        .from("extrovert_areas")
        .select("name")
        .eq("id", verifiedAreaId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const commonArgs = {
    p_excluded_ids: [userId],
    p_interested_in: wanted,
    p_preferred_department: prefDept,
    p_min_age: minAge,
    p_max_age: maxAge,
  };

  const [
    { data: rawProfiles, error },
    { data: rawNearby, error: nearbyError },
    { data: area },
  ] = await Promise.all([
    supabase.rpc("get_discover_profiles_v3", {
      ...commonArgs,
      p_limit: DISCOVER_BATCH_SIZE,
      p_area_id: null,
    }),
    verifiedAreaId
      ? supabase.rpc("get_discover_profiles_v3", {
          ...commonArgs,
          p_limit: NEARBY_BATCH_SIZE,
          p_area_id: verifiedAreaId,
        })
      : Promise.resolve({ data: [], error: null }),
    areaPromise,
  ]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-140px)] w-full max-w-md flex-col items-center justify-center px-4 py-8 text-center supports-[height:100dvh]:min-h-[calc(100dvh-140px)]">
        <Card className="w-full border-white/10 bg-[#121216] p-7 shadow-2xl sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-900/50 bg-rose-950/30 text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold tracking-tight text-zinc-50">
            Discovery is taking a moment
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-400">
            We couldn&apos;t load people right now. Please try again in a moment.
          </p>
          <Link
            href={routes.discover}
            className="mt-5 inline-flex text-xs font-bold text-[rgb(var(--brand-red))] underline underline-offset-4"
          >
            Try Discover again
          </Link>
        </Card>
      </div>
    );
  }

  const profiles = hydrateProfiles((rawProfiles ?? []) as DiscoverProfile[]);
  const nearbyProfiles = nearbyError
    ? []
    : hydrateProfiles((rawNearby ?? []) as DiscoverProfile[]);

  return (
    <DiscoverMode
      profiles={profiles}
      nearbyProfiles={nearbyProfiles}
      isPro={Boolean(isPro)}
      nearbyArea={area?.name ?? null}
      areaVerified={Boolean(verifiedAreaId)}
    />
  );
}

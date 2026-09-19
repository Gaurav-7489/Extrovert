import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import DiscoverMode from "./discover-mode";

export const metadata: Metadata = { title: "Discover | Extrovert" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DISCOVER_BATCH_SIZE = 16;
const NEARBY_BATCH_SIZE = 24;
const DISCOVER_IMAGE_WIDTH = 640;

type RawDiscoverProfile = {
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
  profile_photos:
    | Array<{
        storage_path: string;
        display_order: number;
        is_primary: boolean;
      }>
    | null;
  profile_interests:
    | Array<{
        interests: { id: string; name: string } | null;
      }>
    | null;
  verification_status: string;
  area_verification_status: string;
  area_name: string | null;
  profile_photo_path: string | null;
  is_beyond: boolean;
  distance_km?: number | null;
};

function prepareProfiles(raw: RawDiscoverProfile[], limit: number) {
  return raw.slice(0, limit).map((profile) => {
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
      bio: profile.bio ?? null,
      identity_context: context,
      distance_km:
        profile.distance_km === null || profile.distance_km === undefined
          ? null
          : Number(profile.distance_km),
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
        "id,profile_completed,display_name,date_of_birth,gender,department,academic_year,bio"
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
      <div className="mx-auto flex min-h-[calc(var(--app-height,100dvh)-140px)] w-full max-w-md flex-col items-center justify-center px-4 py-8 text-center">
        <Card className="w-full border-white/10 bg-[#121216] p-7 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgb(var(--brand-red)/.3)] bg-[rgb(var(--brand-red)/.14)] text-[rgb(var(--brand-red))]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-black tracking-tight text-zinc-50">
            Complete your dating profile
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-400">
            Add your preferences, interests and at least one photo before Discover starts ranking people for you.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href={routes.profileSetup} className="w-full">
              <Button className="w-full gap-2 rounded-2xl px-6 py-3 font-bold">
                Finish profile <ArrowRight className="h-4 w-4" />
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
  const minAge = Math.max(18, Number(myPrefs?.min_age ?? 18));
  const maxAge = Math.max(minAge, Math.min(99, Number(myPrefs?.max_age ?? 99)));
  const nearbyVerified = identity?.area_verification_status === "verified";

  const [{ data: currentArea }, forYouResult, nearbyResult] = await Promise.all([
    identity?.area_id
      ? supabase
          .from("extrovert_areas")
          .select("name")
          .eq("id", identity.area_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.rpc("get_discover_profiles_v3", {
      p_excluded_ids: [userId],
      p_limit: DISCOVER_BATCH_SIZE,
      p_interested_in: wanted,
      p_preferred_department: prefDept,
      p_min_age: minAge,
      p_max_age: maxAge,
      p_nearby_only: false,
      p_max_distance_km: 25,
    }),
    nearbyVerified
      ? supabase.rpc("get_discover_profiles_v3", {
          p_excluded_ids: [userId],
          p_limit: NEARBY_BATCH_SIZE,
          p_interested_in: wanted,
          p_preferred_department: prefDept,
          p_min_age: minAge,
          p_max_age: maxAge,
          p_nearby_only: true,
          p_max_distance_km: 25,
        })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (forYouResult.error) {
    console.error("Discover RPC failed:", forYouResult.error);
    return (
      <div className="mx-auto flex min-h-[calc(var(--app-height,100dvh)-140px)] w-full max-w-md flex-col items-center justify-center px-4 py-8 text-center">
        <Card className="w-full border-white/10 bg-[#121216] p-7 shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/[.08] text-rose-300">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-black tracking-tight text-zinc-50">
            Discovery is taking a moment
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-zinc-400">
            We couldn&apos;t build your deck right now. Nothing was lost — try again in a moment.
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

  if (nearbyResult.error) {
    console.error("Nearby Discover RPC failed:", nearbyResult.error);
  }

  const profiles = prepareProfiles(
    (forYouResult.data ?? []) as RawDiscoverProfile[],
    DISCOVER_BATCH_SIZE
  );
  const nearbyProfiles = prepareProfiles(
    (nearbyResult.data ?? []) as RawDiscoverProfile[],
    NEARBY_BATCH_SIZE
  );

  return (
    <DiscoverMode
      profiles={profiles}
      nearbyProfiles={nearbyProfiles}
      isPro={Boolean(isPro)}
      nearbyArea={currentArea?.name ?? null}
      nearbyVerified={nearbyVerified}
      nearbyUnavailable={Boolean(nearbyResult.error)}
    />
  );
}

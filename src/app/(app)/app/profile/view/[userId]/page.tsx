import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck, MapPin, UserRound } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { calculateAge } from "@/lib/utils";
import ProfileActions from "@/components/profile/profile-actions";

type Props = { params: Promise<{ userId: string }> };

type ProfileRow = {
  id: string;
  display_name: string;
  date_of_birth: string;
  gender: string;
  department: string;
  academic_year: string;
  bio: string | null;
  profile_completed: boolean;
  ghost_mode: boolean;
  campus_residency: string | null;
  relationship_goal: string | null;
  zodiac: string | null;
  sleep_habit: string | null;
  caffeine_pref: string | null;
  weekend_vibe: string | null;
  prompt_question: string | null;
  prompt_answer: string | null;
  profile_photos: {
    id: string;
    storage_path: string;
    is_primary: boolean;
    display_order: number;
  }[];
  profile_interests: { id: string; name: string }[];
};

export const metadata: Metadata = { title: "Profile | Extrovert" };
export const dynamic = "force-dynamic";

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-bold shadow-2xs backdrop-blur-xs ${
        ok
          ? "border-[#550000]/30 bg-white/95 text-[#550000] dark:border-red-500/40 dark:bg-[#121216]/95 dark:text-red-300"
          : "border-zinc-300/80 bg-white/90 text-zinc-600 dark:border-white/10 dark:bg-[#121216]/90 dark:text-zinc-400"
      }`}
    >
      <ShieldCheck className="h-2.5 w-2.5" />
      <span>{label}</span>
    </span>
  );
}

export default async function StudentProfilePage({ params }: Props) {
  const { userId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(routes.login);
  if (user.id === userId) redirect(routes.profile);

  const { data: rows, error } = await supabase.rpc("get_student_profile", {
    p_user_id: userId,
  });

  if (error) notFound();
  const profile = (rows?.[0] ?? null) as ProfileRow | null;
  if (!profile || profile.ghost_mode) notFound();

  const [{ data: viewer }, { data: trust }] = await Promise.all([
    supabase
      .from("profiles")
      .select("ghost_mode")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("extrovert_profiles")
      .select(
        "verification_status,area_verification_status,area_id,profile_photo_path,identity_type,institution_name,field_of_study,job_title,employer_name,role_description"
      )
      .eq("id", userId)
      .maybeSingle(),
  ]);

  let areaName: string | null = null;
  if (trust?.area_id) {
    const { data: area } = await supabase
      .from("extrovert_areas")
      .select("name")
      .eq("id", trust.area_id)
      .maybeSingle();
    areaName = area?.name ?? null;
  }

  if (!viewer?.ghost_mode) {
    try {
      await supabase.from("profile_views").insert({
        viewer_id: user.id,
        viewed_id: userId,
      });
    } catch {}
  }

  const photos = [...(profile.profile_photos ?? [])].sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) ||
      a.display_order - b.display_order
  );
  const photoUrls = photos
    .map((p) => getProfilePhotoUrl(p.storage_path, 640))
    .filter(Boolean) as string[];
  const sharedPhoto = getProfilePhotoUrl(trust?.profile_photo_path, 640);
  const age = calculateAge(profile.date_of_birth);
  const identityVerified = trust?.verification_status === "verified";
  const areaVerified = trust?.area_verification_status === "verified";

  return (
    <main className="mx-auto max-w-md space-y-3.5 px-3.5 py-4 pb-28 font-sans text-zinc-950 transition-colors dark:text-zinc-50">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-1">
        <Link
          href={routes.discover}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/90 bg-white text-zinc-700 shadow-2xs transition hover:bg-zinc-50 active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200 dark:hover:bg-[#202028]"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
            EXTROVERT
          </p>
          <h1 className="truncate text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {profile.display_name || "Profile"}
          </h1>
        </div>
      </div>

      {/* Hero Photo & Cover Details */}
      <section className="overflow-hidden rounded-[2rem] border border-zinc-200/90 bg-white shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
        <div className="relative aspect-[4/5] bg-zinc-100 dark:bg-[#16161d]">
          {photoUrls[0] || sharedPhoto ? (
            <Image
              src={photoUrls[0] || sharedPhoto!}
              alt={profile.display_name}
              fill
              priority
              className="object-cover"
              sizes="(max-width:640px) 100vw,420px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#550000]/5 text-7xl font-bold text-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300/40">
              {profile.display_name?.charAt(0) ?? "?"}
            </div>
          )}

          <div className="absolute right-3 top-3 flex max-w-[72%] flex-col items-end gap-1.5">
            <Badge
              ok={identityVerified}
              label={identityVerified ? "Face verified" : "Face not verified"}
            />
            <Badge
              ok={areaVerified}
              label={areaVerified ? "Area verified" : "Area not verified"}
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 pt-20 text-white">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {profile.display_name}
              {age !== null && (
                <span className="ml-1.5 text-xl font-normal text-white/80">
                  {age}
                </span>
              )}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-white/90">
              {profile.gender && <span className="capitalize">{profile.gender}</span>}
              {areaName && (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {areaName}
                </span>
              )}
              {profile.academic_year && <span>• {profile.academic_year}</span>}
            </div>
            {profile.department && (
              <p className="mt-1 text-xs text-white/75">{profile.department}</p>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="p-4">
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-sm">
              &ldquo;{profile.bio}&rdquo;
            </p>
          </div>
        )}
      </section>

      {/* Additional Photos Tray */}
      {photoUrls.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {photoUrls.slice(1, 5).map((url, index) => (
            <div
              key={url}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100 shadow-2xs dark:border-white/10 dark:bg-[#16161d]"
            >
              <Image
                src={url}
                alt={`Photo ${index + 2}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </div>
          ))}
        </div>
      )}

      {/* Prompt Card */}
      {profile.prompt_question && profile.prompt_answer && (
        <section className="rounded-3xl border border-[#550000]/20 bg-[#550000]/5 p-4 transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/15">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
            {profile.prompt_question}
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-900 dark:text-zinc-100 sm:text-sm">
            &ldquo;{profile.prompt_answer}&rdquo;
          </p>
        </section>
      )}

      {/* Identity & Interests / Vibe */}
      <section className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Identity &amp; vibe
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 transition-colors dark:border-white/5 dark:bg-[#16161d]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Gender
            </p>
            <p className="mt-0.5 text-xs font-bold capitalize text-zinc-950 dark:text-zinc-100">
              {profile.gender || "Not set"}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 transition-colors dark:border-white/5 dark:bg-[#16161d]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Area
            </p>
            <p className="mt-0.5 text-xs font-bold text-zinc-950 dark:text-zinc-100">
              {areaName || "Not set"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            profile.relationship_goal,
            profile.zodiac,
            profile.sleep_habit,
            profile.caffeine_pref,
            profile.weekend_vibe,
            ...(profile.profile_interests ?? []).map((i) => i.name),
          ]
            .filter(Boolean)
            .map((item) => (
              <span
                key={String(item)}
                className="rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-300"
              >
                {item}
              </span>
            ))}
        </div>
      </section>

      {/* Floating Action Dock */}
      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 rounded-3xl border border-zinc-200/90 bg-white/95 p-2 shadow-xl backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#121216]/95">
        <Link
          href={routes.discover}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-2xs transition hover:bg-zinc-50 active:scale-95 dark:border-white/10 dark:bg-[#181820] dark:text-zinc-200 dark:hover:bg-[#202028]"
          aria-label="Back to Discover"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <ProfileActions
          targetUserId={profile.id}
          targetName={profile.display_name}
        />

        <Link
          href={routes.profile}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-2xs transition hover:bg-zinc-50 active:scale-95 dark:border-white/10 dark:bg-[#181820] dark:text-zinc-200 dark:hover:bg-[#202028]"
          aria-label="My profile"
        >
          <UserRound className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/shared/empty-state";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { RemoveMatchButton } from "@/components/matches/remove-match-button";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { calculateAge } from "@/lib/utils";
import { MessageCircle, Compass, ShieldCheck, MapPin, UserRound } from "lucide-react";

export const metadata: Metadata = { title: "Your Matches | DateBu" };
export const dynamic = "force-dynamic";

type MatchProfile = {
  id: string;
  display_name: string;
  date_of_birth: string;
  gender: string;
  department: string;
  academic_year: string;
  bio: string | null;
  campus_residency: string | null;
  relationship_goal: string | null;
  zodiac: string | null;
  profile_photos: Array<{
    storage_path: string;
    display_order: number;
    is_primary: boolean;
  }> | null;
};

type IdentityStatus = {
  id: string;
  verification_status: string | null;
  area_verification_status: string | null;
};

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const [
    { data: blocksCreated },
    { data: blocksReceived },
    { data: rawMatches, error: matchesError },
  ] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
    supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id),
    supabase
      .from("matches")
      .select("id,user_a,user_b,created_at")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false }),
  ]);

  const blockedUserIds = new Set<string>([
    ...(blocksCreated ?? []).map((b) => b.blocked_id),
    ...(blocksReceived ?? []).map((b) => b.blocker_id),
  ]);

  if (matchesError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center font-sans">
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          We couldn&apos;t load your matches right now.
        </p>
      </div>
    );
  }

  const matches = (rawMatches ?? []).filter(
    (m) => !blockedUserIds.has(m.user_a === user.id ? m.user_b : m.user_a)
  );

  if (matches.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 font-sans">
        <EmptyState
          icon="💖"
          title="No matches yet"
          description="Keep swiping in Discover! When you and someone connect mutually, they will appear right here."
        >
          <Link href={routes.discover}>
            <Button
              variant="primary"
              size="md"
              className="gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] text-white shadow-md shadow-[#550000]/25 hover:bg-[#680202] active:scale-95"
            >
              <Compass className="h-4 w-4" /> Start Swiping
            </Button>
          </Link>
        </EmptyState>
      </div>
    );
  }

  const otherUserIds = matches.map((m) =>
    m.user_a === user.id ? m.user_b : m.user_a
  );

  const [{ data: profiles, error: profilesError }, { data: identities }] =
    await Promise.all([
      supabase.rpc("get_match_profiles", { p_user_ids: otherUserIds }),
      createAdminClient()
        .from("extrovert_profiles")
        .select("id,verification_status,area_verification_status")
        .in("id", otherUserIds),
    ]);

  if (profilesError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center font-sans">
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          We found your matches, but couldn&apos;t load their profiles. Please try again.
        </p>
      </div>
    );
  }

  const profileMap = new Map(
    ((profiles ?? []) as MatchProfile[]).map((p) => [p.id, p])
  );
  const identityMap = new Map(
    ((identities ?? []) as IdentityStatus[]).map((p) => [p.id, p])
  );

  return (
    <div className="mx-auto max-w-md space-y-4 px-3.5 pb-24 pt-4 font-sans select-none sm:px-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            Your Matches
            <span className="flex h-2 w-2 rounded-full bg-[#550000] animate-pulse dark:bg-red-400" />
          </h1>
          <p className="text-[11px] font-medium text-muted-foreground">
            {matches.length} connection{matches.length === 1 ? "" : "s"} made
          </p>
        </div>
        <Link
          href={routes.discover}
          className="rounded-full border border-[#550000]/25 bg-[#550000]/5 px-3 py-1.5 text-xs font-bold text-[#550000] shadow-2xs transition-colors hover:bg-[#550000]/10 active:scale-95 dark:border-[#550000]/40 dark:bg-[#550000]/20 dark:text-red-300"
        >
          Keep Swiping
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {matches.map((match, idx) => {
          const otherUserId =
            match.user_a === user.id ? match.user_b : match.user_a;
          const profile = profileMap.get(otherUserId);
          if (!profile) return null;
          const identity = identityMap.get(otherUserId);
          const photos = [...(profile.profile_photos ?? [])].sort(
            (a, b) =>
              Number(b.is_primary) - Number(a.is_primary) ||
              a.display_order - b.display_order
          );
          const photoUrl = getProfilePhotoUrl(photos[0]?.storage_path, 320);
          const age = calculateAge(profile.date_of_birth);

          return (
            <div
              key={match.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-2xs transition-all hover:shadow-md dark:border-white/10 dark:bg-[#121216] dark:shadow-black/40"
            >
              <Link
                href={`${routes.profileView}/${otherUserId}`}
                className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950"
              >
                <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                  <span className="rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm">
                    <UserRound className="mr-1 inline h-3 w-3" />
                    View profile
                  </span>
                </div>

                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={profile.display_name ?? "Member"}
                    fill
                    priority={idx < 4}
                    decoding="async"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width:640px) 50vw, 200px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#550000] text-2xl font-bold text-white">
                    {profile.display_name?.charAt(0) ?? "?"}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute right-2.5 top-2.5 flex flex-wrap justify-end gap-1 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[8px] font-bold text-white backdrop-blur-md">
                  {identity?.verification_status === "verified" && (
                    <span className="inline-flex items-center gap-0.5 text-red-300">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      Verified
                    </span>
                  )}
                  {identity?.area_verification_status === "verified" && (
                    <span className="inline-flex items-center gap-0.5 text-zinc-300">
                      <MapPin className="h-2.5 w-2.5" />
                      Area
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <h2 className="truncate text-sm font-bold leading-tight drop-shadow-xs">
                    {profile.display_name || "Member"}
                    {age !== null && (
                      <span className="ml-1 text-xs font-normal opacity-90">
                        {age}
                      </span>
                    )}
                  </h2>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-zinc-300">
                    {profile.department?.split("&")[0]?.trim()}
                    {profile.academic_year ? ` · ${profile.academic_year}` : ""}
                  </p>
                  {profile.campus_residency && (
                    <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] text-zinc-300">
                      <MapPin className="h-2.5 w-2.5" />
                      {profile.campus_residency}
                    </span>
                  )}
                </div>
              </Link>

              <div className="grid grid-cols-3 gap-1.5 border-t border-zinc-100 bg-white p-2 dark:border-white/5 dark:bg-[#121216]">
                <Link
                  href={`${routes.profileView}/${otherUserId}`}
                  className="flex items-center justify-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-50/80 py-2 text-[10px] font-semibold text-foreground transition-colors hover:bg-zinc-100 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  Profile
                </Link>

                <Link
                  href={`${routes.messages}/${match.id}`}
                  className="flex items-center justify-center gap-1 rounded-2xl border border-[#550000]/30 bg-[#550000] py-2 text-[10px] font-bold text-white shadow-2xs transition-all hover:bg-[#680202] active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Chat
                </Link>

                <RemoveMatchButton matchId={match.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
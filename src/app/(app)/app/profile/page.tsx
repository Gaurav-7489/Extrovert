import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  MapPin,
  ShieldCheck,
  Star,
  GraduationCap,
  Briefcase,
  UserRound,
  CalendarDays,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { routes } from "@/config/routes";
import { getProfilePhotoUrl } from "@/lib/profile-photo";
import { calculateAge } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile | DateBu" };
export const dynamic = "force-dynamic";

type ProfileInterest = { id: string; name: string };
type ProfileInterestRow = {
  interests?: ProfileInterest | ProfileInterest[] | null;
};

function clean(value: string | null | undefined, fallback = "Not added") {
  return value?.trim() || fallback;
}

function prettyType(value: string | null | undefined) {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "student") return "Student";
  if (v === "professional") return "Professional";
  if (v === "other") return "Other";
  return clean(value, "Not set")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyGender(value: string | null | undefined) {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "man") return "Man";
  if (v === "woman") return "Woman";
  if (v === "non-binary" || v === "nonbinary") return "Non-binary";
  return clean(value, "Not set")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyYear(value: string | null | undefined) {
  if (!value) return "Not added";
  const map: Record<string, string> = {
    "1st-year": "1st year",
    "2nd-year": "2nd year",
    "3rd-year": "3rd year",
    "4th-year": "4th year",
    "5th-year": "5th year",
    postgraduate: "Postgraduate",
  };
  return (
    map[value] ??
    value.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function TrustBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-bold shadow-2xs backdrop-blur-md ${
        ok
          ? "border-[#550000]/30 bg-[#550000]/85 text-white"
          : "border-white/20 bg-black/60 text-white/80"
      }`}
    >
      <ShieldCheck className="h-3 w-3" />
      <span>{ok ? yes : no}</span>
    </span>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3 transition-colors dark:border-white/10 dark:bg-[#16161d]">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1.5 break-words text-xs font-bold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(routes.login);

  const [{ data: profile }, { data: preferences }, { data: identity }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,bio,profile_completed,ghost_mode,campus_residency,campus_hangout,relationship_goal,zodiac,sleep_habit,caffeine_pref,weekend_vibe,prompt_question,prompt_answer,profile_photos(id,storage_path,is_primary,display_order),profile_interests(interests(id,name))"
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("dating_preferences")
        .select("interested_in,min_age,max_age,preferred_department")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("extrovert_profiles")
        .select(
          "id,display_name,date_of_birth,gender,identity_type,institution_name,field_of_study,department,academic_year,job_title,employer_name,role_description,verification_status,area_verification_status,area_id,profile_photo_path"
        )
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (!profile || !identity) redirect(routes.profileSetup);

  const photos = [...(profile.profile_photos ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );
  const photoUrls = photos
    .map((p) => getProfilePhotoUrl(p.storage_path, 480))
    .filter(Boolean) as string[];
  const sharedPhoto = getProfilePhotoUrl(identity.profile_photo_path, 480);
  const primaryPhoto = photoUrls[0] ?? sharedPhoto;
  const age = identity.date_of_birth
    ? calculateAge(identity.date_of_birth)
    : null;
  const interestRows = (profile.profile_interests ?? []) as ProfileInterestRow[];
  const interests = interestRows.flatMap((pi) =>
    pi.interests
      ? Array.isArray(pi.interests)
        ? pi.interests
        : [pi.interests]
      : []
  );

  const actualDatingDataComplete = Boolean(
    identity.display_name?.trim() &&
      identity.date_of_birth &&
      identity.gender &&
      photoUrls.length > 0 &&
      interests.length > 0 &&
      Array.isArray(preferences?.interested_in) &&
      preferences.interested_in.length > 0 &&
      Number.isInteger(preferences?.min_age) &&
      Number.isInteger(preferences?.max_age)
  );

  if (!actualDatingDataComplete) redirect(routes.profileSetup);

  if (!profile.profile_completed) {
    await supabase
      .from("profiles")
      .update({ profile_completed: true, updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  const areaResult = identity.area_id
    ? await supabase
        .from("extrovert_areas")
        .select("name")
        .eq("id", identity.area_id)
        .maybeSingle()
    : null;
  const areaName = areaResult?.data?.name ?? "Not added";
  const type = (identity.identity_type ?? "").trim().toLowerCase();
  const isStudent = type === "student";
  const isProfessional = type === "professional";
  const verified = identity.verification_status === "verified";

  return (
    <main className="mx-auto max-w-md space-y-4 px-3.5 pb-24 pt-3 font-sans text-zinc-950 dark:text-zinc-50 sm:px-4 md:pt-4">
      {/* Top Header */}
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#550000] dark:text-red-400">
            YOU
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
            Your profile
          </h1>
        </div>
        <Link
          href={routes.profileSetup}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-800 shadow-2xs transition hover:border-[#550000]/30 hover:text-[#550000] active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200 dark:hover:border-[#550000]/50 dark:hover:text-red-400"
          aria-label="Edit profile"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit profile</span>
        </Link>
      </div>

      {/* Hero Profile Photo Card */}
      <section className="overflow-hidden rounded-[2rem] border border-zinc-200/90 bg-white shadow-lg transition-colors dark:border-white/10 dark:bg-[#121216] dark:shadow-2xl">
        <div className="relative aspect-[4/5] max-h-[520px] w-full bg-zinc-100 dark:bg-[#181820]">
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={identity.display_name ?? "Profile"}
              fill
              priority
              decoding="async"
              className="object-cover"
              sizes="(max-width:640px) 100vw, 448px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#550000]/10 text-6xl font-bold text-[#550000] dark:bg-[#550000]/20 dark:text-red-400">
              {identity.display_name?.charAt(0) ?? "?"}
            </div>
          )}

          <div className="absolute right-3 top-3 flex max-w-[80%] flex-col items-end gap-1.5">
            <TrustBadge
              ok={verified}
              yes="Face verified"
              no="Face not verified"
            />
            <TrustBadge
              ok={identity.area_verification_status === "verified"}
              yes="Area verified"
              no="Area not verified"
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-5 pt-20 text-white">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <h2 className="text-3xl font-bold tracking-tight">
                {clean(identity.display_name, "DateBu Member")}
              </h2>
              {age !== null && (
                <span className="text-xl font-normal text-white/85">{age}</span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-medium text-white/85">
              {prettyType(identity.identity_type)}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/75">
              <MapPin className="h-3 w-3" />
              <span>{areaName}</span>
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {profile.bio ? (
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-sm">
              &ldquo;{profile.bio}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              No bio added yet.
            </p>
          )}
        </div>
      </section>

      {/* Trust & Verification Card */}
      <section
        className={`rounded-3xl border p-4 shadow-2xs transition-colors ${
          verified
            ? "border-[#550000]/20 bg-[#550000]/5 dark:border-[#550000]/30 dark:bg-[#550000]/15"
            : "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-2xs ${
              verified
                ? "bg-[#550000] text-white"
                : "bg-white text-amber-700 dark:bg-[#181820] dark:text-amber-400"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[9px] font-bold uppercase tracking-[0.16em] ${
                verified
                  ? "text-[#550000] dark:text-red-400"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              Identity verification
            </p>
            <h2 className="mt-0.5 text-xs font-bold text-zinc-950 dark:text-zinc-50 sm:text-sm">
              {verified ? "Your identity is verified" : "Verify your identity"}
            </h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              {verified
                ? "Your official verification badge is visible on your profile."
                : "Add the trust badge with a government ID check. This is optional and confidential."}
            </p>
          </div>
          <Link
            href={routes.identityVerification}
            className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold text-white shadow-2xs transition hover:opacity-90 active:scale-95 ${
              verified
                ? "border border-[#550000]/30 bg-[#550000]"
                : "bg-amber-600 dark:bg-amber-700"
            }`}
          >
            <span>{verified ? "View" : "Verify"}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Identity Summary */}
      <section className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216] sm:p-5">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            <UserRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 sm:text-sm">
              Who are you?
            </h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Identity details are managed in Profile Setup. Officially verified
              name, gender, and age are locked.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Info
            icon={<UserRound className="h-3 w-3" />}
            label="Name"
            value={clean(identity.display_name)}
          />
          <Info
            icon={<ShieldCheck className="h-3 w-3" />}
            label="Gender"
            value={prettyGender(identity.gender)}
          />
          <Info
            icon={<CalendarDays className="h-3 w-3" />}
            label="Age"
            value={age !== null ? String(age) : "Not available"}
          />
          <Info
            icon={<MapPin className="h-3 w-3" />}
            label="Area"
            value={areaName}
          />
        </div>
      </section>

      {/* Work / Student Context */}
      <section className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216] sm:p-5">
        <div className="mb-3 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#550000]/15 bg-[#550000]/5 text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            {isStudent ? (
              <GraduationCap className="h-4 w-4" />
            ) : (
              <Briefcase className="h-4 w-4" />
            )}
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 sm:text-sm">
              {isStudent
                ? "Student context"
                : isProfessional
                ? "Work context"
                : "Current context"}
            </h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              The study or work information people see on your profile.
            </p>
          </div>
        </div>

        {isStudent ? (
          <div className="grid grid-cols-2 gap-2">
            <Info
              icon={<GraduationCap className="h-3 w-3" />}
              label="College / university"
              value={clean(identity.institution_name)}
            />
            <Info
              icon={<Briefcase className="h-3 w-3" />}
              label="Course / department"
              value={clean(identity.department)}
            />
            <Info
              icon={<GraduationCap className="h-3 w-3" />}
              label="Field of study"
              value={clean(identity.field_of_study)}
            />
            <Info
              icon={<CalendarDays className="h-3 w-3" />}
              label="Academic year"
              value={prettyYear(identity.academic_year)}
            />
          </div>
        ) : isProfessional ? (
          <div className="grid grid-cols-2 gap-2">
            <Info
              icon={<Briefcase className="h-3 w-3" />}
              label="Job / role"
              value={clean(identity.job_title)}
            />
            <Info
              icon={<Briefcase className="h-3 w-3" />}
              label="Company / organisation"
              value={clean(identity.employer_name)}
            />
            <div className="col-span-2">
              <Info
                icon={<UserRound className="h-3 w-3" />}
                label="About the role"
                value={clean(identity.role_description)}
              />
            </div>
          </div>
        ) : (
          <Info
            icon={<UserRound className="h-3 w-3" />}
            label="What you do"
            value={clean(identity.role_description)}
          />
        )}
      </section>

      {/* Dating Photos Grid */}
      {photoUrls.length > 0 && (
        <section className="rounded-[2rem] border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
          <div className="mb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Dating photos · {photoUrls.length}/6
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((url, i) => (
              <div
                key={i}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-black/5 dark:bg-[#181820] dark:ring-white/10"
              >
                <Image
                  src={url}
                  alt={`Dating photo ${i + 1}`}
                  fill
                  decoding="async"
                  className="object-cover"
                  sizes="(max-width:640px) 30vw, 140px"
                />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 flex items-center rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[8px] font-bold text-white shadow-2xs backdrop-blur-md">
                    <Star className="mr-0.5 inline h-2 w-2 fill-current text-[#550000] dark:text-red-400" />
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dating Vibe Pills */}
      <section className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Dating vibe
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            profile.relationship_goal,
            profile.zodiac,
            profile.sleep_habit,
            profile.caffeine_pref,
            profile.weekend_vibe,
          ]
            .filter(Boolean)
            .map((x) => (
              <span
                key={x}
                className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
              >
                {x}
              </span>
            ))}
          {![
            profile.relationship_goal,
            profile.zodiac,
            profile.sleep_habit,
            profile.caffeine_pref,
            profile.weekend_vibe,
          ].some(Boolean) && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Nothing added yet.
            </span>
          )}
        </div>
      </section>

      {/* Interests */}
      <section className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Interests
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {interests.length ? (
            interests.map((i) => (
              <span
                key={i.id}
                className="rounded-full border border-[#550000]/20 bg-[#550000]/5 px-3 py-1 text-xs font-semibold text-[#550000] dark:border-[#550000]/35 dark:bg-[#550000]/15 dark:text-red-300"
              >
                {i.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              No interests added yet.
            </span>
          )}
        </div>
      </section>

      {/* Conversation Prompt Card */}
      <section className="rounded-3xl border border-[#550000]/20 bg-[#550000]/5 p-4 shadow-2xs transition-colors dark:border-[#550000]/30 dark:bg-[#550000]/15">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-400">
          Prompt
        </span>
        {profile.prompt_question && profile.prompt_answer ? (
          <>
            <p className="mt-1 text-xs font-bold text-zinc-950 dark:text-zinc-50 sm:text-sm">
              {profile.prompt_question}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              &ldquo;{profile.prompt_answer}&rdquo;
            </p>
          </>
        ) : (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            Add a prompt in profile setup to make starting conversations easier.
          </p>
        )}
      </section>

      {/* Discovery Preferences */}
      <section className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Discovery preferences
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            {preferences?.interested_in?.includes("everyone")
              ? "Everyone"
              : prettyGender(preferences?.interested_in?.[0])}
          </span>
          <span className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            {preferences?.min_age ?? 18}–{preferences?.max_age ?? 30}
          </span>
        </div>
      </section>
    </main>
  );
}
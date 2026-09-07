"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { saveProfile, type ProfileFormState } from "./actions";
import { Card } from "@/components/ui/card";
import { ProfilePhotoUploader } from "./components/profile-photo-uploader";
import {
  Heart,
  Search,
  GraduationCap,
  MapPin,
  MessageSquareHeart,
  Moon,
  Briefcase,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";

const GOALS = [
  ["Long-term", "Something genuine"],
  ["Short & Chill", "Good conversations, good vibes"],
  ["Study Buddy", "Study together"],
  ["Friends & Connections", "Meet new people"],
] as const;

const RESIDENCY = [
  ["Hostel", "Campus resident"],
  ["Day Scholar", "Daily commuter"],
  ["Off-Campus / PG / Flat", "Living off campus"],
] as const;

const HANGOUTS = ["Canteen", "Library", "Sports Ground", "Labs"] as const;
const SLEEP = ["Night Owl", "Early Bird", "Flexible"] as const;
const COFFEE = ["Chai", "Cold Coffee", "Energy Drinks", "Water / Green Tea"] as const;
const WEEKEND = [
  "Gaming & Movies",
  "Cafes & Exploring",
  "Side Projects & Coding",
  "Sleeping In",
] as const;
const PROMPTS = [
  "The quickest way to win me over is...",
  "My unpopular opinion is...",
  "A perfect first date would be...",
  "One thing you should know about me...",
] as const;
const INTERESTED_IN = [
  ["men", "Men"],
  ["women", "Women"],
  ["nonbinary", "Non-binary / Other"],
  ["everyone", "Everyone"],
] as const;

interface Interest {
  id: string;
  name: string;
}

interface ExistingProfile {
  bio: string | null;
  campus_residency?: string | null;
  campus_hangout?: string | null;
  relationship_goal?: string | null;
  zodiac?: string | null;
  sleep_habit?: string | null;
  caffeine_pref?: string | null;
  weekend_vibe?: string | null;
  prompt_question?: string | null;
  prompt_answer?: string | null;
}

interface ExistingPreferences {
  interested_in: string[] | null;
  min_age: number | null;
  max_age: number | null;
  preferred_department: string | null;
}

interface Identity {
  displayName: string;
  dateOfBirth: string;
  gender: string;
  department: string | null;
  academicYear: string | null;
  identityType: string;
  institutionName: string | null;
  fieldOfStudy: string | null;
  jobTitle: string | null;
  employerName: string | null;
  roleDescription: string | null;
  areaName?: string;
}

interface Props {
  userId: string;
  interests: Interest[];
  existingProfile: ExistingProfile | null;
  existingPhotoUrls: string[];
  existingPhotoPaths: string[];
  existingInterestIds: string[];
  existingPreferences: ExistingPreferences | null;
  identity: Identity;
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border px-3.5 py-3 text-left text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
        active
          ? "border-[#550000] bg-[#550000]/10 text-[#550000] shadow-2xs dark:border-[#550000] dark:bg-[#550000]/25 dark:text-red-300"
          : "border-zinc-200/90 bg-zinc-50/70 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-[#1a1a24]"
      }`}
    >
      {children}
    </button>
  );
}

function Title({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <h2 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-base">
          {title}
        </h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 transition-colors dark:border-white/5 dark:bg-[#141419]">
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
        {value || "Not set"}
      </p>
    </div>
  );
}

export function DatingProfileForm({
  userId,
  interests,
  existingProfile,
  existingPhotoUrls,
  existingPhotoPaths,
  existingInterestIds,
  existingPreferences,
  identity,
}: Props) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    saveProfile,
    {}
  );
  const [bio, setBio] = useState(existingProfile?.bio ?? "");
  const [residency, setResidency] = useState(
    existingProfile?.campus_residency ?? ""
  );
  const [hangout, setHangout] = useState(existingProfile?.campus_hangout ?? "");
  const [goal, setGoal] = useState(existingProfile?.relationship_goal ?? "");
  const [zodiac, setZodiac] = useState(existingProfile?.zodiac ?? "");
  const [sleep, setSleep] = useState(existingProfile?.sleep_habit ?? "");
  const [coffee, setCoffee] = useState(existingProfile?.caffeine_pref ?? "");
  const [weekend, setWeekend] = useState(existingProfile?.weekend_vibe ?? "");
  const [prompt, setPrompt] = useState(
    existingProfile?.prompt_question &&
      PROMPTS.includes(existingProfile.prompt_question as (typeof PROMPTS)[number])
      ? existingProfile.prompt_question
      : PROMPTS[0]
  );
  const [answer, setAnswer] = useState(existingProfile?.prompt_answer ?? "");
  const [search, setSearch] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
    new Set(existingInterestIds)
  );
  const [interestedIn, setInterestedIn] = useState(
    existingPreferences?.interested_in?.includes("everyone")
      ? "everyone"
      : existingPreferences?.interested_in?.[0] ?? ""
  );
  const [minAge, setMinAge] = useState(
    Math.max(18, existingPreferences?.min_age ?? 18)
  );
  const [maxAge, setMaxAge] = useState(
    Math.max(18, existingPreferences?.max_age ?? 30)
  );
  const [photoPaths, setPhotoPaths] = useState(existingPhotoPaths);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const first = Object.values(state.fieldErrors ?? {})[0];
    setNotice(state.error ?? first ?? null);
  }, [state.error, state.fieldErrors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? interests.filter((x) => x.name.toLowerCase().includes(q))
      : interests;
  }, [interests, search]);

  function toggle(id: string) {
    setSelectedInterests((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    if (minAge < 18 || maxAge < 18 || minAge > maxAge) {
      e.preventDefault();
      setNotice("Choose a valid dating age range from 18 to 60.");
    }
  }

  const isStudent = identity.identityType === "student";
  const contextTitle = isStudent
    ? "Your student context"
    : identity.identityType === "professional"
    ? "Your work context"
    : "Your current context";

  return (
    <form action={formAction} onSubmit={submit} className="space-y-4 font-sans">
      {notice && (
        <div
          role="alert"
          className="sticky top-3 z-40 flex items-start justify-between gap-3 rounded-2xl border border-rose-200/90 bg-white/95 px-4 py-3 text-xs font-semibold text-rose-700 shadow-xl backdrop-blur-md dark:border-rose-900/50 dark:bg-[#16161d]/95 dark:text-rose-300"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss error notice"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {photoPaths.map((path) => (
        <input key={path} type="hidden" name="photo_paths" value={path} />
      ))}

      {/* 1. Photos Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={<span className="text-base text-[#550000] dark:text-red-400">▣</span>}
          title="Your photos"
          subtitle="Put your best photo first. Add up to 6 high quality pictures."
        />
        <ProfilePhotoUploader
          userId={userId}
          existingPhotoUrls={existingPhotoUrls}
          existingPhotoPaths={existingPhotoPaths}
          onPhotosUploaded={setPhotoPaths}
        />
      </Card>

      {/* 2. Identity Summary Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={<ShieldCheck className="h-4 w-4 text-[#550000] dark:text-red-400" />}
          title="Who are you?"
          subtitle="Your verified profile details. Information is shown across DateBu."
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ReadOnly label="Name" value={identity.displayName} />
          <ReadOnly label="Gender" value={identity.gender} />
          <ReadOnly label="Type" value={identity.identityType} />
          <ReadOnly label="Area" value={identity.areaName ?? "Verified area"} />
        </div>
        <div className="mt-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 px-3.5 py-2.5 text-[10px] leading-relaxed text-zinc-500 dark:border-white/5 dark:bg-[#141419] dark:text-zinc-400">
          Verified name, photos, and local area are managed through your profile settings.
          Dating edits apply directly here.
        </div>
      </Card>

      {/* 3. Campus/Work Context Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={
            isStudent ? (
              <GraduationCap className="h-4 w-4 text-[#550000] dark:text-red-400" />
            ) : (
              <Briefcase className="h-4 w-4 text-[#550000] dark:text-red-400" />
            )
          }
          title={contextTitle}
          subtitle="Helpful context for matches. Identity details are read-only here."
        />
        {isStudent ? (
          <div className="grid grid-cols-2 gap-2.5">
            <ReadOnly
              label="College / university"
              value={identity.institutionName ?? "Verified campus"}
            />
            <ReadOnly
              label="Course / department"
              value={identity.department ?? identity.fieldOfStudy ?? "Not set"}
            />
            <ReadOnly label="Academic year" value={identity.academicYear ?? "Not set"} />
            <ReadOnly label="Field of study" value={identity.fieldOfStudy ?? "Not set"} />
          </div>
        ) : identity.identityType === "professional" ? (
          <div className="grid grid-cols-2 gap-2.5">
            <ReadOnly label="Job / role" value={identity.jobTitle ?? "Not set"} />
            <ReadOnly
              label="Company / organisation"
              value={identity.employerName ?? "Not set"}
            />
          </div>
        ) : (
          <ReadOnly label="What you do" value={identity.roleDescription ?? "Not set"} />
        )}
      </Card>

      {/* 4. Relationship Goal Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={<Heart className="h-4 w-4 text-[#550000] dark:text-red-400" />}
          title="What are you looking for?"
          subtitle="Choose the kind of connection you want on DateBu."
        />
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map(([value, desc]) => (
            <Choice
              key={value}
              active={goal === value}
              onClick={() => setGoal(goal === value ? "" : value)}
            >
              <span>{value}</span>
              <span className="mt-1 block text-[10px] font-normal opacity-70">
                {desc}
              </span>
            </Choice>
          ))}
        </div>
        <input type="hidden" name="relationship_goal" value={goal} />
      </Card>

      {/* 5. Location Context Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={<MapPin className="h-4 w-4 text-[#550000] dark:text-red-400" />}
          title="Where do you belong?"
          subtitle="Approximate area is verified. Exact coordinates are never shared."
        />
        <div className="rounded-2xl border border-[#550000]/15 bg-[#550000]/5 p-3.5 dark:border-[#550000]/30 dark:bg-[#550000]/15">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#550000] dark:text-red-300">
            Local area
          </p>
          <p className="mt-0.5 text-sm font-bold text-zinc-950 dark:text-zinc-50">
            {identity.areaName || "Verified area"}
          </p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Only verified approximate locality is displayed to protect your privacy.
          </p>
        </div>

        <input type="hidden" name="campus_residency" value={residency} />
        <input type="hidden" name="campus_hangout" value={hangout} />

        <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-white/5">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Currently based <span className="text-[11px] font-normal text-zinc-400">(optional)</span>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {RESIDENCY.map(([value, desc]) => (
              <Choice
                key={value}
                active={residency === value}
                onClick={() => setResidency(residency === value ? "" : value)}
              >
                <span>{value}</span>
                <span className="mt-1 block text-[9px] font-normal opacity-70">
                  {desc}
                </span>
              </Choice>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Favourite spot <span className="text-[11px] font-normal text-zinc-400">(optional)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HANGOUTS.map((value) => (
              <Choice
                key={value}
                active={hangout === value}
                onClick={() => setHangout(hangout === value ? "" : value)}
              >
                {value}
              </Choice>
            ))}
          </div>
        </div>
      </Card>

      {/* 6. Bio & Interests Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={<MessageSquareHeart className="h-4 w-4 text-[#550000] dark:text-red-400" />}
          title="Show who you are"
          subtitle="Share what feels natural. These are dating details, not identity papers."
        />
        <label className="block">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Short bio <span className="text-[11px] font-normal text-zinc-400">(optional)</span>
          </span>
          <textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="A little about your vibe, your passions, or what you're into..."
            className="mt-2 w-full resize-none rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#550000]/15 dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000] dark:focus:bg-[#121216]"
          />
        </label>

        <div className="mt-4">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Interests
          </span>
          <div className="relative mt-2">
            <Search className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search interests..."
              className="h-10 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 pl-9 pr-4 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000]"
            />
          </div>

          <div className="mt-2.5 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto no-scrollbar">
            {filtered.map((item) => {
              const active = selectedInterests.has(item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${
                    active
                      ? "border-[#550000] bg-[#550000]/10 text-[#550000] dark:border-[#550000] dark:bg-[#550000]/25 dark:text-red-300"
                      : "border-zinc-200/90 bg-zinc-50 text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-400"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {item.name}
                </button>
              );
            })}
          </div>

          {Array.from(selectedInterests).map((id) => (
            <input key={id} type="hidden" name="interests" value={id} />
          ))}
        </div>
      </Card>

      {/* 7. Lifestyle & Habits Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={<Moon className="h-4 w-4 text-[#550000] dark:text-red-400" />}
          title="Little things"
          subtitle="Optional details that spark fun conversation."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Sleep rhythm
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLEEP.map((value) => (
                <Choice
                  key={value}
                  active={sleep === value}
                  onClick={() => setSleep(sleep === value ? "" : value)}
                >
                  {value}
                </Choice>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Coffee / drink
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COFFEE.map((value) => (
                <Choice
                  key={value}
                  active={coffee === value}
                  onClick={() => setCoffee(coffee === value ? "" : value)}
                >
                  {value}
                </Choice>
              ))}
            </div>
          </div>
        </div>

        <input type="hidden" name="sleep_habit" value={sleep} />
        <input type="hidden" name="caffeine_pref" value={coffee} />

        <div className="mt-4">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Weekend vibe
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKEND.map((value) => (
              <Choice
                key={value}
                active={weekend === value}
                onClick={() => setWeekend(weekend === value ? "" : value)}
              >
                {value}
              </Choice>
            ))}
          </div>
        </div>

        <input type="hidden" name="weekend_vibe" value={weekend} />

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Zodiac <span className="text-[11px] font-normal text-zinc-400">(optional)</span>
          </span>
          <input
            name="zodiac"
            value={zodiac}
            onChange={(e) => setZodiac(e.target.value.slice(0, 30))}
            placeholder="e.g. Leo, Scorpio"
            className="mt-2 h-10 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000]"
          />
        </label>
      </Card>

      {/* 8. Conversation Prompt Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={<MessageSquareHeart className="h-4 w-4 text-[#550000] dark:text-red-400" />}
          title="Start the conversation"
          subtitle="One prompt makes breaking the ice feel effortless."
        />
        <select
          name="prompt_question"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-10 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3 text-xs font-medium text-zinc-900 transition focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:focus:border-[#550000]"
        >
          {PROMPTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <textarea
          name="prompt_answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.slice(0, 300))}
          rows={3}
          placeholder="Your answer..."
          className="mt-2 w-full resize-none rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000]"
        />
      </Card>

      {/* 9. Discovery Preferences Card */}
      <Card className="p-4 sm:p-5">
        <Title
          icon={<Heart className="h-4 w-4 text-[#550000] dark:text-red-400" />}
          title="Who would you like to meet?"
          subtitle="Gender and age preferences are free and fully open."
        />
        <div className="grid grid-cols-2 gap-2">
          {INTERESTED_IN.map(([value, label]) => (
            <Choice
              key={value}
              active={interestedIn === value}
              onClick={() => setInterestedIn(value)}
            >
              {label}
            </Choice>
          ))}
        </div>
        <input type="hidden" name="interested_in" value={interestedIn} />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Minimum age
            </span>
            <input
              name="min_age"
              type="number"
              min={18}
              max={60}
              value={minAge}
              onChange={(e) => setMinAge(Number(e.target.value))}
              className="mt-2 h-10 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 text-xs text-zinc-900 transition focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:focus:border-[#550000]"
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Maximum age
            </span>
            <input
              name="max_age"
              type="number"
              min={18}
              max={60}
              value={maxAge}
              onChange={(e) => setMaxAge(Number(e.target.value))}
              className="mt-2 h-10 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 text-xs text-zinc-900 transition focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:focus:border-[#550000]"
            />
          </label>
        </div>
      </Card>

      {/* Floating Sticky Save Button */}
      <div className="sticky bottom-4 z-30 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-[#550000]/40 bg-[#550000] px-5 text-sm font-bold text-white shadow-lg shadow-[#550000]/30 transition-all duration-150 hover:bg-[#680202] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:border-[#550000]/60 dark:bg-[#550000] dark:shadow-black/70 dark:hover:bg-[#6e0303]"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving your dating profile…</span>
            </>
          ) : (
            <>
              <span>Save dating profile</span>
              <Heart className="h-4 w-4 fill-current" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
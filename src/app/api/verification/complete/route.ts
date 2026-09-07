import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

const COOKIE = "extrovert_face_challenge";
const TTL_MS = 2 * 60 * 1000;
const CHALLENGES = new Set([
  "Turn your head slightly left",
  "Turn your head slightly right",
  "Move a little closer",
]);

function secret() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Verification signing secret is not configured.");
  return value;
}

function verifySignature(payload: string, signature: string) {
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    method?: string;
    face_detected?: boolean;
    challenge_completed?: boolean;
    challenge?: string;
  } | null;

  if (body?.method !== "camera_liveness" || body.face_detected !== true || body.challenge_completed !== true) {
    return NextResponse.json({ error: "Complete the live camera challenge first." }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Your verification session expired. Start the camera check again." }, { status: 400 });

  const parts = token.split(".");
  if (parts.length < 5) return NextResponse.json({ error: "Invalid verification session." }, { status: 400 });
  const signature = parts.pop()!;
  const issuedAt = Number(parts[2]);
  const challenge = parts.slice(3).join(".");
  const payload = parts.join(".");

  if (
    parts[0] !== user.id ||
    !Number.isFinite(issuedAt) ||
    Date.now() - issuedAt > TTL_MS ||
    !CHALLENGES.has(challenge) ||
    body.challenge !== challenge ||
    !verifySignature(payload, signature)
  ) {
    return NextResponse.json({ error: "Invalid or expired verification challenge. Start again." }, { status: 400 });
  }

  jar.delete(COOKIE);

  const admin = createAdminClient();
  const { data: profile, error: readError } = await admin
    .from("extrovert_profiles")
    .select("verification_status,face_verification_attempts,face_verification_last_attempt_at")
    .eq("id", user.id)
    .maybeSingle();
  if (readError || !profile) return NextResponse.json({ error: "Your Extrovert profile could not be loaded." }, { status: 500 });
  if (profile.verification_status === "verified") return NextResponse.json({ verified: true });

  const now = Date.now();
  const lastAttempt = profile.face_verification_last_attempt_at ? Date.parse(profile.face_verification_last_attempt_at) : 0;
  const attempts = lastAttempt && now - lastAttempt < 10 * 60 * 1000 ? Number(profile.face_verification_attempts ?? 0) : 0;
  if (attempts >= 5) return NextResponse.json({ error: "Too many verification attempts. Please wait a few minutes and try again." }, { status: 429 });

  const { error: attemptError } = await admin
    .from("extrovert_profiles")
    .update({ face_verification_attempts: attempts + 1, face_verification_last_attempt_at: new Date(now).toISOString() })
    .eq("id", user.id);
  if (attemptError) return NextResponse.json({ error: "We couldn't start verification. Please try again." }, { status: 500 });

  const { error } = await admin
    .from("extrovert_profiles")
    .update({ verification_status: "verified", face_verification_completed_at: new Date(now).toISOString(), face_verification_method: "camera_liveness" })
    .eq("id", user.id)
    .eq("verification_status", "pending");

  if (error) return NextResponse.json({ error: "We couldn't save your verification. Please try again." }, { status: 500 });
  return NextResponse.json({ verified: true });
}

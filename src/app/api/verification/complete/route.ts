import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const COOKIE = "extrovert_face_challenge";
const TTL_MS = 2 * 60 * 1000;
const CHALLENGES = new Set([
  "Turn your head slightly left",
  "Turn your head slightly right",
  "Move a little closer",
]);

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
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

  // The server only accepts the exact camera-liveness protocol used by the UI.
  // The session nonce remains the authoritative anti-replay primitive; the
  // client-provided booleans are treated as liveness evidence, not identity data.
  if (
    body?.method !== "camera_liveness" ||
    body.face_detected !== true ||
    body.challenge_completed !== true ||
    typeof body.challenge !== "string" ||
    !CHALLENGES.has(body.challenge)
  ) {
    return NextResponse.json({ error: "Complete the live camera challenge first." }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Your verification session expired. Start the camera check again." }, { status: 400 });

  const admin = createAdminClient();
  const now = new Date();

  // Consume the opaque server-issued session atomically. The raw token never reaches the database,
  // and a consumed/expired token cannot be used a second time.
  const { data: session, error: sessionError } = await admin
    .from("extrovert_face_verification_sessions")
    .update({ consumed_at: now.toISOString() })
    .eq("user_id", user.id)
    .eq("token_hash", hashToken(token))
    .eq("challenge", body.challenge)
    .is("consumed_at", null)
    .gt("expires_at", now.toISOString())
    .select("id,challenge,expires_at")
    .maybeSingle();

  if (sessionError || !session) {
    jar.delete(COOKIE);
    return NextResponse.json({ error: "Invalid, expired, or already-used verification session. Start again." }, { status: 400 });
  }

  const { data: profile, error: readError } = await admin
    .from("extrovert_profiles")
    .select("verification_status,face_verification_attempts,face_verification_last_attempt_at")
    .eq("id", user.id)
    .maybeSingle();
  if (readError || !profile) return NextResponse.json({ error: "Your Extrovert profile could not be loaded." }, { status: 500 });
  if (profile.verification_status === "verified") return NextResponse.json({ verified: true });

  const nowMs = Date.now();
  const lastAttempt = profile.face_verification_last_attempt_at ? Date.parse(profile.face_verification_last_attempt_at) : 0;
  const attempts = lastAttempt && nowMs - lastAttempt < 10 * 60 * 1000 ? Number(profile.face_verification_attempts ?? 0) : 0;
  if (attempts >= 5) return NextResponse.json({ error: "Too many verification attempts. Please wait a few minutes and try again." }, { status: 429 });

  const { error: attemptError } = await admin
    .from("extrovert_profiles")
    .update({ face_verification_attempts: attempts + 1, face_verification_last_attempt_at: new Date(nowMs).toISOString() })
    .eq("id", user.id);
  if (attemptError) return NextResponse.json({ error: "We couldn't start verification. Please try again." }, { status: 500 });

  const { error } = await admin
    .from("extrovert_profiles")
    .update({ verification_status: "verified", face_verification_completed_at: new Date(nowMs).toISOString(), face_verification_method: "camera_liveness" })
    .eq("id", user.id)
    .eq("verification_status", "pending");

  if (error) return NextResponse.json({ error: "We couldn't save your verification. Please try again." }, { status: 500 });

  jar.delete(COOKIE);
  return NextResponse.json({ verified: true, challenge: session.challenge });
}

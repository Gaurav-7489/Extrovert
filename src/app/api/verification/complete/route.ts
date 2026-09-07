import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null) as { method?: string; face_detected?: boolean; challenge_completed?: boolean } | null;
  if (body?.method !== "camera_liveness" || body.face_detected !== true || body.challenge_completed !== true) {
    return NextResponse.json({ error: "Complete the live camera challenge first." }, { status: 400 });
  }

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

  // The browser performs the actual camera challenge. This endpoint only accepts
  // completion from the authenticated account and never accepts a verification
  // status directly from the client. It deliberately does not store frames.
  const { error } = await admin
    .from("extrovert_profiles")
    .update({ verification_status: "verified", face_verification_completed_at: new Date(now).toISOString(), face_verification_method: "camera_liveness" })
    .eq("id", user.id)
    .eq("verification_status", "pending");

  if (error) return NextResponse.json({ error: "We couldn't save your verification. Please try again." }, { status: 500 });
  return NextResponse.json({ verified: true });
}

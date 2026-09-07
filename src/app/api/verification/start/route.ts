import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const COOKIE = "extrovert_face_challenge";
const TTL_MS = 2 * 60 * 1000;
const CHALLENGES = [
  "Turn your head slightly left",
  "Turn your head slightly right",
  "Move a little closer",
] as const;

type Challenge = (typeof CHALLENGES)[number];

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)] as Challenge;
  const token = randomBytes(32).toString("base64url");
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + TTL_MS);

  const admin = createAdminClient();
  const { error } = await admin.from("extrovert_face_verification_sessions").insert({
    user_id: user.id,
    token_hash: hashToken(token),
    challenge,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: "We couldn't start a secure verification session." }, { status: 500 });
  }

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/verification",
    maxAge: Math.floor(TTL_MS / 1000),
  });

  return NextResponse.json({ challenge, expiresAt: expiresAt.getTime() });
}

export { COOKIE, TTL_MS, hashToken };

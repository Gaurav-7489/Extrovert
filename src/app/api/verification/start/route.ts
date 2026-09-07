import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, createHmac } from "node:crypto";
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

function secret() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("Verification signing secret is not configured.");
  return value;
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)] as Challenge;
  const nonce = randomBytes(24).toString("base64url");
  const issuedAt = Date.now().toString();
  const payload = `${user.id}.${nonce}.${issuedAt}.${challenge}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  const token = `${payload}.${signature}`;

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/verification",
    maxAge: Math.floor(TTL_MS / 1000),
  });

  return NextResponse.json({ challenge, expiresAt: Number(issuedAt) + TTL_MS });
}

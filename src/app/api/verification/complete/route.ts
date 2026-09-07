import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null) as { method?: string; face_detected?: boolean } | null;
  if (body?.method !== "camera_liveness" || body.face_detected !== true) {
    return NextResponse.json({ error: "A live camera face check is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("extrovert_profiles")
    .update({ verification_status: "verified" })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "We couldn't save your verification. Please try again." }, { status: 500 });
  return NextResponse.json({ verified: true });
}

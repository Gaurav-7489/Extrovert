import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  runtime: "nodejs",
  // Run auth/session middleware only where it affects navigation.
  matcher: [
    "/login",
    "/register",
    "/onboarding",
    "/app/:path*",
    "/admin/:path*",
    "/verify",
    "/verification",
    "/reset-password",
  ],
};

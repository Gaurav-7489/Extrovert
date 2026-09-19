import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ACCEPTED_ACCURACY_M = 300;

function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const earthRadius = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roundPrivateCoordinate(value: number) {
  // ~100 m grid. Good enough for Nearby ordering without retaining a pinpoint.
  return Math.round(value * 1000) / 1000;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const accuracy = Number(body.accuracy);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ error: "Invalid location." }, { status: 400 });
    }

    if (
      !Number.isFinite(accuracy) ||
      accuracy <= 0 ||
      accuracy > MAX_ACCEPTED_ACCURACY_M
    ) {
      return NextResponse.json(
        {
          error:
            "Location is not precise enough yet. Enable Precise Location/high-accuracy GPS and try again.",
        },
        { status: 400 }
      );
    }

    const { data: areas, error: areaError } = await supabase
      .from("extrovert_areas")
      .select("id,name,center_lat,center_lng,radius_m")
      .not("center_lat", "is", null)
      .not("center_lng", "is", null)
      .not("radius_m", "is", null);

    if (areaError) {
      return NextResponse.json(
        { error: "Supported areas could not be loaded." },
        { status: 500 }
      );
    }

    const candidates = (areas ?? [])
      .map((area) => ({
        ...area,
        distance: distanceMeters(
          latitude,
          longitude,
          Number(area.center_lat),
          Number(area.center_lng)
        ),
        radius: Number(area.radius_m),
      }))
      .filter((area) => area.distance <= area.radius)
      // With a precise device fix, the nearest supported locality is the most
      // truthful label when broad city circles overlap smaller local zones.
      .sort((a, b) => a.distance - b.distance || a.radius - b.radius);

    const matchedArea = candidates[0];
    const admin = createAdminClient();
    const now = new Date().toISOString();

    if (!matchedArea) {
      await Promise.all([
        admin
          .from("extrovert_profiles")
          .update({
            area_id: null,
            area_verification_status: "not_verified",
            updated_at: now,
          })
          .eq("id", user.id),
        admin
          .from("profiles")
          .update({ area_verified: false, updated_at: now })
          .eq("id", user.id),
        admin
          .from("extrovert_area_verifications")
          .delete()
          .eq("user_id", user.id),
      ]);

      return NextResponse.json(
        { error: "You are not currently inside a supported Extrovert area." },
        { status: 422 }
      );
    }

    const { error: profileError } = await admin
      .from("extrovert_profiles")
      .update({
        area_id: matchedArea.id,
        area_verification_status: "verified",
        updated_at: now,
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { error: "Area verification could not be saved." },
        { status: 500 }
      );
    }

    await admin
      .from("profiles")
      .update({ area_verified: true, updated_at: now })
      .eq("id", user.id);

    await admin
      .from("extrovert_area_verifications")
      .delete()
      .eq("user_id", user.id);

    const { error: verificationError } = await admin
      .from("extrovert_area_verifications")
      .insert({
        user_id: user.id,
        area_id: matchedArea.id,
        method: "precise_geolocation",
        status: "verified",
        accuracy_m: Math.round(accuracy * 100) / 100,
        distance_m: Math.round(matchedArea.distance * 100) / 100,
        location_lat_rounded: roundPrivateCoordinate(latitude),
        location_lng_rounded: roundPrivateCoordinate(longitude),
        verified_at: now,
      });

    if (verificationError) {
      return NextResponse.json(
        { error: "Area verification could not be recorded." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      areaName: matchedArea.name,
      accuracyM: Math.round(accuracy * 100) / 100,
      distanceM: Math.round(matchedArea.distance * 100) / 100,
      privacyGridM: 100,
    });
  } catch {
    return NextResponse.json(
      { error: "Area verification could not be completed." },
      { status: 500 }
    );
  }
}

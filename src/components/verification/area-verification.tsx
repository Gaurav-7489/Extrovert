"use client";

import { useState } from "react";
import { Crosshair, Loader2, MapPin, ShieldCheck } from "lucide-react";

type AreaVerificationProps = {
  initialStatus: string;
  areaName: string | null;
};

const TARGET_ACCURACY_M = 120;
const MAX_ACCEPTABLE_ACCURACY_M = 350;
const SAMPLE_WINDOW_MS = 12_000;

function getPrecisePosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    let best: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let timer: number | null = null;
    let settled = false;

    const cleanup = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timer !== null) window.clearTimeout(timer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();

      if (best && best.coords.accuracy <= MAX_ACCEPTABLE_ACCURACY_M) {
        resolve(best);
        return;
      }

      const measured = best ? Math.round(best.coords.accuracy) : null;
      reject(
        new Error(
          measured
            ? `LOCATION_TOO_COARSE:${measured}`
            : "LOCATION_UNAVAILABLE"
        )
      );
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!best || position.coords.accuracy < best.coords.accuracy) {
          best = position;
        }
        if (position.coords.accuracy <= TARGET_ACCURACY_M) finish();
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          if (!settled) {
            settled = true;
            cleanup();
            reject(error);
          }
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: SAMPLE_WINDOW_MS,
      }
    );

    timer = window.setTimeout(finish, SAMPLE_WINDOW_MS);
  });
}

export default function AreaVerification({
  initialStatus,
  areaName,
}: AreaVerificationProps) {
  const [status, setStatus] = useState(initialStatus);
  const [name, setName] = useState(areaName);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setError(null);
    setAccuracy(null);

    if (!window.isSecureContext) {
      setError("Location verification needs the secure HTTPS version of Extrovert.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Location verification is not supported on this device.");
      return;
    }

    setLoading(true);
    try {
      const position = await getPrecisePosition();
      const measuredAccuracy = Math.round(position.coords.accuracy);
      setAccuracy(measuredAccuracy);

      const response = await fetch("/api/verification/area", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Area verification could not be completed.");
      }

      setStatus("verified");
      setName(data.areaName ?? null);
      setAccuracy(Math.round(data.accuracyM ?? measuredAccuracy));
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      if (geoError?.code === geoError.PERMISSION_DENIED) {
        setError(
          "Allow location access and enable Precise Location for Extrovert in your browser settings, then try again."
        );
      } else if (err instanceof Error && err.message.startsWith("LOCATION_TOO_COARSE:")) {
        const meters = Number(err.message.split(":")[1]);
        setAccuracy(Number.isFinite(meters) ? meters : null);
        setError(
          "Your browser only gave an approximate location. Turn on Precise Location/GPS and try again so we do not assign the wrong area."
        );
      } else {
        setError(
          err instanceof Error && err.message !== "LOCATION_UNAVAILABLE"
            ? err.message
            : "We could not get a reliable GPS fix. Move near a window or outdoors, keep device location on, and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const verified = status === "verified";

  return (
    <section className="mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[#111115] p-5 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[rgb(var(--brand-red)/.22)] bg-[rgb(var(--brand-red)/.1)] text-[rgb(var(--brand-red))]">
          <Crosshair className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--brand-red))]">
            PRECISE AREA CHECK
          </p>
          <h2 className="mt-1 text-lg font-bold text-zinc-50">
            Verify where you actually are
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Extrovert samples GPS for a few seconds and keeps the best fix. We save only your supported area — not your exact coordinates.
          </p>

          <div className="mt-3 rounded-2xl border border-white/[.06] bg-[#181820] p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={`h-4 w-4 ${verified ? "text-emerald-400" : "text-amber-400"}`}
              />
              <span className="text-xs font-semibold text-zinc-200">
                {verified
                  ? `Verified area${name ? ` · ${name}` : ""}`
                  : "Area needs verification"}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] leading-4 text-zinc-500">
              {verified
                ? "Nearby uses this verified locality. Refresh whenever you move to another supported area."
                : "On iPhone, keep Precise Location enabled for your browser. Approximate location is intentionally rejected."}
            </p>
            {accuracy !== null && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[9px] font-bold text-sky-300">
                <MapPin className="h-3 w-3" />
                GPS accuracy ±{accuracy} m
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void verify()}
            disabled={loading}
            className="neon-cta mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding a precise GPS fix…
              </>
            ) : (
              <>
                <Crosshair className="h-4 w-4" />
                {verified ? "Refresh precise area" : "Verify precise area"}
              </>
            )}
          </button>

          {verified && (
            <p className="mt-2 text-[10px] text-emerald-400">
              Area verification is active{name ? ` for ${name}` : ""}.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-2 rounded-xl border border-rose-900/40 bg-rose-950/25 px-3 py-2 text-[10px] font-semibold leading-4 text-rose-300"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

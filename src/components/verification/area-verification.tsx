"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";

type AreaVerificationProps = {
  initialStatus: string;
  areaName: string | null;
};

const TARGET_ACCURACY_M = 80;
const MAX_ACCEPTED_ACCURACY_M = 250;
const SAMPLE_WINDOW_MS = 14_000;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function locatePrecisely(onSample: (accuracy: number) => void) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    let best: GeolocationPosition | null = null;
    let settled = false;
    let watchId = -1;

    const finish = (position?: GeolocationPosition, error?: unknown) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (watchId >= 0) navigator.geolocation.clearWatch(watchId);
      if (position) resolve(position);
      else reject(error ?? new Error("Location could not be resolved."));
    };

    const timer = window.setTimeout(() => {
      if (best && best.coords.accuracy <= MAX_ACCEPTED_ACCURACY_M) {
        finish(best);
        return;
      }
      const accuracy = best?.coords.accuracy;
      finish(
        undefined,
        new Error(
          Number.isFinite(accuracy)
            ? `LOW_ACCURACY:${Math.round(accuracy ?? 0)}`
            : "POSITION_UNAVAILABLE"
        )
      );
    }, SAMPLE_WINDOW_MS);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = Number(position.coords.accuracy);
        if (!Number.isFinite(accuracy) || accuracy <= 0) return;

        onSample(accuracy);
        if (!best || accuracy < best.coords.accuracy) best = position;
        if (accuracy <= TARGET_ACCURACY_M) finish(position);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finish(undefined, error);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: SAMPLE_WINDOW_MS,
      }
    );
  });
}

export default function AreaVerification({
  initialStatus,
  areaName,
}: AreaVerificationProps) {
  const [status, setStatus] = useState(initialStatus);
  const [name, setName] = useState(areaName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null);
  const [verifiedAccuracy, setVerifiedAccuracy] = useState<number | null>(null);

  async function verify() {
    setError(null);
    setLiveAccuracy(null);

    if (!navigator.geolocation || !window.isSecureContext) {
      setError(
        "Precise location needs a secure browser connection with location support."
      );
      return;
    }

    setLoading(true);
    try {
      const position = await locatePrecisely((accuracy) =>
        setLiveAccuracy(Math.round(accuracy))
      );

      const response = await fetch("/api/verification/area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Area verification could not be completed.");
      }

      setStatus("verified");
      setName(data.areaName ?? null);
      setVerifiedAccuracy(
        Number.isFinite(Number(data.accuracyM))
          ? Math.round(Number(data.accuracyM))
          : Math.round(position.coords.accuracy)
      );
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      const message = err instanceof Error ? err.message : "";

      if (geoError?.code === geoError.PERMISSION_DENIED) {
        setError(
          isIOS()
            ? "Location is blocked. On iPhone, allow Safari/Extrovert location access and turn Precise Location on, then try again."
            : "Allow precise location access for Extrovert, then try again."
        );
      } else if (message.startsWith("LOW_ACCURACY:")) {
        const meters = Number(message.split(":")[1]);
        setError(
          `Your device is only locating you to about ${meters || "several hundred"} m. ` +
            (isIOS()
              ? "Turn on Precise Location for Safari/Extrovert in iPhone Location Services, move near a window or outdoors, then retry."
              : "Turn on high-accuracy/GPS location, move near a window or outdoors, then retry.")
        );
      } else if (
        geoError?.code === geoError.POSITION_UNAVAILABLE ||
        geoError?.code === geoError.TIMEOUT ||
        message === "POSITION_UNAVAILABLE"
      ) {
        setError(
          "We could not get a reliable GPS fix. Turn on device location, move near a window or outdoors, and try again."
        );
      } else {
        setError(message || "Area verification could not be completed.");
      }
    } finally {
      setLoading(false);
    }
  }

  const verified = status === "verified";
  const accuracy = verifiedAccuracy ?? liveAccuracy;
  const precisionGood = accuracy !== null && accuracy <= MAX_ACCEPTED_ACCURACY_M;

  return (
    <section className="mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-[#101014] shadow-xl">
      <div className="relative p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[rgb(var(--brand-red)/.08)] blur-3xl"
        />

        <div className="relative flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[rgb(var(--brand-red)/.22)] bg-[rgb(var(--brand-red)/.1)] text-[rgb(var(--brand-red))]">
            <Navigation className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--brand-red))]">
              PRECISE AREA
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-zinc-50">
              Verify where you actually are
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Extrovert waits for a high-accuracy device fix before choosing your
              local area. Your exact coordinates stay private.
            </p>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-500">
              <MapPin className="h-3.5 w-3.5" />
              Area
            </div>
            <p className="mt-1 truncate text-xs font-bold text-zinc-100">
              {verified ? name || "Verified area" : "Not verified"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-500">
              <Crosshair className="h-3.5 w-3.5" />
              Precision
            </div>
            <p
              className={
                "mt-1 text-xs font-bold " +
                (accuracy === null
                  ? "text-zinc-400"
                  : precisionGood
                  ? "text-emerald-300"
                  : "text-amber-300")
              }
            >
              {accuracy === null
                ? "Waiting for GPS"
                : precisionGood
                ? `±${accuracy} m`
                : `Improving · ±${accuracy} m`}
            </p>
          </div>
        </div>

        <div
          className={
            "relative mt-3 flex items-start gap-2 rounded-2xl border px-3 py-2.5 " +
            (verified
              ? "border-emerald-500/20 bg-emerald-500/[.07]"
              : "border-white/[.06] bg-white/[.02]")
          }
        >
          {verified ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          )}
          <p className="text-[10px] leading-4 text-zinc-400">
            {verified
              ? "Verified. Nearby can now rank people by private, rounded location distance."
              : isIOS()
              ? "On iPhone, keep Precise Location enabled for Safari/Extrovert. Approximate Location is intentionally rejected."
              : "High-accuracy GPS is required so a broad network location cannot put you in the wrong city."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void verify()}
          disabled={loading}
          className="neon-cta relative mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black text-white disabled:opacity-55"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Locking precise location…
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4" />
              {verified ? "Refresh precise area" : "Use precise location"}
            </>
          )}
        </button>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/[.08] px-3 py-2.5 text-[10px] font-semibold leading-4 text-rose-300"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

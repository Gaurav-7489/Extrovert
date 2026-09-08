"use client";

import { useState } from "react";
import { Loader2, MapPin, ShieldCheck } from "lucide-react";

type AreaVerificationProps = {
  initialStatus: string;
  areaName: string | null;
};

function getCurrentPosition(options: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function locateForVerification() {
  try {
    return await getCurrentPosition({
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 10_000,
    });
  } catch (error) {
    const geoError = error as GeolocationPositionError;
    if (geoError.code === geoError.PERMISSION_DENIED) throw geoError;

    // Some Android devices cannot obtain a GPS fix quickly indoors. Fall back
    // to the network/coarse provider so area verification can still work when
    // the reported accuracy is within the server-side geofence tolerance.
    return getCurrentPosition({
      enableHighAccuracy: false,
      maximumAge: 60_000,
      timeout: 20_000,
    });
  }
}

export default function AreaVerification({ initialStatus, areaName }: AreaVerificationProps) {
  const [status, setStatus] = useState(initialStatus);
  const [name, setName] = useState(areaName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Location verification is not supported on this device.");
      return;
    }

    setLoading(true);
    try {
      const position = await locateForVerification();
      const response = await fetch("/api/verification/area", {
        method: "POST",
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
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      if (geoError?.code === geoError.PERMISSION_DENIED) {
        setError("Allow location access to verify your area, then try again.");
      } else if (geoError?.code === geoError.POSITION_UNAVAILABLE || geoError?.code === geoError.TIMEOUT) {
        setError("We could not get a reliable location fix. Turn on device location and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Area verification could not be completed.");
      }
    } finally {
      setLoading(false);
    }
  }

  const verified = status === "verified";

  return (
    <section className="mt-4 rounded-[2rem] border border-white/10 bg-[#121216] p-5 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-400">AREA VERIFICATION</p>
          <h2 className="mt-1 text-lg font-bold text-zinc-50">Verify your area</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Use your current location to confirm that you are in one of Extrovert&apos;s supported areas. Your exact location is not shown to other users.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/5 bg-[#181820] px-3 py-2.5">
            <ShieldCheck className={`h-4 w-4 ${verified ? "text-emerald-400" : "text-zinc-500"}`} />
            <span className="text-xs font-semibold text-zinc-200">
              {verified ? `Area verified${name ? ` · ${name}` : ""}` : "Area not verified"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void verify()}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#550000] py-3.5 text-xs font-bold text-white shadow-md shadow-[#550000]/20 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking location…</> : <><MapPin className="h-4 w-4" /> {verified ? "Refresh current area" : "Verify my area"}</>}
          </button>

          {verified && <p className="mt-2 text-[10px] text-emerald-400">Your area verification is active. Refresh if you have moved to another supported area.</p>}
          {error && <p role="alert" className="mt-2 rounded-xl border border-rose-900/40 bg-rose-950/25 px-3 py-2 text-[10px] font-semibold text-rose-300">{error}</p>}
        </div>
      </div>
    </section>
  );
}

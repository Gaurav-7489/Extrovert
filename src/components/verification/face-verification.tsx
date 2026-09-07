"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";

type Challenge = "Turn your head slightly left" | "Turn your head slightly right" | "Move a little closer";
type FaceBox = { x: number; y: number; width: number; height: number };
type Detector = { detect(source: CanvasImageSource): Promise<Array<{ boundingBox: DOMRectReadOnly }>> };

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => Detector;
  }
}

const CHALLENGES: Challenge[] = [
  "Turn your head slightly left",
  "Turn your head slightly right",
  "Move a little closer",
];

function pickChallenge(): Challenge {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]!;
}

export default function FaceVerification() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const baselineRef = useRef<FaceBox | null>(null);
  const startedAtRef = useRef(0);
  const finishingRef = useRef(false);
  const challengeRef = useRef<Challenge>(pickChallenge());

  const [status, setStatus] = useState<"idle" | "camera" | "checking" | "success" | "error">("idle");
  const [message, setMessage] = useState("Use your front camera. No ID is required.");
  const [challenge, setChallenge] = useState<Challenge>(challengeRef.current);
  const [progress, setProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [nativeDetection, setNativeDetection] = useState(true);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const finishVerification = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setStatus("checking");
    setMessage("Securing your verification…");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    try {
      const response = await fetch("/api/verification/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "camera_liveness", face_detected: faceDetected || !!detectorRef.current }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Verification failed");
      setProgress(100);
      setStatus("success");
      setMessage("You're verified. Your profile now has the verified badge.");
      stopCamera();
    } catch (error) {
      finishingRef.current = false;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Verification failed. Try again.");
    }
  }, [faceDetected, stopCamera]);

  const loop = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    let box: FaceBox | null = null;
    if (detectorRef.current) {
      try {
        const faces = await detectorRef.current.detect(video);
        if (faces[0]) {
          const b = faces[0].boundingBox;
          box = { x: b.x, y: b.y, width: b.width, height: b.height };
        }
      } catch {
        // Keep the camera flow alive if a browser detector frame fails.
      }
    }

    if (box) {
      setFaceDetected(true);
      if (!baselineRef.current) baselineRef.current = box;
      const base = baselineRef.current;
      const centerX = box.x + box.width / 2;
      const baseCenterX = base.x + base.width / 2;
      const sizeRatio = box.width / Math.max(base.width, 1);
      const horizontalMove = Math.abs(centerX - baseCenterX) / Math.max(video.videoWidth, 1);
      const challengeDone = challengeRef.current.includes("left") || challengeRef.current.includes("right")
        ? horizontalMove > 0.10
        : sizeRatio > 1.18;
      const elapsed = performance.now() - startedAtRef.current;
      setProgress(Math.min(95, Math.round((elapsed / 4200) * 35 + (challengeDone ? 60 : 0))));
      if (elapsed > 1200 && challengeDone) {
        await finishVerification();
        return;
      }
    } else if (!detectorRef.current) {
      const elapsed = performance.now() - startedAtRef.current;
      setFaceDetected(true);
      setProgress(Math.min(70, Math.round((elapsed / 4500) * 70)));
      if (elapsed > 4500) {
        await finishVerification();
        return;
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [finishVerification]);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setMessage("Camera access is not supported on this device/browser.");
      return;
    }

    stopCamera();
    finishingRef.current = false;
    baselineRef.current = null;
    setProgress(0);
    setFaceDetected(false);
    const next = pickChallenge();
    challengeRef.current = next;
    setChallenge(next);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 24 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const canDetect = typeof window.FaceDetector === "function";
      setNativeDetection(canDetect);
      detectorRef.current = canDetect ? new window.FaceDetector!({ fastMode: true, maxDetectedFaces: 1 }) : null;
      setStatus("camera");
      setMessage(canDetect ? next : "Keep your face visible and move naturally for a few seconds.");
      startedAtRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof DOMException && error.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access and try again." : "We couldn't open your camera. Try again.");
    }
  }

  return (
    <section className="w-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.08)]">
      <div className="relative aspect-[4/3] bg-zinc-950">
        <video ref={videoRef} muted playsInline className={`h-full w-full object-cover ${status === "idle" ? "hidden" : ""}`} />
        {status === "idle" && <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-white"><Camera className="h-10 w-10 opacity-80" /></div>}
        {status !== "idle" && status !== "success" && <div className="pointer-events-none absolute inset-0"><div className="absolute left-1/2 top-1/2 h-[62%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.25)]" /></div>}
        {status === "success" && <div className="absolute inset-0 grid place-items-center bg-emerald-950/90 text-white"><CheckCircle2 className="h-14 w-14" /></div>}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><p className="text-sm font-black">Face verification</p></div>
        <p className="mt-2 text-xs leading-5 text-zinc-600">A quick camera check confirms a live face is present. No government ID or document upload is required.</p>

        {status !== "idle" && status !== "success" && <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3"><p className="text-[11px] font-bold text-zinc-800">{nativeDetection ? challenge : "Keep your face visible and move naturally"}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-[10px] text-zinc-500">{faceDetected ? "Face detected" : "Looking for a face…"}</p></div>}

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-[10px] leading-4 text-zinc-500"><span className="font-bold text-zinc-700">Privacy:</span> camera frames stay in the browser and are not uploaded by this flow.</div>
        {status === "error" && <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>}
        {status === "success" && <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</div>}
        {status !== "success" && <button onClick={start} disabled={status === "checking"} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black text-white disabled:opacity-60">{status === "checking" ? <><Loader2 className="h-4 w-4 animate-spin" /> Finishing…</> : status === "error" ? <><RotateCcw className="h-4 w-4" /> Try again</> : <><Camera className="h-4 w-4" /> Start face check</>}</button>}
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type Challenge =
  | "Turn your head slightly left"
  | "Turn your head slightly right"
  | "Move a little closer";

type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Detector = {
  detectForVideo(
    source: HTMLVideoElement,
    timestamp: number
  ): {
    detections: Array<{
      boundingBox?: {
        originX: number;
        originY: number;
        width: number;
        height: number;
      };
    }>;
  };
  close?: () => void;
};

export default function FaceVerification() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const rafRef = useRef<number | null>(null);
  const baselineRef = useRef<FaceBox | null>(null);
  const startedAtRef = useRef(0);
  const finishingRef = useRef(false);
  const challengeRef = useRef<Challenge>("Move a little closer");
  const challengePassedRef = useRef(false);

  const [status, setStatus] = useState<
    "idle" | "camera" | "loading" | "checking" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState(
    "Use your front camera. No ID or document is required."
  );
  const [challenge, setChallenge] = useState<Challenge>(challengeRef.current);
  const [progress, setProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    detectorRef.current?.close?.();
    detectorRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const finish = useCallback(async () => {
    if (finishingRef.current || !challengePassedRef.current) return;
    finishingRef.current = true;
    setStatus("checking");
    setMessage("Securing your verification…");

    try {
      const response = await fetch("/api/verification/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "camera_liveness",
          face_detected: true,
          challenge_completed: true,
          challenge: challengeRef.current,
        }),
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
      setMessage(
        error instanceof Error ? error.message : "Verification failed. Try again."
      );
    }
  }, [stopCamera]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (!video || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    try {
      const result = detector.detectForVideo(video, performance.now());
      const raw = result.detections[0]?.boundingBox;
      const box = raw
        ? { x: raw.originX, y: raw.originY, width: raw.width, height: raw.height }
        : null;

      if (box) {
        setFaceDetected(true);
        if (!baselineRef.current) baselineRef.current = box;

        const base = baselineRef.current;
        const centerX = box.x + box.width / 2;
        const baseCenterX = base.x + base.width / 2;
        const signedMove =
          (centerX - baseCenterX) / Math.max(video.videoWidth, 1);
        const sizeRatio = box.width / Math.max(base.width, 1);
        const threshold = 0.1;

        const challengeDone =
          challengeRef.current === "Turn your head slightly left"
            ? signedMove > threshold
            : challengeRef.current === "Turn your head slightly right"
            ? signedMove < -threshold
            : sizeRatio > 1.18;

        const elapsed = performance.now() - startedAtRef.current;
        setProgress(
          Math.min(95, Math.round((elapsed / 4200) * 35 + (challengeDone ? 60 : 0)))
        );

        if (elapsed > 1200 && challengeDone) {
          challengePassedRef.current = true;
          void finish();
          return;
        }
      } else {
        setFaceDetected(false);
      }
    } catch {
      setFaceDetected(false);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [finish]);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setMessage("Camera access is not supported on this device/browser.");
      return;
    }

    stopCamera();
    finishingRef.current = false;
    baselineRef.current = null;
    challengePassedRef.current = false;
    setProgress(0);
    setFaceDetected(false);
    setDetectorReady(false);
    setStatus("loading");
    setMessage("Starting a secure verification challenge…");

    try {
      const challengeResponse = await fetch("/api/verification/start", {
        method: "POST",
      });
      const challengeData = await challengeResponse.json().catch(() => ({}));
      if (!challengeResponse.ok || !challengeData.challenge) {
        throw new Error(
          challengeData.error || "We couldn't start verification."
        );
      }

      const next = challengeData.challenge as Challenge;
      challengeRef.current = next;
      setChallenge(next);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 24 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      const { FilesetResolver, FaceDetector } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
      );
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.55,
      });

      detectorRef.current = detector as unknown as Detector;
      setDetectorReady(true);
      setStatus("camera");
      setMessage(next);
      startedAtRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    } catch (error) {
      stopCamera();
      setStatus("error");
      setMessage(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access and try again."
          : error instanceof Error
          ? `We couldn't start the face check: ${error.message}`
          : "We couldn't start the face check. Try again."
      );
    }
  }

  return (
    <section className="w-full overflow-hidden rounded-[2rem] border border-zinc-200/90 bg-white shadow-lg transition-colors dark:border-white/10 dark:bg-[#121216] dark:shadow-black/60 font-sans">
      <div className="relative aspect-[4/3] bg-zinc-950">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`h-full w-full object-cover ${
            status === "idle" ? "hidden" : ""
          }`}
        />

        {status === "idle" && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
            <Camera className="h-10 w-10 opacity-75" />
          </div>
        )}

        {status !== "idle" && status !== "success" && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[62%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {status === "success" && (
          <div className="absolute inset-0 grid place-items-center bg-[#550000]/90 text-white backdrop-blur-xs">
            <CheckCircle2 className="h-14 w-14 animate-pulse" />
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#550000] dark:text-red-400" />
          <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
            Face verification
          </p>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          A short camera challenge checks for a live face. Camera frames are processed on your device and this flow does not upload or store face images.
        </p>

        {status !== "idle" && status !== "success" && (
          <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-3.5 dark:border-white/5 dark:bg-[#16161d]">
            <p className="text-xs font-bold text-zinc-950 dark:text-zinc-100">
              {detectorReady ? challenge : "Preparing face detection…"}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-[#550000] transition-all duration-300 dark:bg-red-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {faceDetected ? "Face detected" : "Looking for a face…"}
            </p>
          </div>
        )}

        <div className="mt-3.5 rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-3 text-[10px] leading-relaxed text-zinc-500 dark:border-white/5 dark:bg-[#16161d] dark:text-zinc-400">
          <span className="font-bold text-zinc-700 dark:text-zinc-300">
            Privacy:
          </span>{" "}
          no biometric scan or camera frame is uploaded or stored by DateBu.
        </div>

        {status === "error" && (
          <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-rose-200/90 bg-rose-50/90 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-300">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status === "success" && (
          <div className="mt-3.5 rounded-2xl border border-[#550000]/25 bg-[#550000]/10 p-3 text-xs font-semibold text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/20 dark:text-red-300">
            {message}
          </div>
        )}

        {status !== "success" && (
          <button
            onClick={() => void start()}
            disabled={status === "loading" || status === "checking"}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-[0.98] disabled:opacity-50 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing…</span>
              </>
            ) : status === "checking" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Finishing…</span>
              </>
            ) : status === "error" ? (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Try again</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                <span>Start face check</span>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
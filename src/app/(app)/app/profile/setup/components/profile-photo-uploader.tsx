"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, 
  Loader2, 
  X, 
  Star, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  Camera, 
  Sparkles,
  UserCheck,
  ArrowLeftRight
} from "lucide-react";

interface ProfilePhotoUploaderProps {
  userId: string;
  existingPhotoUrls?: string[];
  existingPhotoPaths?: string[];
  onPhotosUploaded: (storagePaths: string[]) => void;
}

const MAX_PHOTOS = 6;
const MAX_FILE_SIZE = 6 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProfilePhotoUploader({
  userId,
  existingPhotoUrls = [],
  existingPhotoPaths = [],
  onPhotosUploaded,
}: ProfilePhotoUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);

  // Maintain strict 6-slot arrays so deleting an item leaves an empty slot instead of collapsing array
  const [slotsUrls, setSlotsUrls] = useState<(string | null)[]>(() => {
    const initial = Array(MAX_PHOTOS).fill(null);
    existingPhotoUrls.forEach((url, i) => {
      if (i < MAX_PHOTOS) initial[i] = url;
    });
    return initial;
  });

  const [slotsPaths, setSlotsPaths] = useState<(string | null)[]>(() => {
    const initial = Array(MAX_PHOTOS).fill(null);
    existingPhotoPaths.forEach((path, i) => {
      if (i < MAX_PHOTOS) initial[i] = path;
    });
    return initial;
  });

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);

  // Modal crop state
  const [currentCropImage, setCurrentCropImage] = useState<string | null>(null);
  const [currentFileType, setCurrentFileType] = useState<string>("image/jpeg");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onCropAreaComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const triggerUpload = (slotIndex: number) => {
    if (isUploading) return;
    setTargetSlotIndex(slotIndex);
    fileInputRef.current?.click();
  };

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload JPG, PNG, or WebP images only.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 6 MB.");
      event.target.value = "";
      return;
    }

    setCurrentFileType(file.type || "image/jpeg");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);

    const reader = new FileReader();
    reader.onload = () => {
      setCurrentCropImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  }

  async function handleApplyCrop() {
    if (!currentCropImage || !croppedAreaPixels || targetSlotIndex === null) return;

    try {
      setIsUploading(true);

      const croppedBlob = await getCroppedImg(
        currentCropImage,
        croppedAreaPixels,
        rotation,
        currentFileType
      );

      if (!croppedBlob) {
        throw new Error("Could not process cropped image.");
      }

      const extension = currentFileType === "image/png" ? "png" : currentFileType === "image/webp" ? "webp" : "jpg";
      const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, croppedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: currentFileType,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        setError("Failed to upload photo. Please try again.");
        return;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(filePath, 60 * 60);

      const photoUrl =
        !signedUrlError && signedUrlData?.signedUrl
          ? signedUrlData.signedUrl
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-photos/${filePath}`;

      const newUrls = [...slotsUrls];
      const newPaths = [...slotsPaths];

      // Assign to target slot without disturbing others
      newUrls[targetSlotIndex] = photoUrl;
      newPaths[targetSlotIndex] = filePath;

      setSlotsUrls(newUrls);
      setSlotsPaths(newPaths);

      // Preserve fixed slot order. Slot 1 must remain the primary photo.
      onPhotosUploaded(
        newPaths.filter((p): p is string => Boolean(p))
      );
    } catch (err) {
      console.error("Cropping error:", err);
      setError("An error occurred while cropping the image.");
    } finally {
      setIsUploading(false);
      setCurrentCropImage(null);
      setTargetSlotIndex(null);
    }
  }

  function handleCancelCrop() {
    setCurrentCropImage(null);
    setTargetSlotIndex(null);
  }

  // Deletes single slot in place WITHOUT shifting array
  function removePhoto(e: React.MouseEvent, index: number) {
    e.stopPropagation();

    const newUrls = [...slotsUrls];
    const newPaths = [...slotsPaths];

    newUrls[index] = null;
    newPaths[index] = null;

    setSlotsUrls(newUrls);
    setSlotsPaths(newPaths);

    onPhotosUploaded(
      newPaths.filter((p): p is string => Boolean(p))
    );
  }

  // Swap with Slot 1 deliberately
  function makeMainPhoto(e: React.MouseEvent, index: number) {
    e.stopPropagation();
    if (index === 0) return;

    const newUrls = [...slotsUrls];
    const newPaths = [...slotsPaths];

    const tempUrl = newUrls[0] ?? null;
    const tempPath = newPaths[0] ?? null;

    newUrls[0] = newUrls[index] ?? null;
    newPaths[0] = newPaths[index] ?? null;

    newUrls[index] = tempUrl;
    newPaths[index] = tempPath;

    setSlotsUrls(newUrls);
    setSlotsPaths(newPaths);

    onPhotosUploaded(
      newPaths.filter((p): p is string => Boolean(p))
    );
  }

  const isMainSlot = targetSlotIndex === 0;
  const activePhotosCount = slotsPaths.filter(Boolean).length;

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-1.5 text-xs font-bold text-zinc-950 dark:text-zinc-50 sm:text-sm">
            <Camera className="h-4 w-4 text-[#550000] dark:text-red-400" />
            <span>Profile Deck Photos</span>
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Slot 1 is your Main Discovery & avatar card. Photos never shift when deleted.
          </p>
        </div>
        <span className="rounded-full border border-[#550000]/20 bg-[#550000]/5 px-2.5 py-0.5 text-[11px] font-bold text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300">
          {activePhotosCount}/6 Photos
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 6 Fixed Slots Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {slotsUrls.map((url, slotIdx) => {
          const isMain = slotIdx === 0;

          if (url) {
            return (
              <div
                key={slotIdx}
                onClick={() => triggerUpload(slotIdx)}
                className={`group relative aspect-[4/5] overflow-hidden rounded-2xl border-2 bg-zinc-950 shadow-2xs cursor-pointer transition-all ${
                  isMain
                    ? "border-[#550000] ring-3 ring-[#550000]/20 dark:border-red-500/80 dark:ring-red-500/20"
                    : "border-zinc-200/90 hover:border-[#550000]/40 dark:border-white/10 dark:hover:border-white/25"
                }`}
              >
                <Image
                  src={url}
                  alt={`Profile slot ${slotIdx + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 30vw, 160px"
                />

                {isMain ? (
                  <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-[#550000]/95 px-2 py-0.5 text-[9px] font-bold text-white shadow-2xs backdrop-blur-xs">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    <span>Main Card</span>
                  </div>
                ) : (
                  <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/60 text-[10px] font-bold text-white backdrop-blur-xs">
                    {slotIdx + 1}
                  </div>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => removePhoto(e, slotIdx)}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white transition hover:bg-rose-600 active:scale-90"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* "Make Main" Action for non-slot 1 items */}
                {!isMain && (
                  <button
                    type="button"
                    onClick={(e) => makeMainPhoto(e, slotIdx)}
                    className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full border border-white/20 bg-black/75 px-2 py-1 text-[9px] font-bold text-white backdrop-blur-xs transition-colors hover:bg-[#550000] hover:text-white"
                  >
                    <ArrowLeftRight className="h-2.5 w-2.5" />
                    <span>Set Main</span>
                  </button>
                )}
              </div>
            );
          }

          return (
            <button
              type="button"
              key={slotIdx}
              onClick={() => triggerUpload(slotIdx)}
              disabled={isUploading}
              className={`relative flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed transition-all active:scale-95 cursor-pointer ${
                isMain
                  ? "border-[#550000]/40 bg-[#550000]/5 text-[#550000] hover:bg-[#550000]/10 dark:border-[#550000]/50 dark:bg-[#550000]/15 dark:text-red-300 dark:hover:bg-[#550000]/25"
                  : "border-zinc-200/90 bg-zinc-50/70 text-zinc-400 hover:border-zinc-300 hover:bg-zinc-100/70 dark:border-white/10 dark:bg-[#141419] dark:text-zinc-500 dark:hover:border-white/20 dark:hover:bg-[#181820]"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isMain
                    ? "bg-[#550000]/15 text-[#550000] dark:bg-[#550000]/30 dark:text-red-300"
                    : "bg-zinc-200/80 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                }`}
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold">
                {isMain ? "⭐ Main Photo" : `Slot ${slotIdx + 1}`}
              </span>
            </button>
          );
        })}
      </div>

      {!slotsUrls[0] && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          ⚠️ Please add a photo in Slot 1. This will be your primary card and circular profile picture.
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </p>
      )}

      {/* Frame Cropper Modal */}
      {mounted && currentCropImage && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
          <div className="relative flex h-[92dvh] max-h-[700px] w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#0c0c10] shadow-2xl">
            
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-[#0c0c10]">
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sparkles className="h-3.5 w-3.5 text-[#550000] dark:text-red-400" /> 
                  <span>{isMainSlot ? "Frame Main Card (Slot 1)" : `Frame Slot ${targetSlotIndex! + 1}`}</span>
                </h3>
                <p className="text-[10px] text-zinc-400">
                  {isMainSlot ? "Align your face inside the circle guide" : "Pinch or zoom to fit the 4:5 card"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelCrop}
                disabled={isUploading}
                className="rounded-full bg-zinc-900 p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cropper Viewport */}
            <div className="relative flex-1 min-h-0 bg-black">
              <Cropper
                image={currentCropImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={4 / 5}
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropAreaComplete}
              />

              {/* Avatar Safe-Zone Circle Overlay for Slot 1 */}
              {isMainSlot && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-full border-2 border-dashed border-[#550000]/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] dark:border-red-400/90">
                    <div className="absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#550000]/40 bg-black/80 px-2 py-0.5 text-[8px] font-bold text-red-300 backdrop-blur-xs">
                      <UserCheck className="h-2.5 w-2.5" />
                      <span>Avatar Safe Zone</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="shrink-0 space-y-3 border-t border-zinc-800/80 bg-[#121217] p-4">
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 text-zinc-400" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.05}
                  aria-label="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-[#550000]"
                />
                <ZoomIn className="h-4 w-4 text-zinc-400" />
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="ml-1 rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700 active:scale-95"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  disabled={isUploading}
                  className="rounded-xl border border-zinc-700 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#550000]/40 bg-[#550000] py-2.5 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Apply Crop</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ================= High-Res Canvas Cropping Engine ================= */

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  mimeType = "image/jpeg"
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) return null;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((blob) => resolve(blob), mimeType, 0.92);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
// Kamera preview komponenti (Req 8.6).
//
// Berilgan `MediaStream` ni video elementga biriktirib oldindan ko'rsatadi.
// Stream o'zgarganda `srcObject` yangilanadi. Stream bo'lmaganda joy egasi
// (placeholder) ko'rsatiladi.

import { useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { VideoOff } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export interface CameraPreviewProps {
  /** Ko'rsatiladigan media stream (yoki `null`). */
  stream: MediaStream | null;
  /**
   * Video elementga tashqi ref (aniqlash uchun ham ishlatiladi).
   *
   * `RefObject<HTMLVideoElement>` ishlatiladi — `.current` baribir `null`
   * bo'lishi mumkin, lekin DOM `<video ref>` atributi aynan shu turni kutadi
   * (`@types/react` 18.x `LegacyRef`).
   */
  videoRef: RefObject<HTMLVideoElement>;
  /** Qo'shimcha CSS klasslar. */
  className?: string;
}

/**
 * Kamera ko'rinishini oldindan ko'rsatuvchi (preview) komponent. Talaba
 * test boshlashdan oldin o'zini ko'rib tasdiqlashi uchun ishlatiladi (Req 8.6).
 */
export function CameraPreview({
  stream,
  videoRef,
  className,
}: CameraPreviewProps) {
  const { t } = useTranslation();

  // Stream o'zgarganda video elementga biriktiramiz.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.srcObject = stream;
    if (stream) {
      // Avtomatik ijro — preview jonli ko'rsatilishi uchun.
      void video.play().catch(() => {});
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream, videoRef]);

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-900",
        className,
      )}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label={t("proctoring.preview")}
        className={cn(
          "h-full w-full object-cover",
          stream ? "block" : "invisible",
        )}
      />
      {!stream && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-neutral-400"
          role="status"
        >
          <VideoOff className="size-8" aria-hidden="true" />
          <span>{t("proctoring.noCamera")}</span>
        </div>
      )}
    </div>
  );
}

export default CameraPreview;

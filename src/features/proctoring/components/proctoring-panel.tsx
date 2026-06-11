// Proktoring paneli — kamera ruxsati, preview/tasdiqlash va yuz aniqlashni
// bitta oqimga birlashtiradi (Req 8.1, 8.2, 8.3, 8.4, 8.5, 8.6).
//
// Oqim:
//  1. Mount bo'lganda kamera/mikrofon ruxsati so'raladi (Req 8.1).
//  2. Ruxsat rad etilsa ogohlantirish ko'rsatiladi va test boshlanmaydi
//     (Req 8.2) — `onBlocked` chaqiriladi.
//  3. Ruxsat berilsa preview ko'rsatiladi; talaba "Tasdiqlash" tugmasini
//     bosguncha test boshlanmaydi (Req 8.6).
//  4. Tasdiqlangach `onReady` chaqiriladi va yuz aniqlash ishga tushadi
//     (Req 8.3–8.5); qoidabuzarlikda ogohlantirish banneri ko'rsatiladi.

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Camera, ShieldAlert } from "lucide-react";

import { Button } from "@/shared/ui/button";
import type { FaceDetector } from "../lib/face-detection";
import { useCameraPermission } from "../hooks/use-camera-permission";
import { useProctoring } from "../hooks/use-proctoring";
import { CameraPreview } from "./camera-preview";

export interface ProctoringPanelProps {
  /** Hodisalar bog'lanadigan baholash identifikatori. */
  assessmentId: string;
  /** Talaba preview ni tasdiqlab proktoring tayyor bo'lganda chaqiriladi. */
  onReady?: () => void;
  /** Kamera bloklanganda (ruxsat yo'q yoki muhit qo'llab-quvvatlamaydi). */
  onBlocked?: () => void;
  /** Test uchun soxta yuz detektori (default: face-api.js). */
  detector?: FaceDetector;
  /** Aniqlash intervali (default 10s). */
  intervalMs?: number;
  /** face-api.js model fayllari URL i. */
  modelUrl?: string;
}

/**
 * Proktoring paneli komponenti. Test moduli (task 20/21) tomonidan baholash
 * boshlanishidan oldin ko'rsatiladi.
 */
export function ProctoringPanel({
  assessmentId,
  onReady,
  onBlocked,
  detector,
  intervalMs,
  modelUrl,
}: ProctoringPanelProps) {
  const { t } = useTranslation();
  const { state, stream, request, isBlocked } = useCameraPermission();
  const [confirmed, setConfirmed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Mount bo'lganda kamera/mikrofon ruxsatini so'raymiz (Req 8.1).
  useEffect(() => {
    void request();
  }, [request]);

  // Bloklangan holatda chaqiruvchini xabardor qilamiz (test boshlanmaydi).
  useEffect(() => {
    if (isBlocked) {
      onBlocked?.();
    }
  }, [isBlocked, onBlocked]);

  // Talaba tasdiqlagandan keyingina aniqlash faollashadi (Req 8.6).
  const { hasWarning } = useProctoring({
    assessmentId,
    videoRef,
    active: confirmed,
    detector,
    intervalMs,
    modelUrl,
  });

  const handleConfirm = () => {
    setConfirmed(true);
    onReady?.();
  };

  return (
    <section
      aria-label={t("proctoring.title")}
      className="flex flex-col gap-4 rounded-lg border p-4"
    >
      <header className="flex items-center gap-2">
        <Camera className="size-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{t("proctoring.title")}</h2>
      </header>

      <CameraPreview stream={stream} videoRef={videoRef} />

      {/* Ruxsat rad etilgan yoki qo'llab-quvvatlanmaydigan holat (Req 8.2). */}
      {isBlocked && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{t("proctoring.permissionDenied")}</p>
        </div>
      )}

      {/* Ruxsat so'ralmoqda. */}
      {state === "requesting" && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("proctoring.requesting")}
        </p>
      )}

      {/* Qoidabuzarlik ogohlantirishi (Req 8.4). */}
      {confirmed && hasWarning && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-amber-500 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{t("proctoring.faceWarning")}</p>
        </div>
      )}

      {/* Preview tasdiqlash — faqat ruxsat berilgan va hali tasdiqlanmaganda. */}
      {state === "granted" && !confirmed && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {t("proctoring.confirmHint")}
          </p>
          <Button type="button" onClick={handleConfirm} className="self-start">
            {t("proctoring.confirm")}
          </Button>
        </div>
      )}

      {confirmed && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("proctoring.active")}
        </p>
      )}
    </section>
  );
}

export default ProctoringPanel;

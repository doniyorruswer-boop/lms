// Kamera/mikrofon ruxsatini boshqaruvchi hook (Req 8.1, 8.2).
//
// `navigator.mediaDevices.getUserMedia` orqali kamera va mikrofonga ruxsat
// so'raydi. Foydalanuvchi rad etsa yoki muhit qo'llab-quvvatlamasa, `isBlocked`
// `true` bo'ladi — chaqiruvchi (test moduli) testni boshlashga yo'l qo'ymasligi
// kerak (Req 8.2). Olingan `MediaStream` preview uchun video elementga
// biriktiriladi.

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Kamera ruxsati holati:
 * - `idle`        — hali so'ralmagan.
 * - `requesting`  — ruxsat so'rovi davom etmoqda.
 * - `granted`     — ruxsat berildi, stream mavjud.
 * - `denied`      — foydalanuvchi rad etdi yoki qurilma topilmadi.
 * - `unsupported` — muhit `getUserMedia` ni qo'llab-quvvatlamaydi.
 */
export type CameraPermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported";

export interface UseCameraPermissionResult {
  /** Joriy ruxsat holati. */
  state: CameraPermissionState;
  /** Ruxsat berilganda olingan media stream (aks holda `null`). */
  stream: MediaStream | null;
  /** Ruxsat so'rashni boshlaydi (`getUserMedia`). */
  request: () => Promise<void>;
  /** Streamni to'xtatadi va barcha treklarni yopadi. */
  stop: () => void;
  /**
   * Test bloklanishi kerakligini bildiradi: ruxsat rad etilgan yoki muhit
   * qo'llab-quvvatlamaydigan holatlarda `true` (Req 8.2).
   */
  isBlocked: boolean;
}

/** `getUserMedia` mavjudligini xavfsiz tekshiradi (SSR/jsdom uchun guard). */
function isGetUserMediaSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/**
 * Kamera va mikrofon ruxsatini boshqaradi. Komponent unmount bo'lganda stream
 * avtomatik to'xtatiladi.
 *
 * @param constraints - `getUserMedia` cheklovlari (default: video + audio).
 */
export function useCameraPermission(
  constraints: MediaStreamConstraints = { video: true, audio: true },
): UseCameraPermissionResult {
  const [state, setState] = useState<CameraPermissionState>("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  // `getUserMedia` qayta chaqirilganda eski cheklovlardan foydalanmaslik uchun
  // eng so'nggi qiymatni ref da saqlaymiz.
  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;

  const stop = useCallback(() => {
    const current = streamRef.current;
    if (current) {
      current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    setStream(null);
  }, []);

  const request = useCallback(async () => {
    if (!isGetUserMediaSupported()) {
      setState("unsupported");
      return;
    }
    setState("requesting");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraintsRef.current,
      );
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setState("granted");
    } catch {
      // Ruxsat rad etildi yoki qurilma mavjud emas — testni bloklash holati.
      setState("denied");
    }
  }, []);

  // Unmount da streamni tozalaymiz (kamerani bo'shatamiz).
  useEffect(() => {
    return () => {
      const current = streamRef.current;
      if (current) {
        current.getTracks().forEach((track) => track.stop());
      }
      streamRef.current = null;
    };
  }, []);

  const isBlocked = state === "denied" || state === "unsupported";

  return { state, stream, request, stop, isBlocked };
}

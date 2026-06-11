// Yuz aniqlash va proktoring hodisalarini boshqaruvchi hook (Req 8.3, 8.4, 8.5).
//
// `active` bo'lganda:
//  - face-api.js modellarini yuklaydi va har `intervalMs` (default 10s) da bir
//    marta yuzni aniqlaydi; aniqlash sikli `throttle` orqali kamida 10 soniyaga
//    ajratiladi (Req 8.3);
//  - natijani `classifyFaceDetection` orqali tasniflaydi va `ProctoringEvent`
//    sifatida backendga yuboradi; 0 yoki >1 yuz bo'lsa "violation" yuboriladi
//    va talabaga ko'rinadigan ogohlantirish belgilanadi (Req 8.4);
//  - `visibilitychange` (sahifa yashirilganda) va `blur` hodisalarida
//    "tab_switch" hodisasini yuboradi (Req 8.5).
//
// Tarmoq xatolari proktoring tajribasini buzmaydi (fire-and-forget); keyingi
// siklda qayta urinish bo'ladi.

import { useEffect, useRef, useState, type RefObject } from "react";

import { apiClient } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import { throttle } from "@/shared/lib/throttle";
import type { ProctoringEvent } from "@/shared/types";

import { classifyFaceDetection } from "../lib/classify";
import {
  detectFaces,
  loadFaceApiModels,
  type FaceDetector,
} from "../lib/face-detection";
import { faceResultToEventType, isViolation } from "../lib/event-mapper";

/** Yuz aniqlash intervali (Req 8.3): har 10 soniya. */
export const DETECTION_INTERVAL_MS = 10_000;

/**
 * `blur` va `visibilitychange` hodisalari bir vaqtda kelganda tab almashtirishni
 * ikki marta yubormaslik uchun dedup oynasi (millisekund).
 */
export const TAB_SWITCH_DEDUP_MS = 300;

export interface UseProctoringOptions {
  /** Hodisalar bog'lanadigan baholash identifikatori. */
  assessmentId: string;
  /** Aniqlash o'tkaziladigan video elementga ref. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** `true` bo'lganda proktoring ishga tushadi (test davom etmoqda). */
  active: boolean;
  /** Test uchun soxta detektor kiritish imkoniyati (default: face-api.js). */
  detector?: FaceDetector;
  /** Aniqlash intervali (default 10s). */
  intervalMs?: number;
  /** face-api.js model fayllari URL i. */
  modelUrl?: string;
}

export interface UseProctoringResult {
  /** Modellar yuklanganligi (yoki test rejimida detektor mavjudligi). */
  ready: boolean;
  /** Eng so'nggi yuborilgan hodisa turi. */
  lastEventType: ProctoringEvent["type"] | null;
  /** Joriy qoidabuzarlik ogohlantirishi mavjud bo'lsa `true` (Req 8.4). */
  hasWarning: boolean;
}

export function useProctoring(
  options: UseProctoringOptions,
): UseProctoringResult {
  const {
    assessmentId,
    videoRef,
    active,
    detector,
    intervalMs = DETECTION_INTERVAL_MS,
    modelUrl,
  } = options;

  const [ready, setReady] = useState(false);
  const [lastEventType, setLastEventType] = useState<
    ProctoringEvent["type"] | null
  >(null);
  const [hasWarning, setHasWarning] = useState(false);

  // O'zgaruvchan qiymatlarni ref da saqlaymiz, shunda hodisa va interval
  // callbacklari qayta ulanmasdan eng so'nggi qiymatlardan foydalanadi.
  const detectRef = useRef<FaceDetector>(detector ?? detectFaces);
  detectRef.current = detector ?? detectFaces;
  const videoRefHolder = videoRef;
  const assessmentIdRef = useRef(assessmentId);
  assessmentIdRef.current = assessmentId;

  /** Bitta `ProctoringEvent` ni backendga yuboradi (fire-and-forget). */
  const sendEvent = useRef((event: ProctoringEvent) => {
    void apiClient.post(endpoints.proctoring.events, event).catch(() => {});
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let lastTabSwitchAt = 0;

    /** Bir aniqlash siklini bajaradi: aniqlash → tasniflash → yuborish. */
    const runDetectionCycle = (): void => {
      const video = videoRefHolder.current;
      if (!video) {
        return;
      }
      void detectRef.current(video).then((faces) => {
        if (cancelled) {
          return;
        }
        const result = classifyFaceDetection(faces);
        const type = faceResultToEventType(result);
        sendEvent.current({
          assessmentId: assessmentIdRef.current,
          type,
          faceCount: faces.length,
          timestamp: Date.now(),
        });
        setLastEventType(type);
        setHasWarning(isViolation(result));
      });
    };

    // Aniqlash siklini throttle bilan o'raymiz — ketma-ket chaqiruvlar kamida
    // `intervalMs` ga ajratiladi (Req 8.3, design Property 9).
    const throttledCycle = throttle(runDetectionCycle, intervalMs);

    /** Tab almashtirishni "tab_switch" hodisasi sifatida yuboradi (Req 8.5). */
    const reportTabSwitch = (): void => {
      const now = Date.now();
      // `blur` + `visibilitychange` birga kelsa ikki marta yubormaymiz.
      if (now - lastTabSwitchAt < TAB_SWITCH_DEDUP_MS) {
        return;
      }
      lastTabSwitchAt = now;
      sendEvent.current({
        assessmentId: assessmentIdRef.current,
        type: "tab_switch",
        faceCount: 0,
        timestamp: now,
      });
      setLastEventType("tab_switch");
    };

    const handleVisibilityChange = (): void => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        reportTabSwitch();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("blur", reportTabSwitch);
    }

    // Modellarni yuklab, aniqlash intervalini ishga tushiramiz. Test rejimida
    // (detektor kiritilganda) yuklash baribir xavfsiz `false`/`true` qaytaradi,
    // shu sababli detektor mavjud bo'lsa aniqlashni boshlaymiz.
    void loadFaceApiModels(modelUrl).then((loaded) => {
      if (cancelled) {
        return;
      }
      const canDetect = loaded || detector !== undefined;
      setReady(canDetect);
      if (!canDetect) {
        return;
      }
      // Birinchi aniqlash darhol (leading edge), keyin har `intervalMs` da.
      throttledCycle();
      intervalId = setInterval(() => {
        throttledCycle();
      }, intervalMs);
    });

    return () => {
      cancelled = true;
      throttledCycle.cancel();
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("blur", reportTabSwitch);
      }
      setHasWarning(false);
    };
    // `detector` va `modelUrl` o'zgarganda effekt qayta ulanadi.
  }, [active, intervalMs, modelUrl, detector, videoRefHolder]);

  return { ready, lastEventType, hasWarning };
}

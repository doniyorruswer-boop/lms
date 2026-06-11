// Yuz klassifikatsiya natijasini proktoring hodisa turiga aylantiruvchi toza
// helper (Req 8.4).
//
// `classifyFaceDetection` (classify.ts) natijasi UI uchun mo'ljallangan
// uchta holatni qaytaradi (`face_missing` | `face_ok` | `multi_face`). Backend
// esa `ProctoringEventType` (`ok` | `violation` | `tab_switch`) ni kutadi.
// Bu modul ikkalasi o'rtasidagi deterministik bog'lovchi vazifasini bajaradi:
// - `face_ok`     → `ok`        (qoidabuzarlik yo'q)
// - `face_missing`→ `violation` (kadrda yuz yo'q)
// - `multi_face`  → `violation` (bir nechta yuz)

import type { ProctoringEventType } from "@/shared/types";

import type { FaceDetectionResult } from "./classify";

/**
 * Yuz klassifikatsiya natijasini backend `ProctoringEventType` ga aylantiradi.
 * Faqat `face_ok` "ok" hisoblanadi; qolgan barcha holatlar "violation".
 */
export function faceResultToEventType(
  result: FaceDetectionResult,
): Extract<ProctoringEventType, "ok" | "violation"> {
  return result === "face_ok" ? "ok" : "violation";
}

/**
 * Yuz klassifikatsiya natijasi qoidabuzarlik (violation) ekanligini bildiradi.
 * Talabaga ko'rinadigan ogohlantirish ko'rsatish uchun ishlatiladi (Req 8.4).
 */
export function isViolation(result: FaceDetectionResult): boolean {
  return result !== "face_ok";
}

/**
 * Yuz aniqlash klassifikatori.
 *
 * Property 16: Aniqlangan yuzlar sonini deterministik tarzda proktoring
 * hodisasiga klassifikatsiya qiladi.
 * - 0 ta yuz  → 'face_missing'
 * - 1 ta yuz  → 'face_ok'
 * - >= 2 yuz  → 'multi_face'
 *
 * Validates: Requirements 8.4
 */

export type FaceDetectionResult = "face_missing" | "face_ok" | "multi_face";

/**
 * Aniqlangan yuzlar massivini proktoring natijasiga klassifikatsiya qiladi.
 *
 * Mapping faqat massiv uzunligiga bog'liq, shu sababli to'liq va deterministik.
 *
 * @param faces - Aniqlangan yuzlar massivi (har qanday element turi).
 * @returns Klassifikatsiya natijasi.
 */
export function classifyFaceDetection(
  faces: readonly unknown[],
): FaceDetectionResult {
  const count = faces.length;

  if (count === 0) {
    return "face_missing";
  }

  if (count === 1) {
    return "face_ok";
  }

  return "multi_face";
}

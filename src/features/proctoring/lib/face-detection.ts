// face-api.js bilan yuzni aniqlash adapteri (Req 8.3).
//
// face-api.js faqat brauzer muhitida (HTMLVideoElement, WebGL) ishlaydi va
// model fayllarini tarmoqdan yuklaydi. Test muhitida (jsdom) yoki modellar
// mavjud bo'lmaganda ilova ishdan chiqmasligi uchun:
//  - kutubxona DINAMIK import qilinadi (top-level import yo'q), shu sababli
//    modulni import qilish hech qachon brauzer API lariga tegmaydi;
//  - barcha chaqiruvlar try/catch bilan o'raladi va xavfsiz qiymat qaytaradi.
//
// Aniqlash natijasi `classifyFaceDetection` (classify.ts) ga uzatiladigan
// massiv sifatida qaytariladi — bizga faqat uzunlik (yuzlar soni) muhim.

/** TinyFaceDetector modellari joylashgan standart URL (public/models). */
export const DEFAULT_MODEL_URL = "/models";

/** Bir marta yuklangach qayta yuklanmasligi uchun modul darajasidagi bayroq. */
let modelsLoaded = false;

/** Test izolyatsiyasi uchun yuklash holatini tiklash. */
export function resetFaceApiModels(): void {
  modelsLoaded = false;
}

/**
 * TinyFaceDetector modelini yuklaydi. Muvaffaqiyatda `true`, aks holda (muhit
 * qo'llab-quvvatlamasa yoki yuklash muvaffaqiyatsiz bo'lsa) `false` qaytaradi —
 * chaqiruvchi tomon shunga qarab proktoringni xavfsiz tarzda o'chirib qo'yishi
 * mumkin.
 */
export async function loadFaceApiModels(
  modelUrl: string = DEFAULT_MODEL_URL,
): Promise<boolean> {
  if (modelsLoaded) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const faceapi = await import("face-api.js");
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    modelsLoaded = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Berilgan video elementidagi yuzlarni aniqlaydi va aniqlangan yuzlar massivini
 * qaytaradi. Har qanday xatoda bo'sh massiv qaytaradi (xavfsiz default).
 *
 * @returns Aniqlangan yuzlar massivi (`classifyFaceDetection` ga uzatiladi).
 */
export async function detectFaces(
  video: HTMLVideoElement,
): Promise<readonly unknown[]> {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const faceapi = await import("face-api.js");
    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions(),
    );
    return detections;
  } catch {
    return [];
  }
}

/**
 * Proktoring detektori funksiyasining turi. `useProctoring` hookiga test
 * paytida soxta (fake) detektor kiritish imkonini beradi.
 */
export type FaceDetector = (
  video: HTMLVideoElement,
) => Promise<readonly unknown[]>;

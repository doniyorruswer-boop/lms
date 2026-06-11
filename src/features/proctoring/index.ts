// Proktoring moduli (Req 8) uchun ommaviy eksportlar.

// Komponentlar
export { ProctoringPanel } from "./components/proctoring-panel";
export type { ProctoringPanelProps } from "./components/proctoring-panel";
export { CameraPreview } from "./components/camera-preview";
export type { CameraPreviewProps } from "./components/camera-preview";

// Hooklar
export {
  useCameraPermission,
  type CameraPermissionState,
  type UseCameraPermissionResult,
} from "./hooks/use-camera-permission";
export {
  useProctoring,
  DETECTION_INTERVAL_MS,
  TAB_SWITCH_DEDUP_MS,
  type UseProctoringOptions,
  type UseProctoringResult,
} from "./hooks/use-proctoring";

// Toza logika
export {
  classifyFaceDetection,
  type FaceDetectionResult,
} from "./lib/classify";
export { faceResultToEventType, isViolation } from "./lib/event-mapper";
export {
  loadFaceApiModels,
  detectFaces,
  resetFaceApiModels,
  DEFAULT_MODEL_URL,
  type FaceDetector,
} from "./lib/face-detection";

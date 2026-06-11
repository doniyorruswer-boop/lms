// Test_Module (Test_Module) feature uchun ommaviy (public) eksportlar.

export { TestSession, AUTOSAVE_DEBOUNCE_MS } from './components/test-session'
export type { TestSessionProps } from './components/test-session'
export {
  useTestSession,
  useSubmitTest,
  saveAnswers,
  testSessionQueryKey,
  type TestSession as TestSessionData,
  type SaveAnswersPayload,
} from './api/use-test-session'

// Toza logika (oldindan implementatsiya qilingan, PBT bilan qoplanadi).
export { computeRemainingMs } from './lib/timer'
export { ReplayQueue, type AnswerSender } from './lib/replay-queue'

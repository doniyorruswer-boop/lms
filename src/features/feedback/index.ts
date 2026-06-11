// Feedback (Shikoyat) feature exports.
//
// Bu modul talaba shikoyat sistemining barcha komponentlarini eksport qiladi:
// - FeedbackPage: Asosiy sahifa (form + tarix)
// - FeedbackForm: Yangi shikoyat yuborish formasi
// - FeedbackHistory: Shikoyatlar tarixi
// - API hooks: useCreateFeedback, useFeedbackHistory

export { FeedbackPage } from './components/feedback-page'
export { FeedbackForm } from './components/feedback-form'
export { FeedbackHistory } from './components/feedback-history'

export { useCreateFeedback } from './api/use-feedback-mutations'
export { useFeedbackHistory, useFeedbackDetail } from './api/use-feedback-history'

export type { CreateFeedbackPayload } from './api/use-feedback-mutations'
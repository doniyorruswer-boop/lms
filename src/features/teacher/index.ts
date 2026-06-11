// Teacher_Panel feature uchun ommaviy (public) eksportlar.

// Komponentlar
export { TeacherDashboard } from './components/teacher-dashboard'
export { TeacherCourseDetail } from './components/teacher-course-detail'
export { NewLessonForm } from './components/new-lesson-form'
export { NewAssessmentForm } from './components/new-assessment-form'
export { AssessmentGrading } from './components/assessment-grading'
export { GradeSubmission } from './components/grade-submission'

// API hooklari
export {
  useTeacherDashboard,
  TEACHER_DASHBOARD_QUERY_KEY,
  type TeacherDashboardData,
} from './api/use-teacher-dashboard'
export {
  useTeacherCourseDetail,
  teacherCourseDetailQueryKey,
  type TeacherCourseDetailData,
  type CourseStudent,
} from './api/use-teacher-course-detail'
export {
  useSubmissions,
  submissionsQueryKey,
} from './api/use-submissions'
export {
  useCreateLesson,
  useCreateAssessment,
  useGradeSubmission,
  type CreateLessonPayload,
  type CreateAssessmentPayload,
  type GradeSubmissionPayload,
} from './api/use-teacher-mutations'
export type { Submission } from './api/types'

// Sxemalar (Zod)
export { lessonSchema, type LessonFormValues } from './lib/lesson-schema'
export {
  assessmentSchema,
  assessmentQuestionSchema,
  type AssessmentFormValues,
} from './lib/assessment-schema'
export { createGradeSchema, type GradeFormValues } from './lib/grade-schema'

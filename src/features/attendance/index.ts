// Attendance_Module feature uchun ommaviy (public) eksportlar.

// Komponentlar
export {
  AttendanceCheckIn,
  type AttendanceCheckInProps,
} from './components/attendance-check-in'
export {
  AttendanceHistory,
  AttendanceHistoryTable,
} from './components/attendance-history'
export {
  CourseAttendance,
  LessonAttendanceTable,
  type CourseAttendanceProps,
} from './components/course-attendance'

// API hooklari
export {
  useCheckIn,
  useCheckOut,
  type AttendanceCheckPayload,
} from './api/use-attendance-mutations'
export {
  useAttendanceHistory,
  ATTENDANCE_HISTORY_QUERY_KEY,
} from './api/use-attendance-history'
export {
  useCourseAttendance,
  courseAttendanceQueryKey,
  type CourseAttendanceStudent,
  type LessonAttendance,
} from './api/use-course-attendance'

// Toza logika
export {
  attendanceTransition,
  type AttendanceState,
  type AttendanceAction,
  type AttendanceTransitionResult,
} from './lib/state-machine'
export { isLessonStarted } from './lib/lesson-timing'
export { formatClockTime, formatDate, EMPTY_PLACEHOLDER } from './lib/format-time'

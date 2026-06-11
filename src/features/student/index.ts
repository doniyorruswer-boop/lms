// Student_Panel feature uchun ommaviy (public) eksportlar.

export { StudentDashboard } from './components/student-dashboard'
export { StudentCourses } from './components/student-courses'
export { CourseDetail } from './components/course-detail'
export {
  useStudentDashboard,
  STUDENT_DASHBOARD_QUERY_KEY,
  type StudentDashboardData,
} from './api/use-student-dashboard'
export {
  useStudentCourses,
  studentCoursesQueryKey,
  STUDENT_COURSES_PAGE_SIZE,
} from './api/use-student-courses'
export {
  useCourseDetail,
  courseDetailQueryKey,
  type CourseDetailData,
} from './api/use-course-detail'
export { computeAttendancePercent } from './lib/attendance-percent'

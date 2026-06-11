// Ilova marshrut konfiguratsiyasi va RBAC guard (Req 2.7, 2.8, 18.x).
//
// Marshrutlar deklarativ `createBrowserRouter` konfiguratsiyasi orqali
// e'lon qilinadi. Himoyalangan panellar `ProtectedRoute` guardi ostiga
// joylashtiriladi:
//   - JWT_Token mavjud bo'lmasa → `buildLoginUrl(currentPath)` bilan
//     login sahifasiga yo'naltiriladi va boshlang'ich URL `redirect`
//     parametrida saqlanadi (Req 2.7).
//   - Token mavjud, ammo joriy rol marshrutga ruxsat etilmagan bo'lsa
//     (`isRouteAllowed`) → `/forbidden` (403) sahifasiga yo'naltiriladi
//     (Req 2.6).
//
// Guard butun kirish logikasini `shared/auth/rbac.ts` va
// `shared/auth/redirect.ts` dagi toza funksiyalarga topshiradi — imperativ
// tekshiruvlar bu yerda tarqalmaydi.
//
// Barcha majburiy LMS komponentlari (Req 18) rolga qarab shu daraxtga
// ulanadi: kurs katalogi, o'quv materiallari (video/PDF/SCORM), baholash,
// davomat, kommunikatsiya (bildirishnoma + shikoyat), hisobotlar va
// sertifikatlash. ErrorBoundary app va panel darajasida render xatolarini
// ushlaydi.

import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";

import { LoginRoute, OneIDCallback } from "@/features/auth";
import { CertificatesPage } from "@/features/certificates";
import { ComplaintsPage } from "@/features/complaints";
import { HemisSyncPage } from "@/features/admin/hemis-sync";
import { AdminCourses, AdminUsers } from "@/features/admin";
import { MonitoringDashboard } from "@/features/monitoring";
import { ReportsPage } from "@/features/reports";
import { CourseDetail, StudentCourses, StudentDashboard } from "@/features/student";
import {
  AssessmentGrading,
  TeacherCourseDetail,
  TeacherDashboard,
} from "@/features/teacher";
import { isRouteAllowed, startPathForRole } from "@/shared/auth/rbac";
import { buildLoginUrl } from "@/shared/auth/redirect";
import { tokenStorage } from "@/shared/auth/token-storage";
import { ForbiddenPage } from "@/shared/components/forbidden-page";
import { ProtectedLayout, PublicLayout } from "@/shared/components/layout";
import { useAuthStore } from "@/shared/store/auth-store";

import { ErrorBoundary } from "./error-boundary";
import {
  AdminDashboardPage,
  MaterialViewerPage,
  StudentAttendancePage,
  StudentTestPage,
  StudentTestsPage,
  TeacherAttendancePage,
  TeacherCourseAttendancePage,
  TeacherCoursesPage,
  TeacherGradingPage,
} from "./pages";

/**
 * RBAC guard. Himoyalangan marshrut daraxtining ildizida joylashadi va
 * har bir navigatsiyada kirishni tekshiradi (Req 2.6, 2.7, 2.8).
 *
 * Tekshiruv tartibi:
 *   1. Access token yo'q bo'lsa → login URL ga yo'naltirish (joriy path
 *      `redirect` parametrida saqlanadi).
 *   2. Token bor, ammo rol joriy path uchun ruxsat etilmagan bo'lsa →
 *      `/forbidden` sahifasiga yo'naltirish.
 *   3. Aks holda → ichki marshrutni (`<Outlet />`) render qilish.
 */
export function ProtectedRoute() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const token = tokenStorage.getAccessToken();
  if (!token) {
    const currentPath = `${location.pathname}${location.search}`;
    return <Navigate to={buildLoginUrl(currentPath)} replace />;
  }

  if (!user || !isRouteAllowed(location.pathname, user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

/**
 * Ildiz (`/`) yo'nalishi: token bo'lsa rolga mos boshlang'ich panelga,
 * aks holda login sahifasiga yo'naltiradi (Req 2.2–2.5, 2.7).
 */
function RootRedirect() {
  const user = useAuthStore((state) => state.user);
  const token = tokenStorage.getAccessToken();

  if (!token || !user) {
    return <Navigate to={buildLoginUrl("/")} replace />;
  }

  return <Navigate to={startPathForRole(user.role)} replace />;
}

/**
 * Panel darajasidagi ErrorBoundary bilan o'ralgan layout. Bitta feature
 * sahifasidagi render xatosi butun panelni (Header/Sidebar) buzmaydi —
 * foydalanuvchi navigatsiyani saqlab qoladi (Req 18, 21.5).
 */
function ProtectedLayoutWithBoundary() {
  return (
    <ProtectedLayout>
      <ErrorBoundary level="panel">
        <Outlet />
      </ErrorBoundary>
    </ProtectedLayout>
  );
}

function NotFoundPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">Sahifa topilmadi.</p>
    </section>
  );
}

/**
 * Ilova marshrut konfiguratsiyasi (Req 2.8, 18.x).
 *
 * Tuzilishi:
 *   - PublicLayout      → autentifikatsiyasiz sahifalar (/login)
 *   - ProtectedRoute    → RBAC guard
 *       └── ProtectedLayout (+ panel ErrorBoundary) → Header + Sidebar + Outlet
 *             ├── /student/...     (catalog, materiallar, test, davomat,
 *             │                      sertifikat, shikoyat)
 *             ├── /teacher/...     (kurslar, baholash, davomat)
 *             ├── /admin/...       (users, courses, reports, complaints, sync)
 *             └── /monitoring/...  (monitoring, reports, complaints)
 *   - /forbidden        → 403 sahifasi
 *   - *                 → 404 sahifasi
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    element: <PublicLayout />,
    children: [
      { path: "/login", element: <LoginRoute /> },
      { path: "/auth/oneid/callback", element: <OneIDCallback /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ProtectedLayoutWithBoundary />,
        children: [
          // --- Talaba paneli (STUDENT) -----------------------------------
          { path: "/student/dashboard", element: <StudentDashboard /> },
          { path: "/student/courses", element: <StudentCourses /> },
          { path: "/student/courses/:courseId", element: <CourseDetail /> },
          { path: "/student/materials", element: <MaterialViewerPage /> },
          { path: "/student/tests", element: <StudentTestsPage /> },
          { path: "/student/tests/:assessmentId", element: <StudentTestPage /> },
          { path: "/student/attendance", element: <StudentAttendancePage /> },
          { path: "/student/certificates", element: <CertificatesPage /> },
          { path: "/student/complaints", element: <ComplaintsPage /> },

          // --- O'qituvchi paneli (TEACHER) -------------------------------
          { path: "/teacher/dashboard", element: <TeacherDashboard /> },
          { path: "/teacher/courses", element: <TeacherCoursesPage /> },
          { path: "/teacher/courses/:courseId", element: <TeacherCourseDetail /> },
          {
            path: "/teacher/courses/:courseId/attendance",
            element: <TeacherCourseAttendancePage />,
          },
          { path: "/teacher/grading", element: <TeacherGradingPage /> },
          {
            path: "/teacher/assessments/:assessmentId/grade",
            element: <AssessmentGrading />,
          },
          { path: "/teacher/attendance", element: <TeacherAttendancePage /> },

          // --- Administrator paneli (OTM_ADMIN, DEKAN) -------------------
          { path: "/admin/dashboard", element: <AdminDashboardPage /> },
          { path: "/admin/users", element: <AdminUsers /> },
          { path: "/admin/courses", element: <AdminCourses /> },
          { path: "/admin/reports", element: <ReportsPage /> },
          { path: "/admin/complaints", element: <ComplaintsPage /> },
          { path: "/admin/sync", element: <HemisSyncPage /> },

          // --- Monitoring paneli (SUPER_ADMIN) ---------------------------
          { path: "/monitoring/dashboard", element: <MonitoringDashboard /> },
          { path: "/monitoring/reports", element: <ReportsPage /> },
          { path: "/monitoring/complaints", element: <ComplaintsPage /> },
        ],
      },
    ],
  },
  { path: "/forbidden", element: <ForbiddenPage /> },
  { path: "*", element: <NotFoundPage /> },
]);

export default router;

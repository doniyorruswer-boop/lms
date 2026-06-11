// O'qituvchi kurslari uchun umumiy hub komponenti (Req 18.1, 18.3, 18.4).
//
// O'qituvchining faol kurslarini (`useTeacherDashboard`) ro'yxat sifatida
// ko'rsatadi; har bir kurs sozlanadigan `linkFor(courseId)` orqali tegishli
// sahifaga (kurs tafsiloti, baholash yoki davomat) yo'naltiriladi. Shu tarzda
// bitta komponent uchta navigatsiya bo'limini (kurslar, baholash, davomat)
// ta'minlaydi — kod takrorlanmaydi.

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AlertCircle, BookOpen, ChevronRight } from "lucide-react";

import { useTeacherDashboard } from "@/features/teacher";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export interface TeacherCourseHubProps {
  /** Sahifa sarlavhasi (tarjima qilingan). */
  title: string;
  /** Sahifa tavsifi (tarjima qilingan). */
  description?: string;
  /** Kurs uchun navigatsiya manzilini quradi. */
  linkFor: (courseId: string) => string;
}

/**
 * Faol kurslarni ro'yxatlab, har birini berilgan manzilga ulaydigan hub.
 */
export function TeacherCourseHub({
  title,
  description,
  linkFor,
}: TeacherCourseHubProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useTeacherDashboard();

  return (
    <main className="space-y-6 p-6" aria-labelledby="teacher-hub-title">
      <div className="space-y-1">
        <h1 id="teacher-hub-title" className="text-2xl font-bold">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {isLoading ? (
        <div
          className="space-y-3"
          role="status"
          aria-busy="true"
          aria-label={t("common.loading")}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError || !data ? (
        <Card role="alert" className="border-destructive">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
            <CardTitle className="text-lg text-destructive">
              {t("teacher.dashboard.errorTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void refetch()} variant="outline">
              {t("teacher.dashboard.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : data.activeCourses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("teacher.dashboard.noCourses")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.activeCourses.map((course) => (
            <li key={course.id}>
              <Link
                to={linkFor(course.id)}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-3">
                  <BookOpen className="size-5 text-primary" aria-hidden="true" />
                  <span className="font-medium">{course.title}</span>
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default TeacherCourseHub;

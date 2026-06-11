// Talaba — testlar/baholashlar ro'yxati sahifasi (Req 18.3).
//
// Talabaning yaqinlashayotgan baholashlarini (`useStudentDashboard`) ro'yxat
// sifatida ko'rsatadi; har bir baholash "Boshlash" havolasi orqali test
// topshirish sahifasiga (`/student/tests/:assessmentId`) yo'naltiriladi.

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AlertCircle, FileText } from "lucide-react";

import { useStudentDashboard } from "@/features/student";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

/**
 * Talabaning baholashlari ro'yxati va test topshirishga o'tish nuqtasi.
 */
export function StudentTestsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useStudentDashboard();

  return (
    <main className="space-y-6 p-6" aria-labelledby="student-tests-title">
      <h1 id="student-tests-title" className="text-2xl font-bold">
        {t("nav.tests")}
      </h1>

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
              {t("student.dashboard.errorTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void refetch()} variant="outline">
              {t("student.dashboard.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : data.upcomingAssessments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("student.dashboard.noAssessments")}
        </p>
      ) : (
        <ul className="space-y-3">
          {data.upcomingAssessments.map((assessment) => (
            <li
              key={assessment.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="flex items-center gap-3">
                <FileText className="size-5 text-primary" aria-hidden="true" />
                <span className="font-medium">{assessment.title}</span>
              </span>
              <Button asChild size="sm">
                <Link to={`/student/tests/${assessment.id}`}>
                  {t("test.start", "Boshlash")}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default StudentTestsPage;

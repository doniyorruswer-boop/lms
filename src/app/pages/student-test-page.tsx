// Talaba test topshirish sahifasi (Req 18.3; 7.x, 8.x).
//
// Route paramidan `assessmentId` ni oladi va test oqimini ikki bosqichda
// boshqaradi:
//   1. Proktoring: kamera ruxsati va preview (`ProctoringPanel`); talaba
//      tayyorligini tasdiqlagach (`onReady`) testga o'tiladi (Req 8.1, 8.2, 8.6).
//   2. Test sessiyasi: `TestSession` — savollar, taymer, avtosaqlash (Req 7.x).
//
// Shu yo'l bilan proktoring paneli va test sessiyasi marshrutga ulanadi.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { ProctoringPanel } from "@/features/proctoring";
import { TestSession } from "@/features/test-taking";

/**
 * Proktoring tekshiruvidan so'ng test sessiyasini ko'rsatuvchi sahifa.
 */
export function StudentTestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { assessmentId = "" } = useParams<{ assessmentId: string }>();
  const [ready, setReady] = useState(false);

  return (
    <main className="space-y-6 p-6" aria-labelledby="student-test-title">
      <h1 id="student-test-title" className="text-2xl font-bold">
        {t("test.pageTitle", "Test topshirish")}
      </h1>

      {ready ? (
        <TestSession
          assessmentId={assessmentId}
          onCompleted={() => navigate("/student/tests")}
        />
      ) : (
        <ProctoringPanel
          assessmentId={assessmentId}
          onReady={() => setReady(true)}
        />
      )}
    </main>
  );
}

export default StudentTestPage;

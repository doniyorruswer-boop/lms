// Talaba — davomat sahifasi (Req 18.4; 9.4).
//
// Talabaning davomat tarixini (`AttendanceHistory`) ko'rsatadi.

import { useTranslation } from "react-i18next";

import { AttendanceHistory } from "@/features/attendance";

/**
 * Talaba davomat tarixi sahifasi.
 */
export function StudentAttendancePage() {
  const { t } = useTranslation();
  return (
    <main className="space-y-6 p-6" aria-labelledby="student-attendance-title">
      <h1 id="student-attendance-title" className="text-2xl font-bold">
        {t("nav.attendance")}
      </h1>
      <AttendanceHistory />
    </main>
  );
}

export default StudentAttendancePage;

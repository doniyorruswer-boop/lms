// O'quv materiallari ko'rgich sahifasi (Req 18.2).
//
// Kurs tafsilotidagi materiallar ro'yxatidan ochiladi. Material turi va manbai
// URL query parametrlari orqali uzatiladi (`type`, `url`, `title`, `lessonId`)
// va turga qarab tegishli pleyer renderlanadi:
//   - VIDEO → `VideoPlayer` (HLS.js)
//   - PDF   → `PdfViewer` (react-pdf)
//   - SCORM → `ScormPlayer` (iframe + API shim)
//
// Shu yo'l bilan uchala o'quv-materiali pleyeri marshrutga ulanadi (orfan
// kod qolmaydi).

import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { PdfViewer } from "@/features/pdf";
import { ScormPlayer } from "@/features/scorm";
import { VideoPlayer } from "@/features/video";
import { Button } from "@/shared/ui/button";

type MaterialType = "VIDEO" | "PDF" | "SCORM";

/**
 * URL query parametrlariga ko'ra tegishli o'quv-materiali pleyerini ko'rsatadi.
 */
export function MaterialViewerPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const type = (params.get("type") ?? "").toUpperCase() as MaterialType;
  const url = params.get("url") ?? "";
  const title = params.get("title") ?? t("material.untitled", "Material");
  const lessonId = params.get("lessonId") ?? "";

  return (
    <main className="space-y-4 p-6" aria-labelledby="material-viewer-title">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 size-4" aria-hidden="true" />
          {t("buttons.back")}
        </Button>
        <h1 id="material-viewer-title" className="text-2xl font-bold">
          {title}
        </h1>
      </div>

      {!url ? (
        <p className="text-sm text-muted-foreground">
          {t("material.missing", "Material manbai topilmadi.")}
        </p>
      ) : type === "VIDEO" ? (
        <VideoPlayer src={url} lessonId={lessonId} />
      ) : type === "PDF" ? (
        <PdfViewer file={url} title={title} />
      ) : type === "SCORM" ? (
        <ScormPlayer src={url} title={title} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("material.unsupported", "Material turi qo'llab-quvvatlanmaydi.")}
        </p>
      )}
    </main>
  );
}

export default MaterialViewerPage;

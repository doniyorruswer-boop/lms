// PDF_Viewer komponenti (Req 5.1, 5.2, 5.3).
//
// react-pdf (pdf.js) yordamida PDF hujjatlarni brauzerda sahifa-sahifa
// ko'rsatadi. Boshqaruvlar: oldingi/keyingi sahifa, sahifaga o'tish, zoom
// in/out, to'liq ekran va hujjat ichida matn qidirish.
//
// Sahifa navigatsiyasi `clampPage(page, total)` (src/shared/lib/media.ts)
// toza funksiyasiga tayanadi — sahifa raqami hech qachon `[1, total]`
// oralig'idan chiqmaydi (Req 5.2, Property 8).
//
// Yuklanmagan/buzilgan fayl uchun xato holati + alternativ yuklab olish
// havolasi (Req 5.4): Document yuklashda xato bersa (`onLoadError`), boshqaruv
// paneli o'rniga xato xabari va — manba URL mavjud bo'lsa — to'g'ridan-to'g'ri
// yuklab olish havolasi ko'rsatiladi.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileWarning,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import { clampPage } from '@/shared/lib/media'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

// pdf.js worker ni ro'yxatdan o'tkazadi (nojiy ta'sirli import).
import './lib/pdf-worker'

/** Zoom chegaralari va qadami. */
const MIN_SCALE = 0.5
const MAX_SCALE = 3
const SCALE_STEP = 0.25

export interface PdfViewerProps {
  /** PDF manbai — URL string yoki react-pdf qo'llab-quvvatlaydigan obyekt. */
  file: string | { url: string } | { data: Uint8Array }
  /** Ixtiyoriy: maxsus til/qulaylik uchun hujjat sarlavhasi. */
  title?: string
  /**
   * Alternativ yuklab olish havolasi uchun URL (Req 5.4). Berilmasa,
   * `file` string yoki `{ url }` ko'rinishida bo'lsa undan olinadi; `{ data }`
   * manbalari uchun esa yuklab olish havolasi ko'rsatilmaydi.
   */
  downloadUrl?: string
  /**
   * Yuklash xatosi callback i (Req 5.4). Komponent ichki xato holatini
   * ko'rsatishdan tashqari, bu callback ni ham chaqiradi.
   */
  onLoadError?: (error: Error) => void
}

/**
 * `file` proppidan yuklab olish uchun URL ni ajratib oladi (mavjud bo'lsa).
 * `{ data: Uint8Array }` manbalari uchun URL bo'lmaydi.
 */
function resolveDownloadUrl(
  file: PdfViewerProps['file'],
  explicit?: string
): string | null {
  if (explicit) {
    return explicit
  }
  if (typeof file === 'string') {
    return file
  }
  if (file && typeof file === 'object' && 'url' in file) {
    return file.url
  }
  return null
}

/**
 * PDF hujjatni sahifa-sahifa ko'rsatuvchi va navigatsiya/zoom/qidiruv
 * boshqaruvlarini taqdim etuvchi komponent (Req 5.1–5.3).
 */
export function PdfViewer({
  file,
  title,
  downloadUrl,
  onLoadError,
}: PdfViewerProps) {
  const { t } = useTranslation()

  const containerRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Document yuklashda xato yuz berganini kuzatamiz (Req 5.4).
  const [hasError, setHasError] = useState(false)

  // Yuklab olish havolasi uchun URL (mavjud bo'lsa).
  const resolvedDownloadUrl = useMemo(
    () => resolveDownloadUrl(file, downloadUrl),
    [file, downloadUrl]
  )

  // Manba o'zgarsa xato holatini tiklaymiz, shunda Document qayta yuklanadi.
  // Boshlang'ich render da tiklamaymiz — aks holda mount paytida kelgan
  // `onLoadError` (child effect) darhol bekor qilinardi (parent effect).
  const isInitialRender = useRef(true)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }
    setHasError(false)
  }, [file])

  const handleLoadError = useCallback(
    (error: Error) => {
      setHasError(true)
      onLoadError?.(error)
    },
    [onLoadError]
  )

  // Hujjat tashqaridan to'liq ekranga o'tkazilganini kuzatib boramiz.
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const goToPage = useCallback(
    (target: number) => {
      // Sahifa raqami har doim [1, numPages] oralig'iga clamp qilinadi (Req 5.2).
      setPageNumber(clampPage(target, numPages))
    },
    [numPages]
  )

  const handlePageInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      if (Number.isNaN(value)) {
        return
      }
      goToPage(value)
    },
    [goToPage]
  )

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(MAX_SCALE, prev + SCALE_STEP))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(MIN_SCALE, prev - SCALE_STEP))
  }, [])

  const toggleFullscreen = useCallback(() => {
    const element = containerRef.current
    if (!element) {
      return
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void element.requestFullscreen()
    }
  }, [])

  // Matn qidiruv: mos kelgan qismlarni `<mark>` bilan ajratib ko'rsatadi (Req 5.3).
  const highlightMatches = useCallback(
    (text: string): string => {
      const query = searchText.trim()
      if (!query) {
        return text
      }
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escaped})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    },
    [searchText]
  )

  const isFirstPage = pageNumber <= 1
  const isLastPage = numPages === 0 || pageNumber >= numPages

  // Xato holati (Req 5.4): boshqaruvlar va hujjat o'rniga xato xabari hamda
  // — manba URL mavjud bo'lsa — alternativ yuklab olish havolasi ko'rsatiladi.
  if (hasError) {
    return (
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-center gap-4 bg-background p-8 text-center"
        role="alert"
      >
        <FileWarning className="size-10 text-destructive" aria-hidden="true" />
        <p className="text-base font-medium">{t('pdf.error')}</p>
        {resolvedDownloadUrl ? (
          <Button asChild variant="outline">
            <a
              href={resolvedDownloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download aria-hidden="true" />
              {t('pdf.download')}
            </a>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-3 bg-background p-3">
      {/* Boshqaruvlar paneli */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={isFirstPage}
            aria-label={t('pdf.previousPage')}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={isLastPage}
            aria-label={t('pdf.nextPage')}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={numPages || 1}
            value={pageNumber}
            onChange={handlePageInputChange}
            aria-label={t('pdf.goToPage')}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">
            {t('pdf.pageInfo', { current: pageNumber, total: numPages })}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            aria-label={t('pdf.zoomOut')}
          >
            <ZoomOut />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            aria-label={t('pdf.zoomIn')}
          >
            <ZoomIn />
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          aria-label={
            isFullscreen ? t('pdf.exitFullscreen') : t('pdf.enterFullscreen')
          }
        >
          {isFullscreen ? <Minimize /> : <Maximize />}
        </Button>

        <Input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={t('pdf.searchPlaceholder')}
          aria-label={t('pdf.searchPlaceholder')}
          className="w-48"
        />
      </div>

      {/* Hujjat — bir vaqtning o'zida bitta sahifa render qilinadi (Req 5.1). */}
      <div className="flex justify-center overflow-auto">
        <Document
          file={file}
          onLoadSuccess={(pdf) => {
            setNumPages(pdf.numPages)
            setPageNumber((prev) => clampPage(prev, pdf.numPages))
          }}
          onLoadError={handleLoadError}
          loading={
            <p className="p-6 text-muted-foreground">{t('pdf.loading')}</p>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            customTextRenderer={(textItem) => highlightMatches(textItem.str)}
            loading={
              <p className="p-6 text-muted-foreground">{t('pdf.loading')}</p>
            }
            aria-label={title}
          />
        </Document>
      </div>
    </div>
  )
}

export default PdfViewer

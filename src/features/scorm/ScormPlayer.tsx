// SCORM_Player komponenti (Req 6.1–6.5).
//
// SCORM 1.2 / 2004 paketini iframe ichida yuklaydi. Iframe manbasi (`src`)
// o'rnatilishidan OLDIN `window.API` (1.2) va `window.API_1484_11` (2004)
// global obyektlari e'lon qilinadi va `ScormBridge` ga ulanadi (Req 6.1, 6.2) —
// shunda iframe ichidagi paket yuklanganda run-time API ni topa oladi.
//
// xAPI oqimi (Req 6.3, 6.4):
//   - Paket status kalitini (`cmi.core.lesson_status` / `cmi.completion_status`)
//     o'zgartirganda `mapScormStatusToXapi` orqali xAPI hodisasi POST qilinadi
//     (status o'zgarishi — `createScormShim` da ushlanadi).
//   - `ScormBridge.onCommit` (commit va finish da chaqiriladi) yakuniy holatni
//     to'liq snapshot bilan POST qiladi.
//   - Talaba darsdan chiqqanda (unmount) `LMSCommit` + `LMSFinish` bajariladi va
//     yakuniy holat backendga yuboriladi.
//
// Xato holati (Req 6.5): paket yuklanmasa, xato xabari va texnik yordamga
// murojaat havolasi ko'rsatiladi.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

import {
  ScormBridge,
  type CommitHandler,
  type ScormVersion,
} from './lib/bridge'
import { createScormShim, extractStatus } from './lib/scorm-shim'
import { postScormXapi } from './lib/xapi-post'

/** Texnik yordam havolasi uchun zaxira (default) manzil (Req 6.5). */
const DEFAULT_SUPPORT_URL = 'mailto:support@lms.uz'

export interface ScormPlayerProps {
  /** SCORM paketini ishga tushirish (launch) URL — iframe ichida yuklanadi. */
  src: string
  /** Paket targetlagan SCORM standarti. Default: `"1.2"`. */
  version?: ScormVersion
  /** SCORM urinish (attempt) identifikatori — xAPI statement-ga qo'shiladi. */
  attemptId?: string
  /** Paket yuklanmaganda ko'rsatiladigan texnik yordam havolasi (Req 6.5). */
  supportUrl?: string
  /** Iframe uchun qulaylik sarlavhasi. */
  title?: string
  /** Tashqi konteyner uchun qo'shimcha CSS klasslar. */
  className?: string
}

/**
 * SCORM paketini iframe ichida ijro etuvchi va run-time API shim ni ulaydigan
 * komponent. Global API obyektlari iframe `src` o'rnatilishidan oldin
 * e'lon qilinadi (ref + effect).
 */
export function ScormPlayer({
  src,
  version = '1.2',
  attemptId,
  supportUrl,
  title,
  className,
}: ScormPlayerProps) {
  const { t } = useTranslation()

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const bridgeRef = useRef<ScormBridge | null>(null)
  const [hasError, setHasError] = useState(false)

  // Eng so'nggi attemptId/version ni ref da saqlaymiz, shunda commit/status
  // handlerlari barqaror qolib, doim yangi qiymatlardan foydalanadi.
  const attemptIdRef = useRef(attemptId)
  attemptIdRef.current = attemptId
  const versionRef = useRef(version)
  versionRef.current = version

  // Iframe `src` o'rnatilishidan OLDIN global API obyektlarini e'lon qilamiz va
  // bridge ga ulaymiz (Req 6.1, 6.2). Unmount da yakuniy holatni yuboramiz.
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) {
      return
    }

    setHasError(false)

    // Status o'zgarganda darhol xAPI hodisasini yuboramiz (Req 6.3).
    const handleStatusChange = (status: string) => {
      void postScormXapi(status, { attemptId: attemptIdRef.current }).catch(
        () => {}
      )
    }

    // Commit/Finish da yakuniy holatni to'liq snapshot bilan yuboramiz (Req 6.4).
    const handleCommit: CommitHandler = (snapshot) => {
      const status = extractStatus(snapshot, versionRef.current)
      if (status) {
        void postScormXapi(status, {
          attemptId: attemptIdRef.current,
          data: snapshot,
        }).catch(() => {})
      }
    }

    const bridge = new ScormBridge({ version, onCommit: handleCommit })
    bridgeRef.current = bridge

    const shim = createScormShim(bridge, handleStatusChange)

    // SCORM paketi iframe ichidan window.parent.API(_1484_11) ni qidiradi —
    // shu sababli ikkala global ni ham e'lon qilamiz.
    window.API = shim
    window.API_1484_11 = shim

    // Globallar tayyor bo'lgach iframe manbasini o'rnatamiz (Req 6.1).
    iframe.src = src

    return () => {
      // Talaba darsdan chiqqanda: LMSCommit + LMSFinish, yakuniy holat yuboriladi
      // (Req 6.4). Agar paket allaqachon Finish chaqirgan bo'lsa, bu no-op.
      if (bridge.isRunning) {
        bridge.commit()
        bridge.terminate()
      }
      if (window.API === shim) {
        delete window.API
      }
      if (window.API_1484_11 === shim) {
        delete window.API_1484_11
      }
      bridgeRef.current = null
    }
    // `version` o'zgarsa yangi bridge kerak; `src` o'zgarsa qayta yuklash.
  }, [src, version])

  const resolvedSupportUrl = supportUrl ?? DEFAULT_SUPPORT_URL

  return (
    <div
      className={cn(
        'relative flex w-full flex-col overflow-hidden rounded-lg border bg-background',
        className
      )}
    >
      {hasError ? (
        // Xato holati (Req 6.5): xato xabari + texnik yordam havolasi.
        <div
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
          role="alert"
        >
          <AlertTriangle
            className="size-10 text-destructive"
            aria-hidden="true"
          />
          <p className="text-base font-medium">{t('scorm.error')}</p>
          <Button asChild variant="outline">
            <a href={resolvedSupportUrl} target="_blank" rel="noopener noreferrer">
              {t('scorm.support')}
            </a>
          </Button>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          title={title ?? t('scorm.player')}
          className="h-full min-h-[480px] w-full border-0"
          // Manba effekt ichida o'rnatiladi (globallar e'lon qilingach), shu
          // sababli bu yerda `src` berilmaydi.
          onError={() => setHasError(true)}
          allow="autoplay; fullscreen; microphone; camera"
        />
      )}
    </div>
  )
}

export default ScormPlayer

// Video_Player komponenti (Req 4.1, 4.2, 4.5).
//
// HLS.js orqali `.m3u8` adaptiv oqimni ijro etadi; native HLS qo'llab-
// quvvatlanadigan brauzerlarda (Safari) native rejimga tushadi. Boshqaruvlar:
// play/pause, seek bar, ovoz balandligi, to'liq ekran va ijro tezligi
// (0.5x–2x). Manba yuklanishida xato yuz bersa, xato xabari va "Qayta urinish"
// tugmasi ko'rsatiladi.
//
// Progress yuborish (har 10s throttle, Req 4.3), `chooseResumePosition` orqali
// tiklanish (Req 4.4) va klaviatura yorliqlari (probel, ←/→ 5s, Req 4.6) shu
// faylda ulangan (17.2 vazifasi).
import Hls from 'hls.js'
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import { chooseResumePosition, clampSeek } from '@/shared/lib/media'
import { throttle, type Throttled } from '@/shared/lib/throttle'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { VideoProgress } from '@/shared/types'

/** Qo'llab-quvvatlanadigan ijro tezliklari (Req 4.2). */
export const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2] as const

/** Progress backendga yuboriladigan interval (Req 4.3): har 10 soniya. */
export const PROGRESS_INTERVAL_MS = 10_000

/** Klaviatura ←/→ yorliqlari uchun seek qadami (Req 4.6): 5 soniya. */
export const SEEK_STEP_SEC = 5

export interface VideoPlayerProps {
  /** HLS `.m3u8` manba URL. */
  src: string
  /**
   * Dars identifikatori. Berilganda progress `POST /progress/video` orqali
   * backendga yuboriladi (Req 4.3).
   */
  lessonId?: string
  /** Ixtiyoriy poster (oldindan ko'rsatiladigan rasm). */
  poster?: string
  /**
   * Backenddan olingan (remote) davom ettirish o'rni (soniya). Local kuzatilgan
   * pozitsiya bilan birga `chooseResumePosition` ga uzatiladi (Req 4.4).
   */
  resumePosition?: number
  /**
   * Ijro pozitsiyasi o'zgarganda chaqiriladigan callback. Har 10s throttle
   * bilan (backend yuborish bilan birga) chaqiriladi (Req 4.3).
   */
  onProgress?: (positionSec: number) => void
  /** Tashqi konteyner uchun qo'shimcha CSS klasslar. */
  className?: string
  /** Yuklangach avtomatik ijro etish. */
  autoPlay?: boolean
}

/** Soniyani `mm:ss` (yoki `h:mm:ss`) formatiga aylantiradi. */
function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00'
  }
  const seconds = Math.floor(totalSeconds % 60)
  const minutes = Math.floor((totalSeconds / 60) % 60)
  const hours = Math.floor(totalSeconds / 3600)
  const ss = seconds.toString().padStart(2, '0')
  if (hours > 0) {
    const mm = minutes.toString().padStart(2, '0')
    return `${hours}:${mm}:${ss}`
  }
  return `${minutes}:${ss}`
}

/**
 * HLS.js asosidagi video pleyer. `.m3u8` oqimni ijro etadi, native HLS
 * fallback (Safari) bilan; play/pause, seek, ovoz, to'liq ekran va tezlik
 * boshqaruvlarini hamda xato + qayta urinish holatini taqdim etadi.
 */
export function VideoPlayer(props: VideoPlayerProps) {
  const { src, lessonId, poster, resumePosition, onProgress, className, autoPlay } =
    props
  const { t } = useTranslation()

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  // Joriy seansda kuzatilgan eng oxirgi (local) pozitsiya — resume tanlovida
  // remote pozitsiya bilan solishtiriladi (`chooseResumePosition`).
  const localPositionRef = useRef(0)
  // Manba (yoki retry) yuklanganda resume bir marta qo'llanilishini ta'minlaydi.
  const hasResumedRef = useRef(false)
  // Remote resume pozitsiyasini ref da saqlaymiz, shunda hodisa effekti uni
  // qayta ulamasdan eng so'nggi qiymatdan foydalanadi.
  const resumePositionRef = useRef(resumePosition ?? 0)
  resumePositionRef.current = resumePosition ?? 0

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  // `retryToken` o'zgarganda manba qayta yuklanadi ("Qayta urinish").
  const [retryToken, setRetryToken] = useState(0)

  // Progress yuborishning eng so'nggi implementatsiyasini ref da saqlaymiz, shunda
  // throttle o'ralgan funksiya barqaror qoladi-yu, lekin doim yangi
  // `lessonId`/`onProgress` qiymatlaridan foydalanadi.
  const sendProgressRef = useRef<(positionSec: number) => void>(() => {})
  sendProgressRef.current = (positionSec: number) => {
    onProgress?.(positionSec)
    if (lessonId) {
      const payload: VideoProgress = {
        lessonId,
        positionSec: Math.floor(positionSec),
        updatedAt: Date.now(),
      }
      // Yuborish "fire-and-forget" — tarmoq xatosi ijro tajribasini buzmasligi
      // kerak (keyingi 10s intervalda qayta yuboriladi).
      void apiClient.post(endpoints.progress.video, payload).catch(() => {})
    }
  }

  // Har 10 soniyada bir marta yuborishni kafolatlovchi throttle (Req 4.3).
  // Komponent umri davomida barqaror bo'lishi uchun ref da bir marta yaratiladi.
  const throttledSendRef = useRef<Throttled<[number]> | null>(null)
  if (throttledSendRef.current === null) {
    throttledSendRef.current = throttle(
      (positionSec: number) => sendProgressRef.current(positionSec),
      PROGRESS_INTERVAL_MS,
    )
  }

  // Unmount da kutilayotgan trailing yuborishni bekor qilamiz.
  useEffect(() => {
    return () => {
      throttledSendRef.current?.cancel()
    }
  }, [])

  // Yangi dars (`src`) yuklanganda local pozitsiya kuzatuvini va resume holatini
  // tiklaymiz. (Retry/reconnect da local pozitsiya saqlanadi — Req 4.4.)
  useEffect(() => {
    localPositionRef.current = 0
    hasResumedRef.current = false
  }, [src])

  // HLS.js / native manbani biriktirish va xatolarni kuzatish.
  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    setHasError(false)
    setIsLoading(true)
    // Manba qayta biriktirilganda (retry/reconnect) resume qaytadan qo'llanadi.
    hasResumedRef.current = false

    let hls: Hls | null = null

    if (Hls.isSupported()) {
      // HLS.js qo'llab-quvvatlanadigan brauzerlar (Chrome, Firefox, Edge).
      hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        // Faqat tuzatib bo'lmaydigan (fatal) xatolarda xato holatini ko'rsatamiz.
        if (data.fatal) {
          setHasError(true)
          setIsLoading(false)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari) — to'g'ridan-to'g'ri manbani o'rnatamiz.
      video.src = src
    } else {
      // Brauzer HLS ni umuman qo'llab-quvvatlamaydi.
      setHasError(true)
      setIsLoading(false)
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
      hlsRef.current = null
    }
  }, [src, retryToken])

  // Video element hodisalarini media holatiga bog'lash.
  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      // Local pozitsiyani kuzatamiz va throttle orqali backendga yuboramiz.
      localPositionRef.current = video.currentTime
      throttledSendRef.current?.(video.currentTime)
    }
    const handleDurationChange = () => setDuration(video.duration || 0)
    const handleLoadedMetadata = () => {
      const total = video.duration || 0
      setDuration(total)
      setIsLoading(false)
      // Davom ettirish: local va remote pozitsiyalardan eng kattasini tanlab,
      // [0, duration] oralig'iga clamp qilamiz (Req 4.4). Bir marta qo'llanadi.
      if (!hasResumedRef.current) {
        hasResumedRef.current = true
        const target = chooseResumePosition(
          localPositionRef.current,
          resumePositionRef.current,
          total,
        )
        if (target > 0) {
          video.currentTime = target
          setCurrentTime(target)
        }
      }
    }
    const handleCanPlay = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted || video.volume === 0)
    }
    const handleRateChange = () => setPlaybackRate(video.playbackRate)
    const handleError = () => {
      setHasError(true)
      setIsLoading(false)
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('ratechange', handleRateChange)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('ratechange', handleRateChange)
      video.removeEventListener('error', handleError)
    }
  }, [])

  // To'liq ekran holatini kuzatish.
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) {
      return
    }
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) {
      return
    }
    const next = Number(event.target.value)
    video.currentTime = next
    setCurrentTime(next)
  }

  const handleVolume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) {
      return
    }
    const next = Number(event.target.value)
    video.volume = next
    video.muted = next === 0
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) {
      return
    }
    video.muted = !video.muted
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) {
      return
    }
    if (document.fullscreenElement === container) {
      void document.exitFullscreen()
    } else {
      void container.requestFullscreen()
    }
  }

  const handleRateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const video = videoRef.current
    if (!video) {
      return
    }
    video.playbackRate = Number(event.target.value)
  }

  const handleRetry = () => {
    setRetryToken((token) => token + 1)
  }

  // Klaviatura yorliqlari (Req 4.6): probel = play/pause, ←/→ = 5s orqaga/oldinga.
  // Seek `clampSeek` orqali [0, duration] oralig'ida ushlab turiladi.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || hasError) {
      return
    }
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      togglePlay()
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const next = clampSeek(video.currentTime, video.duration || 0, -SEEK_STEP_SEC)
      video.currentTime = next
      setCurrentTime(next)
      return
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const next = clampSeek(video.currentTime, video.duration || 0, SEEK_STEP_SEC)
      video.currentTime = next
      setCurrentTime(next)
    }
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={t('video.player')}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex w-full flex-col overflow-hidden rounded-lg bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
    >
      <div className="relative aspect-video w-full">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          poster={poster}
          autoPlay={autoPlay}
          playsInline
          className="h-full w-full bg-black"
          onClick={togglePlay}
        />

        {isLoading && !hasError && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white"
          >
            {t('video.loading')}
          </div>
        )}

        {hasError && (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center text-white"
          >
            <p className="text-base font-medium">{t('video.error')}</p>
            <Button variant="secondary" onClick={handleRetry}>
              <RotateCcw aria-hidden="true" />
              {t('video.retry')}
            </Button>
          </div>
        )}
      </div>

      {/* Boshqaruvlar paneli (Req 4.2). */}
      <div className="flex flex-col gap-2 bg-neutral-900 px-3 py-2 text-white">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step="any"
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          disabled={hasError || duration === 0}
          aria-label={t('video.seek')}
          className="h-1 w-full cursor-pointer accent-primary"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            disabled={hasError}
            aria-label={isPlaying ? t('video.pause') : t('video.play')}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            {isPlaying ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
          </Button>

          <span className="min-w-[88px] text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              disabled={hasError}
              aria-label={isMuted ? t('video.unmute') : t('video.mute')}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              {isMuted ? (
                <VolumeX aria-hidden="true" />
              ) : (
                <Volume2 aria-hidden="true" />
              )}
            </Button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolume}
              disabled={hasError}
              aria-label={t('video.volume')}
              className="h-1 w-20 cursor-pointer accent-primary"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs">
              <span className="sr-only">{t('video.playbackRate')}</span>
              <select
                value={playbackRate}
                onChange={handleRateChange}
                disabled={hasError}
                aria-label={t('video.playbackRate')}
                className="rounded bg-neutral-800 px-2 py-1 text-xs text-white"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}x
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              disabled={hasError}
              aria-label={
                isFullscreen
                  ? t('video.exitFullscreen')
                  : t('video.fullscreen')
              }
              className="text-white hover:bg-white/10 hover:text-white"
            >
              {isFullscreen ? (
                <Minimize aria-hidden="true" />
              ) : (
                <Maximize aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer

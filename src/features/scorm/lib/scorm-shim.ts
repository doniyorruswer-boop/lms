// SCORM API shim — `ScormBridge` ni iframe ichidagi paketga ulaydi (Req 6.1–6.3).
//
// SCORM paket iframe ichidan `window.API` (SCORM 1.2) yoki `window.API_1484_11`
// (SCORM 2004) global obyektlarini qidiradi. Bu modul `ScormBridge` ustiga
// yengil Proxy o'rab beradi: barcha chaqiruvlar to'g'ridan-to'g'ri bridge ga
// yo'naltiriladi, biroq status data-model kalitiga muvaffaqiyatli `LMSSetValue`/
// `SetValue` bo'lganda `onStatusChange` callback i ishga tushadi (Req 6.3).
//
// Bridge ning o'zi nojiy ta'sirsiz qoladi; xAPI yuborish va backend bilan
// aloqani chaqiruvchi (SCORM_Player) ulaydi.

import { ScormBridge } from './bridge'

declare global {
  interface Window {
    /** SCORM 1.2 run-time API global obyekti (iframe paketi qidiradi). */
    API?: ScormBridge
    /** SCORM 2004 run-time API global obyekti (iframe paketi qidiradi). */
    API_1484_11?: ScormBridge
  }
}

/** SCORM 1.2 da status saqlanadigan data-model kaliti. */
export const STATUS_KEYS_12 = ['cmi.core.lesson_status'] as const

/**
 * SCORM 2004 da status saqlanadigan data-model kalitlari
 * (completion va success statuslari).
 */
export const STATUS_KEYS_2004 = [
  'cmi.completion_status',
  'cmi.success_status',
] as const

const SUCCESS = 'true'

/**
 * Berilgan SCORM standartiga mos status data-model kalitlari ro'yxati.
 */
export function statusKeysFor(version: ScormBridge['version']): readonly string[] {
  return version === '2004' ? STATUS_KEYS_2004 : STATUS_KEYS_12
}

/**
 * Snapshot ichidan joriy SCORM statusini ajratib oladi (mavjud bo'lsa).
 *
 * SCORM 2004 da avval `completion_status`, keyin `success_status` ko'riladi;
 * SCORM 1.2 da `cmi.core.lesson_status`.
 */
export function extractStatus(
  snapshot: Record<string, string>,
  version: ScormBridge['version']
): string | null {
  for (const key of statusKeysFor(version)) {
    const value = snapshot[key]
    if (value !== undefined && value !== '') {
      return value
    }
  }
  return null
}

/**
 * `ScormBridge` ustida status o'zgarishini kuzatuvchi Proxy quradi.
 *
 * Iframe paketi `LMSSetValue`/`SetValue` orqali status kalitini muvaffaqiyatli
 * o'zgartirganda `onStatusChange(value)` chaqiriladi (Req 6.3). Boshqa barcha
 * chaqiruvlar (`LMSInitialize`, `LMSGetValue`, `LMSCommit`, `LMSFinish` va
 * 2004 ekvivalentlari) o'zgarishsiz bridge ga yo'naltiriladi.
 *
 * @returns iframe ichidagi paketga taqdim etiladigan shim (bridge bilan bir xil
 *          interfeysga ega).
 */
export function createScormShim(
  bridge: ScormBridge,
  onStatusChange: (status: string) => void
): ScormBridge {
  const statusKeys = statusKeysFor(bridge.version)

  const handleSet = (method: 'LMSSetValue' | 'SetValue') => {
    return (key: string, value: string): string => {
      const result = bridge[method](key, value)
      if (result === SUCCESS && statusKeys.includes(key)) {
        onStatusChange(value)
      }
      return result
    }
  }

  return new Proxy(bridge, {
    get(target, prop, receiver) {
      if (prop === 'LMSSetValue') {
        return handleSet('LMSSetValue')
      }
      if (prop === 'SetValue') {
        return handleSet('SetValue')
      }
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}

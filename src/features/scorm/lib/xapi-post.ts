// SCORM -> xAPI yuborish yordamchisi (Req 6.3, 6.4).
//
// SCORM_Player status o'zgarganda (`LMSSetValue("cmi.core.lesson_status", ...)`)
// va dars yakunlanganda (`LMSFinish`/`LMSCommit`) xAPI hodisasini backendga
// (`POST /scorm/xapi`) yuboradi. xAPI fe'li (verb) `mapScormStatusToXapi` toza
// funksiyasi orqali deterministik tarzda aniqlanadi (Property 11).
//
// Statement quruvchi (`buildScormXapiStatement`) toza va nojiy ta'sirsiz —
// shu sababli alohida sinalishi mumkin; yuborish (`postScormXapi`) esa
// `apiClient` orqali yagona nojiy ta'sirni amalga oshiradi.

import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

import { mapScormStatusToXapi } from './xapi-map'

/** xAPI statement quruvchi uchun parametrlar. */
export interface BuildXapiOptions {
  /** SCORM urinish (attempt) identifikatori. */
  attemptId?: string
  /**
   * To'liq data-model snapshot (yakuniy/commit holatida). Status o'zgarishi
   * hodisalarida odatda berilmaydi.
   */
  data?: Record<string, string>
  /** ISO 8601 vaqt belgisi (berilmasa `new Date().toISOString()`). */
  timestamp?: string
}

/**
 * Backendga yuboriladigan xAPI statement shakli.
 *
 * `verb` xAPI vocabular-iga mos (IRI + ko'rsatish nomi); `scormStatus` esa
 * dastlabki SCORM status qiymatini (1.2 yoki 2004) saqlab qoladi.
 */
export interface ScormXapiStatement {
  verb: {
    id: string
    display: Record<string, string>
  }
  scormStatus: string
  attemptId?: string
  data?: Record<string, string>
  timestamp: string
}

/**
 * SCORM statusidan xAPI statement quradi (toza funksiya).
 *
 * Fe'l `mapScormStatusToXapi` orqali aniqlanadi — har bir kirish uchun aniq
 * bitta xAPI fe'li (deterministik va to'liq mapping, Property 11).
 */
export function buildScormXapiStatement(
  status: string,
  options: BuildXapiOptions = {}
): ScormXapiStatement {
  const verb = mapScormStatusToXapi(status)
  const statement: ScormXapiStatement = {
    verb: {
      id: verb.iri,
      display: { 'en-US': verb.display },
    },
    scormStatus: status,
    timestamp: options.timestamp ?? new Date().toISOString(),
  }
  if (options.attemptId) {
    statement.attemptId = options.attemptId
  }
  if (options.data) {
    statement.data = options.data
  }
  return statement
}

/**
 * xAPI statement ni backendga yuboradi (`POST /scorm/xapi`).
 *
 * Yuborish "fire-and-forget": tarmoq xatosi SCORM ijro tajribasini buzmasligi
 * uchun chaqiruvchi tomon `catch` bilan o'rashi kutiladi.
 */
export async function postScormXapi(
  status: string,
  options: BuildXapiOptions = {}
): Promise<void> {
  const statement = buildScormXapiStatement(status, options)
  await apiClient.post(endpoints.scorm.xapi, statement)
}

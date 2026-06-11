// Davomat holat-mashinasi (attendance state machine)
//
// Toza (pure) logika: talabaning davomat sessiyasi holatini boshqaradi.
// Qoidalar (Property 17 / Requirements 9.1, 9.2, 9.3):
//   - idle + check_in  -> in
//   - in   + check_out -> out
//   - boshqa barcha kombinatsiyalar reject (xato) qaytaradi
// Tranzitsiyadan keyin yangi holat doim {idle, in, out} dan biri bo'ladi.

/** Davomat sessiyasining mumkin bo'lgan holatlari. */
export type AttendanceState = 'idle' | 'in' | 'out';

/** Davomat holat-mashinasiga yuborilishi mumkin bo'lgan amallar. */
export type AttendanceAction = 'check_in' | 'check_out';

/** Muvaffaqiyatli tranzitsiya natijasi. */
export interface AttendanceTransitionSuccess {
  ok: true;
  /** Tranzitsiyadan keyingi yangi holat. */
  state: AttendanceState;
}

/** Rad etilgan (reject) tranzitsiya natijasi. */
export interface AttendanceTransitionFailure {
  ok: false;
  /** Holat o'zgarmaydi — joriy holat qaytariladi. */
  state: AttendanceState;
  /** Xato sababi. */
  error: string;
}

/** `attendanceTransition` funksiyasining natija turi. */
export type AttendanceTransitionResult =
  | AttendanceTransitionSuccess
  | AttendanceTransitionFailure;

/**
 * Davomat holat-mashinasi tranzitsiyasi.
 *
 * @param state  Joriy holat ({@link AttendanceState}).
 * @param action Bajariladigan amal ({@link AttendanceAction}).
 * @returns Muvaffaqiyatli bo'lsa yangi holat bilan, aks holda xato bilan natija.
 *          Har qanday holatda ham `state` doim {idle, in, out} dan biridir.
 */
export function attendanceTransition(
  state: AttendanceState,
  action: AttendanceAction,
): AttendanceTransitionResult {
  if (state === 'idle' && action === 'check_in') {
    return { ok: true, state: 'in' };
  }

  if (state === 'in' && action === 'check_out') {
    return { ok: true, state: 'out' };
  }

  return {
    ok: false,
    state,
    error: `Invalid transition: cannot perform "${action}" while in state "${state}".`,
  };
}

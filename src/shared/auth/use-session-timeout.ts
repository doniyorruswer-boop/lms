import { useEffect, useRef } from "react";

import { computeIsExpired, THRESHOLD } from "@/shared/auth/session-logic";
import { useAuthStore } from "@/shared/store/auth-store";

/**
 * Foydalanuvchi harakatlarini kuzatuvchi DOM hodisalari (Req 1.9).
 *
 * Har bir hodisada oxirgi faollik vaqti qayta tiklanadi.
 */
const ACTIVITY_EVENTS: readonly (keyof WindowEventMap)[] = [
  "mousemove",
  "keydown",
  "scroll",
  "click",
];

/** Sessiya muddatini tekshirish davriyligi (ms). */
const CHECK_INTERVAL = 60 * 1000;

/**
 * Sessiya timeout hooki (Req 1.9).
 *
 * Foydalanuvchi harakatlarini (mouse, klaviatura, skroll, bosish) kuzatadi va
 * har bir harakatda oxirgi faollik vaqtini qayta tiklaydi. Davriy ravishda
 * {@link computeIsExpired} yordamida 30 daqiqalik harakatsizlikni tekshiradi va
 * muddat tugaganda {@link useAuthStore} `clearSession` orqali logout qiladi.
 *
 * Listenerlar va taymer komponent unmount bo'lganda tozalanadi.
 *
 * @param threshold - Harakatsizlik chegarasi (ms), standart {@link THRESHOLD}.
 */
export function useSessionTimeout(threshold: number = THRESHOLD): void {
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const recordActivity = (): void => {
      lastActivityRef.current = Date.now();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, recordActivity);
    }

    const intervalId = window.setInterval(() => {
      if (computeIsExpired(lastActivityRef.current, Date.now(), threshold)) {
        useAuthStore.getState().clearSession();
      }
    }, CHECK_INTERVAL);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, recordActivity);
      }
      window.clearInterval(intervalId);
    };
  }, [threshold]);
}

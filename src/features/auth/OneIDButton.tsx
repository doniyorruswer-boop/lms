// OneID OAuth orqali kirish tugmasi (Req 1.4).
//
// Bosilganda brauzerni OneID avtorizatsiya URL ga yo'naltiradi. URL standart
// holatda `buildOneIdAuthorizeUrl()` orqali quriladi; testlarda yoki maxsus
// holatlarda `authorizeUrl` propi bilan override qilinishi mumkin.

import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

import { buildOneIdAuthorizeUrl } from "./api/auth-api";

export interface OneIDButtonProps {
  /**
   * Yo'naltiriladigan OneID avtorizatsiya URL. Berilmasa
   * `buildOneIdAuthorizeUrl()` ishlatiladi.
   */
  authorizeUrl?: string;
  /** Qo'shimcha CSS klasslari. */
  className?: string;
}

/**
 * OneID OAuth oqimini boshlovchi tugma. Bosilganda joriy sahifa OneID
 * avtorizatsiya URL ga almashtiriladi (`window.location.assign`).
 */
export function OneIDButton({
  authorizeUrl,
  className = "w-full",
}: OneIDButtonProps) {
  const { t } = useTranslation();

  function handleClick() {
    const url = authorizeUrl ?? buildOneIdAuthorizeUrl();
    window.location.assign(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={handleClick}
    >
      {t("login.oneid")}
    </Button>
  );
}

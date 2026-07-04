"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Kalbos perjungiklis su veliavelemis. Islieka tame paciame puslapyje, pakeicia
// tik kalba. next-intl issaugo pasirinkima NEXT_LOCALE slapuke (galioja bet kada).

function Flag({ locale }: { locale: string }) {
  const cls = "block h-full w-full";
  if (locale === "lt") {
    // Lietuva: geltona / zalia / raudona
    return (
      <svg viewBox="0 0 3 2" className={cls} preserveAspectRatio="none">
        <rect width="3" height="2" fill="#c1272d" />
        <rect width="3" height="1.333" fill="#006a44" />
        <rect width="3" height="0.667" fill="#fdb913" />
      </svg>
    );
  }
  if (locale === "de") {
    // Vokietija: juoda / raudona / auksas
    return (
      <svg viewBox="0 0 3 2" className={cls} preserveAspectRatio="none">
        <rect width="3" height="2" fill="#ffce00" />
        <rect width="3" height="1.333" fill="#dd0000" />
        <rect width="3" height="0.667" fill="#000000" />
      </svg>
    );
  }
  // Anglu kalba: Jungtines Karalystes veliava (Union Jack, supaprastinta)
  return (
    <svg viewBox="0 0 60 30" className={cls} preserveAspectRatio="none">
      <clipPath id="ukclip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#ukclip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 60,30 M60,0 0,30" stroke="#c8102e" strokeWidth="3" />
        <path d="M30,0 30,30 M0,15 60,15" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 30,30 M0,15 60,15" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  );
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1" aria-label="Language">
      {routing.locales.map((l) => {
        const isActive = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={pending}
            aria-label={l.toUpperCase()}
            aria-pressed={isActive}
            title={l.toUpperCase()}
            className={`h-4 w-6 overflow-hidden rounded-sm ring-1 transition disabled:opacity-50 ${
              isActive
                ? "ring-white/80"
                : "opacity-60 ring-white/20 hover:opacity-100 hover:ring-white/40"
            }`}
          >
            <Flag locale={l} />
          </button>
        );
      })}
    </div>
  );
}

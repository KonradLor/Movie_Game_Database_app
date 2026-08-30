"use client";

import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Kompaktiskas kalbos perjungiklis: rodo dabartine veliava + rodykle, paspaudus
// issiskleidzia visos kalbos. next-intl issaugo pasirinkima NEXT_LOCALE slapuke.

function Flag({ locale }: { locale: string }) {
  const cls = "block h-full w-full";
  // unikalus clipPath id kiekvienam Flag egzemplioriui (kad nesikartotu DOM'e)
  const uid = useId().replace(/:/g, "");
  if (locale === "lt") {
    return (
      <svg viewBox="0 0 3 2" className={cls} preserveAspectRatio="none">
        <rect width="3" height="2" fill="#c1272d" />
        <rect width="3" height="1.333" fill="#006a44" />
        <rect width="3" height="0.667" fill="#fdb913" />
      </svg>
    );
  }
  if (locale === "de") {
    return (
      <svg viewBox="0 0 3 2" className={cls} preserveAspectRatio="none">
        <rect width="3" height="2" fill="#ffce00" />
        <rect width="3" height="1.333" fill="#dd0000" />
        <rect width="3" height="0.667" fill="#000000" />
      </svg>
    );
  }
  // Anglu kalba: Jungtines Karalystes veliava (Union Jack, supaprastinta)
  const clip = `ukclip-${uid}`;
  return (
    <svg viewBox="0 0 60 30" className={cls} preserveAspectRatio="none">
      <clipPath id={clip}>
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Uzdarymas paspaudus salia / ESC. (Nenaudojam fixed-inset fono, nes header
  // turi backdrop-filter -> fixed elementai pozicionuojami pagal header'i, o ne langa.)
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(next: string) {
    setOpen(false);
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <span className="h-4 w-6 overflow-hidden rounded-sm ring-1 ring-white/25">
          <Flag locale={locale} />
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 flex flex-col gap-0.5 rounded-lg border border-white/10 bg-[var(--color-surface)] p-1.5 shadow-xl">
            {routing.locales.map((l) => {
              const isActive = l === locale;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchTo(l)}
                  disabled={pending}
                  aria-current={isActive}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition disabled:opacity-50 ${
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="h-4 w-6 shrink-0 overflow-hidden rounded-sm ring-1 ring-white/20">
                    <Flag locale={l} />
                  </span>
                  <span className="uppercase">{l}</span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

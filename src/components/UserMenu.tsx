"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signOutAction } from "@/lib/auth-actions";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import type { Theme } from "@/lib/theme";

// Vartotojo meniu (dropdown) - antriniai/paskyros veiksmai, iskelti is juostos:
// profilis, tema (greitas perjungimas), atsiliepimai, admin, atsijungimas.
export default function UserMenu({
  name,
  isAdmin,
  theme,
}: {
  name: string;
  isAdmin: boolean;
  theme: Theme;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Uzdarymas paspaudus salia / ESC (document listener, nes header backdrop-filter
  // sulauzytu fixed-inset fono pozicionavima).
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

  const itemCls =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-sm text-white/70 transition hover:text-white"
      >
        <span className="max-w-[9rem] truncate">{name}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-[var(--color-surface)] p-2 shadow-xl">
            <Link href="/profilis" className={itemCls} onClick={() => setOpen(false)}>
              {t("profile.title")}
            </Link>

            {/* Temos greitas perjungimas */}
            <div className="px-3 py-2">
              <p className="mb-1.5 text-xs text-white/45">{t("theme.label")}</p>
              <ThemeSwitcher initial={theme} variant="compact" />
            </div>

            <Link href="/atsiliepimai" className={itemCls} onClick={() => setOpen(false)}>
              {t("nav.feedback")}
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`${itemCls} text-[var(--color-accent)] hover:text-[var(--color-accent)]`}
                onClick={() => setOpen(false)}
              >
                Admin
              </Link>
            )}

            <div className="my-1.5 h-px bg-white/10" />

          <form action={signOutAction}>
            <button type="submit" className={itemCls}>
              {t("nav.logout")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

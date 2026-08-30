"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { THEMES, THEME_SWATCH, THEME_COOKIE, DEFAULT_THEME, type Theme } from "@/lib/theme";

// Temu parinkiklis. Nustato slapuka + data-theme ant <html> (momentinis efektas).
// variant="compact" - tik spalvu apskritimai (TopBar); "full" - su pavadinimais.
export default function ThemeSwitcher({
  initial,
  variant = "compact",
}: {
  initial: Theme;
  variant?: "compact" | "full";
}) {
  const t = useTranslations("theme");
  const [active, setActive] = useState<Theme>(initial);

  function pick(theme: Theme) {
    setActive(theme);
    document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;samesite=lax`;
    const root = document.documentElement;
    if (theme === DEFAULT_THEME) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }

  return (
    <div className={variant === "full" ? "flex flex-wrap gap-3" : "flex items-center gap-1.5"}>
      {THEMES.map((theme) => {
        const sw = THEME_SWATCH[theme];
        const isActive = active === theme;
        return (
          <button
            key={theme}
            type="button"
            onClick={() => pick(theme)}
            title={t(theme)}
            aria-label={t(theme)}
            aria-pressed={isActive}
            className={
              variant === "full"
                ? `flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                    isActive
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-white/60 hover:border-white/25"
                  }`
                : "rounded-full p-0.5 transition"
            }
            style={variant === "compact" && isActive ? { outline: "2px solid rgba(255,255,255,.7)", outlineOffset: "1px", borderRadius: "999px" } : undefined}
          >
            <span
              className="inline-block h-5 w-5 shrink-0 rounded-full ring-1 ring-white/20"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${sw.a}, ${sw.b} 70%, ${sw.bg})`,
              }}
            />
            {variant === "full" && <span>{t(theme)}</span>}
          </button>
        );
      })}
    </div>
  );
}

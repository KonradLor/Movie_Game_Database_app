// Temu sistema. Vartotojas pasirenka; issaugoma "theme" slapuke, o serveris
// (layout) uzdeda data-theme ant <html>. CSS kintamieji temoms - globals.css.

export const THEMES = ["default", "neon", "sunset", "emerald", "rose"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "default";
export const THEME_COOKIE = "theme";

export function toTheme(v: string | null | undefined): Theme {
  return (THEMES as readonly string[]).includes(v ?? "") ? (v as Theme) : DEFAULT_THEME;
}

// Perziuros spalvos parinkikliui (accent, accent-2, fonas).
export const THEME_SWATCH: Record<Theme, { a: string; b: string; bg: string }> = {
  default: { a: "#7c5cff", b: "#ff5ca8", bg: "#08080c" },
  neon: { a: "#00f0ff", b: "#ff2fd0", bg: "#04060b" },
  sunset: { a: "#ff8a3d", b: "#ff4d6d", bg: "#0d0707" },
  emerald: { a: "#2ee6a0", b: "#7cff6b", bg: "#040c08" },
  rose: { a: "#ff6fa5", b: "#c77dff", bg: "#0c0709" },
};

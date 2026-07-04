import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // 3 kalbos. Anglu = numatytoji IR atsargine (fallback).
  locales: ["en", "lt", "de"],
  defaultLocale: "en",
  // Numatytoji kalba (en) be prefikso URL'e; /lt ir /de su prefiksu.
  // Vartotojo pasirinkimas issaugomas NEXT_LOCALE slapuke (next-intl).
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

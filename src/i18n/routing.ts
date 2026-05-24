import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Dabar tik lietuviu. Veliau pridesim: "de", "en" ir kt.
  locales: ["lt"],
  defaultLocale: "lt",
  // Numatytoji kalba be prefikso URL'e (pvz. / vietoj /lt)
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

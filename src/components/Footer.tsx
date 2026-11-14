import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Poraštė kiekviename puslapyje: Apie / Atsiliepimai / Privatumas + TMDB ir IGDB
// priskyrimas (TMDB naudojimo sąlygos; LD4 maketas E-5, P-13).
export default async function Footer() {
  const t = await getTranslations("footer");
  const linkCls = "text-white/70 transition hover:text-white";
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm sm:px-6 lg:px-8">
        <Link href="/apie" className={linkCls}>{t("about")}</Link>
        <Link href="/atsiliepimai" className={linkCls}>{t("feedback")}</Link>
        <Link href="/apie#duomenys" className={linkCls}>{t("privacy")}</Link>
        <p className="ml-auto max-w-2xl text-xs text-white/60">{t("sources")}</p>
      </div>
    </footer>
  );
}

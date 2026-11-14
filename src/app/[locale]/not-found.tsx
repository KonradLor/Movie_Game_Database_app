import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Lokalizuotas 404: paaiškinimas ir du keliai atgal (LD4 maketas E-5, būsena B).
export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-gradient text-6xl font-extrabold">404</p>
      <h1 className="mt-3 text-xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-sm text-white/70">{t("text")}</p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {t("home")}
        </Link>
        <Link
          href="/apie"
          className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/85 transition hover:border-white/40 hover:text-white"
        >
          {t("about")}
        </Link>
      </div>
    </main>
  );
}

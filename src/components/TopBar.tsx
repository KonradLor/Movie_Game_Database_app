import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isAdmin } from "@/lib/admin";

export default async function TopBar() {
  const t = await getTranslations();
  const admin = await isAdmin();

  const linkCls = "text-sm text-white/60 transition hover:text-white";

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-bold tracking-tight">
          <span className="text-gradient">●</span> Media
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className={linkCls}>
            {t("nav.home")}
          </Link>
          <Link href="/noriu" className={linkCls}>
            {t("nav.watchlist")}
          </Link>
          <Link href="/statistika" className={linkCls}>
            {t("nav.stats")}
          </Link>
          <Link href="/atsitiktinis" className={linkCls}>
            {t("nav.random")}
          </Link>
          {admin && (
            <Link
              href="/prideti"
              className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              + {t("actions.add")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

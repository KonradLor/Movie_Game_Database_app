import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/current-user";
import { getPendingIncomingCount, getUnreadRecommendationCount } from "@/lib/friends";
import { toTheme, THEME_COOKIE } from "@/lib/theme";
import { signInAction } from "@/lib/auth-actions";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import UserMenu from "@/components/UserMenu";

// Authentik registracijos (enroll) srautas - bendras kondev SSO.
const ENROLL_URL = "https://auth.kondev.app/if/flow/enroll/";

// Ikonos (inline SVG - appas Tabler webfonto neturi)
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 3.5a3 3 0 0 1 0 7" />
      <path d="M21 20a6 6 0 0 0-4-5.6" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export default async function TopBar() {
  const t = await getTranslations();
  const session = await auth();
  const loggedIn = Boolean(session?.user);
  const admin = session?.user?.isAdmin === true;
  const theme = toTheme((await cookies()).get(THEME_COOKIE)?.value);

  // Nav badge'ai: laukiancios draugystes uzklausos + neskaitytos rekomendacijos
  let pendingReq = 0;
  let unreadRec = 0;
  const cu = loggedIn ? await getCurrentUser() : null;
  if (cu) {
    [pendingReq, unreadRec] = await Promise.all([
      getPendingIncomingCount(cu.id),
      getUnreadRecommendationCount(cu.id),
    ]);
  }
  const userName = session?.user?.name || session?.user?.email || "";

  const linkCls = "text-sm text-white/60 transition hover:text-white";
  const iconCls =
    "relative flex items-center rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white";
  const badgeCls =
    "absolute -right-1 -top-1 inline-flex min-w-[1.05rem] justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold leading-4 text-white";

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-base font-bold tracking-tight">
          <span className="text-gradient">●</span> {t("app.title")}
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
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

          {loggedIn && (
            <>
              <Link href="/draugai" className={iconCls} aria-label={t("nav.friends")} title={t("nav.friends")}>
                <UsersIcon />
                {pendingReq > 0 && <span className={badgeCls}>{pendingReq}</span>}
              </Link>
              <Link
                href="/rekomendacijos"
                className={iconCls}
                aria-label={t("nav.recommendations")}
                title={t("nav.recommendations")}
              >
                <MailIcon />
                {unreadRec > 0 && <span className={badgeCls}>{unreadRec}</span>}
              </Link>

              <Link
                href="/prideti"
                className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                + {t("actions.add")}
              </Link>
            </>
          )}

          <LanguageSwitcher />

          {loggedIn ? (
            <UserMenu name={userName} isAdmin={admin} theme={theme} />
          ) : (
            <div className="flex items-center gap-2">
              {/* Atsiliepimai vieši - pasiekiami ir neprisijungus (prisijungus - vartotojo meniu) */}
              <Link href="/atsiliepimai" className={linkCls}>
                {t("nav.feedback")}
              </Link>
              <form action={signInAction}>
                <button
                  type="submit"
                  className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  {t("nav.login")}
                </button>
              </form>
              <a
                href={ENROLL_URL}
                className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {t("nav.register")}
              </a>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

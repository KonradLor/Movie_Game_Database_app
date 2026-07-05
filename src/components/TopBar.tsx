import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth, signIn, signOut } from "@/auth";
import { getCurrentUser } from "@/lib/current-user";
import { getPendingIncomingCount, getUnreadRecommendationCount } from "@/lib/friends";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Authentik registracijos (enroll) srautas - bendras kondev SSO.
const ENROLL_URL = "https://auth.kondev.app/if/flow/enroll/";

export default async function TopBar() {
  const t = await getTranslations();
  const session = await auth();
  const loggedIn = Boolean(session?.user);
  const admin = session?.user?.isAdmin === true;

  // Nav badge'ai: laukiancios draugystes uzklausos + neskaitytos rekomendacijos
  let pendingReq = 0;
  let unreadRec = 0;
  if (loggedIn) {
    const cu = await getCurrentUser();
    if (cu) {
      [pendingReq, unreadRec] = await Promise.all([
        getPendingIncomingCount(cu.id),
        getUnreadRecommendationCount(cu.id),
      ]);
    }
  }

  const linkCls = "text-sm text-white/60 transition hover:text-white";
  const badgeCls =
    "ml-1 inline-flex min-w-[1.1rem] justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold leading-4 text-white";

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-bold tracking-tight">
          <span className="text-gradient">●</span> {t("app.brandTagline")}
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
          <Link href="/atsiliepimai" className={linkCls}>
            {t("nav.feedback")}
          </Link>
          {loggedIn && (
            <>
              <Link href="/draugai" className={linkCls}>
                {t("nav.friends")}
                {pendingReq > 0 && <span className={badgeCls}>{pendingReq}</span>}
              </Link>
              <Link href="/rekomendacijos" className={linkCls}>
                {t("nav.recommendations")}
                {unreadRec > 0 && <span className={badgeCls}>{unreadRec}</span>}
              </Link>
            </>
          )}
          {admin && (
            <Link href="/admin" className="text-sm text-[var(--color-accent)] transition hover:brightness-125">
              Admin
            </Link>
          )}

          {loggedIn && (
            <Link
              href="/prideti"
              className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              + {t("actions.add")}
            </Link>
          )}

          {/* Tik kalbos perjungiklis (vėliavėlės). Temos pasirinkimas - profilyje. */}
          <LanguageSwitcher />

          {/* --- Prisijungimo sritis --- */}
          {loggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profilis"
                className="text-sm text-white/60 transition hover:text-white"
                title="Profilis ir API raktai"
              >
                {session?.user?.name || session?.user?.email}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className={linkCls}>
                  {t("nav.logout")}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <form
                action={async () => {
                  "use server";
                  await signIn("authentik", { redirectTo: "/" });
                }}
              >
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

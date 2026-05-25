import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth, signIn, signOut } from "@/auth";

// Authentik registracijos (enroll) srautas - bendras kondev SSO.
const ENROLL_URL = "https://auth.kondev.app/if/flow/enroll/";

export default async function TopBar() {
  const t = await getTranslations();
  const session = await auth();
  const loggedIn = Boolean(session?.user);
  const admin = session?.user?.isAdmin === true;

  const linkCls = "text-sm text-white/60 transition hover:text-white";

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-bold tracking-tight">
          <span className="text-gradient">●</span> Visas tavo asmeninis multimedijų pasaulis čia
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

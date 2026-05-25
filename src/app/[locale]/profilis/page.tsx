import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { resolveTmdb, resolveTwitch, ownKeysRequired, SHARED_KEY_LIMIT } from "@/lib/api-keys";
import { saveApiKeysAction, clearApiKeysAction } from "@/lib/actions";

function setLabel(v: string | null): string {
  return v ? "nustatyta ••••••" : "neįvesta";
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) notFound();

  const tmdb = resolveTmdb(user);
  const twitch = resolveTwitch(user);
  const required = ownKeysRequired(user.userNumber);

  const sourceText = (canSearch: boolean, usingOwn: boolean, src: string) => {
    if (src === "missing-required")
      return { text: "PRIVALOMA įvesti savo raktus", cls: "text-red-300 bg-red-500/15" };
    if (usingOwn) return { text: "naudojami tavo raktai", cls: "text-emerald-300 bg-emerald-500/15" };
    return { text: "naudojami bendri serverio raktai", cls: "text-white/60 bg-white/10" };
  };
  const tmdbS = sourceText(tmdb.canSearch, tmdb.usingOwn, tmdb.source);
  const twitchS = sourceText(twitch.canSearch, twitch.usingOwn, twitch.source);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-gradient text-2xl font-bold">Profilis</h1>
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Atgal
        </Link>
      </div>

      {/* Vartotojo info */}
      <section className="glass mb-6 p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-white/50">
            Vartotojas: <span className="text-white/90">{user.name || user.email}</span>
          </span>
          <span className="text-white/50">
            Nr.: <span className="text-white/90">#{user.userNumber}</span>
          </span>
          {user.isAdmin && (
            <span className="rounded-full bg-[var(--color-accent)]/20 px-2 py-0.5 text-xs text-[var(--color-accent)]">
              admin
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-white/45">
          {required
            ? `Esi vartotojas #${user.userNumber} (po pirmų ${SHARED_KEY_LIMIT}). Norėdamas pridėti naujų filmų/žaidimų iš duomenų bazių, PRIVALAI įvesti savo API raktus žemiau.`
            : `Pirmieji ${SHARED_KEY_LIMIT} vartotojai gali naudotis bendrais serverio raktais. Nori naudoti savo? Įvesk juos žemiau (neprivaloma).`}
        </p>
      </section>

      {/* Raktų forma */}
      <form action={saveApiKeysAction} className="glass space-y-6 p-6">
        {/* TMDB */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">
              TMDB (filmai / serialai / anime)
            </h2>
            <span className={`rounded-full px-2 py-0.5 text-xs ${tmdbS.cls}`}>{tmdbS.text}</span>
          </div>
          <label className="block text-xs text-white/50">
            Read Access Token (v4) — {setLabel(user.tmdbReadToken)}
          </label>
          <input
            type="password"
            name="tmdbReadToken"
            autoComplete="off"
            placeholder="Įvesk, kad nustatytum / pakeistum"
            className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-[var(--color-accent)]"
          />
          <label className="mt-3 block text-xs text-white/50">
            API Key (v3) — {setLabel(user.tmdbApiKey)}
          </label>
          <input
            type="password"
            name="tmdbApiKey"
            autoComplete="off"
            placeholder="Įvesk, kad nustatytum / pakeistum"
            className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* Twitch / IGDB */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">Twitch / IGDB (žaidimai)</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs ${twitchS.cls}`}>{twitchS.text}</span>
          </div>
          <label className="block text-xs text-white/50">
            Client ID — {setLabel(user.twitchClientId)}
          </label>
          <input
            type="password"
            name="twitchClientId"
            autoComplete="off"
            placeholder="Įvesk, kad nustatytum / pakeistum"
            className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-[var(--color-accent)]"
          />
          <label className="mt-3 block text-xs text-white/50">
            Client Secret — {setLabel(user.twitchClientSecret)}
          </label>
          <input
            type="password"
            name="twitchClientSecret"
            autoComplete="off"
            placeholder="Įvesk, kad nustatytum / pakeistum"
            className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-[var(--color-accent)]"
          />
        </div>

        <p className="text-xs text-white/40">
          Palik lauką tuščią — reikšmė nesikeis. Raktai matomi tik tau.
        </p>

        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Išsaugoti raktus
        </button>
      </form>

      {/* Isvalyti */}
      <form action={clearApiKeysAction} className="mt-4">
        <button
          type="submit"
          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/50 transition hover:bg-red-500/20 hover:text-red-300"
        >
          Išvalyti visus mano raktus
        </button>
      </form>
    </main>
  );
}

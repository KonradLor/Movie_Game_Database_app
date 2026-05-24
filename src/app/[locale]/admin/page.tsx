import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// Admin apžvalga: visų vartotojų sąrašas + bendra statistika (priežiūrai).
// Tik adminui (Konradui). Kiekvienas vartotojas savo dienorastį tvarko atskirai.
export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me?.isAdmin) notFound();

  const t = await getTranslations();

  // Vartotojai + jų įrašų kiekis
  const users = await db.user.findMany({
    orderBy: { userNumber: "asc" },
    include: { _count: { select: { mediaItems: true } } },
  });

  // Peržiūrėtų skaičius pagal vartotoją
  const watchedByUser = await db.mediaItem.groupBy({
    by: ["userId"],
    where: { status: "WATCHED" },
    _count: { _all: true },
  });
  const watchedMap = new Map(watchedByUser.map((w) => [w.userId, w._count._all]));

  // Bendri skaičiai
  const totalUsers = users.length;
  const totalItems = await db.mediaItem.count();
  const totalWatched = await db.mediaItem.count({ where: { status: "WATCHED" } });

  // Naujausi įrašai (visų vartotojų) - priežiūrai
  const recent = await db.mediaItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { user: { select: { name: true, email: true, userNumber: true } } },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-gradient mb-2 text-3xl font-extrabold tracking-tight">
        Admin apžvalga
      </h1>
      <p className="mb-8 text-sm text-white/50">
        Visų vartotojų suvestinė (tik administratoriui). Kiekvienas vartotojas mato
        ir tvarko tik savo dienoraštį.
      </p>

      {/* Bendri skaičiai */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="glass p-6">
          <p className="text-sm text-white/50">Vartotojų</p>
          <p className="mt-1 text-4xl font-bold">{totalUsers}</p>
        </div>
        <div className="glass p-6">
          <p className="text-sm text-white/50">Iš viso įrašų</p>
          <p className="mt-1 text-4xl font-bold">{totalItems}</p>
        </div>
        <div className="glass p-6">
          <p className="text-sm text-white/50">Peržiūrėta</p>
          <p className="mt-1 text-4xl font-bold">{totalWatched}</p>
        </div>
      </div>

      {/* Vartotojų lentelė */}
      <section className="glass mb-8 overflow-x-auto p-6">
        <h2 className="mb-4 text-sm font-semibold text-white/70">Vartotojai</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-white/40">
              <th className="pb-2 pr-4">#</th>
              <th className="pb-2 pr-4">Vartotojas</th>
              <th className="pb-2 pr-4">Rolė</th>
              <th className="pb-2 pr-4 text-right">Įrašų</th>
              <th className="pb-2 pr-4 text-right">Peržiūrėta</th>
              <th className="pb-2 text-right">Prisijungė</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="py-2 pr-4 text-white/50">{u.userNumber}</td>
                <td className="py-2 pr-4">
                  <span className="text-white/90">{u.name || u.email || u.sub}</span>
                  {u.email && u.name && (
                    <span className="block text-xs text-white/40">{u.email}</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {u.isAdmin ? (
                    <span className="rounded-full bg-[var(--color-accent)]/20 px-2 py-0.5 text-xs text-[var(--color-accent)]">
                      admin
                    </span>
                  ) : (
                    <span className="text-white/40">vartotojas</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{u._count.mediaItems}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {watchedMap.get(u.id) ?? 0}
                </td>
                <td className="py-2 text-right text-xs text-white/40">
                  {u.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Naujausi visų vartotojų įrašai */}
      {recent.length > 0 && (
        <section className="glass p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">
            Naujausi įrašai (visų vartotojų)
          </h2>
          <div className="space-y-2">
            {recent.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 border-t border-white/5 py-2 text-sm first:border-0"
              >
                <span className="min-w-0 truncate text-white/90">
                  {m.title}{" "}
                  {m.year && <span className="text-white/40">({m.year})</span>}
                </span>
                <span className="shrink-0 text-xs text-white/40">
                  #{m.user.userNumber} {m.user.name || m.user.email} · {t(`type.${m.type}`)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

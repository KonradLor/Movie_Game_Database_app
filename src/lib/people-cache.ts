// Write-through cache asmenims (Faze 4b): parsiunciam biografija + filmografija
// is TMDB ir issaugom i DB. Po to rodoma is DB.

import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { getPerson, posterUrl } from "./tmdb";

export interface CachedWork {
  tmdbId: number;
  tmdbType: "movie" | "tv";
  title: string;
  year: number | null;
  poster: string | null;
  role: string | null; // veikejas arba pareigos
}

// Parsiusti ir issaugoti asmens info + filmografija. Reikia, kad Person turetu tmdbId.
export async function cachePersonWorks(personDbId: string): Promise<void> {
  const person = await db.person.findUnique({ where: { id: personDbId } });
  if (!person?.tmdbId) throw new Error("Asmuo neturi TMDB saltinio");

  const data = await getPerson(person.tmdbId);

  // Sujungiam cast + crew, dedublikuojam pagal id+type, surikiuojam pagal populiaruma
  const all = [
    ...(data.combined_credits?.cast || []),
    ...(data.combined_credits?.crew || []),
  ];
  const map = new Map<string, CachedWork>();
  for (const w of all) {
    if (w.media_type !== "movie" && w.media_type !== "tv") continue;
    const key = `${w.media_type}-${w.id}`;
    if (map.has(key)) continue;
    const date = w.release_date || w.first_air_date || "";
    map.set(key, {
      tmdbId: w.id,
      tmdbType: w.media_type,
      title: w.title || w.name || "",
      year: date ? parseInt(date.slice(0, 4), 10) || null : null,
      poster: posterUrl(w.poster_path, "w200"),
      role: w.character || w.job || null,
    });
  }
  const works = Array.from(map.values()).sort(
    (a, b) => (b.year || 0) - (a.year || 0)
  );

  await db.person.update({
    where: { id: personDbId },
    data: {
      bio: data.biography || person.bio,
      photoUrl: posterUrl(data.profile_path) || person.photoUrl,
      cachedWorks: works as unknown as Prisma.InputJsonValue,
      worksCachedAt: new Date(),
    },
  });
}

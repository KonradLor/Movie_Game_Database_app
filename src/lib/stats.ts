import type { MediaType } from "@prisma/client";

const ALL_TYPES: MediaType[] = ["MOVIE", "SERIES", "ANIME", "DOCUMENTARY", "GAME"];

// Laiko skaiciavimui reikalingi laukai (filmams/serialams - trukme; zaidimams - valandos).
interface TimeItem {
  type: MediaType;
  durationMin: number | null;
  watchCount: number | null;
  playedHours: number | null;
}

// Valandos vienai kategorijai: zaidimams - zaista valandos (playedHours);
// kitiems - trukme(min) * ziuretu kartu / 60.
export function hoursByType(items: TimeItem[], type: MediaType): number {
  const its = items.filter((i) => i.type === type);
  if (type === "GAME") {
    return Math.round(its.reduce((s, i) => s + (i.playedHours || 0), 0));
  }
  return Math.round(
    its.reduce((s, i) => s + (i.durationMin || 0) * (i.watchCount || 1), 0) / 60
  );
}

// Bendras praleistas laikas (valandomis). Sumuojam suapvalintas kategoriju
// valandas, tad antraste visada sutampa su isskaidymo juostu suma (be apvalinimo
// nesutapimo tarp Statistikos ir profilio).
export function totalHoursOf(items: TimeItem[]): number {
  return ALL_TYPES.reduce((sum, ty) => sum + hoursByType(items, ty), 0);
}

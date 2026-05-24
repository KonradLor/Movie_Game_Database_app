import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Keli pavyzdiniai irasai lokaliam testavimui (Faze 5/6 dizaino perziurai).
async function main() {
  await db.mediaItem.upsert({
    where: { type_tmdbId: { type: "MOVIE", tmdbId: 419430 } },
    update: {},
    create: {
      type: "MOVIE",
      title: "Das Mädchen, das durch die Zeit sprang",
      year: 2006,
      durationMin: 98,
      description: "Anime klasika apie laika.",
      rating: 5,
      opinion: "Zeitloses Meisterwerk.",
      visibility: "PUBLIC",
      source: "MANUAL",
      watchCount: 1,
    },
  });

  await db.mediaItem.create({
    data: {
      type: "GAME",
      title: "The Witcher 3: Wild Hunt",
      year: 2015,
      description: "Atviro pasaulio RPG.",
      rating: 5,
      opinion: "Vienas geriausiu RPG.",
      visibility: "PUBLIC",
      source: "MANUAL",
      watchCount: 2,
    },
  });

  console.log("Seed baigtas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

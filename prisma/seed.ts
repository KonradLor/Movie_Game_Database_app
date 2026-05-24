import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Keli pavyzdiniai irasai lokaliam testavimui (priskirti demo vartotojui).
async function main() {
  // Demo vartotojas (daugiavartotojiskumas)
  const user = await db.user.upsert({
    where: { sub: "seed@example.com" },
    update: {},
    create: {
      sub: "seed@example.com",
      email: "seed@example.com",
      name: "Seed User",
      userNumber: 999,
      isAdmin: false,
    },
  });

  await db.mediaItem.upsert({
    where: {
      userId_type_tmdbId: { userId: user.id, type: "MOVIE", tmdbId: 419430 },
    },
    update: {},
    create: {
      userId: user.id,
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
      userId: user.id,
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

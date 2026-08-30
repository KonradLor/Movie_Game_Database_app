-- Zaidimu platforma (enum) + asmeniniai zaidimu laukai (playtime, platinum).
-- Visi laukai addityvus: enumas naujas, stulpeliai NULL / su default -> saugu live DB.

CREATE TYPE "GamePlatform" AS ENUM ('PC', 'STEAM', 'PLAYSTATION', 'XBOX', 'NINTENDO_SWITCH', 'MOBILE', 'OTHER');

ALTER TABLE "MediaItem" ADD COLUMN "platform" "GamePlatform";
ALTER TABLE "MediaItem" ADD COLUMN "playedHours" DOUBLE PRECISION;
ALTER TABLE "MediaItem" ADD COLUMN "beatenHours" DOUBLE PRECISION;
ALTER TABLE "MediaItem" ADD COLUMN "platinum" BOOLEAN NOT NULL DEFAULT false;

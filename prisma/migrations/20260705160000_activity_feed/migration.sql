-- Sekimo srauto patobulinimai: veiklos laikas (rikiavimui) + "nauja veikla" badge.
-- Addityvi: nauji NULL stulpeliai + backfill.

-- MediaItem.activityAt - veiklos laikas (pridejimas / pazymeta ziureta)
ALTER TABLE "MediaItem" ADD COLUMN "activityAt" TIMESTAMP(3);

-- Backfill esamiems: naujausias is (lastWatched, createdAt)
UPDATE "MediaItem" SET "activityAt" = COALESCE("lastWatched", "createdAt");

CREATE INDEX "MediaItem_activityAt_idx" ON "MediaItem"("activityAt");

-- User.followFeedSeenAt - kada paskutini karta ziurejo sekimo srauta (badge)
ALTER TABLE "User" ADD COLUMN "followFeedSeenAt" TIMESTAMP(3);

-- Daugiavartotojiskumas: User lentele + MediaItem savininkas (userId).
-- Saugus backfill: esami irasai priskiriami adminui (Konradui), tada userId NOT NULL.

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "userNumber" INTEGER NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "tmdbReadToken" TEXT,
    "tmdbApiKey" TEXT,
    "twitchClientId" TEXT,
    "twitchClientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");
CREATE UNIQUE INDEX "User_userNumber_key" ON "User"("userNumber");
CREATE INDEX "User_userNumber_idx" ON "User"("userNumber");

-- Seed: admin (Konradas) - userNumber=1, sub=el.pastas (sub_mode=email)
INSERT INTO "User" ("id","sub","email","name","userNumber","isAdmin","updatedAt")
VALUES ('usr_admin_konradas','klorenz.dev@gmail.com','klorenz.dev@gmail.com','Konradas',1,true,CURRENT_TIMESTAMP);

-- MediaItem.userId: nullable -> backfill (esami -> admin) -> NOT NULL
ALTER TABLE "MediaItem" ADD COLUMN "userId" TEXT;
UPDATE "MediaItem" SET "userId" = 'usr_admin_konradas' WHERE "userId" IS NULL;
ALTER TABLE "MediaItem" ALTER COLUMN "userId" SET NOT NULL;

-- Unikalumas dabar per vartotoja (kad du vartotojai galetu tureti ta pati filma)
DROP INDEX "MediaItem_type_igdbId_key";
DROP INDEX "MediaItem_type_tmdbId_key";
CREATE INDEX "MediaItem_userId_idx" ON "MediaItem"("userId");
CREATE UNIQUE INDEX "MediaItem_userId_type_tmdbId_key" ON "MediaItem"("userId", "type", "tmdbId");
CREATE UNIQUE INDEX "MediaItem_userId_type_igdbId_key" ON "MediaItem"("userId", "type", "igdbId");

-- FK
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

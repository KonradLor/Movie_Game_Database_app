-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'SERIES', 'ANIME', 'DOCUMENTARY', 'GAME');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('WATCHED', 'WATCHLIST');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('TMDB', 'IGDB', 'MANUAL');

-- CreateEnum
CREATE TYPE "CreditRole" AS ENUM ('ACTOR', 'DIRECTOR', 'WRITER', 'CREATOR', 'DESIGNER', 'DEVELOPER', 'PUBLISHER', 'STUDIO');

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "year" INTEGER,
    "durationMin" INTEGER,
    "description" TEXT,
    "posterUrl" TEXT,
    "localPoster" TEXT,
    "rating" INTEGER,
    "opinion" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'WATCHED',
    "watchCount" INTEGER NOT NULL DEFAULT 1,
    "firstWatched" TIMESTAMP(3),
    "lastWatched" TIMESTAMP(3),
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
    "tmdbId" INTEGER,
    "igdbId" INTEGER,
    "cachedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchLog" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagOnMedia" (
    "mediaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagOnMedia_pkey" PRIMARY KEY ("mediaId","tagId")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "photoUrl" TEXT,
    "localPhoto" TEXT,
    "tmdbId" INTEGER,
    "igdbId" INTEGER,
    "worksCachedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "tmdbId" INTEGER,
    "igdbId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "role" "CreditRole" NOT NULL,
    "character" TEXT,
    "mediaId" TEXT NOT NULL,
    "personId" TEXT,
    "companyId" TEXT,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaItem_type_idx" ON "MediaItem"("type");

-- CreateIndex
CREATE INDEX "MediaItem_visibility_idx" ON "MediaItem"("visibility");

-- CreateIndex
CREATE INDEX "MediaItem_status_idx" ON "MediaItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_type_tmdbId_key" ON "MediaItem"("type", "tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_type_igdbId_key" ON "MediaItem"("type", "igdbId");

-- CreateIndex
CREATE INDEX "WatchLog_mediaId_idx" ON "WatchLog"("mediaId");

-- CreateIndex
CREATE INDEX "WatchLog_watchedAt_idx" ON "WatchLog"("watchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_tmdbId_key" ON "Person"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_igdbId_key" ON "Person"("igdbId");

-- CreateIndex
CREATE INDEX "Person_name_idx" ON "Person"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_tmdbId_key" ON "Company"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_igdbId_key" ON "Company"("igdbId");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Credit_mediaId_idx" ON "Credit"("mediaId");

-- CreateIndex
CREATE INDEX "Credit_personId_idx" ON "Credit"("personId");

-- CreateIndex
CREATE INDEX "Credit_companyId_idx" ON "Credit"("companyId");

-- AddForeignKey
ALTER TABLE "WatchLog" ADD CONSTRAINT "WatchLog_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagOnMedia" ADD CONSTRAINT "TagOnMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagOnMedia" ADD CONSTRAINT "TagOnMedia_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;


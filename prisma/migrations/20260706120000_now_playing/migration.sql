-- Naujas MediaStatus: PLAYING (dabar aktyviai zaidziu/ziuriu - GAME/SERIES/ANIME).
-- Addityvu: senas kodas naujos reiksmes nenaudoja, esami irasai nepaliesti.
-- ADD VALUE autocommit rezimu (psql be BEGIN) - saugu; IF NOT EXISTS -> idempotentu.
ALTER TYPE "MediaStatus" ADD VALUE IF NOT EXISTS 'PLAYING';

-- Daugiakalbis turinys ir suaugusiuju turinio filtras.

-- MediaItem: daugiakalbis title/description saugojimas (JSONB).
-- Formatas: { "en": {"title": "...", "description": "..."}, "de": {...}, "lt": {...} }
ALTER TABLE "MediaItem" ADD COLUMN "translations" JSONB;

-- User: suaugusiuju turinio leidimas (numatytai false = blokuota paieskoje/importe).
ALTER TABLE "User" ADD COLUMN "allowAdult" BOOLEAN NOT NULL DEFAULT false;

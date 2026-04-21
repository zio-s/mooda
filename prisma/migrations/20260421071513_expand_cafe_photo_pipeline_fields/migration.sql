-- Expand CafePhoto with pipeline metadata fields (T-SCRIPT-02)
--
-- Columns are all nullable — safe to apply live. Existing rows keep NULL
-- until the thumbnail-fix script / future collectors backfill them.
--
-- Unique constraint (cafeId, url) enforces URL-level dedup which the
-- current `skipDuplicates: true` logic relies on. Prior scan confirmed
-- zero existing duplicate groups (scripts/check-photo-duplicates.ts).

-- AlterTable: new nullable columns
ALTER TABLE "cafe_photos" ADD COLUMN IF NOT EXISTS "originalUrl" TEXT;
ALTER TABLE "cafe_photos" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE "cafe_photos" ADD COLUMN IF NOT EXISTS "width" INTEGER;
ALTER TABLE "cafe_photos" ADD COLUMN IF NOT EXISTS "height" INTEGER;
ALTER TABLE "cafe_photos" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
ALTER TABLE "cafe_photos" ADD COLUMN IF NOT EXISTS "attribution" TEXT;

-- CreateIndex: sourceType filter (naver/google/manual)
CREATE INDEX IF NOT EXISTS "cafe_photos_sourceType_idx" ON "cafe_photos"("sourceType");

-- CreateIndex: (cafeId, url) uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "cafe_photos_cafeId_url_key" ON "cafe_photos"("cafeId", "url");

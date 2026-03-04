-- AlterTable: Add emailVerified to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMPTZ;

-- AlterTable: Add googlePlaceId to cafes
ALTER TABLE "cafes" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "cafes_googlePlaceId_key" ON "cafes"("googlePlaceId");

-- CreateTable: google_place_cache
CREATE TABLE IF NOT EXISTS "google_place_cache" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "cafeId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "google_place_cache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "google_place_cache_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE
);

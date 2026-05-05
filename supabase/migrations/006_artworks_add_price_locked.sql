-- Exclude artwork from bulk price adjustments.

ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS price_locked BOOLEAN NOT NULL DEFAULT false;


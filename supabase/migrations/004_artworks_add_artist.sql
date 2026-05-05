-- Optional artist field for artworks.

ALTER TABLE artworks
ADD COLUMN IF NOT EXISTS artist VARCHAR(120);


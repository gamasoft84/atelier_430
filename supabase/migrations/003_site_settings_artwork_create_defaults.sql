-- Add configurable defaults for "Nueva obra" form.
-- Stored in `site_settings` (JSONB) so it can be edited from Admin UI.

INSERT INTO site_settings (key, value)
VALUES (
  'artwork_create_defaults',
  '{
    "category": "europea",
    "subcategory": "Bodegón",
    "technique": "oleo",
    "artist": "F. Caltenco",
    "width_cm": 60,
    "height_cm": 80,
    "has_frame": false,
    "price": 1000,
    "original_price": 4560
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;


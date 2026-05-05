-- Ensure `artwork_create_defaults` includes default artist for existing DBs
-- that already inserted the row from migration 003 before `artist` existed.

UPDATE site_settings
SET value = value || '{"artist":"F. Caltenco"}'::jsonb
WHERE key = 'artwork_create_defaults'
  AND NOT (value ? 'artist');

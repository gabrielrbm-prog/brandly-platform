-- Migration 0005: reverter instagram_handle/tiktok_handle em brands
-- (foi um erro de interpretação — esses campos são do creator, não da marca)
ALTER TABLE brands DROP COLUMN IF EXISTS instagram_handle;
ALTER TABLE brands DROP COLUMN IF EXISTS tiktok_handle;

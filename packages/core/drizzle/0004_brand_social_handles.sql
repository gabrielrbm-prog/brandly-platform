-- Migration 0004: perfis oficiais da marca (Instagram/TikTok) como referência de match
ALTER TABLE brands ADD COLUMN IF NOT EXISTS instagram_handle varchar(100);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tiktok_handle varchar(100);

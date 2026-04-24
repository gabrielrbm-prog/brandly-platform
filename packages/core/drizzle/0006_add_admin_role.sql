-- Migration: Add admin_role enum and column to users
-- Adds granular admin permissions (super_admin, educator, financial, moderator, viewer)
-- adminRole is nullable: only meaningful when users.role = 'admin'

CREATE TYPE "admin_role" AS ENUM (
  'super_admin',
  'educator',
  'financial',
  'moderator',
  'viewer'
);

ALTER TABLE "users"
  ADD COLUMN "admin_role" "admin_role";

-- Backfill: existing admins become super_admin to preserve current behavior
UPDATE "users"
SET "admin_role" = 'super_admin'
WHERE "role" = 'admin' AND "admin_role" IS NULL;

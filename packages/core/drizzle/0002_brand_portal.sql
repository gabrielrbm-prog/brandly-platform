-- ============================================
-- Migration: Portal das Marcas
-- Adds: precificacao por marca/briefing + tabelas de acesso e payout
-- ============================================

-- Precificacao padrao por marca (video_price_brand, video_price_creator)
ALTER TABLE "brands"
  ADD COLUMN IF NOT EXISTS "video_price_brand" numeric(10, 2) NOT NULL DEFAULT '15.00',
  ADD COLUMN IF NOT EXISTS "video_price_creator" numeric(10, 2) NOT NULL DEFAULT '10.00';

-- Override opcional por briefing (null = usa da marca)
ALTER TABLE "briefings"
  ADD COLUMN IF NOT EXISTS "video_price_brand" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "video_price_creator" numeric(10, 2);

-- Vincula user (role='brand') a uma marca especifica
CREATE TABLE IF NOT EXISTS "brand_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id"),
  "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "brand_users_brand_idx" ON "brand_users"("brand_id");

-- Convites pendentes para criar conta de marca
CREATE TABLE IF NOT EXISTS "brand_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL,
  "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
  "token" varchar(64) NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "brand_invites_token_idx" ON "brand_invites"("token");
CREATE INDEX IF NOT EXISTS "brand_invites_brand_idx" ON "brand_invites"("brand_id");

-- Status do payout
DO $$ BEGIN
  CREATE TYPE "brand_payout_status" AS ENUM ('pending', 'received', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payouts mensais por creator (agregado dos videos aprovados)
CREATE TABLE IF NOT EXISTS "brand_payouts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
  "creator_id" uuid NOT NULL REFERENCES "users"("id"),
  "period" varchar(7) NOT NULL,
  "video_count" integer NOT NULL,
  "amount_total" numeric(12, 2) NOT NULL,
  "amount_creator" numeric(12, 2) NOT NULL,
  "amount_fee" numeric(12, 2) NOT NULL,
  "status" brand_payout_status NOT NULL DEFAULT 'pending',
  "payment_proof_url" text,
  "paid_to_brandly_at" timestamp,
  "paid_to_creator_at" timestamp,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "brand_payouts_brand_idx" ON "brand_payouts"("brand_id");
CREATE INDEX IF NOT EXISTS "brand_payouts_creator_idx" ON "brand_payouts"("creator_id");
CREATE INDEX IF NOT EXISTS "brand_payouts_period_idx" ON "brand_payouts"("period");
CREATE INDEX IF NOT EXISTS "brand_payouts_status_idx" ON "brand_payouts"("status");

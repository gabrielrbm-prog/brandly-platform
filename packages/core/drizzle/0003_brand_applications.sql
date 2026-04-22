-- Migration 0003: Brand applications + match criteria + price update
-- 2026-04-22

-- 1. Atualizar preço default de R$15 para R$20 (marca paga) — creator continua R$10, Brandly fica R$10
ALTER TABLE brands ALTER COLUMN video_price_brand SET DEFAULT '20.00';

-- 2. Atualizar marcas existentes que ainda estão no preço antigo
UPDATE brands SET video_price_brand = '20.00' WHERE video_price_brand = '15.00';

-- 3. Critérios de match (usados pela IA pra avaliar candidaturas)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS target_age_min integer;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS target_age_max integer;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS target_gender varchar(20); -- any | female | male | other
ALTER TABLE brands ADD COLUMN IF NOT EXISTS min_instagram_followers integer;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS min_tiktok_followers integer;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS ai_criteria text; -- texto livre com diretrizes de creator ideal

-- 4. Enum de status da candidatura
DO $$ BEGIN
  CREATE TYPE brand_application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. Tabela de candidaturas
CREATE TABLE IF NOT EXISTS brand_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Dados do formulário
  full_name varchar(255) NOT NULL,
  age integer NOT NULL,
  email varchar(255) NOT NULL,
  gender varchar(20) NOT NULL, -- female | male | other
  instagram_handle varchar(100),
  tiktok_handle varchar(100),

  -- Análise IA
  match_score integer, -- 0-100
  ai_analysis text,
  ai_reasoning jsonb, -- breakdown por critério

  -- Workflow
  status brand_application_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_at timestamp,
  reviewed_by uuid REFERENCES users(id),

  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_applications_brand_idx ON brand_applications(brand_id);
CREATE INDEX IF NOT EXISTS brand_applications_creator_idx ON brand_applications(creator_id);
CREATE INDEX IF NOT EXISTS brand_applications_status_idx ON brand_applications(status);

-- Uma candidatura ativa (pending) por creator+brand
CREATE UNIQUE INDEX IF NOT EXISTS brand_applications_unique_pending
  ON brand_applications(brand_id, creator_id)
  WHERE status = 'pending';

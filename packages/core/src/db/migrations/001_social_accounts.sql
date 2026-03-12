-- Tabela de contas sociais conectadas via Phyllo
CREATE TYPE social_platform AS ENUM ('instagram', 'tiktok');
CREATE TYPE social_account_status AS ENUM ('connected', 'disconnected', 'expired');

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  platform social_platform NOT NULL,
  phyllo_user_id VARCHAR(100),
  phyllo_account_id VARCHAR(100),
  phyllo_profile_id VARCHAR(100),
  platform_username VARCHAR(255),
  platform_url TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_views INTEGER DEFAULT 0,
  avg_comments INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  status social_account_status NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX social_accounts_user_idx ON social_accounts(user_id);
CREATE INDEX social_accounts_phyllo_account_idx ON social_accounts(phyllo_account_id);
CREATE INDEX social_accounts_platform_idx ON social_accounts(user_id, platform);

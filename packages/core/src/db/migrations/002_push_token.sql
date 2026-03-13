-- Adiciona coluna push_token na tabela users para push notifications (Expo)
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

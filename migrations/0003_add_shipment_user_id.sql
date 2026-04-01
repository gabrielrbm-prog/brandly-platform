ALTER TABLE shipments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS shipments_user_idx ON shipments(user_id);

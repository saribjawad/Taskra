-- Up Migration
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hash_key TEXT NOT NULL,
  EXPIRES_AT TIMESTAMP NOT NULL,
  CREATED_AT TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE IF EXISTS password_reset_tokens;

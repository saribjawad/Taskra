-- Up Migration
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK(status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')) default 'pending',
  email VARCHAR(250) UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  workspace_id UUID REFERENCES workspace(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration
DROP TABLE IF EXISTS invitations;
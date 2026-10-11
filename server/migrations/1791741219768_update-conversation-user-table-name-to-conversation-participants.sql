-- Up Migration
DROP TABLE conversation_users;
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);


-- Down Migration
DROP TABLE conversation_participants;
CREATE TABLE conversation_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

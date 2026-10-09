-- Up Migration
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message_date TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Down Migration
DROP TABLE conversations ;

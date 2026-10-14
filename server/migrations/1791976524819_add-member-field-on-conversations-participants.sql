-- Up Migration
ALTER TABLE conversation_participants
ADD COLUMN member TEXT DEFAULT NULL CHECK (member IN('admin', 'member'));

-- Down Migration
ALTER TABLE conversation_participants
DROP COLUMN member;

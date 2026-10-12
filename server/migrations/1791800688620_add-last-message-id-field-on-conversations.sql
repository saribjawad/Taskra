-- Up Migration
ALTER TABLE conversations
ADD last_message_id UUID REFERENCES messages(id) DEFAULT NULL;

-- Down Migration
ALTER TABLE conversations
DROP COLUMN last_message_id;

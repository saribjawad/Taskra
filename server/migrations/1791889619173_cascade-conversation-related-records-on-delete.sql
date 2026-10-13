-- Up Migration
ALTER TABLE messages
DROP CONSTRAINT messages_conversation_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES conversations(id)
ON DELETE CASCADE;

ALTER TABLE conversation_participants
DROP CONSTRAINT conversation_participants_conversation_id_fkey;

ALTER TABLE conversation_participants
ADD CONSTRAINT conversation_participants_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES conversations(id)
ON DELETE CASCADE;

ALTER TABLE messages
DROP CONSTRAINT messages_conversation_participant_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_conversation_participant_id_fkey
FOREIGN KEY (conversation_participant_id)
REFERENCES conversation_participants(id)
ON DELETE CASCADE;

ALTER TABLE conversations
DROP CONSTRAINT conversations_last_message_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_last_message_id_fkey
FOREIGN KEY (last_message_id)
REFERENCES messages(id)
ON DELETE SET NULL;

-- Down Migration
ALTER TABLE messages
DROP CONSTRAINT messages_conversation_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES conversations(id)
ON DELETE NO ACTION;

ALTER TABLE conversation_participants
DROP CONSTRAINT conversation_participants_conversation_id_fkey;

ALTER TABLE conversation_participants
ADD CONSTRAINT conversation_participants_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES conversations(id)
ON DELETE NO ACTION;

ALTER TABLE messages
DROP CONSTRAINT messages_conversation_participant_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_conversation_participant_id_fkey
FOREIGN KEY (conversation_participant_id)
REFERENCES conversation_participants(id)
ON DELETE NO ACTION;

ALTER TABLE conversations
DROP CONSTRAINT conversations_last_message_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_last_message_id_fkey
FOREIGN KEY (last_message_id)
REFERENCES messages(id)
ON DELETE NO ACTION;

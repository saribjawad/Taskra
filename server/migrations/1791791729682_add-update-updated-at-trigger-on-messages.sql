-- Up Migration
CREATE TRIGGER update_message_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Down Migration
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;

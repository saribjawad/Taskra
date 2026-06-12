-- Up Migration
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Down Migration
DROP TRIGGER IF EXISTS update_comments_updated_at ON tasks;

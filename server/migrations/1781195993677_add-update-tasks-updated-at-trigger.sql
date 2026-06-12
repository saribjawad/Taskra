-- Up Migration
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Down Migration
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

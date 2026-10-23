-- Up Migration
ALTER TABLE sub_tasks
  ADD COLUMN assignee UUID REFERENCES users(id) ON DELETE SET NULL;

-- Down Migration
ALTER TABLE sub_tasks DROP COLUMN assignee;

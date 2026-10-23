-- Up Migration
ALTER TABLE sub_tasks ADD COLUMN description TEXT;

-- Down Migration
ALTER TABLE sub_tasks DROP COLUMN description;

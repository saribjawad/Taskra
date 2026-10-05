-- Up Migration
ALTER TABLE users
ADD COLUMN full_name TEXT NOT NULL;

-- Down Migration
ALTER TABLE users
DROP COLUMN full_name;
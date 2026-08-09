-- Up Migration
ALTER TABLE attachments 
ADD storage_id TEXT NOT NULL UNIQUE;

-- Down Migration
ALTER TABLE attachments
DROP COLUMN storage_id;
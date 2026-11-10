-- Up Migration
ALTER TABLE attachments
ADD comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Down Migration
ALTER TABLE attachments
DROP comment_id;

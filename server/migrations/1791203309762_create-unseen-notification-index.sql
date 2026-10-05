-- Up Migration
CREATE INDEX idx_notifications_unseen ON notifications(user_id)
WHERE seen = false;

-- Down Migration
DROP INDEX idx_notifications_unseen;
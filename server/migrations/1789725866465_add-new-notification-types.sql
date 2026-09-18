-- Up Migration
ALTER TABLE notifications
  DROP CONSTRAINT notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (type IN ('task:completed', 'task:assigned', 'task:reporter_assigned', 'task:commented', 'task:due_soon',
  'invite:accepted', 'invite:declined'));

-- Down Migration
ALTER TABLE notifications
  DROP CONSTRAINT notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (type IN ('task:completed', 'task:assigned', 'task:reporter_assigned', 'task:commented', 'task:due_soon'));
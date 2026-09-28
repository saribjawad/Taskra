-- Up Migration
ALTER TABLE notifications
DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN 
  (
    'task:completed',
    'task:assigned',
    'task:reporter_assigned',
    'task:commented',
    'task:due_soon',
    'invite:accepted',
    'invite:declined',
    'project:completed',
    'project:lead_assigned',
    'project:member_assigned',
    'project:task_added',
    'project:commented',
    'project:target_date_soon'
  )
)

-- Down Migration
ALTER TABLE notifications
DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN 
  (
    'task:completed',
    'task:assigned',
    'task:reporter_assigned',
    'task:commented',
    'task:due_soon',
    'invite:accepted',
    'invite:declined'
  )
)
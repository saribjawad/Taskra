-- Up Migration

ALTER TABLE tasks
DROP CONSTRAINT tasks_label_check;

ALTER TABLE tasks
ADD CONSTRAINT tasks_lable_check
CHECK (label IN ('label', 'feature', 'improvement'));

-- Down Migration

ALTER TABLE tasks
DROP CONSTRAINT tasks_label_check;

ALTER TABLE tasks
ADD CONSTRAINT tasks_lable_check
CHECK (label IN ('label', 'feature', 'improvemnt'));
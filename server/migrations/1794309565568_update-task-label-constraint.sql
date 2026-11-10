-- Up Migration
ALTER TABLE tasks
DROP CONSTRAINT tasks_lable_check;

ALTER TABLE tasks
ADD CONSTRAINT tasks_lable_check CHECK (label IN ('bug', 'feature', 'improvement'));

-- Down Migration
ALTER TABLE tasks
DROP CONSTRAINT tasks_lable_check;

ALTER TABLE tasks
ADD CONSTRAINT tasks_lable_check CHECK (label IN ('label', 'feature', 'improvement'));

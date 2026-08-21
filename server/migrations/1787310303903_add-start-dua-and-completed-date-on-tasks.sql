-- Up Migration
ALTER TABLE tasks
  ADD COLUMN start_date DATE,
  ADD COLUMN due_date DATE,
  ADD COLUMN completed_date DATE;

-- Down Migration
ALTER TABLE tasks 
  DROP COLUMN start_date, 
  DROP COLUMN due_date, 
  DROP COLUMN completed_date;
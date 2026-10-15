-- Up Migration
ALTER TABLE teams
ADD COLUMN identifier VARCHAR(6) NOT NULL;

-- Down Migration
ALTER TABLE teams
DROP COLUMN identifier;

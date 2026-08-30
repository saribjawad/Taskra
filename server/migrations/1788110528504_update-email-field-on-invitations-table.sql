-- Up Migration
ALTER TABLE invitations
DROP CONSTRAINT invitations_email_key;

-- Down Migration
ALTER TABLE invitations
ADD CONSTRAINT invitations_email_key UNIQUE (email);

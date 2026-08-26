-- Up Migration
ALTER TABLE invitations
ADD CONSTRAINT invitations_role_check
CHECK(role IN('member', 'owner', 'viewer', 
'admin'));


-- Down Migration
ALTER TABLE invitations
DROP CONSTRAINT invitations_role_check;
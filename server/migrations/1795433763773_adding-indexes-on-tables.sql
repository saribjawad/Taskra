-- Up Migration
CREATE INDEX ON tasks(project_id);
CREATE INDEX ON projects(workspace_id);
CREATE INDEX ON sub_tasks(task_id);
CREATE INDEX ON attachments(sub_task_id);
CREATE INDEX ON project_milestones(project_id);
CREATE INDEX ON teams(workspace_id);
CREATE INDEX ON team_documents(team_id);
CREATE INDEX ON team_links(team_id);
CREATE INDEX ON conversations(workspace_id);
CREATE INDEX ON workspace_members(workspace_id);
CREATE INDEX ON comments(task_id);
CREATE INDEX ON comments(project_id);
CREATE INDEX ON conversation_participants(conversation_id);

CREATE UNIQUE INDEX ON workspace_members(user_id, workspace_id);
CREATE UNIQUE INDEX ON conversation_participants(user_id, conversation_id);
CREATE UNIQUE INDEX ON team_members(user_id, team_id);
CREATE INDEX ON notifications(user_id, workspace_id, created_at DESC);


-- Down Migration
DROP INDEX tasks_project_id_idx;
DROP INDEX projects_workspace_id_idx;
DROP INDEX sub_tasks_task_id_idx;
DROP INDEX attachments_sub_task_id_idx;
DROP INDEX project_milestones_project_id_idx;
DROP INDEX teams_workspace_id_idx;
DROP INDEX team_documents_team_id_idx;
DROP INDEX team_links_team_id_idx;
DROP INDEX conversations_workspace_id_idx;
DROP INDEX comments_task_id_idx;
DROP INDEX comments_project_id_idx;
DROP INDEX conversation_participants_conversation_id_idx;

DROP INDEX workspace_members_user_id_workspace_id_idx;
DROP INDEX conversation_participants_user_id_conversation_id_idx;
DROP INDEX team_members_user_id_team_id_idx;
DROP INDEX notifications_user_id_workspace_id_created_at_idx;

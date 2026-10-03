import { dbPool } from '../db';

export interface DashboardTaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  projectName: string | null;
  assigneeName: string | null;
}

export interface DashboardSummary {
  createdThisWeek: number;
  completedThisWeek: number;
  completedLastWeek: number;
  overdueTaskCount: number;
  overdueHighPriorityCount: number;
  upcomingDeadlineCount: number;
  upcomingProjectCount: number;
}

export interface CompletionDay {
  date: string;
  count: number;
}

export interface TaskStatusCount {
  status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled';
  count: number;
}

interface DashboardTaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string;
  project_name: string | null;
  assignee_name: string | null;
}

export async function getDashboardSummary(
  workspaceId: string,
): Promise<DashboardSummary> {
  const result = await dbPool.query(
    `
    SELECT
      COUNT(*) FILTER (
        WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
          AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
      )::int AS created_this_week,
      COUNT(*) FILTER (
        WHERE status = 'done'
          AND COALESCE(completed_date, updated_at::date) >= DATE_TRUNC('week', CURRENT_DATE)::date
          AND COALESCE(completed_date, updated_at::date) < DATE_TRUNC('week', CURRENT_DATE)::date + 7
      )::int AS completed_this_week,
      COUNT(*) FILTER (
        WHERE status = 'done'
          AND COALESCE(completed_date, updated_at::date) >= DATE_TRUNC('week', CURRENT_DATE)::date - 7
          AND COALESCE(completed_date, updated_at::date) < DATE_TRUNC('week', CURRENT_DATE)::date
      )::int AS completed_last_week,
      COUNT(*) FILTER (
        WHERE status NOT IN ('done', 'cancelled') AND due_date < CURRENT_DATE
      )::int AS overdue_task_count,
      COUNT(*) FILTER (
        WHERE status NOT IN ('done', 'cancelled')
          AND due_date < CURRENT_DATE
          AND priority IN ('urgent', 'high')
      )::int AS overdue_high_priority_count,
      COUNT(*) FILTER (
        WHERE status NOT IN ('done', 'cancelled')
          AND due_date >= CURRENT_DATE
          AND due_date <= CURRENT_DATE + 7
      )::int AS upcoming_deadline_count,
      COUNT(DISTINCT project_id) FILTER (
        WHERE status NOT IN ('done', 'cancelled')
          AND due_date >= CURRENT_DATE
          AND due_date <= CURRENT_DATE + 7
          AND project_id IS NOT NULL
      )::int AS upcoming_project_count
    FROM tasks
    WHERE workspace_id = $1
    `,
    [workspaceId],
  );

  const row = result.rows[0];
  return {
    createdThisWeek: row.created_this_week,
    completedThisWeek: row.completed_this_week,
    completedLastWeek: row.completed_last_week,
    overdueTaskCount: row.overdue_task_count,
    overdueHighPriorityCount: row.overdue_high_priority_count,
    upcomingDeadlineCount: row.upcoming_deadline_count,
    upcomingProjectCount: row.upcoming_project_count,
  };
}

export async function getTaskStatusBreakdown(
  workspaceId: string,
): Promise<TaskStatusCount[]> {
  const result = await dbPool.query<TaskStatusCount>(
    `
    SELECT status, COUNT(*)::int AS count
    FROM tasks
    WHERE workspace_id = $1
    GROUP BY status
    `,
    [workspaceId],
  );

  const counts = new Map(
    result.rows.map(({ status, count }) => [status, count]),
  );

  const statuses: TaskStatusCount['status'][] = [
    'backlog',
    'todo',
    'in_progress',
    'done',
    'cancelled',
  ];

  return statuses.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export async function getCompletionTrend(
  workspaceId: string,
): Promise<CompletionDay[]> {
  const result = await dbPool.query<CompletionDay>(
    `
    WITH 
    days AS (
      SELECT generate_series(
        CURRENT_DATE - 89,
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS day
    ),
    completed AS (
      SELECT
        COALESCE(completed_date, updated_at::date) AS day,
        COUNT(*)::int AS count
      FROM tasks
      WHERE workspace_id = $1
        AND status = 'done'
        AND COALESCE(completed_date, updated_at::date)
          BETWEEN CURRENT_DATE - 89 AND CURRENT_DATE
      GROUP BY COALESCE(completed_date, updated_at::date)
    )
    SELECT
      TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
      COALESCE(completed.count, 0)::int AS count
    FROM days
    LEFT JOIN completed ON completed.day = days.day
    ORDER BY days.day ASC
    `,
    [workspaceId],
  );

  return result.rows;
}

export async function getOverdueTasks(
  workspaceId: string,
): Promise<DashboardTaskSummary[]> {
  const result = await dbPool.query<DashboardTaskRow>(
    `
    SELECT
      tasks.id,
      tasks.title,
      tasks.status,
      tasks.priority,
      tasks.due_date::text AS due_date,
      projects.name AS project_name,
      COALESCE(NULLIF(users.username, ''), users.email) AS assignee_name
    FROM tasks
    LEFT JOIN projects ON projects.id = tasks.project_id
    LEFT JOIN users ON users.id = tasks.assignee
    WHERE tasks.workspace_id = $1
      AND tasks.status NOT IN ('done', 'cancelled')
      AND tasks.due_date < CURRENT_DATE
    ORDER BY
      CASE tasks.priority
        WHEN 'urgent' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END,
      tasks.due_date ASC,
      tasks.id ASC
    LIMIT 3
    `,
    [workspaceId],
  );

  return result.rows.map(toDashboardTask);
}

export async function getUpcomingDeadlines(
  workspaceId: string,
): Promise<DashboardTaskSummary[]> {
  const result = await dbPool.query<DashboardTaskRow>(
    `
    SELECT
      tasks.id,
      tasks.title,
      tasks.status,
      tasks.priority,
      tasks.due_date::text AS due_date,
      projects.name AS project_name,
      COALESCE(NULLIF(users.username, ''), users.email) AS assignee_name
    FROM tasks
    LEFT JOIN projects ON projects.id = tasks.project_id
    LEFT JOIN users ON users.id = tasks.assignee
    WHERE tasks.workspace_id = $1
      AND tasks.status NOT IN ('done', 'cancelled')
      AND tasks.due_date >= CURRENT_DATE
      AND tasks.due_date <= CURRENT_DATE + 7
    ORDER BY tasks.due_date ASC, tasks.id ASC
    LIMIT 3
    `,
    [workspaceId],
  );

  return result.rows.map(toDashboardTask);
}

function toDashboardTask(task: DashboardTaskRow): DashboardTaskSummary {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
    projectName: task.project_name,
    assigneeName: task.assignee_name,
  };
}

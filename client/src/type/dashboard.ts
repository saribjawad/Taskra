export interface DashboardTaskSummary {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string
  projectName: string | null
  assigneeName: string | null
}

export interface WorkspaceDashboard {
  summary: {
    createdThisWeek: number
    completedThisWeek: number
    completedLastWeek: number
    overdueTaskCount: number
    overdueHighPriorityCount: number
    upcomingDeadlineCount: number
    upcomingProjectCount: number
  }
  completionTrend: { date: string; count: number }[]
  taskStatusBreakdown: {
    status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'cancelled'
    count: number
  }[]
  overdueTasks: DashboardTaskSummary[]
  upcomingDeadlines: DashboardTaskSummary[]
}

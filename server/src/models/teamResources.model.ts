export interface TeamDocument {
  id: string;
  team_id: string;
  created_by: string | null;
  created_by_full_name?: string | null;
  created_by_username?: string | null;
  name: string;
  content: string | null;
  updated_at: Date;
  created_at: Date;
}

export interface TeamLink {
  id: string;
  team_id: string;
  created_by: string | null;
  created_by_full_name?: string | null;
  created_by_username?: string | null;
  title: string;
  url: string;
  updated_at: Date;
  created_at: Date;
}

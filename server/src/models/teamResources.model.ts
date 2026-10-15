export interface TeamDocument {
  id: string;
  team_id: string;
  name: string;
  content: string | null;
  updated_at: Date;
  created_at: Date;
}

export interface TeamLink {
  id: string;
  team_id: string;
  title: string;
  url: string;
  updated_at: Date;
  created_at: Date;
}

export interface User {
  id: string;
  active_workspace: string | null;
  username: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  hashed_password: string;
  refresh_token: string | null;
  created_at: Date;
  updated_at: Date;
}

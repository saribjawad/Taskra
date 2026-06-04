export type User = {
  id: string;
  username: string;
  email: string;
  is_verfied: boolean;
  hashed_password: string;
  refresh_token: string | null;
  created_at: Date;
};

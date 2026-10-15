export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  created_at: Date;
}

export interface TeamMemberWithUserDetails extends TeamMember {
  username: string;
  full_name: string;
  email: string;
}

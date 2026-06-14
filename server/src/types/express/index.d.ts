declare namespace Express {
  interface Request {
    user: {
      id: string;
      email: string;
      active_workspace?: string;
    };
  }
}

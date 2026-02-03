export type UserProfile = {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type AuthSession = {
  isReady: boolean;
  isAuthenticated: boolean;
  profile?: UserProfile | null;
  roles: string[];
  tokenParsed?: Record<string, unknown> | null;
};

export type AuthMode = 'none' | 'oidc' | 'proxy';

export type HubUser = {
  sub: string;
  username: string;
  email?: string;
};

export type HubAuth = {
  mode: AuthMode;
};

export type HubLimits = {
  maxConcurrentSessions: number;
};

export type HubStream = {
  provider: string;
  browserPlayable: boolean;
};

export type HubGame = {
  id: string;
  name: string;
  description: string;
  platform?: string;
  streamProvider?: string;
};

export type HubSession = {
  id: string;
  userId: string;
  username: string;
  gameId: string;
  gameName: string;
  platform?: string;
  streamProvider?: string;
  startedAt: string;
};

export type HubResponse = {
  user: HubUser;
  auth?: HubAuth;
  limits: HubLimits;
  stream?: HubStream;
  games: HubGame[];
  activeSessions: HubSession[];
  userSession: HubSession | null;
};

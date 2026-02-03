import type { UserProfile } from '@/domain/auth';

export type AuthInitResult = {
  authenticated: boolean;
  profile?: UserProfile | null;
  tokenParsed?: Record<string, unknown> | null;
};

export interface AuthPort {
  init: () => Promise<AuthInitResult>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<Record<string, unknown> | null>;
  getAccessToken: () => string | null;
  getRoles: () => string[];
  getConfig: () => { url: string; realm: string; clientId: string };
  setConfig: (config: { url: string; realm: string; clientId: string }) => void;
}

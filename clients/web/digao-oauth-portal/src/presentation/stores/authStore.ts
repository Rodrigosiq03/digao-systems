import { create } from 'zustand';
import type { AuthSession } from '@/domain/auth';
import { createAuthUseCases } from '@/application/auth/authUseCases';
import { keycloakAuthClient } from '@/infrastructure/auth/keycloakClient';

const authUseCases = createAuthUseCases(keycloakAuthClient);

type AuthStore = AuthSession & {
  init: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setConfig: (config: { url: string; realm: string; clientId: string }) => void;
  getConfig: () => { url: string; realm: string; clientId: string };
};

export const useAuthStore = create<AuthStore>((set) => ({
  isReady: false,
  isAuthenticated: false,
  profile: null,
  roles: [],
  tokenParsed: null,
  init: async () => {
    try {
      const result = await authUseCases.init();
      set({
        isReady: true,
        isAuthenticated: result.authenticated,
        profile: result.profile ?? null,
        tokenParsed: result.tokenParsed ?? null,
        roles: authUseCases.roles()
      });
    } catch {
      set({
        isReady: true,
        isAuthenticated: false,
        profile: null,
        tokenParsed: null,
        roles: []
      });
    }
  },
  login: async () => {
    await authUseCases.login();
  },
  logout: async () => {
    await authUseCases.logout();
  },
  refresh: async () => {
    const tokenParsed = await authUseCases.refresh();
    if (tokenParsed) {
      set({ tokenParsed, roles: authUseCases.roles() });
    }
  },
  setConfig: (config) => authUseCases.setConfig(config),
  getConfig: () => authUseCases.getConfig()
}));

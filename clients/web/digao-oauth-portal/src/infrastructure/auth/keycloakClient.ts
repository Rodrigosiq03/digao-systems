import Keycloak from 'keycloak-js';
import type { AuthInitResult, AuthPort } from '@/application/auth/authPort';
import type { UserProfile } from '@/domain/auth';

const CONFIG_KEY = 'digao-keycloak-config';

type KeycloakConfig = {
  url: string;
  realm: string;
  clientId: string;
};

const defaultConfig: KeycloakConfig = {
  url: import.meta.env.VITE_KC_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KC_REALM || 'digao-oauth-dev',
  clientId: import.meta.env.VITE_KC_CLIENT_ID || 'digao-oauth-portal'
};

const getStoredConfig = (): KeycloakConfig => {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return defaultConfig;
  try {
    const parsed = JSON.parse(raw) as KeycloakConfig;
    return {
      url: parsed.url || defaultConfig.url,
      realm: parsed.realm || defaultConfig.realm,
      clientId: parsed.clientId || defaultConfig.clientId
    };
  } catch {
    return defaultConfig;
  }
};

let keycloakInstance: Keycloak | null = null;
let activeConfig: KeycloakConfig = getStoredConfig();
let initPromise: Promise<AuthInitResult> | null = null;
let initResult: AuthInitResult | null = null;

const buildKeycloak = () => {
  const current = getStoredConfig();
  activeConfig = current;
  keycloakInstance = new Keycloak({
    url: current.url,
    realm: current.realm,
    clientId: current.clientId
  });
  return keycloakInstance;
};

const getKeycloak = () => keycloakInstance ?? buildKeycloak();

const mapProfile = (profile?: Keycloak.KeycloakProfile | null): UserProfile | null => {
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName
  };
};

export const keycloakAuthClient: AuthPort = {
  init: async (): Promise<AuthInitResult> => {
    const client = getKeycloak();
    if (initResult) return initResult;
    if (initPromise) return initPromise;

    initPromise = client
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        checkLoginIframe: false
      })
      .then(async (authenticated) => {
        if (!authenticated) {
          initResult = { authenticated: false };
          return initResult;
        }

        const profile = await client.loadUserProfile();
        initResult = {
          authenticated,
          profile: mapProfile(profile),
          tokenParsed: client.tokenParsed || null
        };
        return initResult;
      })
      .finally(() => {
        initPromise = null;
      });

    return initPromise;
  },
  login: async () => {
    const client = getKeycloak();
    await client.login({ redirectUri: window.location.origin });
  },
  logout: async () => {
    const client = getKeycloak();
    await client.logout({ redirectUri: window.location.origin });
  },
  refresh: async () => {
    const client = getKeycloak();
    if (!client.authenticated || !client.token) {
      return null;
    }
    try {
      await client.updateToken(30);
      return client.tokenParsed || null;
    } catch {
      return null;
    }
  },
  getAccessToken: () => {
    const client = getKeycloak();
    return client.token ?? null;
  },
  getRoles: () => {
    const client = getKeycloak();
    const realmRoles = client.tokenParsed?.realm_access?.roles ?? [];
    const clientId = activeConfig.clientId;
    const clientRoles = client.tokenParsed?.resource_access?.[clientId]?.roles ?? [];
    return Array.from(new Set([...(realmRoles as string[]), ...(clientRoles as string[])]));
  },
  getConfig: () => ({ ...activeConfig }),
  setConfig: (config) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    window.location.reload();
  }
};

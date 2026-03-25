import Keycloak from 'keycloak-js';
import type { AuthInitResult, AuthPort } from '@/application/auth/authPort';
import type { UserProfile } from '@/domain/auth';

type KeycloakConfig = {
  url: string;
  realm: string;
  clientId: string;
};

const requireEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing required auth config: ${key}`);
  }
  return value;
};

const defaultConfig: KeycloakConfig = {
  url: requireEnv(import.meta.env.VITE_KC_URL, 'VITE_KC_URL'),
  realm: requireEnv(import.meta.env.VITE_KC_REALM, 'VITE_KC_REALM'),
  clientId: requireEnv(import.meta.env.VITE_KC_CLIENT_ID, 'VITE_KC_CLIENT_ID')
};

let keycloakInstance: Keycloak | null = null;
let activeConfig: KeycloakConfig = defaultConfig;
let initPromise: Promise<AuthInitResult> | null = null;
let initResult: AuthInitResult | null = null;
const INIT_TIMEOUT_MS = 8000;

const buildKeycloak = () => {
  activeConfig = defaultConfig;
  keycloakInstance = new Keycloak({
    url: activeConfig.url,
    realm: activeConfig.realm,
    clientId: activeConfig.clientId
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

    const resolveUnauthenticated = () => ({ authenticated: false } as AuthInitResult);

    const boot = client
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        checkLoginIframe: false
      })
      .then(async (authenticated) => {
        if (!authenticated) {
          return resolveUnauthenticated();
        }

        const profile = await client.loadUserProfile();
        return {
          authenticated,
          profile: mapProfile(profile),
          tokenParsed: client.tokenParsed || null
        };
      })
      .catch(() => resolveUnauthenticated());

    const timeout = new Promise<AuthInitResult>((resolve) => {
      window.setTimeout(() => resolve(resolveUnauthenticated()), INIT_TIMEOUT_MS);
    });

    initPromise = Promise.race([boot, timeout])
      .then((result) => {
        initResult = result;
        return result;
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
    try {
      await client.logout({ redirectUri: window.location.origin });
    } finally {
      initPromise = null;
      initResult = null;
      keycloakInstance = null;
    }
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
  clearSession: () => {
    initPromise = null;
    initResult = null;
    keycloakInstance = null;
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
    const APP_ROLES = new Set(['ADMIN_MASTER', 'ADMIN', 'COMMON']);
    return Array.from(new Set([...(realmRoles as string[]), ...(clientRoles as string[])])).filter(
      (r) => APP_ROLES.has(r)
    );
  },
  getConfig: () => ({ ...activeConfig }),
};

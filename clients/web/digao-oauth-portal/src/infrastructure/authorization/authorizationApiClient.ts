import type { AuthPort } from '@/application/auth/authPort';
import type { AuthorizationPort } from '@/application/authorization/authorizationPort';
import type {
  AssignUserProfileInput,
  AuthorizationAuditLog,
  AuthorizationCapability,
  AuthorizationProfile,
  AuthorizationProfileCapability,
  AuthorizationSystem,
  AuthorizationUserProfile,
  CreateAuthorizationCapabilityInput,
  CreateAuthorizationProfileInput,
  CreateAuthorizationSystemInput,
  GrantProfileCapabilityInput,
  MyAccess,
} from '@/domain/authorization';

type ApiError = {
  message?: string;
};

const requireEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Missing required API config: ${key}`);
  }
  return value;
};

const apiBase = requireEnv(import.meta.env.VITE_API_URL, 'VITE_API_URL');

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as ApiError;
    if (data?.message) return data.message;
  } catch {
    // ignore
  }
  return `Erro HTTP ${response.status}`;
};

export const createAuthorizationApiClient = (auth: AuthPort): AuthorizationPort => {
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    await auth.refresh();
    const token = auth.getAccessToken();
    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return (await response.json()) as T;
  };

  return {
    listSystems: () => request<AuthorizationSystem[]>('/admin/systems'),
    createSystem: (payload: CreateAuthorizationSystemInput) =>
      request<AuthorizationSystem>('/admin/systems', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    disableSystem: (systemId: number) =>
      request<AuthorizationSystem>(`/admin/systems/${systemId}/disable`, {
        method: 'PATCH',
      }),
    listCapabilities: () => request<AuthorizationCapability[]>('/admin/capabilities'),
    createCapability: (payload: CreateAuthorizationCapabilityInput) =>
      request<AuthorizationCapability>('/admin/capabilities', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    listProfiles: () => request<AuthorizationProfile[]>('/admin/profiles'),
    createProfile: (payload: CreateAuthorizationProfileInput) =>
      request<AuthorizationProfile>('/admin/profiles', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    grantProfileCapability: (payload: GrantProfileCapabilityInput) =>
      request<AuthorizationProfileCapability>('/admin/profile-capabilities', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    listUserProfiles: (keycloakUserId: string) =>
      request<AuthorizationUserProfile[]>(`/admin/user-profiles?keycloakUserId=${encodeURIComponent(keycloakUserId)}`),
    assignUserProfile: (payload: AssignUserProfileInput) =>
      request<AuthorizationUserProfile>('/admin/user-profiles', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    listAuditLogs: () => request<AuthorizationAuditLog[]>('/admin/audit-logs'),
    getMyAccess: () => request<MyAccess>('/me/access'),
  };
};

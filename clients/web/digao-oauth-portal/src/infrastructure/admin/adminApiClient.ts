import type {
  AdminCreateUserInput,
  AdminGroup,
  AdminResetPasswordInput,
  AdminUser,
  AdminUserVpnAccess,
  AdminUserVpnAccessInput
} from '@/domain/admin';
import type { AdminPort } from '@/application/admin/adminPort';
import type { AuthPort } from '@/application/auth/authPort';

type ApiError = {
  message?: string;
};

const apiBase = import.meta.env.VITE_API_URL;

if (!apiBase) {
  throw new Error('VITE_API_URL não configurada para o portal.');
}

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as ApiError;
    if (data?.message) return data.message;
  } catch {
    // ignore
  }
  return `Erro HTTP ${response.status}`;
};

export const createAdminApiClient = (auth: AuthPort): AdminPort => {
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
        ...(init?.headers || {})
      }
    });

    if (!response.ok) {
      const message = await parseError(response);
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  };

  return {
    listUsers: async (page = 0, limit = 50) =>
      request<AdminUser[]>(`/admin/users?page=${page}&limit=${limit}`),
    listGroups: async () => request<AdminGroup[]>('/admin/groups'),
    createUser: async (payload: AdminCreateUserInput) =>
      request<AdminUser>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    resetUserPassword: async (userId: string, payload: AdminResetPasswordInput) =>
      request<void>(`/admin/users/${userId}/password-reset`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    listUserVpnAccess: async (userId: string) =>
      request<AdminUserVpnAccess[]>(`/admin/users/${userId}/vpn-access`),
    upsertUserVpnAccess: async (userId: string, provider: string, payload: AdminUserVpnAccessInput) =>
      request<AdminUserVpnAccess>(`/admin/users/${userId}/vpn-access/${provider}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
  };
};

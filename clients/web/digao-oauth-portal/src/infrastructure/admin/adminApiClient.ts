import type {
  AdminCreateUserInput,
  AdminGroup,
  AdminResetPasswordInput,
  AdminUpdateUserInput,
  AdminUser,
  AdminUserVpnAccess,
  AdminUserVpnAccessInput
} from '@/domain/admin';
import type { AdminPort } from '@/application/admin/adminPort';
import type { AuthPort } from '@/application/auth/authPort';
import { createProtectedApiClient } from '@/infrastructure/http/protectedApiClient';

export const createAdminApiClient = (auth: AuthPort): AdminPort => {
  const { request } = createProtectedApiClient(auth);

  return {
    listUsers: async (page = 0, limit = 50) =>
      request<AdminUser[]>(`/admin/users?page=${page}&limit=${limit}`),
    listGroups: async () => request<AdminGroup[]>('/admin/groups'),
    createUser: async (payload: AdminCreateUserInput) =>
      request<AdminUser>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    updateUser: async (userId: string, payload: AdminUpdateUserInput) =>
      request<AdminUser>(`/admin/users/${userId}`, {
        method: 'PUT',
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

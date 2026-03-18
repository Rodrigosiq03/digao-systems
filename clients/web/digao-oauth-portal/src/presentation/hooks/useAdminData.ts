import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminCreateUserInput,
  AdminGroup,
  AdminResetPasswordInput,
  AdminUpdateUserInput,
  AdminUser,
  AdminUserVpnAccessInput
} from '@/domain/admin';
import { createAdminApiClient } from '@/infrastructure/admin/adminApiClient';
import { keycloakAuthClient } from '@/infrastructure/auth/keycloakClient';
import { useAuthStore } from '@/presentation/stores/authStore';

const adminClient = createAdminApiClient(keycloakAuthClient);

export const useAdminUsers = (page = 0, limit = 100) => {
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<AdminUser[]>({
    queryKey: ['admin', 'users', page, limit],
    queryFn: () => adminClient.listUsers(page, limit),
    enabled: isReady && isAuthenticated,
    staleTime: 1000 * 30
  });
};

export const useAdminGroups = () => {
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<AdminGroup[]>({
    queryKey: ['admin', 'groups'],
    queryFn: () => adminClient.listGroups(),
    enabled: isReady && isAuthenticated,
    staleTime: 1000 * 30
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminCreateUserInput) => adminClient.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminUpdateUserInput }) =>
      adminClient.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
};

export const useResetUserPassword = () =>
  useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AdminResetPasswordInput }) =>
      adminClient.resetUserPassword(userId, payload)
  });

export const useAdminUserVpnAccess = (userId: string) => {
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['admin', 'users', userId, 'vpn-access'],
    queryFn: () => adminClient.listUserVpnAccess(userId),
    enabled: isReady && isAuthenticated && !!userId,
    staleTime: 1000 * 30
  });
};

export const useUpsertUserVpnAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      provider,
      payload
    }: {
      userId: string;
      provider: string;
      payload: AdminUserVpnAccessInput;
    }) => adminClient.upsertUserVpnAccess(userId, provider, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.userId, 'vpn-access'] });
    }
  });
};

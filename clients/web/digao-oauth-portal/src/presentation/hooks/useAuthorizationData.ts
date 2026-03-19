import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAuthorizationApiClient } from '@/infrastructure/authorization/authorizationApiClient';
import { keycloakAuthClient } from '@/infrastructure/auth/keycloakClient';
import { useAuthStore } from '@/presentation/stores/authStore';
import type {
  AuthorizationAuditLog,
  AuthorizationCapability,
  AuthorizationProfileCapability,
  AuthorizationProfile,
  AuthorizationSystem,
  AuthorizationUserProfile,
  MyAccess,
} from '@/domain/authorization';

const authorizationClient = createAuthorizationApiClient(keycloakAuthClient);

const useAuthorizedQuery = <T,>(queryKey: unknown[], queryFn: () => Promise<T>, enabled = true) => {
  const isReady = useAuthStore((state) => state.isReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<T>({
    queryKey,
    queryFn,
    enabled: enabled && isReady && isAuthenticated,
    staleTime: 1000 * 30,
  });
};

export const useAuthorizationSystems = () =>
  useAuthorizedQuery<AuthorizationSystem[]>(['authorization', 'systems'], () => authorizationClient.listSystems());

export const useAuthorizationCapabilities = () =>
  useAuthorizedQuery<AuthorizationCapability[]>(['authorization', 'capabilities'], () => authorizationClient.listCapabilities());

export const useAuthorizationProfiles = () =>
  useAuthorizedQuery<AuthorizationProfile[]>(['authorization', 'profiles'], () => authorizationClient.listProfiles());

export const useAuthorizationProfileCapabilities = () =>
  useAuthorizedQuery<AuthorizationProfileCapability[]>(
    ['authorization', 'profile-capabilities'],
    () => authorizationClient.listProfileCapabilities()
  );

export const useAuthorizationAssignments = (keycloakUserId?: string) =>
  useAuthorizedQuery<AuthorizationUserProfile[]>(
    ['authorization', 'assignments', keycloakUserId],
    () => authorizationClient.listUserProfiles(keycloakUserId!),
    Boolean(keycloakUserId)
  );

export const useAuthorizationAuditLogs = () =>
  useAuthorizedQuery<AuthorizationAuditLog[]>(['authorization', 'audit'], () => authorizationClient.listAuditLogs());

export const useMyAccess = () =>
  useAuthorizedQuery<MyAccess>(['authorization', 'my-access'], () => authorizationClient.getMyAccess());

export const useCreateAuthorizationSystem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authorizationClient.createSystem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authorization', 'systems'] }),
  });
};

export const useDisableAuthorizationSystem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (systemId: number) => authorizationClient.disableSystem(systemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authorization', 'systems'] }),
  });
};

export const useCreateAuthorizationCapability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authorizationClient.createCapability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authorization', 'capabilities'] }),
  });
};

export const useDisableAuthorizationCapability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (capabilityId: number) => authorizationClient.disableCapability(capabilityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authorization', 'capabilities'] }),
  });
};

export const useCreateAuthorizationProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authorizationClient.createProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authorization', 'profiles'] }),
  });
};

export const useDisableAuthorizationProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: number) => authorizationClient.disableProfile(profileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['authorization', 'profiles'] }),
  });
};

export const useGrantAuthorizationProfileCapability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authorizationClient.grantProfileCapability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authorization', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: ['authorization', 'capabilities'] });
      queryClient.invalidateQueries({ queryKey: ['authorization', 'profile-capabilities'] });
    },
  });
};

export const useAssignAuthorizationUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authorizationClient.assignUserProfile,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['authorization', 'assignments', variables.keycloakUserId] });
    },
  });
};

export const useRevokeAuthorizationUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, keycloakUserId }: { assignmentId: number; keycloakUserId: string }) =>
      authorizationClient.revokeUserProfile(assignmentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['authorization', 'assignments', variables.keycloakUserId] });
    },
  });
};

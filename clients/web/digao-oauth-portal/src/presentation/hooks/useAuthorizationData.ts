import { useQuery } from '@tanstack/react-query';
import { createAuthorizationApiClient } from '@/infrastructure/authorization/authorizationApiClient';
import { keycloakAuthClient } from '@/infrastructure/auth/keycloakClient';
import { useAuthStore } from '@/presentation/stores/authStore';
import type {
  AuthorizationAuditLog,
  AuthorizationCapability,
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

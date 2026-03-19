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
import { createProtectedApiClient } from '@/infrastructure/http/protectedApiClient';

export const createAuthorizationApiClient = (auth: AuthPort): AuthorizationPort => {
  const { request } = createProtectedApiClient(auth);

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
    disableCapability: (capabilityId: number) =>
      request<AuthorizationCapability>(`/admin/capabilities/${capabilityId}/disable`, {
        method: 'PATCH',
      }),
    listProfiles: () => request<AuthorizationProfile[]>('/admin/profiles'),
    createProfile: (payload: CreateAuthorizationProfileInput) =>
      request<AuthorizationProfile>('/admin/profiles', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    disableProfile: (profileId: number) =>
      request<AuthorizationProfile>(`/admin/profiles/${profileId}/disable`, {
        method: 'PATCH',
      }),
    listProfileCapabilities: () =>
      request<AuthorizationProfileCapability[]>('/admin/profile-capabilities'),
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
    revokeUserProfile: (assignmentId: number) =>
      request<AuthorizationUserProfile>(`/admin/user-profiles/${assignmentId}/revoke`, {
        method: 'PATCH',
      }),
    listAuditLogs: () => request<AuthorizationAuditLog[]>('/admin/audit-logs'),
    getMyAccess: () => request<MyAccess>('/me/access'),
  };
};

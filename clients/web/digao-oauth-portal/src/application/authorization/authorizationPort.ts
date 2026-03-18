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

export interface AuthorizationPort {
  listSystems: () => Promise<AuthorizationSystem[]>;
  createSystem: (payload: CreateAuthorizationSystemInput) => Promise<AuthorizationSystem>;
  disableSystem: (systemId: number) => Promise<AuthorizationSystem>;
  listCapabilities: () => Promise<AuthorizationCapability[]>;
  createCapability: (payload: CreateAuthorizationCapabilityInput) => Promise<AuthorizationCapability>;
  disableCapability: (capabilityId: number) => Promise<AuthorizationCapability>;
  listProfiles: () => Promise<AuthorizationProfile[]>;
  createProfile: (payload: CreateAuthorizationProfileInput) => Promise<AuthorizationProfile>;
  disableProfile: (profileId: number) => Promise<AuthorizationProfile>;
  grantProfileCapability: (payload: GrantProfileCapabilityInput) => Promise<AuthorizationProfileCapability>;
  listUserProfiles: (keycloakUserId: string) => Promise<AuthorizationUserProfile[]>;
  assignUserProfile: (payload: AssignUserProfileInput) => Promise<AuthorizationUserProfile>;
  revokeUserProfile: (assignmentId: number) => Promise<AuthorizationUserProfile>;
  listAuditLogs: () => Promise<AuthorizationAuditLog[]>;
  getMyAccess: () => Promise<MyAccess>;
}

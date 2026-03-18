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
  listCapabilities: () => Promise<AuthorizationCapability[]>;
  createCapability: (payload: CreateAuthorizationCapabilityInput) => Promise<AuthorizationCapability>;
  listProfiles: () => Promise<AuthorizationProfile[]>;
  createProfile: (payload: CreateAuthorizationProfileInput) => Promise<AuthorizationProfile>;
  grantProfileCapability: (payload: GrantProfileCapabilityInput) => Promise<AuthorizationProfileCapability>;
  listUserProfiles: (keycloakUserId: string) => Promise<AuthorizationUserProfile[]>;
  assignUserProfile: (payload: AssignUserProfileInput) => Promise<AuthorizationUserProfile>;
  listAuditLogs: () => Promise<AuthorizationAuditLog[]>;
  getMyAccess: () => Promise<MyAccess>;
}

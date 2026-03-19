export type AuthorizationSystem = {
  id: number;
  key: string;
  name: string;
  enabled: boolean;
  entryUrl: string | null;
  disabledAt?: string | null;
  disabledBy?: string | null;
};

export type AuthorizationCapability = {
  id: number;
  systemId: number;
  key: string;
  name: string;
  enabled: boolean;
};

export type AuthorizationProfile = {
  id: number;
  key: string;
  name: string;
  enabled: boolean;
};

export type AuthorizationProfileCapability = {
  id: number;
  profileId: number;
  profileKey: string;
  capabilityId: number;
  capabilityKey: string;
};

export type AuthorizationUserProfile = {
  id: number;
  keycloakUserId: string;
  profileId: number;
  profileKey: string;
};

export type AuthorizationAuditLog = {
  id: number;
  action: string;
  targetType: string;
  targetId: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export type AuthorizationAccessProfile = {
  id: number;
  key: string;
  name: string;
};

export type AuthorizationAccessSystem = {
  id: number;
  key: string;
  name: string;
  capabilities: string[];
};

export type MyAccess = {
  portalRoles: string[];
  profiles: AuthorizationAccessProfile[];
  systems: AuthorizationAccessSystem[];
};

export type CreateAuthorizationSystemInput = {
  key: string;
  name: string;
  entryUrl?: string;
};

export type UpdateAuthorizationSystemInput = {
  name: string;
  entryUrl?: string;
};

export type CreateAuthorizationCapabilityInput = {
  systemId: number;
  key: string;
  name: string;
};

export type CreateAuthorizationProfileInput = {
  key: string;
  name: string;
};

export type GrantProfileCapabilityInput = {
  profileId: number;
  capabilityId: number;
};

export type AssignUserProfileInput = {
  keycloakUserId: string;
  profileId: number;
};

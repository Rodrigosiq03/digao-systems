import type { AuthorizationPort } from './authorizationPort';

export const createAuthorizationUseCases = (port: AuthorizationPort) => ({
  listSystems: () => port.listSystems(),
  createSystem: (payload: Parameters<AuthorizationPort['createSystem']>[0]) => port.createSystem(payload),
  disableSystem: (systemId: number) => port.disableSystem(systemId),
  listCapabilities: () => port.listCapabilities(),
  createCapability: (payload: Parameters<AuthorizationPort['createCapability']>[0]) => port.createCapability(payload),
  listProfiles: () => port.listProfiles(),
  createProfile: (payload: Parameters<AuthorizationPort['createProfile']>[0]) => port.createProfile(payload),
  grantProfileCapability: (payload: Parameters<AuthorizationPort['grantProfileCapability']>[0]) =>
    port.grantProfileCapability(payload),
  listUserProfiles: (keycloakUserId: string) => port.listUserProfiles(keycloakUserId),
  assignUserProfile: (payload: Parameters<AuthorizationPort['assignUserProfile']>[0]) => port.assignUserProfile(payload),
  listAuditLogs: () => port.listAuditLogs(),
  getMyAccess: () => port.getMyAccess(),
});

import type { AuthPort } from './authPort';

export const createAuthUseCases = (port: AuthPort) => ({
  init: () => port.init(),
  login: () => port.login(),
  logout: () => port.logout(),
  refresh: () => port.refresh(),
  roles: () => port.getRoles(),
  getConfig: () => port.getConfig(),
  setConfig: (config: { url: string; realm: string; clientId: string }) => port.setConfig(config)
});

import type { AdminPort } from './adminPort';

export const createAdminUseCases = (port: AdminPort) => ({
  listUsers: (page?: number, limit?: number) => port.listUsers(page, limit),
  listGroups: () => port.listGroups(),
  createUser: (payload: Parameters<AdminPort['createUser']>[0]) => port.createUser(payload),
  resetUserPassword: (userId: string, payload: Parameters<AdminPort['resetUserPassword']>[1]) =>
    port.resetUserPassword(userId, payload)
});

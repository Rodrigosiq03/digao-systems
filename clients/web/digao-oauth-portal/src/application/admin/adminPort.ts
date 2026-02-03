import type { AdminCreateUserInput, AdminGroup, AdminResetPasswordInput, AdminUser } from '@/domain/admin';

export interface AdminPort {
  listUsers: (page?: number, limit?: number) => Promise<AdminUser[]>;
  listGroups: () => Promise<AdminGroup[]>;
  createUser: (payload: AdminCreateUserInput) => Promise<AdminUser>;
  resetUserPassword: (userId: string, payload: AdminResetPasswordInput) => Promise<void>;
}

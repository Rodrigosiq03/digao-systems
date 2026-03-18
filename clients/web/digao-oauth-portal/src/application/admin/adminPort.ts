import type {
  AdminCreateUserInput,
  AdminGroup,
  AdminResetPasswordInput,
  AdminUpdateUserInput,
  AdminUser,
  AdminUserVpnAccess,
  AdminUserVpnAccessInput
} from '@/domain/admin';

export interface AdminPort {
  listUsers: (page?: number, limit?: number) => Promise<AdminUser[]>;
  listGroups: () => Promise<AdminGroup[]>;
  createUser: (payload: AdminCreateUserInput) => Promise<AdminUser>;
  updateUser: (userId: string, payload: AdminUpdateUserInput) => Promise<AdminUser>;
  resetUserPassword: (userId: string, payload: AdminResetPasswordInput) => Promise<void>;
  listUserVpnAccess: (userId: string) => Promise<AdminUserVpnAccess[]>;
  upsertUserVpnAccess: (userId: string, provider: string, payload: AdminUserVpnAccessInput) => Promise<AdminUserVpnAccess>;
}

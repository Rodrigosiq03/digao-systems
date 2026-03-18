export type AdminStat = {
  label: string;
  value: string;
  description: string;
};

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string | null;
  enabled: boolean;
  roles: string[];
  groups: string[];
};

export type AdminGroup = {
  id: string;
  name: string;
  path: string;
  attributes: Record<string, string[]>;
};

export type AdminCreateUserInput = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN_MASTER' | 'ADMIN' | 'COMMON';
  enabled: boolean;
};

export type AdminUpdateUserInput = AdminCreateUserInput;

export type AdminResetPasswordInput = {
  newPassword: string;
  temporary: boolean;
};

export type AdminUserVpnAccessStatus = 'none' | 'invite_pending' | 'active' | 'revoked';

export type AdminUserVpnAccess = {
  keycloakUserId: string;
  provider: string;
  status: AdminUserVpnAccessStatus;
  inviteLink: string | null;
  notes: string | null;
  invitedAt: string | null;
  activatedAt: string | null;
  revokedAt: string | null;
};

export type AdminUserVpnAccessInput = {
  status: AdminUserVpnAccessStatus;
  inviteLink?: string;
  notes?: string;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'blocked';
  system: string;
};

export type SystemSummary = {
  id: string;
  name: string;
  description: string;
  members: number;
  status: 'online' | 'maintenance';
};

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

export type AdminResetPasswordInput = {
  newPassword: string;
  temporary: boolean;
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

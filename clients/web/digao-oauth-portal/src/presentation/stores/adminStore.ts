import { create } from 'zustand';
import type { AdminGroup, AdminStat, AdminUser, UserSummary } from '@/domain/admin';
import { createAdminUseCases } from '@/application/admin/adminUseCases';
import { createAdminApiClient } from '@/infrastructure/admin/adminApiClient';
import { keycloakAuthClient } from '@/infrastructure/auth/keycloakClient';

const adminUseCases = createAdminUseCases(createAdminApiClient(keycloakAuthClient));

type AdminStore = {
  users: AdminUser[];
  groups: AdminGroup[];
  userSummaries: UserSummary[];
  stats: AdminStat[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
};

const buildStats = (users: AdminUser[], groups: AdminGroup[]): AdminStat[] => {
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.enabled).length;
  const systems = groups.length;
  return [
    {
      label: 'Usuários',
      value: totalUsers.toString(),
      description: 'Total de contas gerenciadas'
    },
    {
      label: 'Ativos',
      value: activeUsers.toString(),
      description: 'Usuários com acesso liberado'
    },
    {
      label: 'Sistemas',
      value: systems.toString(),
      description: 'Groups ativos no Keycloak'
    }
  ];
};

const buildUserSummaries = (users: AdminUser[]): UserSummary[] =>
  users.map((user) => ({
    id: user.id,
    name: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role ?? '',
    status: user.enabled ? 'active' : 'blocked',
    system: user.groups.join(', ')
  }));

export const useAdminStore = create<AdminStore>((set) => ({
  users: [],
  groups: [],
  userSummaries: [],
  stats: [],
  isLoading: false,
  error: null,
  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const [users, groups] = await Promise.all([
        adminUseCases.listUsers(0, 100),
        adminUseCases.listGroups()
      ]);
      set({
        users,
        groups,
        userSummaries: buildUserSummaries(users),
        stats: buildStats(users, groups),
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Falha ao carregar dados.'
      });
    }
  }
}));

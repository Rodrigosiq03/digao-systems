import type { AdminStat, SystemSummary, UserSummary } from '@/domain/admin';

export const adminStats: AdminStat[] = [
  {
    label: 'Usuários ativos',
    value: '248',
    description: 'Ativos nos últimos 30 dias'
  },
  {
    label: 'Sistemas conectados',
    value: '7',
    description: 'Grupos usando o mesmo auth'
  },
  {
    label: 'Solicitações pendentes',
    value: '12',
    description: 'Aguardando aprovação'
  }
];

export const users: UserSummary[] = [
  {
    id: 'USR-1201',
    name: 'Rodrigo Siqueira',
    email: 'rod@digao.dev',
    role: 'ADMIN_MASTER',
    status: 'active',
    system: 'Portal Digão'
  },
  {
    id: 'USR-1202',
    name: 'Marina Lopes',
    email: 'marina@digao.dev',
    role: 'MODERATOR',
    status: 'active',
    system: 'ERP Metal'
  },
  {
    id: 'USR-1203',
    name: 'Jorge Dias',
    email: 'jorge@digao.dev',
    role: 'VIEWER',
    status: 'pending',
    system: 'CRM Alpha'
  },
  {
    id: 'USR-1204',
    name: 'Ana Paula',
    email: 'ana@digao.dev',
    role: 'EDITOR',
    status: 'blocked',
    system: 'Analytics Hub'
  }
];

export const systems: SystemSummary[] = [
  {
    id: 'SYS-01',
    name: 'Portal Digão',
    description: 'Entrada principal com autenticação única.',
    members: 132,
    status: 'online'
  },
  {
    id: 'SYS-02',
    name: 'ERP Metal',
    description: 'Gestão de operações internas e estoque.',
    members: 56,
    status: 'online'
  },
  {
    id: 'SYS-03',
    name: 'CRM Alpha',
    description: 'Relatórios comerciais e pipeline.',
    members: 42,
    status: 'maintenance'
  }
];

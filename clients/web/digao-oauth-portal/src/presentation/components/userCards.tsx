import { ShieldCheck, UserCog, UserRoundCheck, UserRoundX } from 'lucide-react';
import type { AdminUser } from '@/domain/admin';
import { AdminResourceGrid } from '@/presentation/components/adminLayout';
import { QuickActionsMenu } from '@/presentation/components/quickActionsMenu';
import { ResourceCard, ResourceCardHeader, ResourceCardMeta } from '@/presentation/components/resourceCard';
import { StatusBadge } from '@/presentation/components/statusBadge';
import { useAdminUserVpnAccess } from '@/presentation/hooks/useAdminData';

type Props = {
  users: AdminUser[];
  canManage: boolean;
  canViewSensitive: boolean;
  onEditUser: (user: AdminUser) => void;
  onManageVpn: (user: AdminUser) => void;
  onManageAccess: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onToggleEnabled: (user: AdminUser) => void;
  isBusy?: boolean;
};

const userStatusMap: Record<'active' | 'blocked', { label: string; tone: 'success' | 'danger' }> = {
  active: { label: 'Ativo', tone: 'success' },
  blocked: { label: 'Bloqueado', tone: 'danger' }
};

const vpnStatusMap: Record<string, { label: string; tone: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  none: { label: 'Sem acesso', tone: 'neutral' },
  invite_pending: { label: 'Convite pendente', tone: 'warning' },
  active: { label: 'Ativo', tone: 'success' },
  revoked: { label: 'Revogado', tone: 'danger' }
};

export function UserCards({
  users,
  canManage,
  canViewSensitive,
  onEditUser,
  onManageVpn,
  onManageAccess,
  onResetPassword,
  onToggleEnabled,
  isBusy
}: Props) {
  return (
    <AdminResourceGrid>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          canManage={canManage}
          canViewSensitive={canViewSensitive}
          onEditUser={onEditUser}
          onManageVpn={onManageVpn}
          onManageAccess={onManageAccess}
          onResetPassword={onResetPassword}
          onToggleEnabled={onToggleEnabled}
          isBusy={isBusy}
        />
      ))}
    </AdminResourceGrid>
  );
}

function UserCard({
  user,
  canManage,
  canViewSensitive,
  onEditUser,
  onManageVpn,
  onManageAccess,
  onResetPassword,
  onToggleEnabled,
  isBusy
}: Omit<Props, 'users'> & { user: AdminUser }) {
  const vpnAccessQuery = useAdminUserVpnAccess(user.id);
  const userStatus = user.enabled ? 'active' : 'blocked';
  const vpnAccess = vpnAccessQuery.data?.find((entry) => entry.provider === 'tailscale');
  const vpnStatus = vpnAccess?.status ?? 'none';

  return (
    <ResourceCard>
      <ResourceCardHeader>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{user.fullName || `${user.firstName} ${user.lastName}`}</h3>
          <p className="text-sm text-[color:var(--muted)]">{user.email}</p>
        </div>
        {canManage && (
          <QuickActionsMenu
            actions={[
              { label: 'Editar', onClick: () => onEditUser(user) },
              { label: 'Gerenciar acessos', onClick: () => onManageAccess(user) },
              { label: 'Editar VPN', onClick: () => onManageVpn(user) },
              { label: 'Resetar senha', onClick: () => onResetPassword(user) },
              {
                label: user.enabled ? 'Desativar usuário' : 'Ativar usuário',
                onClick: () => onToggleEnabled(user),
                disabled: isBusy
              }
            ]}
          />
        )}
      </ResourceCardHeader>

      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={userStatusMap[userStatus].tone}>{userStatusMap[userStatus].label}</StatusBadge>
        <StatusBadge tone={vpnStatusMap[vpnStatus].tone}>
          Status VPN: {vpnStatusMap[vpnStatus].label}
        </StatusBadge>
        <StatusBadge tone="brand">Role: {user.role ?? '-'}</StatusBadge>
      </div>

      <ResourceCardMeta>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Sistemas</p>
          <strong>{user.groups.join(', ') || '-'}</strong>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Provider VPN</p>
          <strong>{vpnAccess?.provider ?? 'tailscale'}</strong>
        </div>
        {canViewSensitive && (
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">User ID</p>
            <strong className="text-xs">{user.id}</strong>
          </div>
        )}
      </ResourceCardMeta>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--soft-border)] bg-[color:var(--soft-panel)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <UserCog className="h-4 w-4" />
            Identidade
          </div>
          <p className="text-sm text-[color:var(--text)]/82">
            Role principal: <strong>{user.role ?? '-'}</strong>
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--soft-border)] bg-[color:var(--soft-panel)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            VPN
          </div>
          <p className="text-sm text-[color:var(--text)]/82">
            {vpnAccess?.notes || 'Sem observações registradas para o provider.'}
          </p>
          {vpnAccess?.inviteLink && (
            <a
              href={vpnAccess.inviteLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              Abrir invite VPN
            </a>
          )}
        </div>
        <div className="rounded-2xl border border-[color:var(--soft-border)] bg-[color:var(--soft-panel)] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            {user.enabled ? <UserRoundCheck className="h-4 w-4" /> : <UserRoundX className="h-4 w-4" />}
            Operação
          </div>
          <p className="text-sm text-[color:var(--text)]/82">
            Use o menu de ações para editar, trocar role, gerenciar acessos e alterar o status do usuário.
          </p>
        </div>
      </div>
    </ResourceCard>
  );
}

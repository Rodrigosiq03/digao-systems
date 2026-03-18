import { ShieldCheck, UserCog, UserRoundCheck, UserRoundX } from 'lucide-react';
import type { AdminUser } from '@/domain/admin';
import { cn } from '@/lib/utils';
import { QuickActionsMenu } from '@/presentation/components/quickActionsMenu';
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

const userStatusMap: Record<'active' | 'blocked', { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-emerald-400/20 text-emerald-100' },
  blocked: { label: 'Bloqueado', className: 'bg-rose-400/20 text-rose-100' }
};

const vpnStatusMap: Record<string, { label: string; className: string }> = {
  none: { label: 'Sem acesso', className: 'bg-slate-400/20 text-slate-100' },
  invite_pending: { label: 'Convite pendente', className: 'bg-amber-400/20 text-amber-100' },
  active: { label: 'Ativo', className: 'bg-emerald-400/20 text-emerald-100' },
  revoked: { label: 'Revogado', className: 'bg-rose-400/20 text-rose-100' }
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
    <div className="admin-page-grid">
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
    </div>
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
    <article className="resource-card glass-card">
      <div className="resource-card-header">
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
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', userStatusMap[userStatus].className)}>
          {userStatusMap[userStatus].label}
        </span>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', vpnStatusMap[vpnStatus].className)}>
          Status VPN: {vpnStatusMap[vpnStatus].label}
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
          Role: {user.role ?? '-'}
        </span>
      </div>

      <div className="resource-card-meta">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Username</p>
          <strong>{user.username}</strong>
        </div>
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
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <UserCog className="h-4 w-4" />
            Identidade
          </div>
          <p className="text-sm text-[color:var(--muted)]">
            Role principal: <strong>{user.role ?? '-'}</strong>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            VPN
          </div>
          <p className="text-sm text-[color:var(--muted)]">
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
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            {user.enabled ? <UserRoundCheck className="h-4 w-4" /> : <UserRoundX className="h-4 w-4" />}
            Operação
          </div>
          <p className="text-sm text-[color:var(--muted)]">
            Use o menu de ações para editar, trocar role, gerenciar acessos e alterar o status do usuário.
          </p>
        </div>
      </div>
    </article>
  );
}

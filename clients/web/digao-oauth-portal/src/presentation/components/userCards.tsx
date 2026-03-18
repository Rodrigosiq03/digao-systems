import { useMemo, useState } from 'react';
import type { AdminUser, AdminUserVpnAccessInput } from '@/domain/admin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ResetPasswordForm } from '@/presentation/forms/resetPasswordForm';
import { UserVpnAccessForm } from '@/presentation/forms/userVpnAccessForm';
import { useAdminUserVpnAccess } from '@/presentation/hooks/useAdminData';

type Props = {
  users: AdminUser[];
  canReset: boolean;
  canManageVpn: boolean;
  canViewSensitive: boolean;
  onResetPassword: (userId: string, payload: { newPassword: string; temporary: boolean }) => Promise<void>;
  onUpsertUserVpnAccess: (userId: string, provider: string, payload: AdminUserVpnAccessInput) => Promise<void>;
  isResetting?: boolean;
  isUpdatingVpn?: boolean;
};

const statusMap: Record<'active' | 'blocked', { label: string; className: string }> = {
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
  canReset,
  canManageVpn,
  canViewSensitive,
  onResetPassword,
  onUpsertUserVpnAccess,
  isResetting,
  isUpdatingVpn
}: Props) {
  return (
    <div className="user-card-grid">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          canReset={canReset}
          canManageVpn={canManageVpn}
          canViewSensitive={canViewSensitive}
          onResetPassword={onResetPassword}
          onUpsertUserVpnAccess={onUpsertUserVpnAccess}
          isResetting={isResetting}
          isUpdatingVpn={isUpdatingVpn}
        />
      ))}
    </div>
  );
}

type UserCardProps = Omit<Props, 'users'> & {
  user: AdminUser;
};

function UserCard({
  user,
  canReset,
  canManageVpn,
  canViewSensitive,
  onResetPassword,
  onUpsertUserVpnAccess,
  isResetting,
  isUpdatingVpn
}: UserCardProps) {
  const [openReset, setOpenReset] = useState(false);
  const [openVpnEditor, setOpenVpnEditor] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const vpnAccessQuery = useAdminUserVpnAccess(user.id);

  const status = user.enabled ? 'active' : 'blocked';
  const vpnAccess = useMemo(() => {
    const current = vpnAccessQuery.data?.find((entry) => entry.provider === 'tailscale');
    return (
      current ?? {
        keycloakUserId: user.id,
        provider: 'tailscale',
        status: 'none' as const,
        inviteLink: null,
        notes: null,
        invitedAt: null,
        activatedAt: null,
        revokedAt: null
      }
    );
  }, [user.id, vpnAccessQuery.data]);

  const cardFeedback = feedback[user.id];

  const handleReset = async (payload: { newPassword: string; temporary: boolean }) => {
    try {
      await onResetPassword(user.id, payload);
      setFeedback((prev) => ({
        ...prev,
        [user.id]: { type: 'success', message: 'Senha resetada. Email enviado ao usuário.' }
      }));
      setOpenReset(false);
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [user.id]: {
          type: 'error',
          message: err instanceof Error ? err.message : 'Falha ao resetar senha.'
        }
      }));
    }
  };

  const handleVpnUpdate = async (payload: AdminUserVpnAccessInput) => {
    try {
      await onUpsertUserVpnAccess(user.id, vpnAccess.provider, payload);
      setFeedback((prev) => ({
        ...prev,
        [user.id]: { type: 'success', message: 'Acesso VPN atualizado com sucesso.' }
      }));
      setOpenVpnEditor(false);
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [user.id]: {
          type: 'error',
          message: err instanceof Error ? err.message : 'Falha ao atualizar acesso VPN.'
        }
      }));
    }
  };

  return (
    <article className="user-card glass-card">
      <div className="user-card-header">
        <div>
          <h3 className="text-lg font-semibold">{user.fullName || `${user.firstName} ${user.lastName}`}</h3>
          <p className="text-sm text-[color:var(--muted)]">{user.email}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusMap[status].className)}>
          {statusMap[status].label}
        </span>
      </div>

      <div className="user-card-body">
        <div>
          <p className="text-xs text-[color:var(--muted)]">Username</p>
          <strong>{user.username}</strong>
        </div>
        <div>
          <p className="text-xs text-[color:var(--muted)]">Role</p>
          <strong>{user.role ?? '-'}</strong>
        </div>
        <div>
          <p className="text-xs text-[color:var(--muted)]">Sistemas</p>
          <strong>{user.groups.join(', ') || '-'}</strong>
        </div>
        {canViewSensitive && (
          <div>
            <p className="text-xs text-[color:var(--muted)]">ID</p>
            <strong className="text-xs">{user.id}</strong>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[color:var(--muted)]">Status VPN</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', vpnStatusMap[vpnAccess.status].className)}>
                {vpnStatusMap[vpnAccess.status].label}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">{vpnAccess.provider}</span>
            </div>
          </div>
          {vpnAccess.inviteLink && (
            <a
              href={vpnAccess.inviteLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              Abrir invite VPN
            </a>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-[color:var(--muted)]">Notas</p>
            <strong className="text-sm">{vpnAccess.notes || '-'}</strong>
          </div>
          <div>
            <p className="text-xs text-[color:var(--muted)]">Última transição</p>
            <strong className="text-sm">{vpnAccess.activatedAt || vpnAccess.invitedAt || vpnAccess.revokedAt || '-'}</strong>
          </div>
        </div>
      </div>

      <div className="user-card-actions">
        {canReset && (
          <Button variant="secondary" onClick={() => setOpenReset((current) => !current)}>
            {openReset ? 'Cancelar senha' : 'Resetar senha'}
          </Button>
        )}
        {canManageVpn && (
          <Button variant="outline" onClick={() => setOpenVpnEditor((current) => !current)}>
            {openVpnEditor ? 'Cancelar VPN' : 'Editar VPN'}
          </Button>
        )}
      </div>

      {openReset && canReset && (
        <div className="user-card-reset">
          <ResetPasswordForm onSubmit={handleReset} isSubmitting={isResetting} />
        </div>
      )}

      {openVpnEditor && canManageVpn && (
        <UserVpnAccessForm
          defaultValues={{
            status: vpnAccess.status,
            inviteLink: vpnAccess.inviteLink ?? undefined,
            notes: vpnAccess.notes ?? undefined
          }}
          onSubmit={handleVpnUpdate}
          isSubmitting={isUpdatingVpn}
        />
      )}

      {cardFeedback && (
        <div
          className={
            cardFeedback.type === 'success'
              ? 'rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100'
              : 'rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100'
          }
        >
          {cardFeedback.message}
        </div>
      )}
    </article>
  );
}

import { useState } from 'react';
import type { AdminUser } from '@/domain/admin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ResetPasswordForm } from '@/presentation/forms/resetPasswordForm';

type Props = {
  users: AdminUser[];
  canReset: boolean;
  onResetPassword: (userId: string, payload: { newPassword: string; temporary: boolean }) => Promise<void>;
  isResetting?: boolean;
};

const statusMap: Record<'active' | 'blocked', { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-emerald-400/20 text-emerald-100' },
  blocked: { label: 'Bloqueado', className: 'bg-rose-400/20 text-rose-100' }
};

export function UserCards({ users, canReset, onResetPassword, isResetting }: Props) {
  const [openReset, setOpenReset] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});

  const handleReset = async (userId: string, payload: { newPassword: string; temporary: boolean }) => {
    try {
      await onResetPassword(userId, payload);
      setFeedback((prev) => ({
        ...prev,
        [userId]: { type: 'success', message: 'Senha resetada. Email enviado ao usuário.' }
      }));
      setOpenReset(null);
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [userId]: {
          type: 'error',
          message: err instanceof Error ? err.message : 'Falha ao resetar senha.'
        }
      }));
    }
  };

  return (
    <div className="user-card-grid">
      {users.map((user) => {
        const status = user.enabled ? 'active' : 'blocked';
        const isOpen = openReset === user.id;
        const cardFeedback = feedback[user.id];
        return (
          <article key={user.id} className="user-card glass-card">
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
              <div>
                <p className="text-xs text-[color:var(--muted)]">ID</p>
                <strong className="text-xs">{user.id}</strong>
              </div>
            </div>
            {canReset && (
              <div className="user-card-actions">
                <Button variant="secondary" onClick={() => setOpenReset(isOpen ? null : user.id)}>
                  {isOpen ? 'Cancelar' : 'Resetar senha'}
                </Button>
              </div>
            )}
            {isOpen && canReset && (
              <div className="user-card-reset">
                <ResetPasswordForm onSubmit={(payload) => handleReset(user.id, payload)} isSubmitting={isResetting} />
              </div>
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
      })}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { UserCards } from '@/presentation/components/userCards';
import { UserFilterForm } from '@/presentation/forms/userFilterForm';
import { useAdminUsers, useCreateUser, useResetUserPassword } from '@/presentation/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateUserForm } from '@/presentation/forms/createUserForm';
import { useAuthStore } from '@/presentation/stores/authStore';
import type { AdminCreateUserInput } from '@/domain/admin';

export function UsersPage() {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const roles = useAuthStore((state) => state.roles);
  const canCreate = roles.includes('ADMIN_MASTER');
  const canReset = roles.includes('ADMIN_MASTER');
  const usersQuery = useAdminUsers();
  const createUserMutation = useCreateUser();
  const resetPasswordMutation = useResetUserPassword();
  const isLoading = usersQuery.isLoading;
  const error = usersQuery.error as Error | null;
  const users = usersQuery.data ?? [];

  const handleCreateUser = async (payload: AdminCreateUserInput) => {
    setFeedback(null);
    try {
      const user = await createUserMutation.mutateAsync(payload);
      setFeedback({
        type: 'success',
        message: `Usuário ${user.email} criado. Email de primeiro acesso enviado.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Falha ao criar usuário.'
      });
    }
  };

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.fullName, user.email, user.role ?? '', user.groups.join(', ')].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [query, users]);

  const handleResetPassword = async (
    userId: string,
    payload: { newPassword: string; temporary: boolean }
  ) => {
    await resetPasswordMutation.mutateAsync({ userId, payload });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Usuários</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Visualize e administre usuários sem precisar entrar no console do Keycloak.
        </p>
      </div>
      <div className="glass-card space-y-4 p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Criar novo usuário</h3>
          <p className="text-sm text-[color:var(--muted)]">
            O usuário recebe um email com senha temporária e link para redefinir.
          </p>
        </div>
        {!canCreate ? (
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">
            Apenas <strong>ADMIN_MASTER</strong> pode criar usuários.
          </div>
        ) : (
          <CreateUserForm onSubmit={handleCreateUser} isSubmitting={createUserMutation.isPending} />
        )}
        {feedback && (
          <div
            className={
              feedback.type === 'success'
                ? 'rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100'
                : 'rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100'
            }
          >
            {feedback.message}
          </div>
        )}
      </div>
      <UserFilterForm onSearch={setQuery} />
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{error.message}</div>
      ) : (
        <UserCards
          users={filtered}
          canReset={canReset}
          onResetPassword={handleResetPassword}
          isResetting={resetPasswordMutation.isPending}
        />
      )}
    </div>
  );
}

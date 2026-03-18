import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminEditorSheet } from '@/presentation/components/adminEditorSheet';
import { UserCards } from '@/presentation/components/userCards';
import { UserFilterForm } from '@/presentation/forms/userFilterForm';
import { UserForm } from '@/presentation/forms/userForm';
import { UserProfileAssignmentForm } from '@/presentation/forms/userProfileAssignmentForm';
import { ResetPasswordForm } from '@/presentation/forms/resetPasswordForm';
import { UserVpnAccessForm } from '@/presentation/forms/userVpnAccessForm';
import {
  useAdminUserVpnAccess,
  useAdminUsers,
  useCreateUser,
  useResetUserPassword,
  useUpdateUser,
  useUpsertUserVpnAccess
} from '@/presentation/hooks/useAdminData';
import {
  useAssignAuthorizationUserProfile,
  useAuthorizationAssignments,
  useAuthorizationProfiles,
  useRevokeAuthorizationUserProfile
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';
import type {
  AdminCreateUserInput,
  AdminResetPasswordInput,
  AdminUpdateUserInput,
  AdminUser,
  AdminUserVpnAccessInput
} from '@/domain/admin';

type PanelState =
  | { type: 'create' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'vpn'; user: AdminUser }
  | { type: 'access'; user: AdminUser }
  | { type: 'password'; user: AdminUser }
  | null;

export function UsersPage() {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [panel, setPanel] = useState<PanelState>(null);
  const roles = useAuthStore((state) => state.roles);
  const canManage = roles.includes('ADMIN_MASTER');
  const canViewSensitive = roles.includes('ADMIN_MASTER') || roles.includes('ADMIN');

  const usersQuery = useAdminUsers();
  const profilesQuery = useAuthorizationProfiles();
  const assignmentsQuery = useAuthorizationAssignments(panel?.type === 'access' ? panel.user.id : undefined);
  const vpnAccessQuery = useAdminUserVpnAccess(panel?.type === 'vpn' ? panel.user.id : '');
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const resetPasswordMutation = useResetUserPassword();
  const upsertUserVpnAccessMutation = useUpsertUserVpnAccess();
  const assignMutation = useAssignAuthorizationUserProfile();
  const revokeMutation = useRevokeAuthorizationUserProfile();

  const users = usersQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    if (!term) {
      return users;
    }
    return users.filter((user) =>
      [user.fullName, user.email, user.role ?? '', user.groups.join(', ')].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [query, users]);

  const setSuccess = (message: string) => setFeedback({ type: 'success', message });
  const setError = (message: string) => setFeedback({ type: 'error', message });

  const handleCreateUser = async (payload: AdminCreateUserInput) => {
    setFeedback(null);
    try {
      const user = await createUserMutation.mutateAsync(payload);
      setSuccess(`Usuário ${user.email} criado. Email de primeiro acesso enviado.`);
      setPanel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar usuário.');
    }
  };

  const handleUpdateUser = async (userId: string, payload: AdminUpdateUserInput, successMessage?: string) => {
    setFeedback(null);
    try {
      const user = await updateUserMutation.mutateAsync({ userId, payload });
      setSuccess(successMessage ?? `Usuário ${user.email} atualizado com sucesso.`);
      setPanel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar usuário.');
    }
  };

  const handleToggleEnabled = async (user: AdminUser) => {
    await handleUpdateUser(
      user.id,
      {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: (user.role as AdminUpdateUserInput['role']) ?? 'COMMON',
        enabled: !user.enabled
      },
      `Usuário ${user.email} ${user.enabled ? 'desativado' : 'ativado'} com sucesso.`
    );
  };

  const handleResetPassword = async (user: AdminUser, payload: AdminResetPasswordInput) => {
    setFeedback(null);
    try {
      await resetPasswordMutation.mutateAsync({ userId: user.id, payload });
      setSuccess(`Senha de ${user.email} resetada e email enviado.`);
      setPanel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao resetar senha.');
    }
  };

  const handleUpsertVpnAccess = async (user: AdminUser, payload: AdminUserVpnAccessInput) => {
    setFeedback(null);
    try {
      await upsertUserVpnAccessMutation.mutateAsync({ userId: user.id, provider: 'tailscale', payload });
      setSuccess(`Acesso VPN de ${user.email} atualizado.`);
      setPanel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar acesso VPN.');
    }
  };

  const handleAssignProfile = async (user: AdminUser, profileId: number) => {
    setFeedback(null);
    try {
      const assignment = await assignMutation.mutateAsync({ keycloakUserId: user.id, profileId });
      setSuccess(`Profile ${assignment.profileKey} vinculado a ${user.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao vincular profile.');
    }
  };

  const handleRevokeProfile = async (assignmentId: number, keycloakUserId: string, email: string) => {
    setFeedback(null);
    try {
      const assignment = await revokeMutation.mutateAsync({ assignmentId, keycloakUserId });
      setSuccess(`Profile ${assignment.profileKey} revogado de ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao revogar profile.');
    }
  };

  const isLoading = usersQuery.isLoading;
  const error = usersQuery.error as Error | null;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Usuários</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Gerencie identidade, role existente no Keycloak, acesso VPN e profiles sem ficar preso a um formulário fixo.
          </p>
        </div>
        {canManage && (
          <Button type="button" variant="metal" onClick={() => setPanel({ type: 'create' })}>
            Novo usuário
          </Button>
        )}
      </div>

      {feedback && (
        <div className={feedback.type === 'success' ? 'inline-feedback-success' : 'inline-feedback-error'}>
          {feedback.message}
        </div>
      )}

      <UserFilterForm onSearch={setQuery} />

      {isLoading ? (
        <div className="admin-page-grid">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{error.message}</div>
      ) : (
        <UserCards
          users={filtered}
          canManage={canManage}
          canViewSensitive={canViewSensitive}
          onEditUser={(user) => setPanel({ type: 'edit', user })}
          onManageVpn={(user) => setPanel({ type: 'vpn', user })}
          onManageAccess={(user) => setPanel({ type: 'access', user })}
          onResetPassword={(user) => setPanel({ type: 'password', user })}
          onToggleEnabled={handleToggleEnabled}
          isBusy={updateUserMutation.isPending}
        />
      )}

      <AdminEditorSheet
        open={panel?.type === 'create'}
        title="Criar usuário"
        description="Cria a conta no Keycloak, atribui uma role global existente e envia o primeiro acesso."
        onClose={() => setPanel(null)}
      >
        <UserForm mode="create" onSubmit={handleCreateUser} isSubmitting={createUserMutation.isPending} />
      </AdminEditorSheet>

      <AdminEditorSheet
        open={panel?.type === 'edit'}
        title="Editar usuário"
        description="Atualize dados básicos e troque a role global existente no Keycloak."
        onClose={() => setPanel(null)}
      >
        {panel?.type === 'edit' && (
          <UserForm
            mode="update"
            user={panel.user}
            onSubmit={(payload) => handleUpdateUser(panel.user.id, payload)}
            isSubmitting={updateUserMutation.isPending}
          />
        )}
      </AdminEditorSheet>

      <AdminEditorSheet
        open={panel?.type === 'password'}
        title="Resetar senha"
        description="Gere uma nova senha para o usuário e envie o fluxo de acesso controlado."
        onClose={() => setPanel(null)}
      >
        {panel?.type === 'password' && (
          <ResetPasswordForm
            onSubmit={(payload) => handleResetPassword(panel.user, payload)}
            isSubmitting={resetPasswordMutation.isPending}
          />
        )}
      </AdminEditorSheet>

      <AdminEditorSheet
        open={panel?.type === 'vpn'}
        title="Acesso VPN"
        description="Persistência operacional de status e invite manual do provider."
        onClose={() => setPanel(null)}
      >
        {panel?.type === 'vpn' && (
          <UserVpnAccessForm
            defaultValues={{
              status: vpnAccessQuery.data?.find((entry) => entry.provider === 'tailscale')?.status ?? 'none',
              inviteLink: vpnAccessQuery.data?.find((entry) => entry.provider === 'tailscale')?.inviteLink ?? undefined,
              notes: vpnAccessQuery.data?.find((entry) => entry.provider === 'tailscale')?.notes ?? undefined
            }}
            onSubmit={(payload) => handleUpsertVpnAccess(panel.user, payload)}
            isSubmitting={upsertUserVpnAccessMutation.isPending}
          />
        )}
      </AdminEditorSheet>

      <AdminEditorSheet
        open={panel?.type === 'access'}
        title="Gerenciar acessos"
        description="Atribua ou revogue profiles do usuário selecionado."
        onClose={() => setPanel(null)}
      >
        {panel?.type === 'access' && (
          <>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
              Usuário alvo: <strong className="text-[color:var(--text)]">{panel.user.email}</strong>
            </div>
            <UserProfileAssignmentForm
              profiles={profiles}
              fixedUserId={panel.user.id}
              onSubmit={(payload) => handleAssignProfile(panel.user, payload.profileId)}
              isSubmitting={assignMutation.isPending}
            />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Profiles ativos
              </h3>
              {assignmentsQuery.isLoading ? (
                <Skeleton className="h-24" />
              ) : assignments.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
                  Nenhum profile ativo para este usuário.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div>
                        <div className="font-semibold">{assignment.profileKey}</div>
                        <div className="text-sm text-[color:var(--muted)]">{assignment.keycloakUserId}</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={revokeMutation.isPending}
                        onClick={() => handleRevokeProfile(assignment.id, assignment.keycloakUserId, panel.user.email)}
                      >
                        Revogar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </AdminEditorSheet>
    </div>
  );
}

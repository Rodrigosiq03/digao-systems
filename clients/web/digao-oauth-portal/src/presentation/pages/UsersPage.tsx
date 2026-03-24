import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader, AdminPageShell, AdminResourceGrid, InlineFeedback } from '@/presentation/components/adminLayout';
import { AdminEditorSheet } from '@/presentation/components/adminEditorSheet';
import { UserCards } from '@/presentation/components/userCards';
import { UserSystemAccessList } from '@/presentation/components/userSystemAccessList';
import { UserSystemAccessSheet } from '@/presentation/components/userSystemAccessSheet';
import { UserFilterForm } from '@/presentation/forms/userFilterForm';
import { UserForm } from '@/presentation/forms/userForm';
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
  useAuthorizationCapabilities,
  useAuthorizationProfileCapabilities,
  useAuthorizationProfiles,
  useAuthorizationSystems,
  useRevokeAuthorizationUserProfile
} from '@/presentation/hooks/useAuthorizationData';
import { useUserSystemAccessView, type UserSystemAccessView } from '@/presentation/hooks/useUserSystemAccessView';
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
  | { type: 'access'; user: AdminUser; selectedSystem: UserSystemAccessView | null }
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
  const systemsQuery = useAuthorizationSystems();
  const capabilitiesQuery = useAuthorizationCapabilities();
  const profilesQuery = useAuthorizationProfiles();
  const profileCapabilitiesQuery = useAuthorizationProfileCapabilities();
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
  const systems = systemsQuery.data ?? [];
  const capabilities = capabilitiesQuery.data ?? [];
  const profileCapabilities = profileCapabilitiesQuery.data ?? [];
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
  const systemAccessViews = useUserSystemAccessView({
    systems,
    capabilities,
    profiles,
    profileCapabilities,
    assignments,
  });

  const handleCreateUser = async (payload: AdminCreateUserInput) => {
    setFeedback(null);
    try {
      const user = await createUserMutation.mutateAsync(payload);
      if (user.emailSent === false) {
        setError(`Usuário ${user.email} criado, mas o email de primeiro acesso falhou. Verifique os logs do auth-service.`);
      } else {
        setSuccess(`Usuário ${user.email} criado. Email de primeiro acesso enviado.`);
      }
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
      setSuccess(`Perfil ${assignment.profileKey} vinculado a ${user.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao vincular perfil.');
    }
  };

  const handleRevokeProfile = async (assignmentId: number, keycloakUserId: string, email: string) => {
    setFeedback(null);
    try {
      const assignment = await revokeMutation.mutateAsync({ assignmentId, keycloakUserId });
      setSuccess(`Perfil ${assignment.profileKey} revogado de ${email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao revogar perfil.');
    }
  };

  const isLoading = usersQuery.isLoading;
  const error = usersQuery.error as Error | null;

  return (
    <AdminPageShell>
      <AdminPageHeader>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Usuários</h2>
          <p className="text-sm text-slate-600 dark:text-[color:var(--muted)]">
            Gerencie pessoas, papel global da plataforma, acesso VPN e perfis sem ficar preso a um formulário fixo.
          </p>
        </div>
        {canManage && (
          <Button type="button" variant="metal" onClick={() => setPanel({ type: 'create' })}>
            Novo usuário
          </Button>
        )}
      </AdminPageHeader>

      {feedback && <InlineFeedback tone={feedback.type}>{feedback.message}</InlineFeedback>}

      <UserFilterForm onSearch={setQuery} />

      {isLoading ? (
        <AdminResourceGrid>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </AdminResourceGrid>
      ) : error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{error.message}</div>
      ) : (
        <UserCards
          users={filtered}
          canManage={canManage}
          canViewSensitive={canViewSensitive}
          onEditUser={(user) => setPanel({ type: 'edit', user })}
          onManageVpn={(user) => setPanel({ type: 'vpn', user })}
          onManageAccess={(user) => setPanel({ type: 'access', user, selectedSystem: null })}
          onResetPassword={(user) => setPanel({ type: 'password', user })}
          onToggleEnabled={handleToggleEnabled}
          isBusy={updateUserMutation.isPending}
        />
      )}

      <AdminEditorSheet
        open={panel?.type === 'create'}
        title="Criar usuário"
        description="Cria a conta, define o papel global da plataforma e envia o primeiro acesso."
        onClose={() => setPanel(null)}
      >
        <UserForm mode="create" onSubmit={handleCreateUser} isSubmitting={createUserMutation.isPending} />
      </AdminEditorSheet>

      <AdminEditorSheet
        open={panel?.type === 'edit'}
        title="Editar usuário"
        description="Atualize dados básicos e troque o papel global da plataforma."
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
        title="Acessos por sistema"
        description="Use Conceder acesso ou Trocar acesso por sistema sem criar vínculo direto no banco."
        onClose={() => setPanel(null)}
      >
        {panel?.type === 'access' && (
          <>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
              Usuário alvo: <strong className="text-[color:var(--text)]">{panel.user.email}</strong>
            </div>
            {assignmentsQuery.isLoading || systemsQuery.isLoading || capabilitiesQuery.isLoading || profileCapabilitiesQuery.isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <>
                <UserSystemAccessList
                  systems={systemAccessViews}
                  onManage={(selectedSystem) => setPanel({ type: 'access', user: panel.user, selectedSystem })}
                />
                <UserSystemAccessSheet
                  selectedSystem={panel.selectedSystem}
                  currentAssignments={assignments}
                  isSubmitting={assignMutation.isPending}
                  isRevoking={revokeMutation.isPending}
                  onAssign={(profileId) => handleAssignProfile(panel.user, profileId)}
                  onRevoke={(assignmentId) => handleRevokeProfile(assignmentId, panel.user.id, panel.user.email)}
                />
              </>
            )}
          </>
        )}
      </AdminEditorSheet>
    </AdminPageShell>
  );
}

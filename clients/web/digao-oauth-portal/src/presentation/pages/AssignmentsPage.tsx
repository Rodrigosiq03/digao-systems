import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminEditorSheet } from '@/presentation/components/adminEditorSheet';
import { QuickActionsMenu } from '@/presentation/components/quickActionsMenu';
import { UserProfileAssignmentForm } from '@/presentation/forms/userProfileAssignmentForm';
import {
  useAuthorizationAssignments,
  useAuthorizationProfiles,
  useAssignAuthorizationUserProfile,
  useRevokeAuthorizationUserProfile
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function AssignmentsPage() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const roles = useAuthStore((state) => state.roles);
  const profile = useAuthStore((state) => state.profile);
  const assignmentsQuery = useAuthorizationAssignments(profile?.id);
  const profilesQuery = useAuthorizationProfiles();
  const assignments = assignmentsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');
  const isAdminMaster = roles.includes('ADMIN_MASTER');
  const assignMutation = useAssignAuthorizationUserProfile();
  const revokeMutation = useRevokeAuthorizationUserProfile();

  const handleAssign = async (payload: { keycloakUserId: string; profileId: number }) => {
    setFeedback(null);
    try {
      const assignment = await assignMutation.mutateAsync(payload);
      setFeedback({ type: 'success', message: `Profile ${assignment.profileKey} vinculado a ${assignment.keycloakUserId}.` });
      setOpenCreate(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao vincular profile.' });
    }
  };

  const handleRevoke = async (assignmentId: number, keycloakUserId: string) => {
    setFeedback(null);
    try {
      const assignment = await revokeMutation.mutateAsync({ assignmentId, keycloakUserId });
      setFeedback({ type: 'success', message: `Vínculo ${assignment.profileKey} revogado de ${assignment.keycloakUserId}.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao revogar vínculo.' });
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Acessos</h2>
          <p className="text-sm text-[color:var(--muted)]">Profiles atribuídos ao usuário autenticado no momento.</p>
        </div>
        {isAdminMaster && (
          <Button type="button" variant="metal" onClick={() => setOpenCreate(true)}>
            Vincular profile
          </Button>
        )}
      </div>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar atribuições.
        </div>
      )}
      {feedback && (
        <div className={feedback.type === 'success' ? 'inline-feedback-success' : 'inline-feedback-error'}>
          {feedback.message}
        </div>
      )}
      {!profile?.id ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">
          Não foi possível resolver o identificador do usuário autenticado.
        </div>
      ) : assignmentsQuery.isLoading ? (
        <div className="admin-page-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      ) : assignmentsQuery.error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{(assignmentsQuery.error as Error).message}</div>
      ) : assignments.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhuma atribuição ativa encontrada.</div>
      ) : (
        <div className="admin-page-grid">
          {assignments.map((assignment) => (
            <article key={assignment.id} className="resource-card glass-card">
              <div className="resource-card-header">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{assignment.profileKey}</h3>
                  <p className="text-sm text-[color:var(--muted)]">{assignment.keycloakUserId}</p>
                </div>
                {isAdminMaster && (
                  <QuickActionsMenu
                    actions={[
                      {
                        label: 'Revogar vínculo',
                        onClick: () => handleRevoke(assignment.id, assignment.keycloakUserId),
                        disabled: revokeMutation.isPending
                      }
                    ]}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminEditorSheet
        open={openCreate}
        title="Vincular profile"
        description="Associe um profile a um usuário do Keycloak."
        onClose={() => setOpenCreate(false)}
      >
        <UserProfileAssignmentForm
          profiles={profiles}
          onSubmit={handleAssign}
          isSubmitting={assignMutation.isPending}
        />
      </AdminEditorSheet>
    </div>
  );
}

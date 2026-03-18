import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfileAssignmentForm } from '@/presentation/forms/userProfileAssignmentForm';
import {
  useAuthorizationAssignments,
  useAuthorizationProfiles,
  useAssignAuthorizationUserProfile,
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function AssignmentsPage() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const roles = useAuthStore((state) => state.roles);
  const profile = useAuthStore((state) => state.profile);
  const assignmentsQuery = useAuthorizationAssignments(profile?.id);
  const profilesQuery = useAuthorizationProfiles();
  const assignments = assignmentsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');
  const isAdminMaster = roles.includes('ADMIN_MASTER');
  const assignMutation = useAssignAuthorizationUserProfile();

  const handleAssign = async (payload: { keycloakUserId: string; profileId: number }) => {
    setFeedback(null);
    try {
      const assignment = await assignMutation.mutateAsync(payload);
      setFeedback({ type: 'success', message: `Profile ${assignment.profileKey} vinculado a ${assignment.keycloakUserId}.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao vincular profile.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Acessos</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Profiles atribuídos ao usuário consultado no momento.
        </p>
      </div>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar atribuições.
        </div>
      )}
      {isAdminMaster && (
        <div className="glass-card space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Vincular profile</h3>
            <p className="text-sm text-[color:var(--muted)]">Associe um profile a um usuário do Keycloak.</p>
          </div>
          <UserProfileAssignmentForm
            profiles={profiles}
            onSubmit={handleAssign}
            isSubmitting={assignMutation.isPending}
          />
        </div>
      )}
      {feedback && (
        <div className={feedback.type === 'success'
          ? 'rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100'
          : 'rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100'}>
          {feedback.message}
        </div>
      )}
      {!profile?.id ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">
          Não foi possível resolver o identificador do usuário autenticado.
        </div>
      ) : assignmentsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      ) : assignmentsQuery.error ? (
        <div className="glass-card p-4 text-sm text-rose-100">
          {(assignmentsQuery.error as Error).message}
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhuma atribuição ativa encontrada.</div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <article key={assignment.id} className="glass-card space-y-1 p-4">
              <h3 className="font-semibold">{assignment.profileKey}</h3>
              <p className="text-sm text-[color:var(--muted)]">{assignment.keycloakUserId}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

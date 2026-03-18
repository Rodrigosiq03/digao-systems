import { Skeleton } from '@/components/ui/skeleton';
import { useAuthorizationAssignments } from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function AssignmentsPage() {
  const roles = useAuthStore((state) => state.roles);
  const profile = useAuthStore((state) => state.profile);
  const assignmentsQuery = useAuthorizationAssignments(profile?.id);
  const assignments = assignmentsQuery.data ?? [];
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');

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

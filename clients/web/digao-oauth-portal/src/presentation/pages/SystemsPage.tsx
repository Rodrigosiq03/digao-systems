import { SystemCard } from '@/presentation/components/systemCard';
import { useAdminGroups } from '@/presentation/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';

export function SystemsPage() {
  const groupsQuery = useAdminGroups();
  const groups = groupsQuery.data ?? [];
  const isLoading = groupsQuery.isLoading;
  const error = groupsQuery.error as Error | null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Sistemas</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Cada sistema corresponde a um Group do Keycloak. Aqui você controla o acesso.
        </p>
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{error.message}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <SystemCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

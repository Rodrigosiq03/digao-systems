import { Skeleton } from '@/components/ui/skeleton';
import { useAuthorizationSystems } from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function SystemsPage() {
  const systemsQuery = useAuthorizationSystems();
  const roles = useAuthStore((state) => state.roles);
  const systems = systemsQuery.data ?? [];
  const isLoading = systemsQuery.isLoading;
  const error = systemsQuery.error as Error | null;
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Sistemas</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Catálogo de sistemas administráveis do portal.
        </p>
      </div>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar sistemas.
        </div>
      )}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{error.message}</div>
      ) : systems.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhum sistema cadastrado ainda.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {systems.map((system) => (
            <article key={system.id} className="glass-card space-y-2 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{system.name}</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {system.enabled ? 'Ativo' : 'Desativado'}
                </span>
              </div>
              <p className="text-sm text-[color:var(--muted)]">{system.key}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

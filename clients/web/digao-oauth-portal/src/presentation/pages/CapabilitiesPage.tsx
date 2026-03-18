import { Skeleton } from '@/components/ui/skeleton';
import { useAuthorizationCapabilities } from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function CapabilitiesPage() {
  const capabilitiesQuery = useAuthorizationCapabilities();
  const roles = useAuthStore((state) => state.roles);
  const capabilities = capabilitiesQuery.data ?? [];
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Capabilities</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Permissões dinâmicas por sistema para evoluir fluxos e responsabilidades.
        </p>
      </div>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar capabilities.
        </div>
      )}
      {capabilitiesQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      ) : capabilitiesQuery.error ? (
        <div className="glass-card p-4 text-sm text-rose-100">
          {(capabilitiesQuery.error as Error).message}
        </div>
      ) : capabilities.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhuma capability cadastrada ainda.</div>
      ) : (
        <div className="space-y-3">
          {capabilities.map((capability) => (
            <article key={capability.id} className="glass-card space-y-1 p-4">
              <h3 className="font-semibold">{capability.name}</h3>
              <p className="text-sm text-[color:var(--muted)]">
                {capability.key} • system #{capability.systemId}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

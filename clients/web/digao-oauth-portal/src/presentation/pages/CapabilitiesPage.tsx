import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CapabilityForm } from '@/presentation/forms/capabilityForm';
import {
  useAuthorizationCapabilities,
  useAuthorizationSystems,
  useCreateAuthorizationCapability,
  useDisableAuthorizationCapability,
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function CapabilitiesPage() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const capabilitiesQuery = useAuthorizationCapabilities();
  const systemsQuery = useAuthorizationSystems();
  const roles = useAuthStore((state) => state.roles);
  const capabilities = capabilitiesQuery.data ?? [];
  const systems = systemsQuery.data ?? [];
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');
  const isAdminMaster = roles.includes('ADMIN_MASTER');
  const createCapabilityMutation = useCreateAuthorizationCapability();
  const disableCapabilityMutation = useDisableAuthorizationCapability();

  const handleCreateCapability = async (payload: { systemId: number; key: string; name: string }) => {
    setFeedback(null);
    try {
      const capability = await createCapabilityMutation.mutateAsync(payload);
      setFeedback({ type: 'success', message: `Capability ${capability.name} criada.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao criar capability.' });
    }
  };

  const handleDisableCapability = async (capabilityId: number) => {
    setFeedback(null);
    try {
      const capability = await disableCapabilityMutation.mutateAsync(capabilityId);
      setFeedback({ type: 'success', message: `Capability ${capability.name} desativada.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao desativar capability.' });
    }
  };

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
      {isAdminMaster && (
        <div className="glass-card space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Nova capability</h3>
            <p className="text-sm text-[color:var(--muted)]">Adicione permissões dinâmicas a um sistema.</p>
          </div>
          <CapabilityForm
            systems={systems}
            onSubmit={handleCreateCapability}
            isSubmitting={createCapabilityMutation.isPending}
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
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{capability.name}</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {capability.enabled ? 'Ativa' : 'Desativada'}
                </span>
              </div>
              <p className="text-sm text-[color:var(--muted)]">
                {capability.key} • system #{capability.systemId}
              </p>
              {isAdminMaster && capability.enabled && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disableCapabilityMutation.isPending}
                    onClick={() => handleDisableCapability(capability.id)}
                  >
                    Desativar capability
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

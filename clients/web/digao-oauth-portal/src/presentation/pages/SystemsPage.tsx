import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SystemForm } from '@/presentation/forms/systemForm';
import {
  useAuthorizationSystems,
  useCreateAuthorizationSystem,
  useDisableAuthorizationSystem,
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function SystemsPage() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const systemsQuery = useAuthorizationSystems();
  const roles = useAuthStore((state) => state.roles);
  const systems = systemsQuery.data ?? [];
  const isLoading = systemsQuery.isLoading;
  const error = systemsQuery.error as Error | null;
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');
  const isAdminMaster = roles.includes('ADMIN_MASTER');
  const createSystemMutation = useCreateAuthorizationSystem();
  const disableSystemMutation = useDisableAuthorizationSystem();

  const handleCreateSystem = async (payload: { key: string; name: string }) => {
    setFeedback(null);
    try {
      const system = await createSystemMutation.mutateAsync(payload);
      setFeedback({ type: 'success', message: `Sistema ${system.name} criado.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao criar sistema.' });
    }
  };

  const handleDisableSystem = async (systemId: number) => {
    setFeedback(null);
    try {
      const system = await disableSystemMutation.mutateAsync(systemId);
      setFeedback({ type: 'success', message: `Sistema ${system.name} desativado.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao desativar sistema.' });
    }
  };

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
      {isAdminMaster && (
        <div className="glass-card space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Novo sistema</h3>
            <p className="text-sm text-[color:var(--muted)]">Crie o identificador administrativo do sistema.</p>
          </div>
          <SystemForm onSubmit={handleCreateSystem} isSubmitting={createSystemMutation.isPending} />
        </div>
      )}
      {feedback && (
        <div className={feedback.type === 'success'
          ? 'rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100'
          : 'rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100'}>
          {feedback.message}
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
              {isAdminMaster && system.enabled && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disableSystemMutation.isPending}
                    onClick={() => handleDisableSystem(system.id)}
                  >
                    Desativar
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

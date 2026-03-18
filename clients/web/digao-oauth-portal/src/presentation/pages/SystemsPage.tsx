import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader, AdminPageShell, AdminResourceGrid, InlineFeedback } from '@/presentation/components/adminLayout';
import { AdminEditorSheet } from '@/presentation/components/adminEditorSheet';
import { QuickActionsMenu } from '@/presentation/components/quickActionsMenu';
import { ResourceCard, ResourceCardHeader, ResourceCardMeta } from '@/presentation/components/resourceCard';
import { SystemForm } from '@/presentation/forms/systemForm';
import {
  useAuthorizationSystems,
  useCreateAuthorizationSystem,
  useDisableAuthorizationSystem
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function SystemsPage() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openEditor, setOpenEditor] = useState(false);
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
      setOpenEditor(false);
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
    <AdminPageShell>
      <AdminPageHeader>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Sistemas</h2>
          <p className="text-sm text-[color:var(--muted)]">Catálogo de sistemas administráveis do portal.</p>
        </div>
        {isAdminMaster && (
          <Button type="button" variant="metal" onClick={() => setOpenEditor(true)}>
            Novo sistema
          </Button>
        )}
      </AdminPageHeader>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar sistemas.
        </div>
      )}
      {feedback && <InlineFeedback tone={feedback.type}>{feedback.message}</InlineFeedback>}
      {isLoading ? (
        <AdminResourceGrid>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56" />
          ))}
        </AdminResourceGrid>
      ) : error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{error.message}</div>
      ) : systems.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhum sistema cadastrado ainda.</div>
      ) : (
        <AdminResourceGrid>
          {systems.map((system) => (
            <ResourceCard key={system.id}>
              <ResourceCardHeader>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{system.name}</h3>
                  <p className="text-sm text-[color:var(--muted)]">{system.key}</p>
                </div>
                {isAdminMaster && system.enabled && (
                  <QuickActionsMenu
                    actions={[
                      {
                        label: 'Desativar sistema',
                        onClick: () => handleDisableSystem(system.id),
                        disabled: disableSystemMutation.isPending
                      }
                    ]}
                  />
                )}
              </ResourceCardHeader>
              <ResourceCardMeta>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Status</p>
                  <strong>{system.enabled ? 'Ativo' : 'Desativado'}</strong>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Identificador</p>
                  <strong>{system.id}</strong>
                </div>
              </ResourceCardMeta>
            </ResourceCard>
          ))}
        </AdminResourceGrid>
      )}

      <AdminEditorSheet
        open={openEditor}
        title="Criar sistema"
        description="Registre um novo sistema administrável no portal."
        onClose={() => setOpenEditor(false)}
      >
        <SystemForm onSubmit={handleCreateSystem} isSubmitting={createSystemMutation.isPending} />
      </AdminEditorSheet>
    </AdminPageShell>
  );
}

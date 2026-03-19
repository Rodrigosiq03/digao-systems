import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader, AdminPageShell, AdminResourceGrid, InlineFeedback } from '@/presentation/components/adminLayout';
import { AdminEditorSheet } from '@/presentation/components/adminEditorSheet';
import { QuickActionsMenu } from '@/presentation/components/quickActionsMenu';
import { ResourceCard, ResourceCardHeader, ResourceCardMeta } from '@/presentation/components/resourceCard';
import { CapabilityForm } from '@/presentation/forms/capabilityForm';
import {
  useAuthorizationCapabilities,
  useAuthorizationSystems,
  useCreateAuthorizationCapability,
  useDisableAuthorizationCapability
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function CapabilitiesPage() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
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
      setOpenCreate(false);
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
    <AdminPageShell>
      <AdminPageHeader>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Permissões</h2>
          <p className="text-sm text-[color:var(--muted)]">Permissões dinâmicas por sistema para evoluir fluxos e responsabilidades.</p>
        </div>
        {isAdminMaster && (
          <Button type="button" variant="metal" onClick={() => setOpenCreate(true)}>
            Nova permissão
          </Button>
        )}
      </AdminPageHeader>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar permissões.
        </div>
      )}
      {feedback && <InlineFeedback tone={feedback.type}>{feedback.message}</InlineFeedback>}
      {capabilitiesQuery.isLoading ? (
        <AdminResourceGrid>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56" />
          ))}
        </AdminResourceGrid>
      ) : capabilitiesQuery.error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{(capabilitiesQuery.error as Error).message}</div>
      ) : capabilities.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhuma permissão cadastrada ainda.</div>
      ) : (
        <AdminResourceGrid>
          {capabilities.map((capability) => (
            <ResourceCard key={capability.id}>
              <ResourceCardHeader>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{capability.name}</h3>
                  <p className="text-sm text-[color:var(--muted)]">{capability.key}</p>
                </div>
                {isAdminMaster && capability.enabled && (
                  <QuickActionsMenu
                    actions={[
                      {
                        label: 'Desativar permissão',
                        onClick: () => handleDisableCapability(capability.id),
                        disabled: disableCapabilityMutation.isPending
                      }
                    ]}
                  />
                )}
              </ResourceCardHeader>
              <ResourceCardMeta>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Status</p>
                  <strong>{capability.enabled ? 'Ativa' : 'Desativada'}</strong>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">System ID</p>
                  <strong>{capability.systemId}</strong>
                </div>
              </ResourceCardMeta>
            </ResourceCard>
          ))}
        </AdminResourceGrid>
      )}

      <AdminEditorSheet
        open={openCreate}
        title="Criar permissão"
        description="Adicione uma nova permissão dinâmica a um sistema."
        onClose={() => setOpenCreate(false)}
      >
        <CapabilityForm
          systems={systems}
          onSubmit={handleCreateCapability}
          isSubmitting={createCapabilityMutation.isPending}
        />
      </AdminEditorSheet>
    </AdminPageShell>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader, AdminPageShell, AdminResourceGrid, InlineFeedback } from '@/presentation/components/adminLayout';
import { AdminEditorSheet } from '@/presentation/components/adminEditorSheet';
import { accentActionButtonClass } from '@/presentation/components/accentActionButtonClass';
import { QuickActionsMenu } from '@/presentation/components/quickActionsMenu';
import { ResourceCard, ResourceCardHeader, ResourceCardMeta } from '@/presentation/components/resourceCard';
import { ProfileForm } from '@/presentation/forms/profileForm';
import {
  useAuthorizationProfiles,
  useAuthorizationCapabilities,
  useCreateAuthorizationProfile,
  useDisableAuthorizationProfile,
  useGrantAuthorizationProfileCapability
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function ProfilesPage() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openGrant, setOpenGrant] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<number | null>(null);
  const profilesQuery = useAuthorizationProfiles();
  const capabilitiesQuery = useAuthorizationCapabilities();
  const roles = useAuthStore((state) => state.roles);
  const profiles = profilesQuery.data ?? [];
  const capabilities = capabilitiesQuery.data ?? [];
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');
  const isAdminMaster = roles.includes('ADMIN_MASTER');
  const createProfileMutation = useCreateAuthorizationProfile();
  const disableProfileMutation = useDisableAuthorizationProfile();
  const grantMutation = useGrantAuthorizationProfileCapability();

  const handleCreateProfile = async (payload: { key: string; name: string }) => {
    setFeedback(null);
    try {
      const profile = await createProfileMutation.mutateAsync(payload);
      setFeedback({ type: 'success', message: `Perfil ${profile.name} criado.` });
      setOpenCreate(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao criar perfil.' });
    }
  };

  const handleGrant = async () => {
    if (!selectedProfileId || !selectedCapabilityId) return;
    setFeedback(null);
    try {
      const grant = await grantMutation.mutateAsync({ profileId: selectedProfileId, capabilityId: selectedCapabilityId });
      setFeedback({ type: 'success', message: `Permissão ${grant.capabilityKey} vinculada ao perfil ${grant.profileKey}.` });
      setOpenGrant(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao vincular permissão.' });
    }
  };

  const handleDisableProfile = async (profileId: number) => {
    setFeedback(null);
    try {
      const profile = await disableProfileMutation.mutateAsync(profileId);
      setFeedback({ type: 'success', message: `Perfil ${profile.name} desativado.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao desativar perfil.' });
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Perfis</h2>
          <p className="text-sm text-slate-600 dark:text-[color:var(--muted)]">Pacotes reutilizáveis de permissões atribuíveis a usuários.</p>
        </div>
        {isAdminMaster && (
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="ghost" className={accentActionButtonClass} onClick={() => setOpenGrant(true)}>
              Vincular permissão
            </Button>
            <Button type="button" variant="metal" onClick={() => setOpenCreate(true)}>
              Novo perfil
            </Button>
          </div>
        )}
      </AdminPageHeader>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar perfis.
        </div>
      )}
      {feedback && <InlineFeedback tone={feedback.type}>{feedback.message}</InlineFeedback>}
      {profilesQuery.isLoading ? (
        <AdminResourceGrid>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56" />
          ))}
        </AdminResourceGrid>
      ) : profilesQuery.error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{(profilesQuery.error as Error).message}</div>
      ) : profiles.length === 0 ? (
        <div className="glass-card p-4 text-sm text-slate-600 dark:text-[color:var(--muted)]">Nenhum perfil cadastrado ainda.</div>
      ) : (
        <AdminResourceGrid>
          {profiles.map((profile) => (
            <ResourceCard key={profile.id}>
              <ResourceCardHeader>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-[color:var(--muted)]">{profile.key}</p>
                </div>
                {isAdminMaster && profile.enabled && (
                  <QuickActionsMenu
                    actions={[
                      {
                        label: 'Desativar perfil',
                        onClick: () => handleDisableProfile(profile.id),
                        disabled: disableProfileMutation.isPending
                      }
                    ]}
                  />
                )}
              </ResourceCardHeader>
              <ResourceCardMeta>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Status</p>
                  <strong>{profile.enabled ? 'Ativo' : 'Desativado'}</strong>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Identificador</p>
                  <strong>{profile.id}</strong>
                </div>
              </ResourceCardMeta>
            </ResourceCard>
          ))}
        </AdminResourceGrid>
      )}

      <AdminEditorSheet
        open={openCreate}
        title="Criar perfil"
        description="Crie um pacote reutilizável de acesso para usuários."
        onClose={() => setOpenCreate(false)}
      >
        <ProfileForm onSubmit={handleCreateProfile} isSubmitting={createProfileMutation.isPending} />
      </AdminEditorSheet>

      <AdminEditorSheet
        open={openGrant}
        title="Vincular permissão"
        description="Associe uma permissão dinâmica a um perfil existente."
        onClose={() => setOpenGrant(false)}
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="grant-profile-inline">Perfil</Label>
            <Select id="grant-profile-inline" value={selectedProfileId?.toString() ?? ''} onChange={(e) => setSelectedProfileId(Number(e.target.value))}>
              <option value="">Selecione</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-capability-inline">Permissão</Label>
            <Select id="grant-capability-inline" value={selectedCapabilityId?.toString() ?? ''} onChange={(e) => setSelectedCapabilityId(Number(e.target.value))}>
              <option value="">Selecione</option>
              {capabilities.map((capability) => (
                <option key={capability.id} value={capability.id}>{capability.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-start">
            <Button
              type="button"
              variant="ghost"
              className={accentActionButtonClass}
              onClick={handleGrant}
              disabled={grantMutation.isPending || !selectedProfileId || !selectedCapabilityId}
            >
              Vincular
            </Button>
          </div>
        </div>
      </AdminEditorSheet>
    </AdminPageShell>
  );
}

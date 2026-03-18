import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminEditorSheet } from '@/presentation/components/adminEditorSheet';
import { QuickActionsMenu } from '@/presentation/components/quickActionsMenu';
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
      setFeedback({ type: 'success', message: `Profile ${profile.name} criado.` });
      setOpenCreate(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao criar profile.' });
    }
  };

  const handleGrant = async () => {
    if (!selectedProfileId || !selectedCapabilityId) return;
    setFeedback(null);
    try {
      const grant = await grantMutation.mutateAsync({ profileId: selectedProfileId, capabilityId: selectedCapabilityId });
      setFeedback({ type: 'success', message: `Capability ${grant.capabilityKey} vinculada ao profile ${grant.profileKey}.` });
      setOpenGrant(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao vincular capability.' });
    }
  };

  const handleDisableProfile = async (profileId: number) => {
    setFeedback(null);
    try {
      const profile = await disableProfileMutation.mutateAsync(profileId);
      setFeedback({ type: 'success', message: `Profile ${profile.name} desativado.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Falha ao desativar profile.' });
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Profiles</h2>
          <p className="text-sm text-[color:var(--muted)]">Pacotes reutilizáveis de capabilities atribuíveis a usuários.</p>
        </div>
        {isAdminMaster && (
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => setOpenGrant(true)}>
              Vincular capability
            </Button>
            <Button type="button" variant="metal" onClick={() => setOpenCreate(true)}>
              Novo profile
            </Button>
          </div>
        )}
      </div>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar profiles.
        </div>
      )}
      {feedback && (
        <div className={feedback.type === 'success' ? 'inline-feedback-success' : 'inline-feedback-error'}>
          {feedback.message}
        </div>
      )}
      {profilesQuery.isLoading ? (
        <div className="admin-page-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56" />
          ))}
        </div>
      ) : profilesQuery.error ? (
        <div className="glass-card p-4 text-sm text-rose-100">{(profilesQuery.error as Error).message}</div>
      ) : profiles.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhum profile cadastrado ainda.</div>
      ) : (
        <div className="admin-page-grid">
          {profiles.map((profile) => (
            <article key={profile.id} className="resource-card glass-card">
              <div className="resource-card-header">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-sm text-[color:var(--muted)]">{profile.key}</p>
                </div>
                {isAdminMaster && profile.enabled && (
                  <QuickActionsMenu
                    actions={[
                      {
                        label: 'Desativar profile',
                        onClick: () => handleDisableProfile(profile.id),
                        disabled: disableProfileMutation.isPending
                      }
                    ]}
                  />
                )}
              </div>
              <div className="resource-card-meta">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Status</p>
                  <strong>{profile.enabled ? 'Ativo' : 'Desativado'}</strong>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Identificador</p>
                  <strong>{profile.id}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminEditorSheet
        open={openCreate}
        title="Criar profile"
        description="Crie um pacote reutilizável de acesso para usuários."
        onClose={() => setOpenCreate(false)}
      >
        <ProfileForm onSubmit={handleCreateProfile} isSubmitting={createProfileMutation.isPending} />
      </AdminEditorSheet>

      <AdminEditorSheet
        open={openGrant}
        title="Vincular capability"
        description="Associe uma capability dinâmica a um profile existente."
        onClose={() => setOpenGrant(false)}
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="grant-profile-inline">Profile</Label>
            <Select id="grant-profile-inline" value={selectedProfileId?.toString() ?? ''} onChange={(e) => setSelectedProfileId(Number(e.target.value))}>
              <option value="">Selecione</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grant-capability-inline">Capability</Label>
            <Select id="grant-capability-inline" value={selectedCapabilityId?.toString() ?? ''} onChange={(e) => setSelectedCapabilityId(Number(e.target.value))}>
              <option value="">Selecione</option>
              {capabilities.map((capability) => (
                <option key={capability.id} value={capability.id}>{capability.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="metal" onClick={handleGrant} disabled={grantMutation.isPending || !selectedProfileId || !selectedCapabilityId}>
              Vincular
            </Button>
          </div>
        </div>
      </AdminEditorSheet>
    </div>
  );
}

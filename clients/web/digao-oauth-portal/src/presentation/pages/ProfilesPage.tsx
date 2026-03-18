import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ProfileForm } from '@/presentation/forms/profileForm';
import {
  useAuthorizationProfiles,
  useAuthorizationCapabilities,
  useCreateAuthorizationProfile,
  useDisableAuthorizationProfile,
  useGrantAuthorizationProfileCapability,
} from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function ProfilesPage() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Profiles</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Pacotes reutilizáveis de capabilities atribuíveis a usuários.
        </p>
      </div>
      {isReadOnly && (
        <div className="glass-card p-4 text-sm text-amber-100">
          <strong>Somente leitura.</strong> Apenas <strong>ADMIN_MASTER</strong> pode alterar profiles.
        </div>
      )}
      {isAdminMaster && (
        <>
          <div className="glass-card space-y-4 p-5">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Novo profile</h3>
              <p className="text-sm text-[color:var(--muted)]">Crie um pacote reutilizável de acesso.</p>
            </div>
            <ProfileForm onSubmit={handleCreateProfile} isSubmitting={createProfileMutation.isPending} />
          </div>
          <div className="glass-card grid gap-4 md:grid-cols-[1fr_1fr_auto] p-5">
            <div className="space-y-2">
              <Label htmlFor="grant-profile">Profile</Label>
              <Select id="grant-profile" value={selectedProfileId?.toString() ?? ''} onChange={(e) => setSelectedProfileId(Number(e.target.value))}>
                <option value="">Selecione</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-capability">Capability</Label>
              <Select id="grant-capability" value={selectedCapabilityId?.toString() ?? ''} onChange={(e) => setSelectedCapabilityId(Number(e.target.value))}>
                <option value="">Selecione</option>
                {capabilities.map((capability) => (
                  <option key={capability.id} value={capability.id}>{capability.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="metal" onClick={handleGrant} disabled={grantMutation.isPending || !selectedProfileId || !selectedCapabilityId}>
                Vincular capability
              </Button>
            </div>
          </div>
        </>
      )}
      {feedback && (
        <div className={feedback.type === 'success'
          ? 'rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100'
          : 'rounded-lg border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100'}>
          {feedback.message}
        </div>
      )}
      {profilesQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      ) : profilesQuery.error ? (
        <div className="glass-card p-4 text-sm text-rose-100">
          {(profilesQuery.error as Error).message}
        </div>
      ) : profiles.length === 0 ? (
        <div className="glass-card p-4 text-sm text-[color:var(--muted)]">Nenhum profile cadastrado ainda.</div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <article key={profile.id} className="glass-card space-y-1 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{profile.name}</h3>
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {profile.enabled ? 'Ativo' : 'Desativado'}
                </span>
              </div>
              <p className="text-sm text-[color:var(--muted)]">{profile.key}</p>
              {isAdminMaster && profile.enabled && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disableProfileMutation.isPending}
                    onClick={() => handleDisableProfile(profile.id)}
                  >
                    Desativar profile
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

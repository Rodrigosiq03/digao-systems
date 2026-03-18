import { Skeleton } from '@/components/ui/skeleton';
import { useAuthorizationProfiles } from '@/presentation/hooks/useAuthorizationData';
import { useAuthStore } from '@/presentation/stores/authStore';

export function ProfilesPage() {
  const profilesQuery = useAuthorizationProfiles();
  const roles = useAuthStore((state) => state.roles);
  const profiles = profilesQuery.data ?? [];
  const isReadOnly = roles.includes('ADMIN') && !roles.includes('ADMIN_MASTER');

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
              <h3 className="font-semibold">{profile.name}</h3>
              <p className="text-sm text-[color:var(--muted)]">{profile.key}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

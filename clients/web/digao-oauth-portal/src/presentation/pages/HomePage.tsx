import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/presentation/stores/authStore';

export function HomePage() {
  const { profile, roles } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-black">Portal Digão OAuth</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Ponto central de identidade, acesso e governança dos sistemas do Digão.
        </p>
      </div>
      <div className="glass-card space-y-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Sessão atual</p>
          <h3 className="text-xl font-bold">{profile?.firstName || profile?.username || 'Usuário autenticado'}</h3>
          <p className="text-sm text-[color:var(--muted)]">{profile?.email || 'Sem e-mail disponível'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Badge key={role}>
              {role}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

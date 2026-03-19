import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/presentation/stores/authStore';

export function AuthPanel() {
  const { isReady, isAuthenticated, profile, roles, login, logout, refresh } = useAuthStore();

  if (!isReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conectando...</CardTitle>
          <CardDescription>Verificando sua sessão para liberar a plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entrar na plataforma</CardTitle>
          <CardDescription>
            Faça login para acessar seus sistemas, equipes e controles administrativos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="metal" onClick={login}>
            Entrar com DigãoOAuth
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bem-vindo de volta</CardTitle>
        <CardDescription>
          {profile?.firstName || profile?.username || 'Usuário'} • {profile?.email || 'sem email'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[color:var(--muted)]">Usuário</p>
            <strong>{profile?.username || '-'}</strong>
          </div>
          <div>
            <p className="text-xs text-[color:var(--muted)]">Status da sessão</p>
            <strong>Ativa</strong>
          </div>
          <div>
            <p className="text-xs text-[color:var(--muted)]">Papéis</p>
            <strong>{roles.length}</strong>
          </div>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          {roles.length === 0 && <span className="text-xs text-[color:var(--muted)]">Nenhuma role.</span>}
          {roles.map((role) => (
            <span key={role} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold">
              {role}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-start gap-3">
        <Button variant="secondary" onClick={refresh}>
          Atualizar sessão
        </Button>
        <Button variant="ghost" onClick={logout}>
          Sair
        </Button>
      </CardFooter>
    </Card>
  );
}

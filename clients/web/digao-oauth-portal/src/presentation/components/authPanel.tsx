import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/presentation/stores/authStore';

export function AuthPanel() {
  const { isReady, isAuthenticated, profile, roles, login, logout, refresh, getConfig } = useAuthStore();
  const config = getConfig();

  if (!isReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conectando...</CardTitle>
          <CardDescription>Checando sua sessão no Keycloak.</CardDescription>
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
          <CardTitle>Entrar no Digão OAuth</CardTitle>
          <CardDescription>
            Você será redirecionado para o Keycloak e retorna direto para este portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="metal" onClick={login}>
            Entrar com Keycloak
          </Button>
          <p className="text-xs text-[color:var(--muted)]">
            Realm: <strong>{config.realm}</strong> • Client: <strong>{config.clientId}</strong>
          </p>
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
            <p className="text-xs text-[color:var(--muted)]">Realm</p>
            <strong>{config.realm}</strong>
          </div>
          <div>
            <p className="text-xs text-[color:var(--muted)]">Client</p>
            <strong>{config.clientId}</strong>
          </div>
          <div>
            <p className="text-xs text-[color:var(--muted)]">Roles</p>
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
          Atualizar token
        </Button>
        <Button variant="ghost" onClick={logout}>
          Sair
        </Button>
      </CardFooter>
    </Card>
  );
}

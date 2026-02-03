import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/presentation/components/themeToggle';
import { useAuthStore } from '@/presentation/stores/authStore';

export function Topbar() {
  const { isAuthenticated, profile, login, logout } = useAuthStore();

  return (
    <header className="app-topbar">
      <div className="topbar-brand">
        <img src={logo} alt="Digão OAuth" />
        <div>
          <strong>Digão OAuth</strong>
          <span>Admin Console</span>
        </div>
      </div>
      <div className="topbar-actions">
        <ThemeToggle />
        {!isAuthenticated && (
          <Button variant="metal" onClick={login}>
            Entrar
          </Button>
        )}
        {isAuthenticated && (
          <Button variant="ghost" onClick={logout}>
            {profile?.firstName || 'Conta'} • Sair
          </Button>
        )}
      </div>
    </header>
  );
}

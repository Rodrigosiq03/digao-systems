import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/presentation/components/themeToggle';
import { useAuthStore } from '@/presentation/stores/authStore';

export function Topbar() {
  const { isAuthenticated, profile, login, logout } = useAuthStore();

  return (
    <header className="relative z-[1] flex flex-col items-start justify-between gap-4 border-b border-white/8 px-6 py-5 backdrop-blur-[16px] md:flex-row md:items-center md:px-8">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Digão Systems" className="h-10 w-10" />
        <div>
          <strong className="block font-extrabold">Digão Systems</strong>
          <span className="text-xs text-[color:var(--muted)]">Plataforma de acesso</span>
        </div>
      </div>
      <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
        <ThemeToggle />
        {!isAuthenticated && (
          <Button variant="metal" onClick={login}>
            Entrar
          </Button>
        )}
        {isAuthenticated && (
          <Button
            variant="ghost"
            onClick={logout}
            className="border border-rose-400/20 bg-rose-500/8 text-rose-200 hover:bg-rose-500/14 hover:text-rose-100"
          >
            {profile?.firstName || 'Conta'} • Sair
          </Button>
        )}
      </div>
    </header>
  );
}

import { useEffect } from 'react';
import { Sidebar } from '@/presentation/components/sidebar';
import { Topbar } from '@/presentation/components/topbar';
import { useAuthStore } from '@/presentation/stores/authStore';
import { useNavStore } from '@/presentation/stores/navStore';
import { useThemeStore } from '@/presentation/stores/themeStore';
import { AdminPage } from '@/presentation/pages/AdminPage';
import { UsersPage } from '@/presentation/pages/UsersPage';
import { SystemsPage } from '@/presentation/pages/SystemsPage';
import { AuthPanel } from '@/presentation/components/authPanel';
import { ThemeToggle } from '@/presentation/components/themeToggle';

export function AppShell() {
  const init = useAuthStore((state) => state.init);
  const { isReady, isAuthenticated } = useAuthStore();
  const active = useNavStore((state) => state.active);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="auth-gate">
        <div className="auth-gate-bg">
          <span className="gate-orb orb-a" />
          <span className="gate-orb orb-b" />
          <span className="gate-orb orb-c" />
          <span className="gate-grid" />
        </div>
        <div className="auth-gate-toolbar">
          <ThemeToggle />
        </div>
        <div className="auth-gate-inner">
          <div className="auth-gate-copy">
            <div className="gate-brand">
              <div className="lock-emblem">
                <span className="lock-core" />
              </div>
              <div>
                <p className="gate-eyebrow">Digão OAuth</p>
                <h1 className="gate-title">Acesso unificado, controle total</h1>
              </div>
            </div>
            <p className="gate-subtitle">
              Entre com o Keycloak e volte direto para o painel. Aqui você orquestra usuários,
              roles e sistemas com segurança e identidade própria.
            </p>
            <div className="gate-tags">
              <span>PKCE</span>
              <span>RBAC</span>
              <span>Keycloak</span>
              <span>Auditável</span>
            </div>
          </div>
          <div className="auth-gate-panel">
            <AuthPanel />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Sidebar />
      <div className="app-main">
        <div className="app-ambient">
          <span className="app-flash flash-a" />
          <span className="app-flash flash-b" />
          <span className="app-flash flash-c" />
        </div>
        <Topbar />
        <main className="app-content">
          <div className="page-transition">
            {active === 'admin' && <AdminPage />}
            {active === 'users' && <UsersPage />}
            {active === 'systems' && <SystemsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Sidebar } from '@/presentation/components/sidebar';
import { Topbar } from '@/presentation/components/topbar';
import { useAuthStore } from '@/presentation/stores/authStore';
import { useNavStore } from '@/presentation/stores/navStore';
import { useThemeStore } from '@/presentation/stores/themeStore';
import { AdminPage } from '@/presentation/pages/AdminPage';
import { UsersPage } from '@/presentation/pages/UsersPage';
import { SystemsPage } from '@/presentation/pages/SystemsPage';
import { ProfilesPage } from '@/presentation/pages/ProfilesPage';
import { CapabilitiesPage } from '@/presentation/pages/CapabilitiesPage';
import { AssignmentsPage } from '@/presentation/pages/AssignmentsPage';
import { AuditPage } from '@/presentation/pages/AuditPage';
import { HomePage } from '@/presentation/pages/HomePage';
import { AuthPanel } from '@/presentation/components/authPanel';
import { LockEmblem } from '@/presentation/components/lockEmblem';
import { ThemeToggle } from '@/presentation/components/themeToggle';
import { cn } from '@/lib/utils';

export function AppShell() {
  const init = useAuthStore((state) => state.init);
  const { isReady, isAuthenticated, roles } = useAuthStore();
  const active = useNavStore((state) => state.active);
  const collapsed = useNavStore((state) => state.collapsed);
  const setActive = useNavStore((state) => state.setActive);
  const theme = useThemeStore((state) => state.theme);
  const isAdminMaster = roles.includes('ADMIN_MASTER');
  const isAdmin = isAdminMaster || roles.includes('ADMIN');
  const isCommon = roles.includes('COMMON');
  const canViewAdminSections = isAdmin;

  useEffect(() => {
    if (!canViewAdminSections && active !== 'home') {
      setActive('home');
    }
  }, [active, canViewAdminSections, setActive]);

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
              <LockEmblem />
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
    <div
      className={cn(
        'grid min-h-screen grid-cols-1 transition-[grid-template-columns] duration-200 lg:grid-cols-[280px_minmax(0,1fr)]',
        collapsed && 'lg:grid-cols-[104px_minmax(0,1fr)]'
      )}
    >
      <Sidebar />
      <div
        className="relative flex min-w-0 flex-col overflow-hidden"
        style={{
          background:
            'radial-gradient(900px 500px at 10% -20%, rgba(88,102,255,0.12), transparent 60%), radial-gradient(900px 500px at 90% -30%, rgba(82,212,255,0.12), transparent 65%), linear-gradient(180deg, rgba(6,10,18,0.55), rgba(6,10,18,0.92))'
        }}
      >
        <div className="pointer-events-none absolute inset-0 z-0">
          <span className="absolute left-[-120px] top-[-120px] h-[480px] w-[480px] animate-[flashDrift_18s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(120,160,255,0.22),rgba(120,160,255,0)_70%)] opacity-40 blur-[12px]" />
          <span className="absolute bottom-[-160px] right-[-120px] h-[480px] w-[480px] animate-[flashDrift_18s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(90,240,210,0.18),rgba(90,240,210,0)_70%)] opacity-40 blur-[12px] [animation-delay:3s]" />
          <span className="absolute right-[15%] top-[20%] h-[360px] w-[360px] animate-[flashDrift_18s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),rgba(255,255,255,0)_70%)] opacity-40 blur-[12px] [animation-delay:7s]" />
        </div>
        <Topbar />
        <main className="relative z-[1] px-6 py-8 md:px-8">
          <div className="animate-[fadeUp_0.5s_ease]">
            {active === 'home' && <HomePage />}
            {active === 'admin' && canViewAdminSections && <AdminPage />}
            {active === 'users' && canViewAdminSections && <UsersPage />}
            {active === 'systems' && canViewAdminSections && <SystemsPage />}
            {active === 'profiles' && canViewAdminSections && <ProfilesPage />}
            {active === 'capabilities' && canViewAdminSections && <CapabilitiesPage />}
            {active === 'assignments' && canViewAdminSections && <AssignmentsPage />}
            {active === 'audit' && canViewAdminSections && <AuditPage />}
            {!canViewAdminSections && isCommon && active !== 'home' && <HomePage />}
          </div>
        </main>
      </div>
    </div>
  );
}

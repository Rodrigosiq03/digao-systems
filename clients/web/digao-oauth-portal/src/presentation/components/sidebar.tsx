import { Binary, Blocks, ChevronLeft, ChevronRight, LayoutDashboard, Layers3, ReceiptText, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LockEmblem } from '@/presentation/components/lockEmblem';
import { useNavStore, type NavSection } from '@/presentation/stores/navStore';
import { useAuthStore } from '@/presentation/stores/authStore';

const items: Array<{
  id: NavSection;
  label: string;
  icon: typeof ShieldCheck;
  adminOnly?: boolean;
}> = [
  { id: 'home', label: 'Início', icon: LayoutDashboard },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
  { id: 'users', label: 'Usuários', icon: Users, adminOnly: true },
  { id: 'systems', label: 'Sistemas', icon: Layers3, adminOnly: true },
  { id: 'profiles', label: 'Perfis', icon: Blocks, adminOnly: true },
  { id: 'capabilities', label: 'Permissões', icon: Binary, adminOnly: true },
  { id: 'assignments', label: 'Acessos', icon: ReceiptText, adminOnly: true },
  { id: 'audit', label: 'Auditoria', icon: ReceiptText, adminOnly: true }
];

export function Sidebar() {
  const active = useNavStore((state) => state.active);
  const collapsed = useNavStore((state) => state.collapsed);
  const setActive = useNavStore((state) => state.setActive);
  const toggleCollapsed = useNavStore((state) => state.toggleCollapsed);
  const roles = useAuthStore((state) => state.roles);
  const canViewAdminSections = roles.includes('ADMIN_MASTER') || roles.includes('ADMIN');
  const visibleItems = items.filter((item) => !item.adminOnly || canViewAdminSections);
  const CollapseIcon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <aside
      className={cn(
        'top-0 flex h-auto flex-row items-center justify-between gap-4 overflow-x-auto border-b border-white/8 bg-[linear-gradient(180deg,rgba(15,22,36,0.92),rgba(15,22,36,0.7))] px-5 py-5 backdrop-blur-[20px] lg:sticky lg:h-screen lg:flex-col lg:items-stretch lg:justify-start lg:overflow-visible lg:border-b-0 lg:border-r lg:border-white/8 lg:px-6',
        collapsed && 'lg:px-4'
      )}
    >
      <div className="flex items-center gap-3">
        <LockEmblem />
        <div className={cn(collapsed && 'lg:sr-only')}>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Digao Systems</p>
          <h3 className="font-black text-brand">Control Center</h3>
        </div>
        <button
          type="button"
          className="ml-auto inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/10 bg-white/6 text-[color:var(--text)]"
          onClick={toggleCollapsed}
          aria-label="Alternar barra lateral"
        >
          <CollapseIcon className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex flex-row gap-2 lg:flex-col">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                'inline-flex w-full items-center gap-3 rounded-2xl border border-transparent px-3.5 py-3 text-left text-[rgba(231,237,247,0.84)] transition duration-150 hover:bg-white/6 hover:text-white lg:hover:translate-x-0.5',
                collapsed ? 'justify-center lg:px-0' : 'justify-start',
                isActive && 'border-white/20 bg-white/12 text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)]'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className={cn(collapsed && 'lg:sr-only')}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

import { Binary, Blocks, ChevronLeft, ChevronRight, LayoutDashboard, Layers3, ReceiptText, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  { id: 'profiles', label: 'Profiles', icon: Blocks, adminOnly: true },
  { id: 'capabilities', label: 'Capabilities', icon: Binary, adminOnly: true },
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
    <aside className={cn('app-sidebar', collapsed && 'app-sidebar-collapsed')}>
      <div className="sidebar-header">
        <div className="lock-emblem">
          <div className="lock-core" />
        </div>
        <div className={cn(collapsed && 'sr-only')}>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Digão OAuth</p>
          <h3 className="font-black text-brand">Control Center</h3>
        </div>
        <button type="button" className="sidebar-toggle" onClick={toggleCollapsed} aria-label="Alternar barra lateral">
          <CollapseIcon className="h-4 w-4" />
        </button>
      </div>
      <nav className="nav-list">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn('nav-item', isActive && 'nav-item-active')}
            >
              <Icon className="h-4 w-4" />
              <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

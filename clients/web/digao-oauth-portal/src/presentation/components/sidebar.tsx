import { ShieldCheck, Users, Layers3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavStore, type NavSection } from '@/presentation/stores/navStore';

const items: Array<{ id: NavSection; label: string; icon: typeof ShieldCheck }> = [
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'systems', label: 'Sistemas', icon: Layers3 }
];

export function Sidebar() {
  const active = useNavStore((state) => state.active);
  const setActive = useNavStore((state) => state.setActive);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="lock-emblem">
          <div className="lock-core" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Digão OAuth</p>
          <h3 className="font-black text-brand">Control Center</h3>
        </div>
      </div>
      <nav className="nav-list">
        {items.map((item) => {
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
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

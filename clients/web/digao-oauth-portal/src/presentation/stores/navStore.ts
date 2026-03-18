import { create } from 'zustand';

export type NavSection =
  | 'home'
  | 'admin'
  | 'users'
  | 'systems'
  | 'profiles'
  | 'capabilities'
  | 'assignments'
  | 'audit';

type NavState = {
  active: NavSection;
  collapsed: boolean;
  setActive: (section: NavSection) => void;
  toggleCollapsed: () => void;
};

export const useNavStore = create<NavState>((set) => ({
  active: 'home',
  collapsed: false,
  setActive: (section) => set({ active: section }),
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed }))
}));

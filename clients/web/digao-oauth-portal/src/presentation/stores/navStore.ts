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
  setActive: (section: NavSection) => void;
};

export const useNavStore = create<NavState>((set) => ({
  active: 'home',
  setActive: (section) => set({ active: section })
}));

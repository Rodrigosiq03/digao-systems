import { create } from 'zustand';

export type NavSection = 'admin' | 'users' | 'systems';

type NavState = {
  active: NavSection;
  setActive: (section: NavSection) => void;
};

export const useNavStore = create<NavState>((set) => ({
  active: 'admin',
  setActive: (section) => set({ active: section })
}));

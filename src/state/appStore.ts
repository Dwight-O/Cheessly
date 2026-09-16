import { create } from 'zustand';

export type Screen = 'home' | 'game' | 'runEnd' | 'daily' | 'upgrades' | 'dev';

interface AppStore {
  screen: Screen;
  go(screen: Screen): void;
}

export const useAppStore = create<AppStore>((set) => ({
  screen: 'home',
  go: (screen) => set({ screen }),
}));

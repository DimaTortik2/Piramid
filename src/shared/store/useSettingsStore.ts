import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isZenMode: boolean;
  toggleZenMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isZenMode: false,

      toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
    }),
    {
      name: 'app-settings',
    }
  )
);

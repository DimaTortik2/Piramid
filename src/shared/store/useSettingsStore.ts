import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isZenMode: boolean;
  toggleZenMode: () => void;

  isDarkBalls: boolean;
  toggleisDarkBalls: () => void;

  disableBlur: boolean;
  toggleDisableBlur: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isZenMode: false,
      isDarkBalls: false,
      disableBlur: false,

      toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
      toggleisDarkBalls: () =>
        set((state) => ({ isDarkBalls: !state.isDarkBalls })),
      toggleDisableBlur: () =>
        set((state) => ({ disableBlur: !state.disableBlur })),
    }),
    {
      name: 'app-settings',
    }
  )
);

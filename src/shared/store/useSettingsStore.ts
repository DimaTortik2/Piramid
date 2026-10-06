import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isLecturesZenMode: boolean;
  toggleLecturesZenMode: () => void;

  isGameZenMode: boolean;
  toggleGameZenMode: () => void;

  isDarkBalls: boolean;
  toggleisDarkBalls: () => void;

  disableBlur: boolean;
  toggleDisableBlur: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isLecturesZenMode: false,
      isGameZenMode: true,
      isDarkBalls: false,
      disableBlur: false,

      toggleLecturesZenMode: () =>
        set((state) => ({ isLecturesZenMode: !state.isLecturesZenMode })),
      toggleGameZenMode: () =>
        set((state) => ({ isLecturesZenMode: !state.isLecturesZenMode })),
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

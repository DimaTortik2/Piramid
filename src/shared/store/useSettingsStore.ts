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

  disableDynamicBackground: boolean;
  toggleDisableDynamicBackground: () => void;

  autoRotateSimulator: boolean;
  toggleAutoRotateSimulator: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isLecturesZenMode: false,
      isGameZenMode: false,
      isDarkBalls: false,
      disableBlur: false,
      disableDynamicBackground: false,
      autoRotateSimulator: true,

      toggleLecturesZenMode: () =>
        set((state) => ({ isLecturesZenMode: !state.isLecturesZenMode })),
      toggleGameZenMode: () =>
        set((state) => ({ isGameZenMode: !state.isGameZenMode })),
      toggleisDarkBalls: () =>
        set((state) => ({ isDarkBalls: !state.isDarkBalls })),
      toggleDisableBlur: () =>
        set((state) => ({ disableBlur: !state.disableBlur })),
      toggleDisableDynamicBackground: () =>
        set((state) => ({
          disableDynamicBackground: !state.disableDynamicBackground,
        })),
      toggleAutoRotateSimulator: () =>
        set((state) => ({
          autoRotateSimulator: !state.autoRotateSimulator,
        })),
    }),
    {
      name: 'app-settings',
    }
  )
);
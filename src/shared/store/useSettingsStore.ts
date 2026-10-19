import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MainPageStyle = 'modern' | 'classic';
export type BackgroundMode = 'full' | 'cloth-only' | 'static';

interface SettingsState {
  isLecturesZenMode: boolean;
  toggleLecturesZenMode: () => void;

  isGameZenMode: boolean;
  toggleGameZenMode: () => void;

  isDarkBalls: boolean;
  toggleisDarkBalls: () => void;
  setDarkBalls: (value: boolean) => void;

  isDarkBgBalls: boolean;
  setDarkBgBalls: (value: boolean) => void;

  isDarkPlayBall: boolean;
  setDarkPlayBall: (value: boolean) => void;

  disableBlur: boolean;
  toggleDisableBlur: () => void;

  backgroundMode: BackgroundMode;
  setBackgroundMode: (mode: BackgroundMode) => void;

  autoRotateSimulator: boolean;
  toggleAutoRotateSimulator: () => void;

  showTableBorders: boolean;
  toggleShowTableBorders: () => void;

  mainPageStyle: MainPageStyle;
  setMainPageStyle: (style: MainPageStyle) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isLecturesZenMode: false,
      isGameZenMode: false,
      isDarkBalls: false,
      isDarkBgBalls: false,
      isDarkPlayBall: false,
      disableBlur: false,
      backgroundMode: 'full',
      autoRotateSimulator: true,
      showTableBorders: false,
      mainPageStyle: 'modern',

      toggleLecturesZenMode: () =>
        set((state) => ({ isLecturesZenMode: !state.isLecturesZenMode })),
      toggleGameZenMode: () =>
        set((state) => ({ isGameZenMode: !state.isGameZenMode })),
      toggleisDarkBalls: () =>
        set((state) => ({ isDarkBalls: !state.isDarkBalls })),
      setDarkBalls: (value) => set({ isDarkBalls: value }),
      setDarkBgBalls: (value) => set({ isDarkBgBalls: value }),
      setDarkPlayBall: (value) => set({ isDarkPlayBall: value }),
      toggleDisableBlur: () =>
        set((state) => ({ disableBlur: !state.disableBlur })),
      setBackgroundMode: (mode) => set({ backgroundMode: mode }),
      toggleAutoRotateSimulator: () =>
        set((state) => ({
          autoRotateSimulator: !state.autoRotateSimulator,
        })),
      toggleShowTableBorders: () =>
        set((state) => ({
          showTableBorders: !state.showTableBorders,
        })),
      setMainPageStyle: (style) => set({ mainPageStyle: style }),
    }),
    {
      name: 'app-settings',
    }
  )
);

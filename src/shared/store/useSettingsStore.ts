import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DisciplineId } from './useDisciplineStore';
import type { GameMode } from './gameStore';

export type MainPageStyle = 'modern' | 'classic';
export type BackgroundMode = 'full' | 'cloth-only' | 'static';
export type ThemeColorSlot =
  | 'cloth'
  | 'rails'
  | 'playBall'
  | 'pyramidBalls'
  | 'bgBalls';

export type ThemeColors = Record<ThemeColorSlot, string>;

export interface AppTheme {
  id: string;
  name: string;
  isBuiltin?: boolean;
  colors: ThemeColors;
}

export const BUILTIN_THEMES: Record<DisciplineId, AppTheme[]> = {
  pyramid: [
    {
      id: 'classic',
      name: 'Классика',
      isBuiltin: true,
      colors: {
        cloth: '#11311c',
        rails: '#141210',
        playBall: '#f0ebd8',
        pyramidBalls: '#f0ebd8',
        bgBalls: '#f0ebd8',
      },
    },
    {
      id: 'white',
      name: 'Белый',
      isBuiltin: true,
      colors: {
        cloth: '#ded8c7',
        rails: '#211d1a',
        playBall: '#121316',
        pyramidBalls: '#f0ebd8',
        bgBalls: '#121316',
      },
    },
    {
      id: 'dark',
      name: 'Темный',
      isBuiltin: true,
      colors: {
        cloth: '#14171c',
        rails: '#0c0e11',
        playBall: '#f0ebd8',
        pyramidBalls: '#f0ebd8',
        bgBalls: '#f0ebd8',
      },
    },
    {
      id: 'sapphire',
      name: 'Сапфир',
      isBuiltin: true,
      colors: {
        cloth: '#10243e',
        rails: '#0a121c',
        playBall: '#f0ebd8',
        pyramidBalls: '#f0ebd8',
        bgBalls: '#f0ebd8',
      },
    },
    {
      id: 'mocha',
      name: 'Мокко',
      isBuiltin: true,
      colors: {
        cloth: '#261914',
        rails: '#120b08',
        playBall: '#f0ebd8',
        pyramidBalls: '#f0ebd8',
        bgBalls: '#f0ebd8',
      },
    },
  ],
  upcoming: [
    {
      id: 'upcoming-blue',
      name: 'Синее сукно',
      isBuiltin: true,
      colors: {
        cloth: '#0f2d4a',
        rails: '#141210',
        playBall: '#f0ebd8',
        pyramidBalls: '#f0ebd8',
        bgBalls: '#f0ebd8',
      },
    },
  ],
};

export interface DisciplineThemeState {
  activeThemeId: string;
  customThemes: AppTheme[];
}

const createInitialDisciplineThemes = (): Record<
  DisciplineId,
  DisciplineThemeState
> => ({
  pyramid: {
    activeThemeId: 'classic-green',
    customThemes: [],
  },
  upcoming: {
    activeThemeId: 'upcoming-blue',
    customThemes: [],
  },
});

export function getDisciplineThemesList(
  state: Record<DisciplineId, DisciplineThemeState> | undefined,
  discipline: DisciplineId
): AppTheme[] {
  const builtins = BUILTIN_THEMES[discipline] ?? BUILTIN_THEMES.pyramid;
  const customs = state?.[discipline]?.customThemes ?? [];
  return [...builtins, ...customs];
}

export function getActiveTheme(
  state: Record<DisciplineId, DisciplineThemeState> | undefined,
  discipline: DisciplineId
): AppTheme {
  const all = getDisciplineThemesList(state, discipline);
  const activeId = state?.[discipline]?.activeThemeId;
  return all.find((t) => t.id === activeId) ?? all[0];
}

export function resolveSlotColor(
  state: Record<DisciplineId, DisciplineThemeState> | undefined,
  discipline: DisciplineId,
  slot: ThemeColorSlot
): string {
  const theme = getActiveTheme(state, discipline);
  return theme.colors[slot] ?? BUILTIN_THEMES.pyramid[0].colors[slot];
}

export function encodeThemeShareCode(theme: AppTheme): string {
  const { cloth, rails, playBall, pyramidBalls, bgBalls } = theme.colors;
  const clean = (hex: string) => hex.replace('#', '').toUpperCase().slice(0, 6);
  const namePart = encodeURIComponent(theme.name.trim().slice(0, 24));
  return `PRM-${clean(cloth)}-${clean(rails)}-${clean(playBall)}-${clean(pyramidBalls)}-${clean(bgBalls)}-${namePart}`;
}

export function decodeThemeShareCode(
  code: string
): Omit<AppTheme, 'id'> | null {
  const trimmed = code.trim();
  const match = trimmed.match(
    /^PRM-([0-9A-Fa-f]{6})-([0-9A-Fa-f]{6})-([0-9A-Fa-f]{6})-([0-9A-Fa-f]{6})-([0-9A-Fa-f]{6})(?:-(.+))?$/
  );
  if (!match) return null;

  const [, cloth, rails, playBall, pyramidBalls, bgBalls, rawName] = match;
  let name = 'Импорт';
  if (rawName) {
    try {
      name = decodeURIComponent(rawName).slice(0, 24) || 'Импорт';
    } catch {
      name = 'Импорт';
    }
  }

  return {
    name,
    colors: {
      cloth: `#${cloth.toLowerCase()}`,
      rails: `#${rails.toLowerCase()}`,
      playBall: `#${playBall.toLowerCase()}`,
      pyramidBalls: `#${pyramidBalls.toLowerCase()}`,
      bgBalls: `#${bgBalls.toLowerCase()}`,
    },
  };
}

interface SettingsState {
  isLecturesZenMode: boolean;
  toggleLecturesZenMode: () => void;

  isGameZenMode: boolean;
  toggleGameZenMode: () => void;

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

  disciplineThemes: Record<DisciplineId, DisciplineThemeState>;
  setActiveTheme: (discipline: DisciplineId, themeId: string) => void;
  saveTheme: (discipline: DisciplineId, theme: AppTheme) => void;
  deleteCustomTheme: (discipline: DisciplineId, themeId: string) => void;

  hasSeenMainTour: boolean;
  seenGameModeTours: Partial<Record<GameMode, boolean>>;
  completeMainTour: () => void;
  completeGameModeTour: (mode: GameMode) => void;
  resetOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isLecturesZenMode: false,
      isGameZenMode: false,
      disableBlur: false,
      backgroundMode: 'full',
      autoRotateSimulator: true,
      showTableBorders: false,
      mainPageStyle: 'modern',
      disciplineThemes: createInitialDisciplineThemes(),
      hasSeenMainTour: false,
      seenGameModeTours: {},

      toggleLecturesZenMode: () =>
        set((state) => ({ isLecturesZenMode: !state.isLecturesZenMode })),
      toggleGameZenMode: () =>
        set((state) => ({ isGameZenMode: !state.isGameZenMode })),
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

      setActiveTheme: (discipline, themeId) =>
        set((state) => {
          const current =
            state.disciplineThemes?.[discipline] ??
            createInitialDisciplineThemes()[discipline];
          return {
            disciplineThemes: {
              ...state.disciplineThemes,
              [discipline]: {
                ...current,
                activeThemeId: themeId,
              },
            },
          };
        }),

      saveTheme: (discipline, theme) =>
        set((state) => {
          const current =
            state.disciplineThemes?.[discipline] ??
            createInitialDisciplineThemes()[discipline];
          const exists = current.customThemes.some((t) => t.id === theme.id);
          const nextCustom = exists
            ? current.customThemes.map((t) => (t.id === theme.id ? theme : t))
            : [...current.customThemes, theme];

          return {
            disciplineThemes: {
              ...state.disciplineThemes,
              [discipline]: {
                activeThemeId: theme.id,
                customThemes: nextCustom,
              },
            },
          };
        }),

      deleteCustomTheme: (discipline, themeId) =>
        set((state) => {
          const current =
            state.disciplineThemes?.[discipline] ??
            createInitialDisciplineThemes()[discipline];
          const nextCustom = current.customThemes.filter(
            (t) => t.id !== themeId
          );
          const fallbackId = BUILTIN_THEMES[discipline][0].id;

          return {
            disciplineThemes: {
              ...state.disciplineThemes,
              [discipline]: {
                activeThemeId:
                  current.activeThemeId === themeId
                    ? fallbackId
                    : current.activeThemeId,
                customThemes: nextCustom,
              },
            },
          };
        }),

      completeMainTour: () => set({ hasSeenMainTour: true }),
      completeGameModeTour: (mode) =>
        set((state) => ({
          seenGameModeTours: {
            ...state.seenGameModeTours,
            [mode]: true,
          },
        })),
      resetOnboarding: () =>
        set({
          hasSeenMainTour: false,
          seenGameModeTours: {},
        }),
    }),
    {
      name: 'app-settings',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SettingsState> | undefined;
        const defaults = createInitialDisciplineThemes();

        const sanitizeDiscipline = (
          disc: DisciplineId
        ): DisciplineThemeState => {
          const raw = persisted?.disciplineThemes?.[disc];
          if (
            raw &&
            typeof raw === 'object' &&
            'activeThemeId' in raw &&
            Array.isArray(raw.customThemes)
          ) {
            return raw;
          }
          return defaults[disc];
        };

        return {
          ...currentState,
          ...persisted,
          disciplineThemes: {
            pyramid: sanitizeDiscipline('pyramid'),
            upcoming: sanitizeDiscipline('upcoming'),
          },
          seenGameModeTours: persisted?.seenGameModeTours ?? {},
          hasSeenMainTour: Boolean(persisted?.hasSeenMainTour),
        };
      },
    }
  )
);
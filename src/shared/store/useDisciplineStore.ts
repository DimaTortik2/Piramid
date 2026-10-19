import { create } from 'zustand';

export const DISCIPLINES = [
  { id: 'pyramid', label: 'Русский бильярд' },
  { id: 'upcoming', label: 'Здесь может быть ваша реклама' },
] as const;

export type DisciplineId = (typeof DISCIPLINES)[number]['id'];

interface DisciplineState {
  discipline: DisciplineId;
  setDiscipline: (discipline: DisciplineId) => void;
  nextDiscipline: () => boolean;
  prevDiscipline: () => boolean;
}

export const useDisciplineStore = create<DisciplineState>((set, get) => ({
  discipline: 'pyramid',
  setDiscipline: (discipline) => set({ discipline }),
  nextDiscipline: () => {
    const currentIndex = DISCIPLINES.findIndex(
      (d) => d.id === get().discipline
    );
    if (currentIndex < DISCIPLINES.length - 1) {
      set({ discipline: DISCIPLINES[currentIndex + 1].id });
      return true;
    }
    return false;
  },
  prevDiscipline: () => {
    const currentIndex = DISCIPLINES.findIndex(
      (d) => d.id === get().discipline
    );
    if (currentIndex > 0) {
      set({ discipline: DISCIPLINES[currentIndex - 1].id });
      return true;
    }
    return false;
  },
}));

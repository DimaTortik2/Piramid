import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GameMode =
  | 'free-pyramid'
  | 'combined-pyramid'
  | 'dynamic-pyramid'
  | 'classic-pyramid'
  | 'continuous-free-pyramid';

export interface Player {
  id: 'p1' | 'p2';
  name: string;
  score: number;
  roundsWon: number;
}

interface GameStateData {
  p1: Player;
  p2: Player;
  pottedBalls: number[];
  mode: GameMode;
  previousRoundsTime: number; // Время, затраченное на уже сыгранные партии
}

interface GameStore extends GameStateData {
  history: GameStateData[];
  startTime: number | null;
  totalPausedTime: number;
  pauseStartTime: number | null;
  isPaused: boolean;
  isActiveGame: boolean;

  startGame: (mode: GameMode, p1Name: string, p2Name: string) => void;
  addScore: (playerId: 'p1' | 'p2', amount?: number, ballNumber?: number) => void;
  removeScore: (playerId: 'p1' | 'p2') => void;
  applyPenalty: (penalizedPlayerId: 'p1' | 'p2') => void;
  undo: () => void;
  togglePause: () => void;
  setPause: (forcePause: boolean) => void;
  endGame: () => void;
}

const MAX_HISTORY = 20;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      mode: 'free-pyramid',
      p1: { id: 'p1', name: 'Вы', score: 0, roundsWon: 0 },
      p2: { id: 'p2', name: 'Оппонент', score: 0, roundsWon: 0 },
      pottedBalls: [],
      history: [],
      previousRoundsTime: 0,
      
      startTime: null,
      totalPausedTime: 0,
      pauseStartTime: null,
      isPaused: false,
      isActiveGame: false,

      startGame: (mode, p1Name, p2Name) =>
        set({
          mode,
          p1: { id: 'p1', name: p1Name || 'Вы', score: 0, roundsWon: 0 },
          p2: { id: 'p2', name: p2Name || 'Оппонент', score: 0, roundsWon: 0 },
          pottedBalls: [],
          history: [],
          previousRoundsTime: 0,
          startTime: Date.now(),
          totalPausedTime: 0,
          pauseStartTime: null,
          isPaused: false,
          isActiveGame: true,
        }),

      togglePause: () => {
        get().setPause(!get().isPaused);
      },

      setPause: (forcePause) =>
        set((state) => {
          if (!state.startTime || state.isPaused === forcePause) return state;
          
          const now = Date.now();
          if (!forcePause) {
            const pausedFor = state.pauseStartTime ? now - state.pauseStartTime : 0;
            return { isPaused: false, pauseStartTime: null, totalPausedTime: state.totalPausedTime + pausedFor };
          } else {
            return { isPaused: true, pauseStartTime: now };
          }
        }),

      endGame: () => set({ isActiveGame: false, startTime: null }),

      addScore: (playerId, amount = 1, ballNumber) =>
        set((state) => {
          if (state.isPaused) return state;

          const snapshot: GameStateData = { 
            p1: state.p1, 
            p2: state.p2, 
            mode: state.mode, 
            pottedBalls: state.pottedBalls,
            previousRoundsTime: state.previousRoundsTime // Сохраняем в историю для Undo
          };
          const history = [...state.history, snapshot].slice(-MAX_HISTORY);

          const nextP1 = { ...state.p1 };
          const nextP2 = { ...state.p2 };
          const nextPottedBalls = [...state.pottedBalls];
          let nextPreviousRoundsTime = state.previousRoundsTime;

          if (ballNumber) nextPottedBalls.push(ballNumber);

          if (playerId === 'p1') {
            nextP1.score += amount;
          } else {
            nextP2.score += amount;
          }

          const isStandardMode = ['free-pyramid', 'combined-pyramid', 'dynamic-pyramid'].includes(state.mode);
          const isClassicMode = state.mode === 'classic-pyramid';

          const isStandardWin = isStandardMode && (nextP1.score >= 8 || nextP2.score >= 8);
          const isClassicWin = isClassicMode && (nextP1.score >= 71 || nextP2.score >= 71);

          // Проверяем авто-победу
          if (isStandardWin || isClassicWin) {
            if (nextP1.score >= (isClassicMode ? 71 : 8)) nextP1.roundsWon += 1;
            if (nextP2.score >= (isClassicMode ? 71 : 8)) nextP2.roundsWon += 1;
            
            nextP1.score = 0; 
            nextP2.score = 0; 
            nextPottedBalls.length = 0;

            // Партия завершена, фиксируем затраченное общее время
            if (state.startTime) {
              nextPreviousRoundsTime = Date.now() - state.startTime - state.totalPausedTime;
            }
          }

          return { 
            p1: nextP1, 
            p2: nextP2, 
            pottedBalls: nextPottedBalls, 
            previousRoundsTime: nextPreviousRoundsTime,
            history 
          };
        }),

      removeScore: (playerId) =>
        set((state) => {
          if (state.isPaused || state[playerId].score <= 0) return state;
          const snapshot: GameStateData = { 
            p1: state.p1, p2: state.p2, mode: state.mode, pottedBalls: state.pottedBalls, previousRoundsTime: state.previousRoundsTime 
          };
          return { 
            history: [...state.history, snapshot].slice(-MAX_HISTORY), 
            [playerId]: { ...state[playerId], score: state[playerId].score - 1 } 
          };
        }),

      applyPenalty: (penalizedPlayerId) => {
        const opponentId = penalizedPlayerId === 'p1' ? 'p2' : 'p1';
        get().addScore(opponentId, 1);
      },

      undo: () =>
        set((state) => {
          if (state.history.length === 0) return state;
          const newHistory = [...state.history];
          const previousState = newHistory.pop();
          return previousState ? { ...previousState, history: newHistory } : state;
        }),
    }),
    {
      name: 'piramid-game-storage',
    }
  )
);
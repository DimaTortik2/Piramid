import { create } from 'zustand';

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
}

interface GameStore extends GameStateData {
  history: GameStateData[];
  startTime: number | null;
  totalPausedTime: number;
  pauseStartTime: number | null;
  isPaused: boolean;

  startGame: (mode: GameMode, p1Name: string, p2Name: string) => void;
  addScore: (playerId: 'p1' | 'p2', amount?: number, ballNumber?: number) => void;
  removeScore: (playerId: 'p1' | 'p2') => void;
  applyPenalty: (penalizedPlayerId: 'p1' | 'p2') => void;
  undo: () => void;
  togglePause: () => void;
}

const MAX_HISTORY = 20;

export const useGameStore = create<GameStore>((set, get) => ({
  mode: 'free-pyramid',
  p1: { id: 'p1', name: 'Вы', score: 0, roundsWon: 0 },
  p2: { id: 'p2', name: 'Оппонент', score: 0, roundsWon: 0 },
  pottedBalls: [],
  history: [],
  
  startTime: null,
  totalPausedTime: 0,
  pauseStartTime: null,
  isPaused: false,

  startGame: (mode, p1Name, p2Name) =>
    set({
      mode,
      p1: { id: 'p1', name: p1Name || 'Вы', score: 0, roundsWon: 0 },
      p2: { id: 'p2', name: p2Name || 'Оппонент', score: 0, roundsWon: 0 },
      pottedBalls: [],
      history: [],
      startTime: Date.now(),
      totalPausedTime: 0,
      pauseStartTime: null,
      isPaused: false,
    }),

  togglePause: () =>
    set((state) => {
      if (!state.startTime) return state;
      const now = Date.now();
      if (state.isPaused) {
        const pausedFor = state.pauseStartTime ? now - state.pauseStartTime : 0;
        return { isPaused: false, pauseStartTime: null, totalPausedTime: state.totalPausedTime + pausedFor };
      } else {
        return { isPaused: true, pauseStartTime: now };
      }
    }),

  addScore: (playerId, amount = 1, ballNumber) =>
    set((state) => {
      if (state.isPaused) return state;

      const snapshot: GameStateData = { 
        p1: state.p1, 
        p2: state.p2, 
        mode: state.mode, 
        pottedBalls: state.pottedBalls 
      };
      
      const history = [...state.history, snapshot].slice(-MAX_HISTORY);

      const nextP1 = { ...state.p1 };
      const nextP2 = { ...state.p2 };
      const nextPottedBalls = [...state.pottedBalls];

      if (ballNumber) nextPottedBalls.push(ballNumber);

      if (playerId === 'p1') {
        nextP1.score += amount;
      } else {
        nextP2.score += amount;
      }

      const isStandardMode = ['free-pyramid', 'combined-pyramid', 'dynamic-pyramid'].includes(state.mode);
      const isClassicMode = state.mode === 'classic-pyramid';

      // Проверяем авто-победу
      if (isStandardMode && (nextP1.score >= 8 || nextP2.score >= 8)) {
        if (nextP1.score >= 8) nextP1.roundsWon += 1;
        if (nextP2.score >= 8) nextP2.roundsWon += 1;
        
        nextP1.score = 0;
        nextP2.score = 0;
        nextPottedBalls.length = 0;
      } else if (isClassicMode && (nextP1.score >= 71 || nextP2.score >= 71)) {
        if (nextP1.score >= 71) nextP1.roundsWon += 1;
        if (nextP2.score >= 71) nextP2.roundsWon += 1;
        
        nextP1.score = 0;
        nextP2.score = 0;
        nextPottedBalls.length = 0;
      }

      return {
        p1: nextP1,
        p2: nextP2,
        pottedBalls: nextPottedBalls,
        history,
      };
    }),

  removeScore: (playerId) =>
    set((state) => {
      if (state.isPaused || state[playerId].score <= 0) return state;
      const snapshot: GameStateData = { p1: state.p1, p2: state.p2, mode: state.mode, pottedBalls: state.pottedBalls };
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
}));
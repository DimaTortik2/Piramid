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

export interface RawRoundEvent {
  id: string;
  timestamp: number;
  roundElapsedMs: number;
  sessionElapsedMs: number;
  playerId: 'p1' | 'p2';
  type: 'pot' | 'penalty';
  amount: number;
  ballNumber?: number;
  visitEnded?: boolean;
}

export interface GameEvent extends RawRoundEvent {
  beneficiaryId: 'p1' | 'p2';
  timeSinceLastEventMs: number;
  pointsDeltaP1: number;
  pointsDeltaP2: number;
  scoreAfterP1: number;
  scoreAfterP2: number;
  streakBallsAfter: number;
  streakPointsAfter: number;
}

export interface PlayerMatchStats {
  playerId: 'p1' | 'p2';
  name: string;
  finalScore: number;
  ballsPotted: number;
  pointsFromPots: number;
  penaltiesCommitted: number;
  pointsFromOpponentPenalties: number;
  pointsLostToOwnPenalties: number;
  maxStreakBalls: number;
  maxStreakPoints: number;
  streaks: number[];
  avgStreakBalls: number;
  scoringVisits: number;
  pottedBallNumbers: number[];
  avgTimePerPotMs: number | null;
  fastestPotMs: number | null;
  slowestPotMs: number | null;
  scoredFirst: boolean;
  maxDeficitOvercome: number;
}

export interface MatchRecord {
  id: string;
  roundNumber: number;
  mode: GameMode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  isCompleted: boolean;
  finishReason: 'target-reached' | 'manual-round-end' | 'session-ended';
  winnerId: 'p1' | 'p2' | 'draw' | null;
  p1: PlayerMatchStats;
  p2: PlayerMatchStats;
  leadChanges: number;
  maxLeadP1: number;
  maxLeadP2: number;
  events: GameEvent[];
}

export interface PlayerSessionSummary {
  name: string;
  roundsWon: number;
  winRate: number;
  totalScore: number;
  totalBallsPotted: number;
  totalPenaltiesCommitted: number;
  totalPointsFromOpponentPenalties: number;
  totalPointsLostToOwnPenalties: number;
  maxStreakBalls: number;
  maxStreakPoints: number;
  avgStreakBalls: number;
  avgScorePerMatch: number;
  avgBallsPerMatch: number;
  avgTimePerPotMs: number | null;
  fastestPotMs: number | null;
  pottedBallNumbers: number[];
}

export interface GameSessionRecord {
  id: string;
  mode: GameMode;
  startedAt: number;
  endedAt: number;
  totalDurationMs: number;
  totalPausedMs: number;
  winnerId: 'p1' | 'p2' | 'draw';
  p1: PlayerSessionSummary;
  p2: PlayerSessionSummary;
  matchesCount: number;
  completedMatchesCount: number;
  longestMatchMs: number;
  shortestMatchMs: number;
  avgMatchDurationMs: number;
  matches: MatchRecord[];
}

interface GameStateData {
  p1: Player;
  p2: Player;
  pottedBalls: number[];
  mode: GameMode;
  initialBreaker: 'p1' | 'p2';
  roundElapsedMs: number;
  currentRoundStartTime: number | null;
  currentRoundEvents: RawRoundEvent[];
  lastCompletedRound: MatchRecord | null;
}

interface GameStore extends GameStateData {
  history: GameStateData[];
  savedMatches: MatchRecord[];
  recentPlayers: string[];
  removedPresetNames: string[];
  defaultP1Name: string;
  startTime: number | null;
  lastTickTimestamp: number | null;
  isPaused: boolean;
  isActiveGame: boolean;

  startGame: (
    mode: GameMode,
    p1Name: string,
    p2Name: string,
    initialBreaker?: 'p1' | 'p2'
  ) => void;
  tickTimer: () => void;
  addScore: (
    playerId: 'p1' | 'p2',
    amount?: number,
    ballNumber?: number
  ) => void;
  removeScore: (playerId: 'p1' | 'p2') => void;
  applyPenalty: (penalizedPlayerId: 'p1' | 'p2') => void;
  endCurrentVisit: (playerId: 'p1' | 'p2') => void;
  finishCurrentRound: () => MatchRecord | null;
  dismissRoundModal: () => void;
  deleteMatch: (matchId: string) => void;
  importMatches: (incoming: MatchRecord[]) => number;
  removeRecentPlayer: (name: string) => void;
  undo: () => void;
  togglePause: () => void;
  setPause: (forcePause: boolean) => void;
  endGame: () => void;
}

const MAX_HISTORY = 30;
const MAX_RECENT_PLAYERS = 15;
const DEFAULT_NAMES = new Set(['вы', 'оппонент', 'игрок 1', 'игрок 2']);

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function updateRecentPlayerList(current: string[], names: string[]): string[] {
  const next = [...current];
  for (const raw of names) {
    const trimmed = raw.trim();
    if (!trimmed || DEFAULT_NAMES.has(trimmed.toLowerCase())) continue;
    const existingIdx = next.findIndex(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingIdx !== -1) {
      next.splice(existingIdx, 1);
    }
    next.unshift(trimmed);
  }
  return next.slice(0, MAX_RECENT_PLAYERS);
}

function computeActiveElapsedMs(
  state: {
    roundElapsedMs: number;
    lastTickTimestamp: number | null;
    isPaused: boolean;
  },
  now: number
): number {
  if (state.isPaused || !state.lastTickTimestamp) {
    return state.roundElapsedMs;
  }
  const delta = now - state.lastTickTimestamp;
  if (delta <= 0 || delta > 5000) {
    return state.roundElapsedMs;
  }
  return state.roundElapsedMs + delta;
}

export function getActivePlayerStreak(
  rawEvents: RawRoundEvent[],
  playerId: 'p1' | 'p2'
): number {
  let streak = 0;
  for (const ev of rawEvents) {
    if (ev.type === 'pot' && ev.playerId === playerId) {
      streak += 1;
      if (ev.visitEnded) {
        streak = 0;
      }
    } else {
      streak = 0;
    }
  }
  return streak;
}

function closeOpenStreakForOpponent(
  events: RawRoundEvent[],
  playerToClose: 'p1' | 'p2'
): RawRoundEvent[] {
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev.type === 'pot' && ev.playerId === playerToClose) {
      if (ev.visitEnded) return events;
      const copy = [...events];
      copy[i] = { ...ev, visitEnded: true };
      return copy;
    }
    if (ev.type === 'penalty' || ev.playerId !== playerToClose) {
      return events;
    }
  }
  return events;
}

function replayRoundEvents(rawEvents: RawRoundEvent[], mode: GameMode) {
  let p1Score = 0;
  let p2Score = 0;
  const pottedBalls: number[] = [];

  let p1StreakBalls = 0;
  let p1StreakPoints = 0;
  let p2StreakBalls = 0;
  let p2StreakPoints = 0;

  let prevRoundElapsed = 0;

  const events: GameEvent[] = rawEvents.map((raw) => {
    const timeSinceLastEventMs = Math.max(
      0,
      raw.roundElapsedMs - prevRoundElapsed
    );
    prevRoundElapsed = raw.roundElapsedMs;

    let pointsDeltaP1 = 0;
    let pointsDeltaP2 = 0;
    let beneficiaryId: 'p1' | 'p2' = raw.playerId;

    if (raw.type === 'pot') {
      if (raw.ballNumber) {
        pottedBalls.push(raw.ballNumber);
      }
      if (raw.playerId === 'p1') {
        pointsDeltaP1 = raw.amount;
        p1Score += raw.amount;
        p1StreakBalls += 1;
        p1StreakPoints += raw.amount;
        p2StreakBalls = 0;
        p2StreakPoints = 0;
      } else {
        pointsDeltaP2 = raw.amount;
        p2Score += raw.amount;
        p2StreakBalls += 1;
        p2StreakPoints += raw.amount;
        p1StreakBalls = 0;
        p1StreakPoints = 0;
      }
      if (
        mode === 'classic-pyramid' &&
        pottedBalls.length === 15 &&
        p1Score < 71 &&
        p2Score < 71
      ) {
        pottedBalls.pop();
      }
    } else {
      beneficiaryId = raw.playerId === 'p1' ? 'p2' : 'p1';
      p1StreakBalls = 0;
      p1StreakPoints = 0;
      p2StreakBalls = 0;
      p2StreakPoints = 0;

      if (mode === 'classic-pyramid') {
        if (raw.playerId === 'p1') {
          const deducted = Math.min(p1Score, 5);
          pointsDeltaP1 = -deducted;
          pointsDeltaP2 = 5;
          p1Score -= deducted;
          p2Score += 5;
        } else {
          const deducted = Math.min(p2Score, 5);
          pointsDeltaP2 = -deducted;
          pointsDeltaP1 = 5;
          p2Score -= deducted;
          p1Score += 5;
        }
      } else {
        if (beneficiaryId === 'p1') {
          pointsDeltaP1 = 1;
          p1Score += 1;
        } else {
          pointsDeltaP2 = 1;
          p2Score += 1;
        }
      }
    }

    const streakBallsAfter =
      raw.type === 'pot'
        ? raw.playerId === 'p1'
          ? p1StreakBalls
          : p2StreakBalls
        : 0;
    const streakPointsAfter =
      raw.type === 'pot'
        ? raw.playerId === 'p1'
          ? p1StreakPoints
          : p2StreakPoints
        : 0;

    if (raw.type === 'pot' && raw.visitEnded) {
      if (raw.playerId === 'p1') {
        p1StreakBalls = 0;
        p1StreakPoints = 0;
      } else {
        p2StreakBalls = 0;
        p2StreakPoints = 0;
      }
    }

    return {
      ...raw,
      beneficiaryId,
      timeSinceLastEventMs,
      pointsDeltaP1,
      pointsDeltaP2,
      scoreAfterP1: p1Score,
      scoreAfterP2: p2Score,
      streakBallsAfter,
      streakPointsAfter,
    };
  });

  return { p1Score, p2Score, pottedBalls, events };
}

function buildMatchRecord(params: {
  roundNumber: number;
  mode: GameMode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  p1Name: string;
  p2Name: string;
  rawEvents: RawRoundEvent[];
  isCompleted: boolean;
  finishReason: 'target-reached' | 'manual-round-end' | 'session-ended';
}): MatchRecord {
  const { p1Score, p2Score, events } = replayRoundEvents(
    params.rawEvents,
    params.mode
  );

  let winnerId: 'p1' | 'p2' | 'draw' | null = null;
  if (params.isCompleted) {
    winnerId = p1Score > p2Score ? 'p1' : p2Score > p1Score ? 'p2' : 'draw';
  }

  let leadChanges = 0;
  let currentLeader: 'p1' | 'p2' | null = null;
  let maxLeadP1 = 0;
  let maxLeadP2 = 0;

  for (const ev of events) {
    const diff = ev.scoreAfterP1 - ev.scoreAfterP2;
    if (diff > 0) {
      maxLeadP1 = Math.max(maxLeadP1, diff);
      if (currentLeader && currentLeader !== 'p1') leadChanges += 1;
      currentLeader = 'p1';
    } else if (diff < 0) {
      maxLeadP2 = Math.max(maxLeadP2, -diff);
      if (currentLeader && currentLeader !== 'p2') leadChanges += 1;
      currentLeader = 'p2';
    }
  }

  const firstPotEvent = events.find((e) => e.type === 'pot');

  const computePlayerStats = (
    playerId: 'p1' | 'p2',
    name: string,
    finalScore: number
  ): PlayerMatchStats => {
    const isP1 = playerId === 'p1';
    let ballsPotted = 0;
    let pointsFromPots = 0;
    let penaltiesCommitted = 0;
    let pointsFromOpponentPenalties = 0;
    let pointsLostToOwnPenalties = 0;
    let maxStreakBalls = 0;
    let maxStreakPoints = 0;
    let activeStreak = 0;
    const streaks: number[] = [];
    const pottedBallNumbers: number[] = [];
    const potTimes: number[] = [];

    for (const ev of events) {
      const delta = isP1 ? ev.pointsDeltaP1 : ev.pointsDeltaP2;
      if (ev.type === 'pot' && ev.playerId === playerId) {
        ballsPotted += 1;
        pointsFromPots += delta;
        activeStreak += 1;
        maxStreakBalls = Math.max(maxStreakBalls, ev.streakBallsAfter);
        maxStreakPoints = Math.max(maxStreakPoints, ev.streakPointsAfter);
        if (ev.ballNumber) pottedBallNumbers.push(ev.ballNumber);
        potTimes.push(ev.timeSinceLastEventMs);
        if (ev.visitEnded) {
          streaks.push(activeStreak);
          activeStreak = 0;
        }
      } else {
        if (activeStreak > 0) {
          streaks.push(activeStreak);
          activeStreak = 0;
        }
        if (ev.type === 'penalty') {
          if (ev.playerId === playerId) {
            penaltiesCommitted += 1;
            pointsLostToOwnPenalties += Math.abs(Math.min(0, delta));
          } else {
            pointsFromOpponentPenalties += Math.max(0, delta);
          }
        }
      }
    }
    if (activeStreak > 0) streaks.push(activeStreak);

    const scoringVisits = streaks.length;
    const avgStreakBalls =
      scoringVisits > 0 ? Number((ballsPotted / scoringVisits).toFixed(2)) : 0;

    const avgTimePerPotMs =
      potTimes.length > 0
        ? Math.round(potTimes.reduce((a, b) => a + b, 0) / potTimes.length)
        : null;
    const fastestPotMs = potTimes.length > 0 ? Math.min(...potTimes) : null;
    const slowestPotMs = potTimes.length > 0 ? Math.max(...potTimes) : null;

    const maxDeficitOvercome =
      winnerId === playerId ? (isP1 ? maxLeadP2 : maxLeadP1) : 0;

    return {
      playerId,
      name,
      finalScore,
      ballsPotted,
      pointsFromPots,
      penaltiesCommitted,
      pointsFromOpponentPenalties,
      pointsLostToOwnPenalties,
      maxStreakBalls,
      maxStreakPoints,
      streaks,
      avgStreakBalls,
      scoringVisits,
      pottedBallNumbers,
      avgTimePerPotMs,
      fastestPotMs,
      slowestPotMs,
      scoredFirst: firstPotEvent?.playerId === playerId,
      maxDeficitOvercome,
    };
  };

  return {
    id: uid(),
    roundNumber: params.roundNumber,
    mode: params.mode,
    startedAt: params.startedAt,
    endedAt: params.endedAt,
    durationMs: params.durationMs,
    isCompleted: params.isCompleted,
    finishReason: params.finishReason,
    winnerId,
    p1: computePlayerStats('p1', params.p1Name, p1Score),
    p2: computePlayerStats('p2', params.p2Name, p2Score),
    leadChanges,
    maxLeadP1,
    maxLeadP2,
    events,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      mode: 'free-pyramid',
      initialBreaker: 'p1',
      lastCompletedRound: null,
      p1: { id: 'p1', name: 'Вы', score: 0, roundsWon: 0 },
      p2: { id: 'p2', name: 'Оппонент', score: 0, roundsWon: 0 },
      pottedBalls: [],
      history: [],
      savedMatches: [],
      recentPlayers: [],
      removedPresetNames: [],
      defaultP1Name: '',
      roundElapsedMs: 0,
      currentRoundStartTime: null,
      currentRoundEvents: [],

      startTime: null,
      lastTickTimestamp: null,
      isPaused: false,
      isActiveGame: false,

      startGame: (mode, p1Name, p2Name, initialBreaker = 'p1') => {
        const now = Date.now();
        const cleanP1 = p1Name.trim() || 'Вы';
        const cleanP2 = p2Name.trim() || 'Оппонент';
        const nextRecent = updateRecentPlayerList(get().recentPlayers ?? [], [
          cleanP2,
          cleanP1,
        ]);
        const activeLowers = new Set([
          cleanP1.toLowerCase(),
          cleanP2.toLowerCase(),
        ]);
        const nextRemoved = (get().removedPresetNames ?? []).filter(
          (n) => !activeLowers.has(n.toLowerCase())
        );

        set({
          mode,
          initialBreaker,
          lastCompletedRound: null,
          defaultP1Name: cleanP1 !== 'Вы' ? cleanP1 : get().defaultP1Name,
          p1: { id: 'p1', name: cleanP1, score: 0, roundsWon: 0 },
          p2: { id: 'p2', name: cleanP2, score: 0, roundsWon: 0 },
          pottedBalls: [],
          history: [],
          roundElapsedMs: 0,
          currentRoundStartTime: now,
          currentRoundEvents: [],
          startTime: now,
          lastTickTimestamp: now,
          isPaused: false,
          isActiveGame: true,
          recentPlayers: nextRecent,
          removedPresetNames: nextRemoved,
        });
      },

      tickTimer: () =>
        set((state) => {
          if (
            !state.isActiveGame ||
            state.isPaused ||
            state.lastCompletedRound
          ) {
            return state;
          }
          const now = Date.now();
          const nextElapsed = computeActiveElapsedMs(state, now);
          return {
            roundElapsedMs: nextElapsed,
            lastTickTimestamp: now,
          };
        }),

      togglePause: () => {
        get().setPause(!get().isPaused);
      },

      setPause: (forcePause) =>
        set((state) => {
          if (!state.isActiveGame || state.isPaused === forcePause) {
            return state;
          }
          const now = Date.now();
          if (forcePause) {
            return {
              roundElapsedMs: computeActiveElapsedMs(state, now),
              isPaused: true,
              lastTickTimestamp: null,
            };
          }
          return {
            isPaused: false,
            lastTickTimestamp: now,
          };
        }),

      endGame: () =>
        set((state) => ({
          isActiveGame: false,
          startTime: null,
          lastTickTimestamp: null,
          isPaused: false,
          roundElapsedMs: 0,
          lastCompletedRound: null,
          currentRoundStartTime: null,
          currentRoundEvents: [],
          pottedBalls: [],
          history: [],
          p1: { ...state.p1, score: 0, roundsWon: 0 },
          p2: { ...state.p2, score: 0, roundsWon: 0 },
        })),

      dismissRoundModal: () => set({ lastCompletedRound: null }),

      removeRecentPlayer: (name) =>
        set((state) => {
          const targetLower = name.trim().toLowerCase();
          const currentRemoved = state.removedPresetNames ?? [];
          return {
            recentPlayers: (state.recentPlayers ?? []).filter(
              (n) => n.toLowerCase() !== targetLower
            ),
            removedPresetNames: currentRemoved.includes(targetLower)
              ? currentRemoved
              : [...currentRemoved, targetLower],
          };
        }),

      deleteMatch: (matchId) =>
        set((state) => ({
          savedMatches: (state.savedMatches ?? []).filter(
            (m) => m.id !== matchId
          ),
        })),

      importMatches: (incoming) => {
        if (!Array.isArray(incoming)) return 0;
        const current = get().savedMatches ?? [];
        const existingIds = new Set(current.map((m) => m.id));

        const validNew = incoming.filter(
          (m) =>
            m &&
            typeof m.id === 'string' &&
            typeof m.endedAt === 'number' &&
            m.p1 &&
            m.p2 &&
            Array.isArray(m.events) &&
            !existingIds.has(m.id)
        );

        if (validNew.length === 0) return 0;

        const merged = [...validNew, ...current].sort(
          (a, b) => b.endedAt - a.endedAt
        );

        const importedNames = validNew.flatMap((m) => [m.p1.name, m.p2.name]);
        const nextRecent = updateRecentPlayerList(
          get().recentPlayers ?? [],
          importedNames
        );

        set({ savedMatches: merged, recentPlayers: nextRecent });
        return validNew.length;
      },

      endCurrentVisit: (playerId) =>
        set((state) => {
          if (state.isPaused) return state;
          const currentEvents = state.currentRoundEvents ?? [];
          const activeStreak = getActivePlayerStreak(currentEvents, playerId);
          if (activeStreak < 1) return state;

          let lastPotIdx = -1;
          for (let i = currentEvents.length - 1; i >= 0; i--) {
            const ev = currentEvents[i];
            if (
              ev.type === 'pot' &&
              ev.playerId === playerId &&
              !ev.visitEnded
            ) {
              lastPotIdx = i;
              break;
            }
          }

          if (lastPotIdx === -1) return state;

          const now = Date.now();
          const roundElapsedMs = computeActiveElapsedMs(state, now);

          const snapshot: GameStateData = {
            p1: state.p1,
            p2: state.p2,
            mode: state.mode,
            initialBreaker: state.initialBreaker,
            pottedBalls: state.pottedBalls,
            roundElapsedMs,
            currentRoundStartTime: state.currentRoundStartTime,
            currentRoundEvents: currentEvents,
            lastCompletedRound: null,
          };

          const nextRawEvents = currentEvents.map((ev, idx) =>
            idx === lastPotIdx ? { ...ev, visitEnded: true } : ev
          );

          return {
            history: [...state.history, snapshot].slice(-MAX_HISTORY),
            currentRoundEvents: nextRawEvents,
            roundElapsedMs,
            lastTickTimestamp: now,
          };
        }),

      addScore: (playerId, amount = 1, ballNumber) =>
        set((state) => {
          if (state.isPaused) return state;

          const now = Date.now();
          const roundElapsedMs = computeActiveElapsedMs(state, now);
          const currentEvents = state.currentRoundEvents ?? [];

          const snapshot: GameStateData = {
            p1: state.p1,
            p2: state.p2,
            mode: state.mode,
            initialBreaker: state.initialBreaker,
            pottedBalls: state.pottedBalls,
            roundElapsedMs,
            currentRoundStartTime: state.currentRoundStartTime,
            currentRoundEvents: currentEvents,
            lastCompletedRound: null,
          };
          const history = [...state.history, snapshot].slice(-MAX_HISTORY);

          const opponentId = playerId === 'p1' ? 'p2' : 'p1';
          const eventsWithClosedOpponent = closeOpenStreakForOpponent(
            currentEvents,
            opponentId
          );

          const newEvent: RawRoundEvent = {
            id: uid(),
            timestamp: now,
            roundElapsedMs,
            sessionElapsedMs: roundElapsedMs,
            playerId,
            type: 'pot',
            amount,
            ballNumber,
          };

          const nextRawEvents = [...eventsWithClosedOpponent, newEvent];
          const replayed = replayRoundEvents(nextRawEvents, state.mode);

          const nextP1 = { ...state.p1, score: replayed.p1Score };
          const nextP2 = { ...state.p2, score: replayed.p2Score };

          const isStandardMode = [
            'free-pyramid',
            'combined-pyramid',
            'dynamic-pyramid',
          ].includes(state.mode);
          const isClassicMode = state.mode === 'classic-pyramid';
          const targetScore = isClassicMode ? 71 : 8;

          const isRoundWin =
            (isStandardMode || isClassicMode) &&
            (nextP1.score >= targetScore || nextP2.score >= targetScore);

          if (isRoundWin) {
            const matchRecord = buildMatchRecord({
              roundNumber: 1,
              mode: state.mode,
              startedAt: state.currentRoundStartTime ?? state.startTime ?? now,
              endedAt: now,
              durationMs: roundElapsedMs,
              p1Name: nextP1.name,
              p2Name: nextP2.name,
              rawEvents: nextRawEvents,
              isCompleted: true,
              finishReason: 'target-reached',
            });

            return {
              p1: nextP1,
              p2: nextP2,
              pottedBalls: replayed.pottedBalls,
              roundElapsedMs,
              lastTickTimestamp: null,
              currentRoundEvents: nextRawEvents,
              lastCompletedRound: matchRecord,
              savedMatches: [matchRecord, ...(state.savedMatches ?? [])],
              isActiveGame: false,
              history,
            };
          }

          return {
            p1: nextP1,
            p2: nextP2,
            pottedBalls: replayed.pottedBalls,
            roundElapsedMs,
            lastTickTimestamp: now,
            currentRoundEvents: nextRawEvents,
            history,
          };
        }),

      removeScore: (playerId) =>
        set((state) => {
          if (state.isPaused || state[playerId].score <= 0) return state;

          const currentEvents = state.currentRoundEvents ?? [];
          let removeIndex = -1;

          for (let i = currentEvents.length - 1; i >= 0; i--) {
            const ev = currentEvents[i];
            const isPlayerPot = ev.type === 'pot' && ev.playerId === playerId;
            const isOpponentPenalty =
              ev.type === 'penalty' && ev.playerId !== playerId;
            if (isPlayerPot || isOpponentPenalty) {
              removeIndex = i;
              break;
            }
          }

          if (removeIndex === -1) return state;

          const now = Date.now();
          const roundElapsedMs = computeActiveElapsedMs(state, now);

          const snapshot: GameStateData = {
            p1: state.p1,
            p2: state.p2,
            mode: state.mode,
            initialBreaker: state.initialBreaker,
            pottedBalls: state.pottedBalls,
            roundElapsedMs,
            currentRoundStartTime: state.currentRoundStartTime,
            currentRoundEvents: currentEvents,
            lastCompletedRound: null,
          };

          const removedEvent = currentEvents[removeIndex];
          const nextRawEvents = currentEvents.filter(
            (_, i) => i !== removeIndex
          );

          if (removedEvent.type === 'pot' && removedEvent.visitEnded) {
            for (let i = removeIndex - 1; i >= 0; i--) {
              const prevEv = nextRawEvents[i];
              if (prevEv.type === 'pot' && prevEv.playerId === playerId) {
                nextRawEvents[i] = { ...prevEv, visitEnded: true };
                break;
              }
              if (prevEv.type === 'penalty' || prevEv.playerId !== playerId) {
                break;
              }
            }
          }

          const replayed = replayRoundEvents(nextRawEvents, state.mode);

          return {
            history: [...state.history, snapshot].slice(-MAX_HISTORY),
            p1: { ...state.p1, score: replayed.p1Score },
            p2: { ...state.p2, score: replayed.p2Score },
            pottedBalls: replayed.pottedBalls,
            roundElapsedMs,
            lastTickTimestamp: now,
            currentRoundEvents: nextRawEvents,
          };
        }),

      applyPenalty: (penalizedPlayerId) =>
        set((state) => {
          if (state.isPaused) return state;

          const now = Date.now();
          const roundElapsedMs = computeActiveElapsedMs(state, now);
          const currentEvents = state.currentRoundEvents ?? [];

          const snapshot: GameStateData = {
            p1: state.p1,
            p2: state.p2,
            mode: state.mode,
            initialBreaker: state.initialBreaker,
            pottedBalls: state.pottedBalls,
            roundElapsedMs,
            currentRoundStartTime: state.currentRoundStartTime,
            currentRoundEvents: currentEvents,
            lastCompletedRound: null,
          };
          const history = [...state.history, snapshot].slice(-MAX_HISTORY);

          const closedP1 = closeOpenStreakForOpponent(currentEvents, 'p1');
          const closedBoth = closeOpenStreakForOpponent(closedP1, 'p2');

          const newEvent: RawRoundEvent = {
            id: uid(),
            timestamp: now,
            roundElapsedMs,
            sessionElapsedMs: roundElapsedMs,
            playerId: penalizedPlayerId,
            type: 'penalty',
            amount: state.mode === 'classic-pyramid' ? 5 : 1,
          };

          const nextRawEvents = [...closedBoth, newEvent];
          const replayed = replayRoundEvents(nextRawEvents, state.mode);

          const nextP1 = { ...state.p1, score: replayed.p1Score };
          const nextP2 = { ...state.p2, score: replayed.p2Score };

          const isStandardMode = [
            'free-pyramid',
            'combined-pyramid',
            'dynamic-pyramid',
          ].includes(state.mode);
          const isClassicMode = state.mode === 'classic-pyramid';
          const targetScore = isClassicMode ? 71 : 8;

          const isRoundWin =
            (isStandardMode || isClassicMode) &&
            (nextP1.score >= targetScore || nextP2.score >= targetScore);

          if (isRoundWin) {
            const matchRecord = buildMatchRecord({
              roundNumber: 1,
              mode: state.mode,
              startedAt: state.currentRoundStartTime ?? state.startTime ?? now,
              endedAt: now,
              durationMs: roundElapsedMs,
              p1Name: nextP1.name,
              p2Name: nextP2.name,
              rawEvents: nextRawEvents,
              isCompleted: true,
              finishReason: 'target-reached',
            });

            return {
              p1: nextP1,
              p2: nextP2,
              pottedBalls: replayed.pottedBalls,
              roundElapsedMs,
              lastTickTimestamp: null,
              currentRoundEvents: nextRawEvents,
              lastCompletedRound: matchRecord,
              savedMatches: [matchRecord, ...(state.savedMatches ?? [])],
              isActiveGame: false,
              history,
            };
          }

          return {
            p1: nextP1,
            p2: nextP2,
            pottedBalls: replayed.pottedBalls,
            roundElapsedMs,
            lastTickTimestamp: now,
            currentRoundEvents: nextRawEvents,
            history,
          };
        }),

      finishCurrentRound: () => {
        const state = get();
        const currentEvents = state.currentRoundEvents ?? [];
        if (currentEvents.length === 0) return null;

        const now = Date.now();
        const roundElapsedMs = computeActiveElapsedMs(state, now);

        const snapshot: GameStateData = {
          p1: state.p1,
          p2: state.p2,
          mode: state.mode,
          initialBreaker: state.initialBreaker,
          pottedBalls: state.pottedBalls,
          roundElapsedMs,
          currentRoundStartTime: state.currentRoundStartTime,
          currentRoundEvents: currentEvents,
          lastCompletedRound: null,
        };

        const matchRecord = buildMatchRecord({
          roundNumber: 1,
          mode: state.mode,
          startedAt: state.currentRoundStartTime ?? state.startTime ?? now,
          endedAt: now,
          durationMs: roundElapsedMs,
          p1Name: state.p1.name,
          p2Name: state.p2.name,
          rawEvents: currentEvents,
          isCompleted: true,
          finishReason: 'manual-round-end',
        });

        set({
          roundElapsedMs,
          lastTickTimestamp: null,
          isPaused: false,
          lastCompletedRound: matchRecord,
          savedMatches: [matchRecord, ...(state.savedMatches ?? [])],
          isActiveGame: false,
          history: [...state.history, snapshot].slice(-MAX_HISTORY),
        });

        return matchRecord;
      },

      undo: () =>
        set((state) => {
          if (state.history.length === 0) return state;
          const newHistory = [...state.history];
          const previousState = newHistory.pop();
          if (!previousState) return state;

          const completedId = state.lastCompletedRound?.id;
          const nextSavedMatches = completedId
            ? (state.savedMatches ?? []).filter((m) => m.id !== completedId)
            : state.savedMatches;

          return {
            ...previousState,
            history: newHistory,
            savedMatches: nextSavedMatches,
            isActiveGame: true,
            isPaused: false,
            lastTickTimestamp: Date.now(),
          };
        }),
    }),
    {
      name: 'piramid-game-storage',
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Record<string, unknown>) || {};
        let savedMatches = Array.isArray(persisted.savedMatches)
          ? (persisted.savedMatches as MatchRecord[])
          : [];

        if (
          savedMatches.length === 0 &&
          Array.isArray(persisted.savedSessions)
        ) {
          const oldSessions = persisted.savedSessions as GameSessionRecord[];
          savedMatches = oldSessions
            .flatMap((s) => (Array.isArray(s.matches) ? s.matches : []))
            .sort((a, b) => b.endedAt - a.endedAt);
        }

        const removedPresetNames = Array.isArray(persisted.removedPresetNames)
          ? (persisted.removedPresetNames as string[])
          : [];
        const removedSet = new Set(
          removedPresetNames.map((n) => n.toLowerCase())
        );

        const existingRecent = Array.isArray(persisted.recentPlayers)
          ? (persisted.recentPlayers as string[])
          : [];
        const namesFromMatches = savedMatches.flatMap((m) => [
          m.p1?.name ?? '',
          m.p2?.name ?? '',
        ]);
        const recentPlayers = updateRecentPlayerList(
          existingRecent,
          namesFromMatches
        ).filter((n) => !removedSet.has(n.toLowerCase()));

        return {
          ...currentState,
          ...persisted,
          savedMatches,
          recentPlayers,
          removedPresetNames,
          lastTickTimestamp: null,
        };
      },
    }
  )
);

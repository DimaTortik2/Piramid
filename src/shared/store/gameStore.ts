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
  previousRoundsTime: number;
  currentRoundStartTime: number | null;
  currentRoundEvents: RawRoundEvent[];
  completedMatches: MatchRecord[];
  lastCompletedRound: MatchRecord | null;
}

interface GameStore extends GameStateData {
  history: GameStateData[];
  savedSessions: GameSessionRecord[];
  startTime: number | null;
  totalPausedTime: number;
  pauseStartTime: number | null;
  isPaused: boolean;
  isActiveGame: boolean;
  importSessions: (incoming: GameSessionRecord[]) => number;

  startGame: (
    mode: GameMode,
    p1Name: string,
    p2Name: string,
    initialBreaker?: 'p1' | 'p2'
  ) => void;
  addScore: (
    playerId: 'p1' | 'p2',
    amount?: number,
    ballNumber?: number
  ) => void;
  removeScore: (playerId: 'p1' | 'p2') => void;
  applyPenalty: (penalizedPlayerId: 'p1' | 'p2') => void;
  finishCurrentRound: () => void;
  finishSession: () => GameSessionRecord | null;
  dismissRoundModal: () => void;
  deleteSession: (sessionId: string) => void;
  undo: () => void;
  togglePause: () => void;
  setPause: (forcePause: boolean) => void;
  endGame: () => void;
}

const MAX_HISTORY = 30;
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function getEffectiveSessionElapsedMs(
  state: {
    startTime: number | null;
    totalPausedTime: number;
    isPaused: boolean;
    pauseStartTime: number | null;
  },
  now: number
) {
  if (!state.startTime) return 0;
  const currentPause =
    state.isPaused && state.pauseStartTime ? now - state.pauseStartTime : 0;
  return Math.max(
    0,
    now - state.startTime - state.totalPausedTime - currentPause
  );
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
    let streaks: number[];
    streaks = [];
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

function buildSessionRecord(params: {
  mode: GameMode;
  startedAt: number;
  endedAt: number;
  totalDurationMs: number;
  totalPausedMs: number;
  p1: Player;
  p2: Player;
  matches: MatchRecord[];
}): GameSessionRecord {
  const { matches, p1, p2 } = params;
  const matchesCount = matches.length;
  const completedMatchesCount = matches.filter((m) => m.isCompleted).length;

  const aggregatePlayer = (
    playerId: 'p1' | 'p2',
    player: Player
  ): PlayerSessionSummary => {
    const pMatches = matches.map((m) => m[playerId]);
    const totalScore = pMatches.reduce((acc, m) => acc + m.finalScore, 0);
    const totalBallsPotted = pMatches.reduce(
      (acc, m) => acc + m.ballsPotted,
      0
    );
    const totalPenaltiesCommitted = pMatches.reduce(
      (acc, m) => acc + m.penaltiesCommitted,
      0
    );
    const totalPointsFromOpponentPenalties = pMatches.reduce(
      (acc, m) => acc + m.pointsFromOpponentPenalties,
      0
    );
    const totalPointsLostToOwnPenalties = pMatches.reduce(
      (acc, m) => acc + m.pointsLostToOwnPenalties,
      0
    );
    const maxStreakBalls = pMatches.reduce(
      (acc, m) => Math.max(acc, m.maxStreakBalls),
      0
    );
    const maxStreakPoints = pMatches.reduce(
      (acc, m) => Math.max(acc, m.maxStreakPoints),
      0
    );
    const allStreaks = pMatches.flatMap((m) => m.streaks);
    const avgStreakBalls =
      allStreaks.length > 0
        ? Number((totalBallsPotted / allStreaks.length).toFixed(2))
        : 0;

    const allPotTimes = matches.flatMap((m) =>
      m.events
        .filter((e) => e.type === 'pot' && e.playerId === playerId)
        .map((e) => e.timeSinceLastEventMs)
    );
    const avgTimePerPotMs =
      allPotTimes.length > 0
        ? Math.round(
            allPotTimes.reduce((a, b) => a + b, 0) / allPotTimes.length
          )
        : null;
    const fastestPotMs =
      allPotTimes.length > 0 ? Math.min(...allPotTimes) : null;

    const winRate =
      completedMatchesCount > 0
        ? Number(((player.roundsWon / completedMatchesCount) * 100).toFixed(1))
        : 0;

    return {
      name: player.name,
      roundsWon: player.roundsWon,
      winRate,
      totalScore,
      totalBallsPotted,
      totalPenaltiesCommitted,
      totalPointsFromOpponentPenalties,
      totalPointsLostToOwnPenalties,
      maxStreakBalls,
      maxStreakPoints,
      avgStreakBalls,
      avgScorePerMatch:
        matchesCount > 0 ? Number((totalScore / matchesCount).toFixed(1)) : 0,
      avgBallsPerMatch:
        matchesCount > 0
          ? Number((totalBallsPotted / matchesCount).toFixed(1))
          : 0,
      avgTimePerPotMs,
      fastestPotMs,
      pottedBallNumbers: pMatches.flatMap((m) => m.pottedBallNumbers),
    };
  };

  const p1Summary = aggregatePlayer('p1', p1);
  const p2Summary = aggregatePlayer('p2', p2);

  const durations = matches.map((m) => m.durationMs);
  const longestMatchMs = durations.length > 0 ? Math.max(...durations) : 0;
  const shortestMatchMs = durations.length > 0 ? Math.min(...durations) : 0;
  const avgMatchDurationMs =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  let winnerId: 'p1' | 'p2' | 'draw' = 'draw';
  if (p1.roundsWon !== p2.roundsWon) {
    winnerId = p1.roundsWon > p2.roundsWon ? 'p1' : 'p2';
  } else if (p1Summary.totalScore !== p2Summary.totalScore) {
    winnerId = p1Summary.totalScore > p2Summary.totalScore ? 'p1' : 'p2';
  }

  return {
    id: uid(),
    mode: params.mode,
    startedAt: params.startedAt,
    endedAt: params.endedAt,
    totalDurationMs: params.totalDurationMs,
    totalPausedMs: params.totalPausedMs,
    winnerId,
    p1: p1Summary,
    p2: p2Summary,
    matchesCount,
    completedMatchesCount,
    longestMatchMs,
    shortestMatchMs,
    avgMatchDurationMs,
    matches,
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
      savedSessions: [],
      previousRoundsTime: 0,
      currentRoundStartTime: null,
      currentRoundEvents: [],
      completedMatches: [],

      startTime: null,
      totalPausedTime: 0,
      pauseStartTime: null,
      isPaused: false,
      isActiveGame: false,

      startGame: (mode, p1Name, p2Name, initialBreaker = 'p1') => {
        const now = Date.now();
        set({
          mode,
          initialBreaker,
          lastCompletedRound: null,
          p1: { id: 'p1', name: p1Name || 'Вы', score: 0, roundsWon: 0 },
          p2: { id: 'p2', name: p2Name || 'Оппонент', score: 0, roundsWon: 0 },
          pottedBalls: [],
          history: [],
          previousRoundsTime: 0,
          currentRoundStartTime: now,
          currentRoundEvents: [],
          completedMatches: [],
          startTime: now,
          totalPausedTime: 0,
          pauseStartTime: null,
          isPaused: false,
          isActiveGame: true,
        });
      },

      togglePause: () => {
        get().setPause(!get().isPaused);
      },

      setPause: (forcePause) =>
        set((state) => {
          if (!state.startTime || state.isPaused === forcePause) return state;

          const now = Date.now();
          if (!forcePause) {
            const pausedFor = state.pauseStartTime
              ? now - state.pauseStartTime
              : 0;
            return {
              isPaused: false,
              pauseStartTime: null,
              totalPausedTime: state.totalPausedTime + pausedFor,
            };
          }
          return { isPaused: true, pauseStartTime: now };
        }),

      endGame: () =>
        set((state) => ({
          isActiveGame: false,
          startTime: null,
          lastCompletedRound: null,
          currentRoundEvents: [],
          completedMatches: [],
          pottedBalls: [],
          history: [],
          p1: { ...state.p1, score: 0, roundsWon: 0 },
          p2: { ...state.p2, score: 0, roundsWon: 0 },
        })),

      dismissRoundModal: () => set({ lastCompletedRound: null }),

      deleteSession: (sessionId) =>
        set((state) => {
          const next = (state.savedSessions ?? []).filter(
            (s) => s.id !== sessionId
          );
          try {
            localStorage.setItem('piramid-match-history', JSON.stringify(next));
          } catch {
            // ignore storage errors
          }
          return { savedSessions: next };
        }),
        importSessions: (incoming) => {
        if (!Array.isArray(incoming)) return 0;
        const current = get().savedSessions ?? [];
        const existingIds = new Set(current.map((s) => s.id));

        const validNew = incoming.filter(
          (s) =>
            s &&
            typeof s.id === 'string' &&
            typeof s.endedAt === 'number' &&
            s.p1 &&
            s.p2 &&
            Array.isArray(s.matches) &&
            !existingIds.has(s.id)
        );

        if (validNew.length === 0) return 0;

        const merged = [...validNew, ...current].sort(
          (a, b) => b.endedAt - a.endedAt
        );

        try {
          localStorage.setItem('piramid-match-history', JSON.stringify(merged));
        } catch {
          // ignore storage quota errors
        }

        set({ savedSessions: merged });
        return validNew.length;
      },

      addScore: (playerId, amount = 1, ballNumber) =>
        set((state) => {
          if (state.isPaused) return state;

          const now = Date.now();
          const sessionElapsedMs = getEffectiveSessionElapsedMs(state, now);
          const roundElapsedMs = Math.max(
            0,
            sessionElapsedMs - state.previousRoundsTime
          );

          const snapshot: GameStateData = {
            p1: state.p1,
            p2: state.p2,
            mode: state.mode,
            initialBreaker: state.initialBreaker,
            pottedBalls: state.pottedBalls,
            previousRoundsTime: state.previousRoundsTime,
            currentRoundStartTime: state.currentRoundStartTime,
            currentRoundEvents: state.currentRoundEvents ?? [],
            completedMatches: state.completedMatches ?? [],
            lastCompletedRound: null,
          };
          const history = [...state.history, snapshot].slice(-MAX_HISTORY);

          const newEvent: RawRoundEvent = {
            id: uid(),
            timestamp: now,
            roundElapsedMs,
            sessionElapsedMs,
            playerId,
            type: 'pot',
            amount,
            ballNumber,
          };

          const nextRawEvents = [...(state.currentRoundEvents ?? []), newEvent];
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
            if (nextP1.score >= targetScore) nextP1.roundsWon += 1;
            else if (nextP2.score >= targetScore) nextP2.roundsWon += 1;

            const completedList = state.completedMatches ?? [];
            const matchRecord = buildMatchRecord({
              roundNumber: completedList.length + 1,
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

            nextP1.score = 0;
            nextP2.score = 0;

            return {
              p1: nextP1,
              p2: nextP2,
              pottedBalls: [],
              previousRoundsTime: sessionElapsedMs,
              currentRoundStartTime: now,
              currentRoundEvents: [],
              completedMatches: [...completedList, matchRecord],
              lastCompletedRound: matchRecord,
              history,
            };
          }

          return {
            p1: nextP1,
            p2: nextP2,
            pottedBalls: replayed.pottedBalls,
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
            if (ev.type === 'pot' && ev.playerId === playerId) {
              removeIndex = i;
              break;
            }
          }

          if (removeIndex === -1) {
            for (let i = currentEvents.length - 1; i >= 0; i--) {
              const ev = currentEvents[i];
              if (ev.type === 'penalty' && ev.playerId !== playerId) {
                removeIndex = i;
                break;
              }
            }
          }

          if (removeIndex === -1) return state;

          const snapshot: GameStateData = {
            p1: state.p1,
            p2: state.p2,
            mode: state.mode,
            initialBreaker: state.initialBreaker,
            pottedBalls: state.pottedBalls,
            previousRoundsTime: state.previousRoundsTime,
            currentRoundStartTime: state.currentRoundStartTime,
            currentRoundEvents: currentEvents,
            completedMatches: state.completedMatches ?? [],
            lastCompletedRound: null,
          };

          const nextRawEvents = currentEvents.filter(
            (_, i) => i !== removeIndex
          );
          const replayed = replayRoundEvents(nextRawEvents, state.mode);

          return {
            history: [...state.history, snapshot].slice(-MAX_HISTORY),
            p1: { ...state.p1, score: replayed.p1Score },
            p2: { ...state.p2, score: replayed.p2Score },
            pottedBalls: replayed.pottedBalls,
            currentRoundEvents: nextRawEvents,
          };
        }),

      applyPenalty: (penalizedPlayerId) =>
        set((state) => {
          if (state.isPaused) return state;

          const now = Date.now();
          const sessionElapsedMs = getEffectiveSessionElapsedMs(state, now);
          const roundElapsedMs = Math.max(
            0,
            sessionElapsedMs - state.previousRoundsTime
          );

          const snapshot: GameStateData = {
            p1: state.p1,
            p2: state.p2,
            mode: state.mode,
            initialBreaker: state.initialBreaker,
            pottedBalls: state.pottedBalls,
            previousRoundsTime: state.previousRoundsTime,
            currentRoundStartTime: state.currentRoundStartTime,
            currentRoundEvents: state.currentRoundEvents ?? [],
            completedMatches: state.completedMatches ?? [],
            lastCompletedRound: null,
          };
          const history = [...state.history, snapshot].slice(-MAX_HISTORY);

          const newEvent: RawRoundEvent = {
            id: uid(),
            timestamp: now,
            roundElapsedMs,
            sessionElapsedMs,
            playerId: penalizedPlayerId,
            type: 'penalty',
            amount: state.mode === 'classic-pyramid' ? 5 : 1,
          };

          const nextRawEvents = [...(state.currentRoundEvents ?? []), newEvent];
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
            if (nextP1.score >= targetScore) nextP1.roundsWon += 1;
            else if (nextP2.score >= targetScore) nextP2.roundsWon += 1;

            const completedList = state.completedMatches ?? [];
            const matchRecord = buildMatchRecord({
              roundNumber: completedList.length + 1,
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

            nextP1.score = 0;
            nextP2.score = 0;

            return {
              p1: nextP1,
              p2: nextP2,
              pottedBalls: [],
              previousRoundsTime: sessionElapsedMs,
              currentRoundStartTime: now,
              currentRoundEvents: [],
              completedMatches: [...completedList, matchRecord],
              lastCompletedRound: matchRecord,
              history,
            };
          }

          return {
            p1: nextP1,
            p2: nextP2,
            pottedBalls: replayed.pottedBalls,
            currentRoundEvents: nextRawEvents,
            history,
          };
        }),

      finishCurrentRound: () =>
        set((state) => {
          const currentEvents = state.currentRoundEvents ?? [];
          if (currentEvents.length === 0) return state;

          const now = Date.now();
          const sessionElapsedMs = getEffectiveSessionElapsedMs(state, now);
          const roundElapsedMs = Math.max(
            0,
            sessionElapsedMs - state.previousRoundsTime
          );

          const snapshot: GameStateData = {
            p1: state.p1,
            p2: state.p2,
            mode: state.mode,
            initialBreaker: state.initialBreaker,
            pottedBalls: state.pottedBalls,
            previousRoundsTime: state.previousRoundsTime,
            currentRoundStartTime: state.currentRoundStartTime,
            currentRoundEvents: currentEvents,
            completedMatches: state.completedMatches ?? [],
            lastCompletedRound: null,
          };

          const nextP1 = { ...state.p1 };
          const nextP2 = { ...state.p2 };

          if (nextP1.score > nextP2.score) nextP1.roundsWon += 1;
          else if (nextP2.score > nextP1.score) nextP2.roundsWon += 1;

          const completedList = state.completedMatches ?? [];
          const matchRecord = buildMatchRecord({
            roundNumber: completedList.length + 1,
            mode: state.mode,
            startedAt: state.currentRoundStartTime ?? state.startTime ?? now,
            endedAt: now,
            durationMs: roundElapsedMs,
            p1Name: nextP1.name,
            p2Name: nextP2.name,
            rawEvents: currentEvents,
            isCompleted: true,
            finishReason: 'manual-round-end',
          });

          nextP1.score = 0;
          nextP2.score = 0;

          return {
            p1: nextP1,
            p2: nextP2,
            pottedBalls: [],
            previousRoundsTime: sessionElapsedMs,
            currentRoundStartTime: now,
            currentRoundEvents: [],
            completedMatches: [...completedList, matchRecord],
            lastCompletedRound: matchRecord,
            history: [...state.history, snapshot].slice(-MAX_HISTORY),
          };
        }),

      finishSession: () => {
        const state = get();
        const now = Date.now();
        const totalDurationMs = getEffectiveSessionElapsedMs(state, now);
        const currentPause =
          state.isPaused && state.pauseStartTime
            ? now - state.pauseStartTime
            : 0;
        const totalPausedMs = state.totalPausedTime + currentPause;

        const matches = [...(state.completedMatches ?? [])];
        const currentEvents = state.currentRoundEvents ?? [];
        const finalP1 = { ...state.p1 };
        const finalP2 = { ...state.p2 };

        if (currentEvents.length > 0) {
          const roundElapsedMs = Math.max(
            0,
            totalDurationMs - state.previousRoundsTime
          );
          const isContinuous = state.mode === 'continuous-free-pyramid';
          if (isContinuous && finalP1.score !== finalP2.score) {
            if (finalP1.score > finalP2.score) finalP1.roundsWon += 1;
            else finalP2.roundsWon += 1;
          }

          const lastMatch = buildMatchRecord({
            roundNumber: matches.length + 1,
            mode: state.mode,
            startedAt: state.currentRoundStartTime ?? state.startTime ?? now,
            endedAt: now,
            durationMs: roundElapsedMs,
            p1Name: finalP1.name,
            p2Name: finalP2.name,
            rawEvents: currentEvents,
            isCompleted: isContinuous && finalP1.score !== finalP2.score,
            finishReason: 'session-ended',
          });
          matches.push(lastMatch);
        }

        const sessionRecord = buildSessionRecord({
          mode: state.mode,
          startedAt: state.startTime ?? now,
          endedAt: now,
          totalDurationMs,
          totalPausedMs,
          p1: finalP1,
          p2: finalP2,
          matches,
        });

        const nextSavedSessions = [
          sessionRecord,
          ...(state.savedSessions ?? []),
        ];

        try {
          localStorage.setItem(
            'piramid-match-history',
            JSON.stringify(nextSavedSessions)
          );
        } catch {
          // ignore storage quota errors
        }

        set({
          savedSessions: nextSavedSessions,
          isActiveGame: false,
          startTime: null,
          lastCompletedRound: null,
          currentRoundStartTime: null,
          currentRoundEvents: [],
          completedMatches: [],
          pottedBalls: [],
          history: [],
          previousRoundsTime: 0,
          totalPausedTime: 0,
          pauseStartTime: null,
          isPaused: false,
          p1: { ...state.p1, score: 0, roundsWon: 0 },
          p2: { ...state.p2, score: 0, roundsWon: 0 },
        });

        return sessionRecord;
      },

      undo: () =>
        set((state) => {
          if (state.history.length === 0) return state;
          const newHistory = [...state.history];
          const previousState = newHistory.pop();
          return previousState
            ? { ...previousState, history: newHistory }
            : state;
        }),
    }),
    {
      name: 'piramid-game-storage',
    }
  )
);

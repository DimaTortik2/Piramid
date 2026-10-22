import { cn } from '@/shared/lib/utils/cn';
import {
  type HTMLAttributes,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  SignOutIcon,
  ArrowArcLeftIcon,
  QuestionMarkIcon,
  PlayIcon,
  FireIcon,
  CheckIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { Circle } from '@/shared/Circle';
import { Button } from '@/shared/Button';
import { useSwipe } from '@/shared/hooks/useSwipe';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { ShareSessionDrawer } from '@/shared/ShareSessionDrawer';
import {
  useGameStore,
  getActivePlayerStreak,
  type GameMode,
} from '@/shared/store/gameStore';
import { useSettingsStore } from '@/shared/store/useSettingsStore';
import { startGameModeOnboardingTour } from '@/shared/lib/onboarding';
import { Drawer } from 'vaul';
import { toast } from 'sonner';
import { triggerHaptic } from '@/shared/lib/telegram';

interface GamePageProps {}

const BALL_R = 25;

const MODE_TITLES: Record<GameMode, string> = {
  'free-pyramid': 'Американка',
  'combined-pyramid': 'Московка',
  'dynamic-pyramid': 'Невская',
  'classic-pyramid': 'Классика',
  'continuous-free-pyramid': 'С продолжением',
};

const STREAK_ANIMATION_STYLES = `
  @keyframes badge-pop {
    0% { transform: scale(0.5); opacity: 0; filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.8)); }
    15% { transform: scale(1.3); opacity: 1; filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.8)); }
    30% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 0 rgba(34, 197, 94, 0)); }
    80% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0.5); opacity: 0; }
  }
  @keyframes check-pop {
    0% { transform: scale(0) rotate(-45deg); }
    35% { transform: scale(1.3) rotate(15deg); }
    55% { transform: scale(1) rotate(0); }
    100% { transform: scale(1) rotate(0); }
  }
  @keyframes penalty-pop {
    0% { transform: scale(0.5) rotate(-15deg); opacity: 0; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)); }
    15% { transform: scale(1.3) rotate(15deg); opacity: 1; filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)); }
    30% { transform: scale(1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 0 rgba(239, 68, 68, 0)); }
    80% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0.5); opacity: 0; }
  }
  
 @property --snake-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes snake-spin {
    0% { --snake-angle: 0deg; opacity: 0; }
    15% { opacity: 1; }
    70% { opacity: 1; }
    100% { --snake-angle: 200deg; opacity: 0; } 
  }
  .board-snake-base::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 4px; /* Сделали толще */
    pointer-events: none;
    z-index: 50;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    /* Убрали forwards, так как opacity 0 в конце и так скроет её */
    animation: snake-spin 0.7s ease-out forwards; 
  }
  .board-snake-green::after {
    background: conic-gradient(from var(--snake-angle), rgba(34, 197, 94, 0) 0%, rgba(34, 197, 94, 0) 10%, rgba(34, 197, 94, 1) 45%, rgba(34, 197, 94, 0) 50%, rgba(34, 197, 94, 0) 60%, rgba(34, 197, 94, 1) 95%, rgba(34, 197, 94, 0) 100%);
  }
  .board-snake-red::after {
    background: conic-gradient(from var(--snake-angle), rgba(239, 68, 68, 0) 0%, rgba(239, 68, 68, 0) 10%, rgba(239, 68, 68, 1) 45%, rgba(239, 68, 68, 0) 50%, rgba(239, 68, 68, 0) 60%, rgba(239, 68, 68, 1) 95%, rgba(239, 68, 68, 0) 100%);
  }
     @keyframes shelf-bump-green {
    0% { transform: translateY(0); }
    25% { transform: translateY(-6px); }
    50% { transform: translateY(3px); }
    75% { transform: translateY(-1px); }
    100% { transform: translateY(0); }
  }
  @keyframes shelf-bump-red {
    0% { transform: translateY(0); }
    25% { transform: translateY(6px); }
    50% { transform: translateY(-3px); }
    75% { transform: translateY(1px); }
    100% { transform: translateY(0); }
  }
  .bump-green { animation: shelf-bump-green 0.4s ease-out; }
  .bump-red { animation: shelf-bump-red 0.4s ease-out; }
`;
const stopSwipePropagation = (e: SyntheticEvent) => {
  e.stopPropagation();
};

const swipeIgnoreProps = {
  onPointerDown: stopSwipePropagation,
  onPointerMove: stopSwipePropagation,
  onPointerUp: stopSwipePropagation,
  onPointerCancel: stopSwipePropagation,
  onTouchStart: stopSwipePropagation,
  onTouchMove: stopSwipePropagation,
  onTouchEnd: stopSwipePropagation,
  onMouseDown: stopSwipePropagation,
  onMouseUp: stopSwipePropagation,
};

const Ball = ({ scored }: { scored: boolean }) => {
  return (
    <div
      style={{ height: BALL_R * 2, width: BALL_R * 2 }}
      className={cn(
        'rounded-full transition-colors',
        scored ? 'bg-piramid-ball-mid' : 'bg-piramid-ball-mid/30'
      )}
    />
  );
};

const Shelf = ({
  ScoredBallsCount,
  maxBallsOnShelf = 4,
  className,
  ...props
}: {
  ScoredBallsCount: number;
  maxBallsOnShelf?: number;
} & HTMLAttributes<HTMLDivElement>) => {
  const ballsLeft = maxBallsOnShelf - ScoredBallsCount;
  const ballsData: { scored: boolean }[] = [];

  for (let i = 0; i < ScoredBallsCount; i++) ballsData.push({ scored: true });
  for (let i = 0; i < ballsLeft; i++) ballsData.push({ scored: false });

  return (
    <div {...props} className={cn('flex flex-col items-center', className)}>
      <div className="flex gap-2">
        {ballsData.slice(0, 4).map((ball, i) => (
          <Ball key={i} scored={ball.scored} />
        ))}
      </div>
      <div
        style={{ maxWidth: BALL_R * 10 }}
        className="bg-billiard-border h-4 w-[95%] rounded-full"
      />
    </div>
  );
};

const HeaderDisplay = ({
  mode,
  isTimerDrawerOpen = false,
  setIsTimerDrawerOpen,
  roundHours = 0,
  roundMinutes = 0,
  roundSeconds = 0,
  isPaused = false,
  onTogglePause,
}: {
  mode: GameMode;
  isTimerDrawerOpen: boolean;
  setIsTimerDrawerOpen: (isOpen: boolean) => void;
  roundHours?: number;
  roundMinutes?: number;
  roundSeconds?: number;
  isPaused?: boolean;
  onTogglePause?: () => void;
} & HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      id="tour-game-header"
      className={cn(
        'bg-background/80 text-foreground flex h-11 items-center justify-between rounded-xl px-4 py-2.5 backdrop-blur-lg transition-all duration-300',
        isPaused && 'pause-header-snake'
      )}
    >
      <span
        className={cn(
          'text-sm font-medium transition-all duration-300',
          isPaused ? 'opacity-35 grayscale' : 'opacity-75'
        )}
      >
        {MODE_TITLES[mode]}
      </span>

      {isPaused ? (
        <button
          id="tour-game-timer"
          type="button"
          className="bg-destructive/15 text-destructive flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors"
          onClick={onTogglePause}
        >
          <PlayIcon weight="fill" className="size-3.5" />
          <span>На паузе</span>
        </button>
      ) : (
        <button
          id="tour-game-timer"
          type="button"
          onClick={onTogglePause}
          className="flex items-center justify-center py-1 text-sm opacity-80 transition-opacity hover:opacity-100"
        >
          {roundHours > 0 ? (
            <p>
              <span>{roundHours}</span>
              <span className="text-[0.75em]"> ч. </span>
              <span>{roundMinutes}</span>
              <span className="text-[0.75em]"> мин.</span>
            </p>
          ) : (
            <p>
              <span>{roundMinutes}</span>
              <span className="text-[0.75em]"> мин. </span>
              <span>{roundSeconds}</span>
              <span className="text-[0.75em]"> сек.</span>
            </p>
          )}
        </button>
      )}
      <InfoDrawer
        isOpen={isTimerDrawerOpen}
        onOpenChange={setIsTimerDrawerOpen}
        content={
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            {isPaused ? (
              <p>
                Партия на паузе. Нажмите кнопку ниже, чтобы продолжить отсчет
                времени.
              </p>
            ) : (
              <p>
                Время партии: {roundHours > 0 && `${roundHours} ч. `}
                {roundMinutes} мин. {roundHours === 0 && `${roundSeconds} сек.`}
              </p>
            )}
            <Drawer.Close asChild>
              <Button
                variant={isPaused ? 'approve' : 'primary'}
                onClick={onTogglePause}
                className="mt-4 w-full"
              >
                {isPaused ? 'Возобновить партию' : 'Поставить на паузу'}
              </Button>
            </Drawer.Close>
          </div>
        }
      />
    </div>
  );
};

const UserGameBoard = ({
  boardId,
  nameRowId,
  penaltyBtnId,
  name,
  score = 0,
  activeStreak = 0,
  isPaused = false,
  onAdd,
  onRemove,
  onPenalty,
  onEndVisit,
  showNumberOnly = false,
  isRecentlyPenalized = false,
  snakeType,
  snakeCount,
}: {
  boardId?: string;
  penaltyBtnId?: string;
  name?: string;
  score?: number;
  activeStreak?: number;
  isPaused?: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onPenalty?: () => void;
  onEndVisit?: () => void;
  showNumberOnly?: boolean;
  isRecentlyPenalized?: boolean;
  nameRowId?: string;
  snakeType?: 'green' | 'red';
  snakeCount?: number;
} & HTMLAttributes<HTMLDivElement>) => {
  let firstShelfScore = 0;
  let secondShelfScore = 0;

  if (score <= 4) {
    firstShelfScore = score;
    secondShelfScore = 0;
  } else {
    firstShelfScore = 4;
    secondShelfScore = score - 4;
  }

  const { handlers, swipeOffset, threshold } = useSwipe({
    onSwipeUp: onAdd,
    onSwipeDown: onRemove,
    threshold: 60,
  });

  const pullUpProgress = Math.max(0, Math.min(swipeOffset / threshold, 1));
  const pullDownProgress = Math.max(0, Math.min(-swipeOffset / threshold, 1));

  const [savingStreak, setSavingStreak] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleEndVisitClick = (e: SyntheticEvent) => {
    e.stopPropagation();
    if (isPaused) {
      onEndVisit?.();
      return;
    }
    setSavingStreak(true);
    triggerHaptic('pot');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSavingStreak(false);
    }, 1200);
    onEndVisit?.();
  };

  return (
    <div
      id={boardId}
      {...handlers}
      className={cn(
        'bg-background/80 text-foreground relative flex flex-1 touch-none flex-col overflow-hidden rounded-xl p-4 backdrop-blur-lg transition-all duration-300 select-none',
        isPaused && 'opacity-25 grayscale'
      )}
    >
      {(snakeCount ?? 0) > 0 && (
        <div
          key={snakeCount}
          className={cn(
            'board-snake-base pointer-events-none absolute inset-0 rounded-xl',
            snakeType === 'green' ? 'board-snake-green' : 'board-snake-red'
          )}
        />
      )}

      <div
        className="from-approve/40 pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent transition-opacity duration-75"
        style={{ opacity: pullUpProgress }}
      />
      <div
        className="from-destructive/40 pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent transition-opacity duration-75"
        style={{ opacity: pullDownProgress }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center">
        <div className="flex w-full items-center justify-between gap-2">
          <div id={nameRowId} className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{name}</span>
            {(activeStreak >= 1 || savingStreak) &&
              (savingStreak ? (
                <div
                  className="text-approve flex h-4 shrink-0 items-center justify-center px-2"
                  style={{ animation: 'badge-pop 1.2s ease-in-out forwards' }}
                >
                  <CheckIcon
                    weight="bold"
                    className="size-4"
                    style={{
                      animation:
                        'check-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  title="Завершить подход (прервать серию)"
                  {...swipeIgnoreProps}
                  onClick={handleEndVisitClick}
                  className="bg-approve/20 text-approve hover:bg-approve/30 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all active:scale-95"
                >
                  <FireIcon weight="fill" className="size-3.5" />
                  <span>Серия {activeStreak}</span>
                </button>
              ))}
          </div>
          <div
            id={penaltyBtnId}
            {...swipeIgnoreProps}
            className="relative flex shrink-0 items-center justify-center"
          >
            <Button
              onClick={onPenalty}
              variant="destructive"
              size="sm"
              className={cn(
                'w-fit transition-opacity duration-200',
                isRecentlyPenalized
                  ? 'pointer-events-none opacity-0'
                  : 'opacity-100'
              )}
            >
              Штраф
            </Button>

            {isRecentlyPenalized && (
              <div
                className="text-destructive pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ animation: 'penalty-pop 1.5s ease-in-out forwards' }}
              >
                <WarningIcon weight="fill" className="size-6" />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2">
          <Button
            variant="ghostApprove"
            className="text-foreground/20 mx-auto hidden w-fit lg:flex pointer-fine:flex"
            onClick={onAdd}
          >
            +1
          </Button>

          <div
            key={snakeCount}
            className={cn(
              'flex w-full flex-col items-center justify-center',
              (snakeCount ?? 0) > 0 &&
                (snakeType === 'green' ? 'bump-green' : 'bump-red')
            )}
          >
            {showNumberOnly ? (
              <div className="my-4 flex flex-col items-center justify-center">
                <span className="text-7xl font-bold">{score}</span>
              </div>
            ) : (
              <>
                <Shelf className="mb-4" ScoredBallsCount={firstShelfScore} />
                <Shelf ScoredBallsCount={secondShelfScore} />
              </>
            )}
          </div>

          <Button
            variant="ghostDestructive"
            className="text-foreground/20 mx-auto hidden w-fit lg:flex pointer-fine:flex"
            onClick={onRemove}
          >
            -1
          </Button>
        </div>
      </div>
    </div>
  );
};

const BottomActions = ({
  onUndo,
  onPauseAndExit,
  onFinishRound,
  onEmptyExit,
  onStartTour,
  hasEvents = false,
  isPaused = false,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  onUndo: () => void;
  onPauseAndExit: () => void;
  onFinishRound: () => void;
  onEmptyExit: () => void;
  onStartTour: () => void;
  hasEvents?: boolean;
  isPaused?: boolean;
}) => {
  const [isExitDrawerOpen, setIsExitDrawerOpen] = useState(false);

  const handleExitButtonClick = () => {
    if (!hasEvents) {
      onEmptyExit();
      return;
    }
    setIsExitDrawerOpen(true);
  };

  return (
    <div
      id="tour-bottom-actions"
      className={cn('flex w-full gap-2 p-2', className)}
      {...props}
    >
      <button type="button" onClick={handleExitButtonClick}>
        <Circle className="text-foreground hover:bg-foreground/20 size-9 bg-transparent">
          <SignOutIcon />
        </Circle>
      </button>

      <InfoDrawer
        isOpen={isExitDrawerOpen}
        onOpenChange={setIsExitDrawerOpen}
        content={
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-lg font-medium">Партия не доиграна</p>
            <div className="mt-1 flex w-full flex-col gap-2">
              <Button
                variant="approve"
                className="w-full"
                onClick={() => {
                  setIsExitDrawerOpen(false);
                  onFinishRound();
                }}
              >
                Закончить партию
              </Button>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setIsExitDrawerOpen(false);
                  onPauseAndExit();
                }}
              >
                В меню
              </Button>
            </div>
          </div>
        }
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        className={cn(
          'transition-all duration-300',
          isPaused && 'pointer-events-none opacity-10 grayscale'
        )}
      >
        <ArrowArcLeftIcon /> {'Отмена действия'}
      </Button>

      <button
        type="button"
        aria-label="Обучение и правила режима"
        onClick={() => {
          triggerHaptic('light');
          onStartTour();
        }}
        className={cn(
          'transition-all duration-300',
          isPaused && 'pointer-events-none opacity-10 grayscale'
        )}
      >
        <Circle className="text-foreground hover:bg-foreground/20 size-9 bg-transparent">
          <QuestionMarkIcon />
        </Circle>
      </button>
    </div>
  );
};

export function GamePage({}: GamePageProps) {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const isLeavingRef = useRef(false);
  const isUndoingRef = useRef(false);

  const {
    p1,
    p2,
    mode: storeMode,
    lastCompletedRound,
    dismissRoundModal,
    startGame,
    tickTimer,
    addScore,
    removeScore,
    applyPenalty,
    endCurrentVisit,
    finishCurrentRound,
    endGame,
    undo,
    isPaused,
    togglePause,
    setPause,
    roundElapsedMs,
    pottedBalls,
    isActiveGame,
    currentRoundEvents,
  } = useGameStore();

  const seenGameModeTours = useSettingsStore(
    (state) => state.seenGameModeTours
  );
  const completeGameModeTour = useSettingsStore(
    (state) => state.completeGameModeTour
  );

  const [classicDrawerOpen, setClassicDrawerOpen] = useState(false);
  const [activePlayerForClassic, setActivePlayerForClassic] = useState<
    'p1' | 'p2'
  >('p1');
  const [penaltyTarget, setPenaltyTarget] = useState<'p1' | 'p2' | null>(null);
  const [recentlyPenalized, setRecentlyPenalized] = useState<
    'p1' | 'p2' | null
  >(null);
  const [p1Snake, setP1Snake] = useState({
    count: 0,
    type: 'green' as 'green' | 'red',
  });
  const [p2Snake, setP2Snake] = useState({
    count: 0,
    type: 'green' as 'green' | 'red',
  });
  const triggerSnake = (playerId: 'p1' | 'p2', type: 'green' | 'red') => {
    if (playerId === 'p1') {
      setP1Snake((prev) => ({ count: prev.count + 1, type }));
    } else {
      setP2Snake((prev) => ({ count: prev.count + 1, type }));
    }
  };

  const [isTimerDrawerOpen, setIsTimerDrawerOpen] = useState(false);

  const withPauseCheck = (action: () => void) => {
    if (isPaused) {
      setIsTimerDrawerOpen(true);
      return;
    }
    action();
  };

  useEffect(() => {
    if (isLeavingRef.current || lastCompletedRound) return;
    if (storeMode !== mode || !isActiveGame) {
      startGame((mode as GameMode) || 'free-pyramid', p1.name, p2.name);
    } else if (!isPaused) {
      setPause(false);
    }
  }, [mode]);

  useEffect(() => {
    const activeMode = (mode as GameMode) || storeMode || 'free-pyramid';
    if (seenGameModeTours?.[activeMode] || lastCompletedRound) return;

    const timer = setTimeout(() => {
      const driverInstance = startGameModeOnboardingTour(activeMode, () => {
        completeGameModeTour(activeMode);
      });
      return () => driverInstance.destroy();
    }, 450);

    return () => clearTimeout(timer);
  }, [
    mode,
    storeMode,
    seenGameModeTours,
    lastCompletedRound,
    completeGameModeTour,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setPause(true);
      }
    };
    const handleBeforeUnload = () => {
      setPause(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!isLeavingRef.current) {
        setPause(true);
      }
    };
  }, [setPause]);

  useEffect(() => {
    if (isPaused || !isActiveGame || lastCompletedRound) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 250);
    return () => clearInterval(interval);
  }, [isPaused, isActiveGame, lastCompletedRound, tickTimer]);

  const roundHours = Math.floor(roundElapsedMs / (1000 * 60 * 60));
  const roundMinutes = Math.floor(
    (roundElapsedMs % (1000 * 60 * 60)) / (1000 * 60)
  );
  const roundSeconds = Math.floor((roundElapsedMs % (1000 * 60)) / 1000);

  const isClassic = storeMode === 'classic-pyramid';
  const showNumberOnly = isClassic || storeMode === 'continuous-free-pyramid';

  const eventsList = currentRoundEvents ?? [];
  const p1ActiveStreak = getActivePlayerStreak(eventsList, 'p1');
  const p2ActiveStreak = getActivePlayerStreak(eventsList, 'p2');

  const checkSeventhBallWarning = (
    playerId: 'p1' | 'p2',
    nextScore: number
  ) => {
    const isStandard = [
      'free-pyramid',
      'combined-pyramid',
      'dynamic-pyramid',
    ].includes(storeMode);
    const playerName = playerId === 'p1' ? p1.name : p2.name;
    if (isStandard && nextScore === 7) {
      toast.info(`7 шаров у игрока ${playerName}`);
    }
  };

  const handleAddScore = (playerId: 'p1' | 'p2') => {
    if (isClassic) {
      setActivePlayerForClassic(playerId);
      setClassicDrawerOpen(true);
    } else {
      const currentScore = playerId === 'p1' ? p1.score : p2.score;
      checkSeventhBallWarning(playerId, currentScore + 1);
      addScore(playerId, 1);
      triggerSnake(playerId, 'green');
    }
    triggerHaptic('pot');
  };

  const handleRemoveScore = (playerId: 'p1' | 'p2') => {
    const currentScore = playerId === 'p1' ? p1.score : p2.score;
    if (currentScore > 0) {
      triggerSnake(playerId, 'red');
    }
    removeScore(playerId);
    triggerHaptic('undo');
  };

  const handleEndVisit = (playerId: 'p1' | 'p2') => {
    withPauseCheck(() => {
      endCurrentVisit(playerId);
      triggerHaptic('tab');
    });
  };

  const handlePenalty = (playerId: 'p1' | 'p2') => {
    setPenaltyTarget(playerId);
  };

  const handleConfirmPenalty = () => {
    if (!penaltyTarget) return;
    const target = penaltyTarget;
    const beneficiaryId = penaltyTarget === 'p1' ? 'p2' : 'p1';
    const currentScore = beneficiaryId === 'p1' ? p1.score : p2.score;
    checkSeventhBallWarning(beneficiaryId, currentScore + 1);
    applyPenalty(penaltyTarget);
    setPenaltyTarget(null);
    triggerHaptic('penalty');

    setRecentlyPenalized(target);
    setTimeout(() => setRecentlyPenalized(null), 1500);

    triggerSnake(beneficiaryId, 'green');
  };

  const handleSelectClassicBall = (num: number) => {
    let points = num === 1 ? 11 : num;
    if (pottedBalls.length === 14) {
      points += 10;
    }

    addScore(activePlayerForClassic, points, num);
    setClassicDrawerOpen(false);
    triggerHaptic('pot');
    triggerSnake(activePlayerForClassic, 'green');
  };

  const handleUndoCompletedMatch = () => {
    isUndoingRef.current = true;
    undo();
    triggerHaptic('undo');
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 100);
  };

  const handleCloseCompletedMatchDrawer = () => {
    if (isUndoingRef.current || useGameStore.getState().isActiveGame) {
      isUndoingRef.current = false;
      return;
    }
    isLeavingRef.current = true;
    dismissRoundModal();
    endGame();
    navigate('/', { replace: true });
  };

  const handlePauseAndExit = () => {
    isLeavingRef.current = true;
    setPause(true);
    navigate('/', { replace: true });
  };

  const handleEmptyExit = () => {
    isLeavingRef.current = true;
    endGame();
    navigate('/', { replace: true });
  };

  const handleReplayTour = () => {
    startGameModeOnboardingTour(storeMode, () => {
      completeGameModeTour(storeMode);
    });
  };

  const balls1to15 = Array.from({ length: 15 }, (_, i) => i + 1);
  const penalizedName = penaltyTarget === 'p1' ? p1.name : p2.name;
  const beneficiaryName = penaltyTarget === 'p1' ? p2.name : p1.name;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-125 flex-col gap-4 p-3">
      <style>{STREAK_ANIMATION_STYLES}</style>
      <HeaderDisplay
        mode={storeMode}
        isTimerDrawerOpen={isTimerDrawerOpen}
        setIsTimerDrawerOpen={setIsTimerDrawerOpen}
        roundHours={roundHours}
        roundMinutes={roundMinutes}
        roundSeconds={roundSeconds}
        isPaused={isPaused}
        onTogglePause={togglePause}
      />
      <UserGameBoard
        boardId="tour-player-board"
        nameRowId="tour-player-name-row"
        penaltyBtnId="tour-penalty-btn"
        name={p1.name}
        score={p1.score}
        activeStreak={p1ActiveStreak}
        isPaused={isPaused}
        onAdd={() => withPauseCheck(() => handleAddScore('p1'))}
        onRemove={() => withPauseCheck(() => handleRemoveScore('p1'))}
        isRecentlyPenalized={recentlyPenalized === 'p1'}
        snakeType={p1Snake.type}
        snakeCount={p1Snake.count}
        onPenalty={() => withPauseCheck(() => handlePenalty('p1'))}
        onEndVisit={() => handleEndVisit('p1')}
        showNumberOnly={showNumberOnly}
      />
      <UserGameBoard
        name={p2.name}
        score={p2.score}
        activeStreak={p2ActiveStreak}
        isPaused={isPaused}
        onAdd={() => withPauseCheck(() => handleAddScore('p2'))}
        onRemove={() => withPauseCheck(() => handleRemoveScore('p2'))}
        isRecentlyPenalized={recentlyPenalized === 'p2'}
        snakeType={p2Snake.type}
        snakeCount={p2Snake.count}
        onPenalty={() => withPauseCheck(() => handlePenalty('p2'))}
        onEndVisit={() => handleEndVisit('p2')}
        showNumberOnly={showNumberOnly}
      />
      <BottomActions
        onUndo={() => {
          withPauseCheck(undo);
          triggerHaptic('undo');
        }}
        onPauseAndExit={handlePauseAndExit}
        onFinishRound={() => finishCurrentRound()}
        onEmptyExit={handleEmptyExit}
        onStartTour={handleReplayTour}
        hasEvents={eventsList.length > 0}
        isPaused={isPaused}
      />

      <InfoDrawer
        isOpen={penaltyTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPenaltyTarget(null);
        }}
        content={
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-xl font-medium">Назначить штраф?</p>
            <p className="text-neutral-foreground/70 text-sm">
              {isClassic ? (
                <>
                  Со счета игрока <strong>{penalizedName}</strong> будет списано
                  5 очков, а игроку <strong>{beneficiaryName}</strong> будет
                  начислено 5 очков.
                </>
              ) : (
                <>
                  Игрок <strong>{penalizedName}</strong> нарушил правила. Игроку{' '}
                  <strong>{beneficiaryName}</strong> будет начислен 1 штрафной
                  шар.
                </>
              )}
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleConfirmPenalty}
              >
                Подтвердить штраф
              </Button>
            </div>
          </div>
        }
      />

      <InfoDrawer
        isOpen={classicDrawerOpen}
        onOpenChange={setClassicDrawerOpen}
        content={
          <div className="flex flex-col items-center py-2">
            <p className="mb-4 text-xl">Какой шар забит?</p>
            <div className="flex max-w-[280px] flex-wrap justify-center gap-4">
              {balls1to15.map((num) => {
                const isPotted = pottedBalls.includes(num);
                return (
                  <button
                    key={num}
                    disabled={isPotted}
                    onClick={() => handleSelectClassicBall(num)}
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full text-lg transition-all',
                      isPotted
                        ? 'bg-neutral text-neutral-foreground/30'
                        : 'bg-primary text-primary-foreground hover:scale-105'
                    )}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-center text-sm opacity-60">
              Шар №1 дает 11 очков.
              <br />
              Остальные шары по номиналу.
            </p>
          </div>
        }
      />

      <ShareSessionDrawer
        match={lastCompletedRound}
        isOpen={lastCompletedRound !== null}
        closeLabel="На главную"
        onUndo={
          lastCompletedRound?.finishReason === 'target-reached'
            ? handleUndoCompletedMatch
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            handleCloseCompletedMatchDrawer();
          }
        }}
      />
    </div>
  );
}

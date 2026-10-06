import { cn } from '@/shared/lib/utils/cn';
import { type HTMLAttributes, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  SignOutIcon,
  ArrowArcLeftIcon,
  QuestionMarkIcon,
} from '@phosphor-icons/react';
import { Circle } from '@/shared/Circle';
import { Button } from '@/shared/Button';
import { useSwipe } from '@/shared/hooks/useSwipe';
import { InfoDrawer } from '@/shared/InfoDrawer';
import SwipeTutorialCard from '@/shared/SwipeTutorialCard';
import { useGameStore, type GameMode } from '@/shared/store/gameStore';
import { Drawer } from 'vaul';

interface GamePageProps {}

const BALL_R = 25;

const Ball = ({ scored }: { scored: boolean }) => {
  return (
    <div
      style={{ height: BALL_R * 2, width: BALL_R * 2 }}
      className={cn(
        'rounded-full transition-colors',
        scored ? 'bg-piramid-ball-mid' : 'bg-piramid-ball-mid/30'
      )}
    ></div>
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
  let ballsData: { scored: boolean }[] = [];

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
  isTimerDrawerOpen = false,
  setIsTimerDrawerOpen,
  opponentWinnedRounds = 0,
  opponentName = 'Оппонент',
  yourWinnedRounds = 0,
  yourName = 'Вы',
  roundHours = 0,
  roundMinutes = 0,
  roundSeconds = 0,
  totalHours = 0,
  totalMinutes = 0,
  totalSeconds = 0,
  isPaused = false,
  onTogglePause,
}: {
  isTimerDrawerOpen: boolean;
  setIsTimerDrawerOpen: (isOpen: boolean) => void;

  opponentWinnedRounds?: number;
  opponentName?: string;
  yourWinnedRounds?: number;
  yourName?: string;
  roundHours?: number;
  roundMinutes?: number;
  roundSeconds?: number;
  totalHours?: number;
  totalMinutes?: number;
  totalSeconds?: number;
  isPaused?: boolean;
  onTogglePause?: () => void;
} & HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="bg-background/80 text-foreground flex items-center justify-between rounded-xl px-5 py-2 backdrop-blur-lg">
      <div className="flex flex-col items-center text-[1rem]">
        <span className="text-[1.2em]">{yourWinnedRounds}</span>
        <span className="text-[0.7em]">{yourName}</span>
      </div>

      <InfoDrawer
        isOpen={isTimerDrawerOpen}
        onOpenChange={setIsTimerDrawerOpen}
        trigger={
          isPaused ? (
            <Button
              variant="ghost"
              className="text-destructive text-[0.9rem] hover:bg-transparent"
            >
              Игра приостановлена
            </Button>
          ) : (
            <button className="flex h-full flex-col items-center justify-center gap-1 text-[0.9rem] opacity-80 hover:opacity-100">
              <p className={cn(isPaused && 'text-destructive')}>
                {roundHours > 0 ? (
                  <>
                    <span>{roundHours}</span>
                    <span className="text-[0.7em]"> ч. </span>
                    <span>{roundMinutes}</span>
                    <span className="text-[0.7em]"> мин. </span>
                  </>
                ) : (
                  <>
                    <span>{roundMinutes}</span>
                    <span className="text-[0.7em]"> мин. </span>
                    <span>{roundSeconds}</span>
                    <span className="text-[0.7em]"> сек. </span>
                  </>
                )}
              </p>
            </button>
          )
        }
        content={
          <div className="flex flex-col items-center gap-2 py-4">
            {isPaused ? (
              <p>
                Игра была приостановлена, вы можете ее продолжить нажав на
                кнопку ниже
              </p>
            ) : (
              <p>
                Общее время: {totalHours > 0 && `${totalHours} ч. `}
                {totalMinutes} мин. {totalHours === 0 && `${totalSeconds} сек.`}
              </p>
            )}
            <Drawer.Close asChild>
              <Button
                variant={isPaused ? 'approve' : 'primary'}
                onClick={onTogglePause}
                className="mt-4"
              >
                {isPaused ? 'Возобновить игру' : 'Поставить на паузу'}
              </Button>
            </Drawer.Close>
          </div>
        }
      />

      <div className="flex flex-col items-center text-[1rem]">
        <span className="text-[1.2em]">{opponentWinnedRounds}</span>
        <span className="text-[0.7em]">{opponentName}</span>
      </div>
    </div>
  );
};

const UserGameBoard = ({
  name,
  score = 0,
  onAdd,
  onRemove,
  onPenalty,
  showNumberOnly = false,
}: {
  name?: string;
  score?: number;
  onAdd: () => void;
  onRemove: () => void;
  onPenalty?: () => void;
  showNumberOnly?: boolean;
} & HTMLAttributes<HTMLDivElement>) => {
  let firstShelfScore = 0;
  let secondShelfScore = 0;

  if (score <= 4) {
    firstShelfScore = score;
    secondShelfScore = 0;
  } else if (score > 4) {
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

  return (
    <div
      {...handlers}
      className="bg-background/80 text-foreground relative flex flex-1 touch-none flex-col overflow-hidden rounded-xl p-4 backdrop-blur-lg select-none"
    >
      <div
        className="from-approve/23 pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent transition-opacity duration-75"
        style={{ opacity: pullUpProgress }}
      />
      <div
        className="from-destructive/23 pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent transition-opacity duration-75"
        style={{ opacity: pullDownProgress }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center">
        <div className="flex w-full justify-between">
          <span>{name}</span>
          <Button
            onClick={onPenalty}
            variant="destructive"
            size="sm"
            className="w-fit"
          >
            Штраф
          </Button>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2">
          <Button
            variant="ghostApprove"
            className="text-foreground/20 mx-auto hidden w-fit lg:flex pointer-fine:flex"
            onClick={onAdd}
          >
            +1
          </Button>

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
  onExitConfirm,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  onUndo: () => void;
  onExitConfirm: () => void;
}) => {
  const [isExitDrawerOpen, setIsExitDrawerOpen] = useState(false);

  return (
    <div className={cn('flex w-full gap-2 p-2', className)} {...props}>
      <button onClick={() => setIsExitDrawerOpen(true)}>
        <Circle className="text-foreground hover:bg-foreground/20 size-9 bg-transparent">
          <SignOutIcon />
        </Circle>
      </button>

      <InfoDrawer
        isOpen={isExitDrawerOpen}
        onOpenChange={setIsExitDrawerOpen}
        closeBtn={
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setIsExitDrawerOpen(false)}
          >
            Отмена
          </Button>
        }
        content={
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-xl font-medium">Покинуть игру?</p>
            <p className="text-neutral-foreground/70 text-sm">
              Ваш прогресс сохранен. Вы сможете вернуться в эту партию с главной
              страницы.
            </p>
            <div className="mt-4 flex w-full flex-col gap-2">
              <Link to="/" onClick={onExitConfirm} className="w-full">
                <Button variant="destructive" className="w-full">
                  Да, выйти на главную
                </Button>
              </Link>
            </div>
          </div>
        }
      />

      <Button variant="ghost" size="sm" onClick={onUndo}>
        <ArrowArcLeftIcon /> {'Отмена действия'}
      </Button>

      <InfoDrawer
        content={
          <div>
            <p>
              <strong>В самом верху</strong> находится{' '}
              <strong className="text-reader-accent-foreground">
                общий счет
              </strong>{' '}
              сыгранных партий между вами. Там же видно сколько времени идет эта
              партия.
              <br />
              <br />
              <strong>Далее полки игроков:</strong>
              <br />
              Когда кто-то забил,{' '}
              <strong className="text-reader-accent-foreground">
                свайпните
              </strong>{' '}
              по его полке чтобы начислить ему очко!
              <br />
              <strong className="text-destructive">
                Ошиблись?
              </strong> Нестрашно,{' '}
              <strong className="text-reader-accent-foreground">
                свайпните вниз или нажмите "Отмена действия"
              </strong>{' '}
              в самом низу экрана.
            </p>
            <br />
            <SwipeTutorialCard />
            Кнопка <strong className="text-destructive">"штраф"</strong>{' '}
            накладывает штраф, ну тут все понятно. Отменить его также можно
            кнопкой{' '}
            <strong className="text-reader-accent-foreground">
              отмены действия
            </strong>
            .
          </div>
        }
        trigger={
          <button>
            <Circle className="text-foreground hover:bg-foreground/20 size-9 bg-transparent">
              <QuestionMarkIcon />
            </Circle>
          </button>
        }
      />
    </div>
  );
};

export function GamePage({}: GamePageProps) {
  const { mode } = useParams<{ mode: string }>();
  const {
    p1,
    p2,
    mode: storeMode,
    startGame,
    addScore,
    removeScore,
    applyPenalty,
    undo,
    isPaused,
    togglePause,
    setPause,
    startTime,
    totalPausedTime,
    pottedBalls,
    isActiveGame,
    previousRoundsTime,
  } = useGameStore();

  const [totalElapsed, setTotalElapsed] = useState(0);
  const [roundElapsed, setRoundElapsed] = useState(0);
  const [classicDrawerOpen, setClassicDrawerOpen] = useState(false);
  const [activePlayerForClassic, setActivePlayerForClassic] = useState<
    'p1' | 'p2'
  >('p1');
  const [isTimerDrawerOpen, setIsTimerDrawerOpen] = useState(false);

  const withPauseCheck = (action: () => void) => {
    if (isPaused) {
      setIsTimerDrawerOpen(true);
      return;
    }
    action();
  };

  useEffect(() => {
    if (storeMode !== mode || !isActiveGame) {
      startGame((mode as GameMode) || 'free-pyramid', p1.name, p2.name);
    }
  }, [mode, storeMode, isActiveGame]);

  useEffect(() => {
    const handleBeforeUnload = () => setPause(true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [setPause]);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      if (!isPaused) {
        // Считаем общее время матча
        const currentTotal = Date.now() - startTime - totalPausedTime;
        setTotalElapsed(currentTotal);

        // Считаем время текущей партии (общее минус время старых партий)
        setRoundElapsed(Math.max(0, currentTotal - previousRoundsTime));
      }
    }, 200);
    return () => clearInterval(interval);
  }, [startTime, totalPausedTime, previousRoundsTime, isPaused]);

  // Вычисляем время для партии
  const roundHours = Math.floor(roundElapsed / (1000 * 60 * 60));
  const roundMinutes = Math.floor(
    (roundElapsed % (1000 * 60 * 60)) / (1000 * 60)
  );
  const roundSeconds = Math.floor((roundElapsed % (1000 * 60)) / 1000);

  // Вычисляем время для всего матча
  const totalHours = Math.floor(totalElapsed / (1000 * 60 * 60));
  const totalMinutes = Math.floor(
    (totalElapsed % (1000 * 60 * 60)) / (1000 * 60)
  );
  const totalSeconds = Math.floor((totalElapsed % (1000 * 60)) / 1000);

  const isClassic = storeMode === 'classic-pyramid';
  const showNumberOnly = isClassic || storeMode === 'continuous-free-pyramid';

  const handleAddScore = (playerId: 'p1' | 'p2') => {
    if (isClassic) {
      setActivePlayerForClassic(playerId);
      setClassicDrawerOpen(true);
    } else {
      addScore(playerId, 1);
    }
  };

  const handlePenalty = (playerId: 'p1' | 'p2') => {
    if (isClassic) {
      const opponentId = playerId === 'p1' ? 'p2' : 'p1';
      setActivePlayerForClassic(opponentId);
      setClassicDrawerOpen(true);
    } else {
      applyPenalty(playerId);
    }
  };

  const handleSelectClassicBall = (num: number) => {
    let points = num === 1 ? 11 : num;
    if (pottedBalls.length === 14) {
      points += 10;
    }

    addScore(activePlayerForClassic, points, num);
    setClassicDrawerOpen(false);
  };

  const balls1to15 = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-125 flex-col gap-4 p-3">
      <HeaderDisplay
        isTimerDrawerOpen={isTimerDrawerOpen}
        setIsTimerDrawerOpen={setIsTimerDrawerOpen}
        yourWinnedRounds={p1.roundsWon}
        yourName={p1.name}
        opponentWinnedRounds={p2.roundsWon}
        opponentName={p2.name}
        roundHours={roundHours}
        roundMinutes={roundMinutes}
        roundSeconds={roundSeconds}
        totalHours={totalHours}
        totalMinutes={totalMinutes}
        totalSeconds={totalSeconds}
        isPaused={isPaused}
        onTogglePause={togglePause}
      />
      <UserGameBoard
        name={p1.name}
        score={p1.score}
        onAdd={() => withPauseCheck(() => handleAddScore('p1'))}
        onRemove={() => withPauseCheck(() => !isClassic && removeScore('p1'))}
        onPenalty={() => withPauseCheck(() => handlePenalty('p1'))}
        showNumberOnly={showNumberOnly}
      />
      <UserGameBoard
        name={p2.name}
        score={p2.score}
        onAdd={() => withPauseCheck(() => handleAddScore('p2'))}
        onRemove={() => withPauseCheck(() => !isClassic && removeScore('p2'))}
        onPenalty={() => withPauseCheck(() => handlePenalty('p2'))}
        showNumberOnly={showNumberOnly}
      />
      <BottomActions
        onUndo={() => withPauseCheck(undo)}
        onExitConfirm={() => setPause(true)}
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
    </div>
  );
}

import { cn } from '@/shared/lib/utils/cn';
import {  type HTMLAttributes } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  SignOutIcon,
  ArrowArcLeftIcon,
  QuestionMarkIcon,
  ClockCountdownIcon,
} from '@phosphor-icons/react';
import { Circle } from '@/shared/Circle';
import { Button } from '@/shared/Button';
import { useSwipe } from '@/shared/hooks/useSwipe';
import { InfoDrawer } from '@/shared/InfoDrawer';
import SwipeTutorialCard from '@/shared/SwipeTutorialCard';

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

  for (let i = 0; i < ScoredBallsCount; i++) {
    ballsData.push({ scored: true });
  }

  for (let i = 0; i < ballsLeft; i++) {
    ballsData.push({ scored: false });
  }

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
  opponentWinnedRounds = 0,
  opponentName = 'Оппонент',
  yourWinnedRounds = 0,
  yourName = 'Вы',
}: {
  opponentWinnedRounds?: number;
  opponentName?: string;
  yourWinnedRounds?: number;
  yourName?: string;
} & HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="bg-background/80 text-foreground flex justify-between rounded-xl px-5 py-2 backdrop-blur-lg">
      <div className="flex flex-col items-center text-[1rem]">
        <span className="text-[1.2em]">{yourWinnedRounds}</span>
        <span className="text-[0.7em]">{yourName}</span>
      </div>

      <div className="flex h-full flex-col items-center justify-center gap-1 text-[0.9rem]">
        <ClockCountdownIcon className="text-[0.9em]" />
        <p>
          <span>1</span>
          <span className="text-[0.7em]"> ч. </span>
          <span>20</span>
          <span className="text-[0.7em]"> мин. </span>
        </p>
      </div>
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
}: {
  name?: string;
  score?: number;
  onAdd: () => void;
  onRemove: () => void;
  onPenalty?: () => void;
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

  // Вытаскиваем offset и handlers
  const { handlers, swipeOffset, threshold } = useSwipe({
    onSwipeUp: onAdd,
    onSwipeDown: onRemove,
    threshold: 60, // Чуть увеличим порог, чтобы юзер успел увидеть красивую тень
  });

  // Высчитываем прогресс натяжения от 0 до 1 (для opacity)
  const pullUpProgress = Math.max(0, Math.min(swipeOffset / threshold, 1));
  const pullDownProgress = Math.max(0, Math.min(-swipeOffset / threshold, 1));

  return (
    <div
      {...handlers}
      className="bg-background/80 text-foreground relative flex flex-1 touch-none flex-col overflow-hidden rounded-xl p-4 backdrop-blur-lg select-none"
    >
      <div
        className="from-approve/10 pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent transition-opacity duration-75"
        style={{ opacity: pullUpProgress }}
      />

      {/* 2. Эффект натяжения (ВНИЗ -> Красная тень СНИЗУ) */}
      <div
        className="from-destructive/15 pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent transition-opacity duration-75"
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
          <Shelf className="mb-4" ScoredBallsCount={firstShelfScore} />
          <Shelf ScoredBallsCount={secondShelfScore} />
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
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('flex w-full gap-2 p-2', className)} {...props}>
      <Link to={'/'} onClick={() => console.log('Выход')}>
        <Circle className="text-foreground hover:bg-foreground/20 size-9 bg-transparent">
          <SignOutIcon />
        </Circle>
      </Link>

      <Button variant="ghost" size="sm">
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
  console.log({mode})
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-125 flex-col gap-4 p-3">
      <HeaderDisplay />
      <UserGameBoard
        onAdd={() => console.log('add 1')}
        onRemove={() => console.log('remove 1')}
        name="Вы"
      />
      <UserGameBoard
        onAdd={() => console.log('add 2')}
        onRemove={() => console.log('remove 2')}
        name="Василий"
      />
      <BottomActions />
    </div>
  );
}

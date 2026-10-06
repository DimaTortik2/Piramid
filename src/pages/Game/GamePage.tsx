import { cn } from '@/shared/lib/utils/cn';
import type { HTMLAttributes } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  SignOutIcon,
  ArrowArcLeftIcon,
  QuestionMarkIcon,
  ClockCountdownIcon,
} from '@phosphor-icons/react';
import { Circle } from '@/shared/Circle';
import { Button } from '@/shared/Button';

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
  opponentScore = 0,
  opponentName = 'Оппонент',
  yourScore = 0,
  yourName = 'Вы',
}: {
  opponentScore?: number;
  opponentName?: string;
  yourScore?: number;
  yourName?: string;
} & HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="bg-background/80 text-foreground flex justify-between rounded-xl px-5 py-2 backdrop-blur-lg">
      <div className="flex flex-col items-center text-[1rem]">
        <span className="text-[1.2em]">{yourScore}</span>
        <span className="text-[0.7em]">{yourName}</span>
      </div>

      <div className="flex items-center gap-1 text-[0.9rem]">
        <ClockCountdownIcon className="text-[0.9em]" />
        <p>
          <span>1</span>
          <span className="text-[0.7em]"> ч. </span>
          <span>20</span>
          <span className="text-[0.7em]"> мин. </span>
          <span>39</span>
          <span className="text-[0.7em]"> сек. </span>
        </p>
      </div>
      <div className="flex flex-col items-center text-[1rem]">
        <span className="text-[1.2em]">{opponentScore}</span>
        <span className="text-[0.7em]">{opponentName}</span>
      </div>
    </div>
  );
};

const UserGameBoard = ({
  name,
  score = 0,
}: {
  name?: string;
  score?: number;
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

  return (
    <div className="bg-background/80 text-foreground border-billiard-border flex flex-1 flex-col rounded-xl border-10 border-solid p-4 backdrop-blur-lg">
      <div className="flex w-full justify-between">
        <span>{name}</span>
        <Button variant="destructive" size="sm" className="w-fit">
          Штраф
        </Button>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2">
        <Button variant="ghostApprove" className="text-foreground/20">
          +1
        </Button>
        <Shelf className="mb-4" ScoredBallsCount={firstShelfScore} />
        <Shelf ScoredBallsCount={secondShelfScore} />
        <Button variant="ghostDestructive" className="text-foreground/20">
          -1
        </Button>
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
        <Circle className="size-9">
          <SignOutIcon />
        </Circle>
      </Link>

      <Button size="sm">
        <ArrowArcLeftIcon /> {'Отмена действия'}
      </Button>
      <Circle className="size-9">
        <QuestionMarkIcon />
      </Circle>
    </div>
  );
};

export function GamePage({}: GamePageProps) {
  const { mode } = useParams<{ mode: string }>();

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-125 flex-col gap-4 p-3">
      <HeaderDisplay />
      <UserGameBoard name="Вы" />
      <UserGameBoard name="Василий" />
      <BottomActions />
    </div>
  );
}

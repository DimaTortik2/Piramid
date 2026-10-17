import { Button } from '@/shared/Button';
import type { useZenMode } from '@/shared/hooks/useZenMode';
import { InfoDrawer, type InfoDrawerProps } from '@/shared/InfoDrawer';
import { getTelegramUserName } from '@/shared/lib/telegram';
import { cn } from '@/shared/lib/utils/cn';
import { useGameStore } from '@/shared/store/gameStore';
import { useSettingsStore } from '@/shared/store/useSettingsStore';
import {
  CirclesThreePlusIcon,
  CrownIcon,
  CrosshairIcon,
  InfinityIcon,
  LightningIcon,
  QuestionIcon,
  TargetIcon,
  UsersIcon,
  type Icon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

interface ChooseGameDrawerProps extends Omit<InfoDrawerProps, 'content'> {}

const GAME_DATA: {
  id: number;
  title: string;
  desc: string;
  lectureHref: string;
  icon: Icon;
  piramidName:
    | 'free-pyramid'
    | 'combined-pyramid'
    | 'dynamic-pyramid'
    | 'classic-pyramid'
    | 'continuous-free-pyramid';
}[] = [
  {
    id: 1,
    title: 'Свободная пирамида (Американка)',
    desc: 'Любой шар биток, любой прицельный',
    piramidName: 'free-pyramid',
    lectureHref: '/lectures/first',
    icon: CirclesThreePlusIcon,
  },
  {
    id: 2,
    title: 'Комбинированная пирамида (Московка)',
    desc: 'Биток один (цветной). Забил биток - снимаешь любой шар, биток возвращаешь в дом',
    piramidName: 'combined-pyramid',
    lectureHref: '/lectures/first',
    icon: TargetIcon,
  },
  {
    id: 3,
    title: 'Динамичная пирамида (Невская)',
    desc: 'То же самое, что Комбинированная, но после забитого битка играешь с руки с любого места',
    piramidName: 'dynamic-pyramid',
    lectureHref: '/lectures/first',
    icon: LightningIcon,
  },
  {
    id: 4,
    title: 'Русская пирамида (Классическая 71 очко)',
    desc: 'Шар номер 1 = 11 очков. Остальные = по номиналу. Последний шар на столе = +10 очков. Игра идет до 71 очка',
    piramidName: 'classic-pyramid',
    lectureHref: '/lectures/first',
    icon: CrownIcon,
  },
  {
    id: 5,
    title: 'Свободная с продолжением',
    desc: 'Играют не до 8 шаров, а до лимита (например, до 50 или 100 забитых), пирамида постоянно переставляется',
    piramidName: 'continuous-free-pyramid',
    lectureHref: '/lectures/first',
    icon: InfinityIcon,
  },
];

const SELECTED_PIRAMID_DEFAULT_ID = 1;

export function ChooseGameDrawer({ ...props }: ChooseGameDrawerProps) {
  const [selectedPiramidId, setSelectedPiramidId] = useState<number>(
    SELECTED_PIRAMID_DEFAULT_ID
  );

  const [p1Name, setP1Name] = useState(() => getTelegramUserName() || 'Вы');
  const [p2Name, setP2Name] = useState('Оппонент');
  const [initialBreaker, setInitialBreaker] = useState<'p1' | 'p2'>('p1');

  const startGame = useGameStore((state) => state.startGame);

  const isGameZenMode = useSettingsStore((state) => state.isGameZenMode);
  const { enableZenMode } = useOutletContext<ReturnType<typeof useZenMode>>();

  const selectedPiramid =
    GAME_DATA.find((el) => el.id === selectedPiramidId) || GAME_DATA[0];

  const handleStartGame = () => {
    startGame(selectedPiramid.piramidName, p1Name, p2Name, initialBreaker);
    if (isGameZenMode) {
      enableZenMode();
    }
  };

  return (
    <InfoDrawer
      onOpenChange={(open) => {
        if (!open) {
          setSelectedPiramidId(SELECTED_PIRAMID_DEFAULT_ID);
        }
      }}
      content={
        <div className="flex flex-col gap-2">
          <p className="mb-2 text-xl">Выберите пирамиду</p>
          {GAME_DATA.map((d) => {
            const IconComponent = d.icon;
            const isSelected = selectedPiramidId === d.id;

            return (
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-neutral text-neutral-foreground hover:bg-primary/60 hover:text-primary-foreground hover:translate-y-[-2px]'
                )}
                onClick={() =>
                  setSelectedPiramidId((prev) => (prev === d.id ? prev : d.id))
                }
                key={d.id}
              >
                <div className="flex items-center gap-3 text-left">
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center transition-all',
                      isSelected
                        ? 'text-primary-foreground'
                        : ' text-neutral-foreground/70'
                    )}
                  >
                    <IconComponent size={22} weight="fill" />
                  </div>
                  <div>
                    <p className="text-left text-base font-medium leading-snug">
                      {d.title}
                    </p>
                    <p className="mt-0.5 text-left text-xs opacity-60">
                      {d.desc}
                    </p>
                  </div>
                </div>
                <Link
                  to={d.lectureHref}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 p-1 opacity-60 transition-opacity hover:opacity-100"
                >
                  <QuestionIcon className="size-6" weight="bold" />
                </Link>
              </button>
            );
          })}

          <div className="mt-2 flex flex-col gap-2">
            <div className="mt-2 flex items-center gap-2">
              <UsersIcon size={20} weight="fill" className="opacity-70" />
              <p className="text-xl">Игроки</p>
            </div>
            <input
              className="bg-neutral text-neutral-foreground w-full rounded-2xl px-3 py-3 outline-none"
              value={p1Name}
              onChange={(e) => setP1Name(e.target.value)}
              placeholder="Ваше имя"
            />
            <input
              className="bg-neutral text-neutral-foreground w-full rounded-2xl px-3 py-3 outline-none"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              placeholder="Имя оппонента"
            />
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 opacity-70">
              <CrosshairIcon size={16} weight="bold" />
              <p className="text-sm">Кто разбивает первую партию?</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInitialBreaker('p1')}
                className={cn(
                  'flex-1 rounded-2xl py-2.5 text-sm font-medium transition-all',
                  initialBreaker === 'p1'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-neutral text-neutral-foreground opacity-70'
                )}
              >
                {p1Name || 'Вы'}
              </button>
              <button
                type="button"
                onClick={() => setInitialBreaker('p2')}
                className={cn(
                  'flex-1 rounded-2xl py-2.5 text-sm font-medium transition-all',
                  initialBreaker === 'p2'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-neutral text-neutral-foreground opacity-70'
                )}
              >
                {p2Name || 'Оппонент'}
              </button>
            </div>
          </div>
        </div>
      }
      {...props}
      closeBtn={
        <Link to={'/game/' + selectedPiramid.piramidName}>
          <Button onClick={handleStartGame}>Разбить пирамиду!</Button>
        </Link>
      }
    />
  );
}
import { Button } from '@/shared/Button';
import { InfoDrawer, type InfoDrawerProps } from '@/shared/InfoDrawer';
import { cn } from '@/shared/lib/utils/cn';
import { QuestionIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ChooseGameDrawerProps extends Omit<InfoDrawerProps, 'content'> {}

const GAME_DATA: {
  id: number;
  title: string;
  desc: string;
  lectureHref: string;
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
  },
  {
    id: 2,
    title: 'Комбинированная пирамида (Московка)',
    desc: 'Биток один (цветной). Забил биток - снимаешь любой шар, биток возвращаешь в дом',
    piramidName: 'combined-pyramid',
    lectureHref: '/lectures/first',
  },
  {
    id: 3,
    title: 'Динамичная пирамида (Невская)',
    desc: 'То же самое, что Комбинированная, но после забитого битка играешь с руки с любого места',
    piramidName: 'dynamic-pyramid',
    lectureHref: '/lectures/first',
  },
  {
    id: 4,
    title: 'Русская пирамида (Классическая 71 очко)',
    desc: 'Шар номер 1 = 11 очков. Остальные = по номиналу. Последний шар на столе = +10 очков. Игра идет до 71 очка',
    piramidName: 'classic-pyramid',
    lectureHref: '/lectures/first',
  },
  {
    id: 5,
    title: 'Свободная с продолжением',
    desc: 'Играют не до 8 шаров, а до лимита (например, до 50 или 100 забитых), пирамида постоянно переставляется',
    piramidName: 'continuous-free-pyramid',
    lectureHref: '/lectures/first',
  },
];

const SELECTED_PIRAMID_DEFAULT_ID = 1;

export function ChooseGameDrawer({ ...props }: ChooseGameDrawerProps) {
  const [selectedPiramidId, setSelectedPiramidId] = useState<number>(
    SELECTED_PIRAMID_DEFAULT_ID
  );
  const selectedPiramid =
    GAME_DATA.find((el) => el.id === selectedPiramidId) || GAME_DATA[0];

  console.log(selectedPiramid);

  const handleStartGame = () => {
    console.log('Начали');
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
          {GAME_DATA.map((d) => (
            <button
              className={cn(
                'flex w-full justify-between rounded-2xl px-3 py-2 transition-all',
                selectedPiramidId === d.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-neutral text-neutral-foreground hover:bg-primary/60 hover:text-primary-foreground hover:translate-y-[-2px]'
              )}
              onClick={() =>
                setSelectedPiramidId((prev) => (prev === d.id ? prev : d.id))
              }
              key={d.id}
            >
              <div>
                <p className="text-left text-lg">{d.title}</p>
                <p className="text-left text-sm opacity-60">{d.desc}</p>
              </div>
              <Link to={d.lectureHref}>
                <QuestionIcon className="size-8" />
              </Link>
            </button>
          ))}
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

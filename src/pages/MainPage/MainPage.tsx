import { FAQS } from '@/app/data/faqs';
import { WelcomeBanner } from '@/pages/MainPage/ui/WelcomeBanner';
import { ActionCard } from '@/shared/ActionCard';
import { Button } from '@/shared/Button';
import { ChooseGameDrawer } from '@/shared/ChooseGameDrawer';
import { Circle } from '@/shared/Circle';
import { Faq } from '@/shared/Faq';
import type { useZenMode } from '@/shared/hooks/useZenMode';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { useGameStore } from '@/shared/store/gameStore';
import { useSettingsStore } from '@/shared/store/useSettingsStore';
import { QuestionMarkIcon, TrashIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

interface MainPageProps {}

interface IActionCardData {
  title: string;
  desc?: ReactNode;
  actions?: ReactNode;
  headerAddon?: ReactNode;
}

const ACTION_CARDS_DATA: IActionCardData[] = [
  {
    title: 'Дисплей для матча',
    desc: <>Вы можете сыграть с другом, а мы будем вам помогать</>,
    actions: <ChooseGameDrawer trigger={<Button>Новая игра</Button>} />,
    headerAddon: (
      <InfoDrawer
        content={
          <>
            Это как бы режим игры. Вы можете{' '}
            <strong className="text-reader-accent-foreground">
              отслеживать в нем статистику
            </strong>{' '}
            ваших текущих партий. <br />
            <strong className="text-reader-accent-foreground">
              Просто помечайте забитые шары и штрафы.
            </strong>{' '}
            <br />В конце игры вы сможете рассмотреть статистику по партиям и{' '}
            <strong className="text-reader-accent-foreground">
              поделиться резуьтатом
            </strong>{' '}
            в соц сетях
          </>
        }
        trigger={
          <button>
            <Circle>
              <QuestionMarkIcon />
            </Circle>
          </button>
        }
      />
    ),
  },
  {
    title: 'История матчей',
    desc: <>Статистика по матчам, когда вы использовали дисплей для матча</>,
    actions: (
      <Button onClick={() => toast.warning('Добавим "смотреть" позже')}>
        Смотреть
      </Button>
    ),
    headerAddon: (
      <button onClick={() => toast.info('Вы играли столько матчей')}>
        <Circle>5</Circle>
      </button>
    ),
  },
  {
    title: 'Настройки',
    desc: <>Вы можете настроить что-то под себя</>,
    actions: (
      <Link className="w-full" to={'/settings'}>
        <Button>Открыть настройки</Button>
      </Link>
    ),
  },
  {
    title: 'Созерцать',
    desc: <>Просто дайте посмотреть на задний фон</>,
    actions: (
      <Link className="w-full" to={'/spectator'}>
        <Button>Смотреть</Button>
      </Link>
    ),
  },
];

export function MainPage({}: MainPageProps) {
  const { isActiveGame, mode, endGame } = useGameStore();
  const isGameZenMode = useSettingsStore((state) => state.isGameZenMode);
  const { enableZenMode } = useOutletContext<ReturnType<typeof useZenMode>>();

  const handleGameStart = () => {
    if (isGameZenMode) {
      enableZenMode();
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-125 flex-col justify-end gap-4 px-1 py-3">
      <WelcomeBanner pyramidClassName="w-[17.5rem]" />
      {isActiveGame && (
        <ActionCard
          title="Текущая партия"
          desc={<p>Вы не закончили матч.</p>}
          actions={
            <Link className="w-full" to={`/game/${mode}`}>
              <Button
                onClick={handleGameStart}
                className="flex w-full items-center justify-center gap-2"
              >
                Вернуться в игру
              </Button>
            </Link>
          }
          headerAddon={
            <button
              onClick={() => {
                endGame();
                toast.success('Партия удалена');
              }}
              className="text-destructive transition-opacity hover:opacity-70"
            >
              <TrashIcon className="size-6" />
            </button>
          }
        />
      )}
      {ACTION_CARDS_DATA.slice(0, 2).map((d) => (
        <ActionCard key={d.title} {...d} />
      ))}

      <div className="bg-foreground/20 mx-auto h-2 w-[90%] max-w-[5rem] rounded-full" />

      {FAQS.map((faq) => (
        <Faq key={faq.question} answer={faq.answer}>
          {faq.question}
        </Faq>
      ))}
      <div className="bg-foreground/20 mx-auto h-2 w-[90%] max-w-[5rem] rounded-full" />
      {ACTION_CARDS_DATA.slice(2).map((d) => (
        <ActionCard key={d.title} {...d} />
      ))}
    </div>
  );
}

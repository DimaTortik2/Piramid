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
import { type ReactNode, useState } from 'react';
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
              поделиться результатом
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
      <Link className="w-full" to="/history">
        <Button>Смотреть</Button>
      </Link>
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
  const { isActiveGame, mode, endGame, finishSession, savedSessions } =
    useGameStore();
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);

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
              onClick={() => setIsDeleteDrawerOpen(true)}
              className="text-destructive transition-opacity hover:opacity-70"
            >
              <TrashIcon className="size-6" />
            </button>
          }
        />
      )}
      {ACTION_CARDS_DATA.slice(0, 2).map((d) => (
        <ActionCard
          key={d.title}
          {...d}
          headerAddon={
            d.title === 'История матчей' ? (
              <Link to="/history">
                <Circle>{savedSessions?.length ?? 0}</Circle>
              </Link>
            ) : (
              d.headerAddon
            )
          }
        />
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

      <InfoDrawer
        isOpen={isDeleteDrawerOpen}
        onOpenChange={setIsDeleteDrawerOpen}
        closeBtn={
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setIsDeleteDrawerOpen(false)}
          >
            Отмена
          </Button>
        }
        content={
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-xl font-medium">Завершить или удалить матч?</p>
            <p className="text-neutral-foreground/70 text-sm">
              Вы можете завершить текущую сессию с сохранением статистики в
              историю или полностью удалить её.
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button
                variant="approve"
                className="w-full"
                onClick={() => {
                  finishSession();
                  setIsDeleteDrawerOpen(false);
                  toast.success('Сессия сохранена в историю');
                }}
              >
                Завершить и сохранить в историю
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  endGame();
                  setIsDeleteDrawerOpen(false);
                  toast.success('Партия удалена');
                }}
              >
                Удалить без сохранения
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
}
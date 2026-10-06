import { FAQS } from '@/app/data/faqs';
import { WelcomeBanner } from '@/pages/MainPage/ui/WelcomeBanner';
import { ActionCard } from '@/shared/ActionCard';
import { Button } from '@/shared/Button';
import { ChooseGameDrawer } from '@/shared/ChooseGameDrawer';
import { Circle } from '@/shared/Circle';
import { Faq } from '@/shared/Faq';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { QuestionMarkIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
    title: 'Дисплей для матча',
    desc: <>Вы можете сыграть с другом, а мы будем вам помогать</>,
    actions: (
      <ChooseGameDrawer
        trigger={
          <Button
          >
            Играть
          </Button>
        }
      />
    ),
    headerAddon: (
      <InfoDrawer
        content={
          <>
            quia ea quasi iusto vitae fugit eveniet debitis voluptates vero
            quod.
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
    title: 'Настройки',
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
  return (
    <div className="mx-auto flex min-h-full w-full max-w-125 flex-col justify-end gap-4 px-1 py-3">
      <WelcomeBanner pyramidClassName="w-[17.5rem]" />

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

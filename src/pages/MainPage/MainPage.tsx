import { WelcomeBanner } from '@/pages/MainPage/ui/WelcomeBanner';
import { ActionCard } from '@/shared/ActionCard';
import { Button } from '@/shared/Button';
import { Circle } from '@/shared/Circle';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { QuestionMarkIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface MainPageProps {}

export function MainPage({}: MainPageProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-125 flex-col justify-end gap-4 px-1 py-3">
      <WelcomeBanner pyramidClassName="w-[17.5rem]" />
      <ActionCard
        title={<>История матчей</>}
        desc={
          <>Статистика по матчам, когда вы использовали дисплей для матча</>
        }
        actions={
          <Button onClick={() => toast.warning('Добавим "смотреть" позже')}>
            Смотреть
          </Button>
        }
        headerAddon={
          <button onClick={() => toast.info('Вы играли столько матчей')}>
            <Circle>5</Circle>
          </button>
        }
      />
      <ActionCard
        title={<>Дисплей для матча</>}
        desc={<>Вы можете сыграть с другом, а мы будем вам помогать</>}
        actions={
          <Button
            onClick={() => toast.warning('Добавим "дисплей для игры" позже')}
          >
            Играть
          </Button>
        }
        headerAddon={
          <InfoDrawer
            content={
              <>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Similique fugiat architecto unde beatae libero iusto minima
                delectus! Voluptate consectetur incidunt consequuntur repellat
                magni sunt earum magnam illo provident tenetur deserunt dolore
                eligendi facere maiores repellendus rem, accusantium minus
                possimus, numquam accusamus praesentium sapiente perspiciatis
                fugit! Pariatur, exercitationem eius iure culpa fuga omnis
                totam! Neque, incidunt illum quia velit rem illo ipsa quod
                dolorum provident eveniet modi dignissimos corrupti harum eaque
                dolore distinctio officiis? Laborum, nemo omnis, animi ullam
                totam molestias a perspiciatis impedit saepe neque sequi esse
                provident temporibus quia ea quasi iusto vitae fugit eveniet
                debitis voluptates vero quod. Lorem ipsum dolor sit amet
                consectetur adipisicing elit. Similique fugiat architecto unde
                beatae libero iusto minima delectus! Voluptate consectetur
                incidunt consequuntur repellat magni sunt earum magnam illo
                provident tenetur deserunt dolore eligendi facere maiores
                repellendus rem, accusantium minus possimus, numquam accusamus
                praesentium sapiente perspiciatis fugit! Pariatur,
                exercitationem eius iure culpa fuga omnis totam! Neque, incidunt
                illum quia velit rem illo ipsa quod dolorum provident eveniet
                modi dignissimos corrupti harum eaque dolore distinctio
                officiis? Laborum, nemo omnis, animi ullam totam molestias a
                perspiciatis impedit saepe neque sequi esse provident temporibus
                quia ea quasi iusto vitae fugit eveniet debitis voluptates vero
                quod. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Similique fugiat architecto unde beatae libero iusto minima
                delectus! Voluptate consectetur incidunt consequuntur repellat
                magni sunt earum magnam illo provident tenetur deserunt dolore
                eligendi facere maiores repellendus rem, accusantium minus
                possimus, numquam accusamus praesentium sapiente perspiciatis
                fugit! Pariatur, exercitationem eius iure culpa fuga omnis
                totam! Neque, incidunt illum quia velit rem illo ipsa quod
                dolorum provident eveniet modi dignissimos corrupti harum eaque
                dolore distinctio officiis? Laborum, nemo omnis, animi ullam
                totam molestias a perspiciatis impedit saepe neque sequi esse
                provident temporibus quia ea quasi iusto vitae fugit eveniet
                debitis voluptates vero quod. Lorem ipsum dolor sit amet
                consectetur adipisicing elit. Similique fugiat architecto unde
                beatae libero iusto minima delectus! Voluptate consectetur
                incidunt consequuntur repellat magni sunt earum magnam illo
                provident tenetur deserunt dolore eligendi facere maiores
                repellendus rem, accusantium minus possimus, numquam accusamus
                praesentium sapiente perspiciatis fugit! Pariatur,
                exercitationem eius iure culpa fuga omnis totam! Neque, incidunt
                illum quia velit rem illo ipsa quod dolorum provident eveniet
                modi dignissimos corrupti harum eaque dolore distinctio
                officiis? Laborum, nemo omnis, animi ullam totam molestias a
                perspiciatis impedit saepe neque sequi esse provident temporibus
                quia ea quasi iusto vitae fugit eveniet debitis voluptates vero
                quod. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Similique fugiat architecto unde beatae libero iusto minima
                delectus! Voluptate consectetur incidunt consequuntur repellat
                magni sunt earum magnam illo provident tenetur deserunt dolore
                eligendi facere maiores repellendus rem, accusantium minus
                possimus, numquam accusamus praesentium sapiente perspiciatis
                fugit! Pariatur, exercitationem eius iure culpa fuga omnis
                totam! Neque, incidunt illum quia velit rem illo ipsa quod
                dolorum provident eveniet modi dignissimos corrupti harum eaque
                dolore distinctio officiis? Laborum, nemo omnis, animi ullam
                totam molestias a perspiciatis impedit saepe neque sequi esse
                provident temporibus quia ea quasi iusto vitae fugit eveniet
                debitis voluptates vero quod. Lorem ipsum dolor sit amet
                consectetur adipisicing elit. Similique fugiat architecto unde
                beatae libero iusto minima delectus! Voluptate consectetur
                incidunt consequuntur repellat magni sunt earum magnam illo
                provident tenetur deserunt dolore eligendi facere maiores
                repellendus rem, accusantium minus possimus, numquam accusamus
                praesentium sapiente perspiciatis fugit! Pariatur,
                exercitationem eius iure culpa fuga omnis totam! Neque, incidunt
                illum quia velit rem illo ipsa quod dolorum provident eveniet
                modi dignissimos corrupti harum eaque dolore distinctio
                officiis? Laborum, nemo omnis, animi ullam totam molestias a
                perspiciatis impedit saepe neque sequi esse provident temporibus
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
        }
      />
    </div>
  );
}

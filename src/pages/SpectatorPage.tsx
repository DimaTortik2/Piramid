import { Button } from '@/shared/Button';
import { useSwipeUp } from '@/shared/hooks/useSwipeUp';
import { useZenMode } from '@/shared/hooks/useZenMode';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

export function SpectatorPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { enableZenMode, disableZenMode, isZenModeActive } =
    useOutletContext<ReturnType<typeof useZenMode>>();

  const handleEnableZenMode = async () => {
    setIsDrawerOpen(false);
    enableZenMode();
  };


  const swipeHandlers = useSwipeUp(() => {
    if (isZenModeActive) {
      setIsDrawerOpen(true);
    }
  });

  return (
    <div {...swipeHandlers} className="flex h-[100dvh] w-full flex-col p-3">
      <div>
        {!isZenModeActive && (
          <Link className="flex items-center gap-1 opacity-30" to={'/'}>
            <ArrowLeftIcon />
            {'Назад'}
          </Link>
        )}
      </div>

      <div className="mt-auto flex justify-center">
        {isZenModeActive ? (
          <>
            <button className="opacity-2" onClick={disableZenMode}>
              Выкл
            </button>
            <InfoDrawer
              isOpen={isDrawerOpen}
              onOpenChange={setIsDrawerOpen}
              content={
                <>
                  Вы хотите{' '}
                  <strong>
                    <span className="text-reader-accent-foreground">
                      выйти из режима
                    </span>
                  </strong>{' '}
                  полного наблюдения?
                </>
              }
              closeBtn={<Button onClick={disableZenMode}>Да, выходим</Button>}
            />
          </>
        ) : (
          <InfoDrawer
            trigger={
              <Button variant="ghost" className="w-fit opacity-30">
                Включить полное наблюдение
              </Button>
            }
            content={
              <>
                Ваш экран не будет гаснуть, а вы сможете наблюдать за шариками.
                Также, если это возможно, мы откроем ваш экран на максимум.{' '}
                <br />
                Выйти из этого режима вы сможете нажав на кнопочку "Выкл" <br />
                <strong>
                  <span className="text-reader-accent-foreground">
                    в нижней части экрана
                  </span>
                </strong>
                {' или сделав '}
                <strong>
                  <span className="text-reader-accent-foreground">
                    свайп снизу вверх
                  </span>
                </strong>
              </>
            }
            closeBtn={
              <Button onClick={handleEnableZenMode}>Ок, включаем</Button>
            }
          />
        )}
      </div>
    </div>
  );
}

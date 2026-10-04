import { Button } from '@/shared/Button';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import NoSleep from 'nosleep.js';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function useSwipeUp(onSwipeUp: () => void, threshold = 50) {
  const touchStartY = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const distance = touchStartY.current - touchEndY; // разница по оси Y

    if (distance > threshold) {
      onSwipeUp();
    }
  };

  return { onTouchStart, onTouchEnd };
}

export function SpectatorPage() {
  const [isActive, setIsActive] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const noSleepRef = useRef<NoSleep | null>(null);

  const swipeHandlers = useSwipeUp(() => {
    if (isActive) {
      setIsDrawerOpen(true);
    }
  });

  useEffect(() => {
    noSleepRef.current = new NoSleep();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        if (noSleepRef.current) {
          noSleepRef.current.disable();
        }
        setIsActive(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (noSleepRef.current) {
        noSleepRef.current.disable();
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const handleEnableBoth = async () => {
    setIsDrawerOpen(false);

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      if (noSleepRef.current) {
        await noSleepRef.current.enable();
      }
      setIsActive(true);
    } catch (err) {
      console.error('Ошибка при включении:', err);
    }
  };

  const handleDisableBoth = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      if (noSleepRef.current) {
        noSleepRef.current.disable();
      }
      setIsActive(false);
    } catch (err) {
      console.error('Ошибка при отключении:', err);
    }
  };

  return (
    <div {...swipeHandlers} className="flex h-[100dvh] w-full flex-col p-3">
      <div>
        {!isActive && (
          <Link className="flex items-center gap-1 opacity-30" to={'/'}>
            <ArrowLeftIcon />
            {'Назад'}
          </Link>
        )}
      </div>

      <div className="mt-auto flex justify-center">
        {isActive ? (
          <>
            <button className="opacity-2" onClick={handleDisableBoth}>
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
              closeBtn={
                <Button onClick={handleDisableBoth}>Да, выходим</Button>
              }
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
            closeBtn={<Button onClick={handleEnableBoth}>Ок, включаем</Button>}
          />
        )}
      </div>
    </div>
  );
}

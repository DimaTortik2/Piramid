import { Button } from '@/shared/Button';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import NoSleep from 'nosleep.js';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function SpectatorPage() {
  const [isActive, setIsActive] = useState(false);

  const noSleepRef = useRef<NoSleep | null>(null);
  useEffect(() => {
    noSleepRef.current = new NoSleep();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        if (noSleepRef.current) {
          noSleepRef.current.disable();
        }
        setIsActive(false);
        console.log('Полноэкранный режим и NoSleep отключены');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      if (noSleepRef.current) {
        noSleepRef.current.disable();
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn('Не удалось выйти из полноэкранного режима:', err);
        });
      }
    };
  }, []);

  const enableBoth = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      if (noSleepRef.current) {
        await noSleepRef.current.enable();
      }

      setIsActive(true);
      console.log('Режим "Всегда включен" активирован');
    } catch (err) {
      console.error('Ошибка при включении:', err);
    }
  };

  const disableBoth = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      if (noSleepRef.current) {
        noSleepRef.current.disable();
      }

      setIsActive(false);
      console.log('Все вернулось в обычный режим');
    } catch (err) {
      console.error('Ошибка при отключении:', err);
    }
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col p-3">
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
          <button className="opacity-2" onClick={disableBoth}>
            Выкл
          </button>
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
              </>
            }
            closeBtn={<Button onClick={enableBoth}>Ок, включаем</Button>}
          />
        )}
      </div>
    </div>
  );
}

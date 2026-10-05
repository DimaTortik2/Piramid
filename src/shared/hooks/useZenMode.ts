import NoSleep from 'nosleep.js';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useZenMode() {
  const [isZenModeActive, setIsZenModeActive] = useState(false);

  const noSleepRef = useRef<NoSleep | null>(null);

  useEffect(() => {
    noSleepRef.current = new NoSleep();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        if (noSleepRef.current) {
          noSleepRef.current.disable();
        }
        setIsZenModeActive(false);
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

  const enableZenMode = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      if (noSleepRef.current) {
        await noSleepRef.current.enable();
      }
      setIsZenModeActive(true);
    } catch (err) {
      console.error('Ошибка при включении:', err);
    }
  }, []);

  const disableZenMode = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      if (noSleepRef.current) {
        noSleepRef.current.disable();
      }
      setIsZenModeActive(false);
    } catch (err) {
      console.error('Ошибка при отключении:', err);
    }
  },[])

  return {
    enableZenMode,
    disableZenMode,
    isZenModeActive,
  };
}

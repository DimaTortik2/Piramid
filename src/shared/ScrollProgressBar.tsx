import { useEffect, useRef } from 'react';

interface ScrollProgressBarProps {}

export function ScrollProgressBar({}: ScrollProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);

  const calculationOpened = useRef<boolean>(true);

  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (calculationOpened.current) {
        rafId = window.requestAnimationFrame(() => {
          const scrollHeight =
            document.documentElement.scrollHeight - window.innerHeight; // все доступное на скролл минус высота экрана = доступное для скролла впринципе (100%)
          const currentScrollY = window.scrollY;

          if (ref.current) {
            if (scrollHeight > 0) {
              const progress = Math.min(
                Math.max(currentScrollY / scrollHeight, 0),
                1
              );
              ref.current.style.transform = `scaleX(${progress})`;
            } else {
              ref.current.style.transform = `scaleX(${0})`;
            }
          }

          // open
          calculationOpened.current = true;
        });

        //close
        calculationOpened.current = false;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      calculationOpened.current = true;
    };
  }, []);
  return (
    <div
      ref={ref}
      className="bg-reader-accent-foreground fixed top-0 left-0 z-50 h-1 w-full origin-left will-change-transform"
    />
  );
}

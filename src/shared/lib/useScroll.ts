import { useEffect, useRef, useState } from 'react';
/**
 * Вешает слушатель на скролл и дает понять скроллим ли мы низ
 *
 */

export function useScroll() {
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  const lastScrollY = useRef<number>(0);
  const calculationOpened = useRef<boolean>(true);
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (calculationOpened.current) {
        rafId = window.requestAnimationFrame(() => {
          // Ща посчитаем сролим ли мы вниз

          const currentScrollY = window.scrollY;

          if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setIsScrollingDown((prev) => (prev !== true ? true : prev));
          } else if (currentScrollY < lastScrollY.current) {
            setIsScrollingDown((prev) => (prev !== false ? false : prev));
          }

          lastScrollY.current = currentScrollY;

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

  return {
    isScrollingDown,
  };
}

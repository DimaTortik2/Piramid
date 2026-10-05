import { useRef } from "react";

export function useSwipeUp(onSwipeUp: () => void, threshold = 50) {
  const touchStartY = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const distance = touchStartY.current - touchEndY;

    if (distance > threshold) {
      onSwipeUp();
    }
  };

  return { onTouchStart, onTouchEnd };
}
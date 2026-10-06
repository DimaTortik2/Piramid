import { useRef, useState } from 'react';

interface UseSwipeProps {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeUp, onSwipeDown, threshold = 50 }: UseSwipeProps) {
  const touchCoords = useRef({ x: 0, y: 0 });
  const [swipeOffset, setSwipeOffset] = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchCoords.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setSwipeOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const distanceX = touchCoords.current.x - currentX;
    const distanceY = touchCoords.current.y - currentY; 

    if (Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      return;
    }

    setSwipeOffset(distanceY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const distanceY = touchCoords.current.y - endY;

    if (distanceY > threshold) {
      onSwipeUp?.();
    } else if (distanceY < -threshold) {
      onSwipeDown?.();
    }
    
    setSwipeOffset(0);
  };

  return { 
    handlers: { onTouchStart, onTouchMove, onTouchEnd }, 
    swipeOffset, 
    threshold 
  };
}
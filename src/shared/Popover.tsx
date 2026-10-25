import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils/cn';

interface PopoverProps {
  trigger: (props: { isOpen: boolean; toggle: () => void }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  className?: string;
}

export function Popover({ trigger, children, className }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      {trigger({ isOpen, toggle })}

      <div
        className={cn(
          'bg-background text-foreground absolute right-0 bottom-full z-50 mb-4 max-h-64 min-w-52 origin-bottom-right overflow-y-auto overscroll-contain rounded-2xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-200',
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0',
          className
        )}
      >
        {children({ close })}
      </div>
    </div>
  );
}
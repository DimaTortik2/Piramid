import { cn } from '@/shared/lib/utils/cn';
import type { ReactNode } from 'react';

interface CircleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Circle({ children, className, ...props }: CircleProps) {
  return (
    <div
      className={cn(
        'bg-foreground text-background flex size-7 shrink-0 items-center justify-center rounded-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

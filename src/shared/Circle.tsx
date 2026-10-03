import { cn } from '@/shared/lib/utils/cn';

interface CircleProps extends React.HTMLAttributes<HTMLDivElement> {
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

import { cn } from '@/shared/lib/utils/cn';

interface CircleProps extends React.HTMLAttributes<HTMLDivElement> {
  disableHover?: boolean;
}

export function Circle({
  children,
  className,
  disableHover,
  ...props
}: CircleProps) {
  return (
    <div
      className={cn(
        'bg-foreground text-background flex size-7 shrink-0 items-center justify-center rounded-full',
        !disableHover &&
          'cursor-pointer transition-transform hover:translate-y-[-2px]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

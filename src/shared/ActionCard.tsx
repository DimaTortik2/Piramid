import type { ReactNode, ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils/cn';

interface ActionCardProps extends Omit<ComponentProps<'div'>, 'title'> {
  title?: ReactNode;
  desc?: ReactNode;
  actions?: ReactNode;
  headerAddon?: ReactNode;
}

export function ActionCard({
  title,
  desc,
  actions,
  headerAddon,
  className,
  ...props
}: ActionCardProps) {
  return (
    <div
      className={cn(
        'bg-background/80 text-foreground rounded-lg p-5 backdrop-blur-lg shadow-2xl',
        className
      )}
      {...props}
    >
      {/* Шапка */}
      <div className="flex items-start justify-between">
        <div>
          {title && <h3 className="text-lg">{title}</h3>}
          {desc && <p className="text-muted-foreground text-sm">{desc}</p>}
        </div>

        {/*бейдж или кнопка-вопросик*/}
        {headerAddon && <div>{headerAddon}</div>}
      </div>

      {/* Зона кнопок */}
      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
    </div>
  );
}

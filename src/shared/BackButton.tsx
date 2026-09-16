import type { ComponentPropsWithoutRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowFatLeftIcon } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';

interface BackButtonProps extends ComponentPropsWithoutRef<'button'> {
  /** Если не передан — будет только круглая иконка */
  title?: string;
  /** Если мы перешли по ссылке, то кнопка уведет сюда */
  fallbackTo?: string;
  /** Просто ссылка куда ведет */
  to?: string;

  collapsed?: boolean;
}

export function BackButton({
  title,
  fallbackTo = '/',
  className,
  to,
  collapsed = false,
  ...props
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
      return;
    }

    const state = window.history.state as { idx?: number } | null;
    const hasHistory =
      state !== null && typeof state.idx === 'number' && state.idx > 0;

    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(fallbackTo, { relative: 'path' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={title ?? 'Вернуться назад'}
      className={cn(
        'group inline-flex items-center justify-center select-none',
        title
          ? 'h-9 rounded-full px-3' 
          : 'size-9 rounded-full', 
        'bg-foreground/5 hover:bg-foreground/10 active:bg-foreground/15',
        'text-foreground/80 hover:text-foreground',
        'text-xs font-semibold tracking-wide',
        'cursor-pointer overflow-hidden transition-all duration-300 active:scale-95',
        'focus-visible:ring-primary focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      {...props}
    >
      <ArrowFatLeftIcon
        weight="fill"
        className="size-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5"
      />
      {title && (
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-all duration-300 ease-out',
            collapsed
              ? 'ml-0 max-w-0 opacity-0'
              : 'ml-2 max-w-[200px] opacity-100'
          )}
        >
          {title}
        </span>
      )}
    </button>
  );
}

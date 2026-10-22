import { useEffect, useRef, type ReactNode } from 'react';
import {
  CaretDownIcon,
  CheckIcon,
  LinkSimpleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';
import { useLectureContext } from './LectureContext';

interface LectureSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function LectureSection({
  id,
  title,
  description,
  children,
}: LectureSectionProps) {
  const {
    isSectionOpen,
    toggleSection,
    isSectionCompleted,
    markSectionCompleted,
    toggleSectionCompleted,
    copyTopicLink,
  } = useLectureContext();

  const isOpen = isSectionOpen(id);
  const isCompleted = isSectionCompleted(id);
  const endSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = endSentinelRef.current;
    if (!node || !isOpen || isCompleted) return;

    let timer: number | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && window.scrollY > 80) {
          timer = window.setTimeout(() => {
            markSectionCompleted(id);
          }, 550);
        } else if (timer) {
          window.clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: 0.9 }
    );

    observer.observe(node);

    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [id, isOpen, isCompleted, markSectionCompleted]);

  return (
    <section
      id={id}
      data-lecture-section
      data-section-id={id}
      data-section-title={title}
      data-section-desc={description ?? ''}
    >
      <div className="bg-reader-accent-foreground h-px w-full" />

      <div className="not-prose flex items-start justify-between gap-3 py-5">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          aria-expanded={isOpen}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <span
            className={cn(
              'text-reader-accent-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center transition-transform duration-200',
              isOpen && 'rotate-180', isCompleted && !isOpen && 'opacity-45'
            )}
          >
            <CaretDownIcon size={16} weight="bold" />
          </span>

          <div className="flex-1">
            <h2
              className={cn(
                'text-base font-semibold leading-snug transition-colors sm:text-lg',
                isCompleted && !isOpen
                  ? 'text-reader-foreground/35'
                  : 'text-reader-foreground',
                  
              )}
            >
              {title}
            </h2>
            {description && (
              <p className={cn("text-reader-muted-foreground mt-1 text-xs leading-relaxed", isCompleted && !isOpen && 'text-reader-muted-foreground/30')}>
                {description}
              </p>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => toggleSectionCompleted(id)}
            title={
              isCompleted
                ? 'Отметить как непрочитанное'
                : 'Отметить как прочитанное'
            }
            aria-label={
              isCompleted
                ? 'Отметить как непрочитанное'
                : 'Отметить как прочитанное'
            }
            className={cn(
              'flex size-8 items-center justify-center transition-colors',
              isCompleted
                ? 'text-reader-accent-foreground'
                : 'text-reader-muted-foreground/45 hover:text-reader-foreground',
               isCompleted && !isOpen && 'opacity-45'
            )}
          >
            <CheckIcon size={16} weight="bold" />
          </button>

          <button
            type="button"
            onClick={() => copyTopicLink(id)}
            title="Скопировать ссылку на тему"
            aria-label="Скопировать ссылку на тему"
            className={cn("text-reader-muted-foreground hover:text-reader-accent-foreground flex size-8 items-center justify-center transition-colors", isCompleted && 'opacity-50', isCompleted && isOpen && 'opacity-100')}
          >
            <LinkSimpleIcon size={16} weight="bold" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-6">
            {children}
            <div
              ref={endSentinelRef}
              aria-hidden="true"
              className="h-1 w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
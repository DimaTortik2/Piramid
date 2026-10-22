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
  const isDimmed = isCompleted && !isOpen;
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
      <div
        className={cn(
          'h-px w-full transition-colors duration-300 ease-out',
          isDimmed
            ? 'bg-reader-accent-foreground/30'
            : 'bg-reader-accent-foreground'
        )}
      />

      <div className="not-prose flex items-start justify-between gap-3 py-5">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          aria-expanded={isOpen}
          className="group flex flex-1 items-start gap-3 text-left"
        >
          <span
            className={cn(
              'text-reader-accent-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center transition-[transform,opacity] duration-300 ease-out',
              isOpen && 'rotate-180',
              isDimmed && 'opacity-40 group-hover:opacity-75'
            )}
          >
            <CaretDownIcon size={16} weight="bold" />
          </span>

          <div className="flex-1">
            <h2
              className={cn(
                'text-base font-semibold leading-snug transition-colors duration-300 ease-out sm:text-lg',
                isDimmed
                  ? 'text-reader-foreground/40 group-hover:text-reader-foreground/75'
                  : 'text-reader-foreground'
              )}
            >
              {title}
            </h2>
            {description && (
              <p
                className={cn(
                  'mt-1 text-xs leading-relaxed transition-colors duration-300 ease-out',
                  isDimmed
                    ? 'text-reader-muted-foreground/30 group-hover:text-reader-muted-foreground/60'
                    : 'text-reader-muted-foreground'
                )}
              >
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
              'flex size-8 items-center justify-center transition-[color,opacity] duration-300 ease-out',
              isCompleted
                ? 'text-reader-accent-foreground'
                : 'text-reader-muted-foreground/45 hover:text-reader-foreground',
              isDimmed && 'opacity-45 hover:opacity-100'
            )}
          >
            <CheckIcon size={16} weight="bold" />
          </button>

          <button
            type="button"
            onClick={() => copyTopicLink(id)}
            title="Скопировать ссылку на тему"
            aria-label="Скопировать ссылку на тему"
            className={cn(
              'text-reader-muted-foreground hover:text-reader-accent-foreground flex size-8 items-center justify-center transition-[color,opacity] duration-300 ease-out',
              isDimmed && 'opacity-40 hover:opacity-100'
            )}
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
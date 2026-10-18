import type { ReactNode } from 'react';
import { CaretDownIcon, LinkSimpleIcon } from '@phosphor-icons/react';
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
  const { isSectionOpen, toggleSection, copyTopicLink, highlightedId } =
    useLectureContext();

  const isOpen = isSectionOpen(id);
  const isHighlighted = highlightedId === id;

  return (
    <section
      id={id}
      data-lecture-section
      data-section-id={id}
      data-section-title={title}
      data-section-desc={description ?? ''}
      className={cn(
        'scroll-mt-20 transition-all duration-300',
        isHighlighted && 'bg-white/5 rounded-2xl p-2'
      )}
    >
      <div className="not-prose flex items-center justify-between gap-3 py-3">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className={cn(
              'text-reader-accent-foreground flex size-6 shrink-0 items-center justify-center transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          >
            <CaretDownIcon size={16} weight="bold" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-reader-foreground text-base font-semibold leading-snug sm:text-lg">
              {title}
            </h2>
            {description && (
              <p className="text-reader-muted-foreground mt-0.5 truncate text-xs">
                {description}
              </p>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => copyTopicLink(id)}
          title="Скопировать ссылку на тему"
          aria-label="Скопировать ссылку на тему"
          className="text-reader-muted-foreground hover:text-reader-accent-foreground flex size-8 shrink-0 items-center justify-center transition-colors"
        >
          <LinkSimpleIcon size={16} weight="bold" />
        </button>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-2 pb-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
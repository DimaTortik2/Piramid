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
  const { isSectionOpen, toggleSection, copyTopicLink } = useLectureContext();

  const isOpen = isSectionOpen(id);

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
              isOpen && 'rotate-180'
            )}
          >
            <CaretDownIcon size={16} weight="bold" />
          </span>

          <div className="flex-1">
            <h2 className="text-reader-foreground text-base font-semibold leading-snug sm:text-lg">
              {title}
            </h2>
            {description && (
              <p className="text-reader-muted-foreground mt-1 text-xs leading-relaxed">
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
          <div className="pb-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
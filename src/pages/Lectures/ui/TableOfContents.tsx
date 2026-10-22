import { useLayoutEffect } from 'react';
import {
  CaretRightIcon,
  CheckIcon,
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';
import { useLectureContext } from './LectureContext';

export function TableOfContents({
  title = 'Оглавление',
}: {
  title?: string;
}) {
  const {
    topics,
    scanSections,
    navigateToTopic,
    isSectionCompleted,
  } = useLectureContext();

  useLayoutEffect(() => {
    scanSections();
  }, [scanSections]);

  if (topics.length === 0) return null;

  return (
    <nav
      id="lecture-toc"
      aria-label="Оглавление лекции"
      className="not-prose mt-4 mb-6 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="text-reader-foreground flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
          <span>{title}</span>
        </div>
      </div>

      <ol className="flex flex-col gap-1">
        {topics.map((topic, index) => {
          const isCompleted = isSectionCompleted(topic.id);

          return (
            <li key={topic.id}>
              <a
                href={`#${topic.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToTopic(topic.id);
                }}
                className="group flex items-center justify-between gap-3 px-1 py-2.5 transition-colors duration-300 ease-out"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className={cn(
                      'shrink-0 text-xs font-semibold tabular-nums transition-colors duration-300 ease-out',
                      isCompleted
                        ? 'text-reader-accent-foreground/40 group-hover:text-reader-accent-foreground'
                        : 'text-reader-muted-foreground/60 group-hover:text-reader-accent-foreground'
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium leading-snug transition-colors duration-300 ease-out',
                        isCompleted
                          ? 'text-reader-foreground/40 group-hover:text-reader-foreground'
                          : 'text-reader-foreground group-hover:text-reader-accent-foreground'
                      )}
                    >
                      {topic.title}
                    </p>
                    {topic.description && (
                      <p
                        className={cn(
                          'mt-0.5 text-xs leading-relaxed transition-colors duration-300 ease-out',
                          isCompleted
                            ? 'text-reader-muted-foreground/30 group-hover:text-reader-muted-foreground/65'
                            : 'text-reader-muted-foreground'
                        )}
                      >
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>

                {isCompleted ? (
                  <CheckIcon
                    size={15}
                    weight="bold"
                    className="text-reader-accent-foreground/45 group-hover:text-reader-accent-foreground shrink-0 transition-[color,transform] duration-300 ease-out group-hover:scale-110"
                  />
                ) : (
                  <CaretRightIcon
                    size={14}
                    weight="bold"
                    className="text-reader-muted-foreground group-hover:text-reader-accent-foreground shrink-0 transition-[color,transform] duration-300 ease-out group-hover:translate-x-0.5"
                  />
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
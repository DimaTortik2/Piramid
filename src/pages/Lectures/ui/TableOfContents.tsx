import { useLayoutEffect } from 'react';
import {
  ArrowsInLineVerticalIcon,
  ArrowsOutLineVerticalIcon,
  CaretRightIcon,
  ListNumbersIcon,
} from '@phosphor-icons/react';
import { useLectureContext } from './LectureContext';

export function TableOfContents({
  title = 'Оглавление',
}: {
  title?: string;
}) {
  const {
    topics,
    openMap,
    scanSections,
    navigateToTopic,
    expandAll,
    collapseAll,
  } = useLectureContext();

  useLayoutEffect(() => {
    scanSections();
  }, [scanSections]);

  if (topics.length === 0) return null;

  const allExpanded = topics.every((t) => openMap[t.id] ?? true);

  return (
    <nav
      id="lecture-toc"
      aria-label="Оглавление лекции"
      className="not-prose bg-background/20 my-4 rounded-3xl p-5 backdrop-blur-xl"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="text-reader-foreground flex items-center gap-2.5 text-base font-semibold">
          <ListNumbersIcon
            size={22}
            className="text-reader-accent-foreground"
          />
          <span>{title}</span>
        </div>

        <button
          type="button"
          onClick={allExpanded ? collapseAll : expandAll}
          className="text-reader-muted-foreground hover:text-reader-foreground flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors"
        >
          {allExpanded ? (
            <>
              <ArrowsInLineVerticalIcon size={14} weight="bold" />
              <span>Свернуть все</span>
            </>
          ) : (
            <>
              <ArrowsOutLineVerticalIcon size={14} weight="bold" />
              <span>Развернуть все</span>
            </>
          )}
        </button>
      </div>

      <ol className="flex flex-col gap-1.5">
        {topics.map((topic, index) => (
          <li key={topic.id}>
            <a
              href={`#${topic.id}`}
              onClick={(e) => {
                e.preventDefault();
                navigateToTopic(topic.id);
              }}
              className="group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 transition-all hover:bg-white/5"
            >
              <div className="flex min-w-0 items-baseline gap-3">
                <span className="text-reader-accent-foreground shrink-0 font-mono text-xs font-semibold opacity-80">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <div className="min-w-0">
                  <p className="text-reader-foreground group-hover:text-reader-accent-foreground truncate text-sm font-medium transition-colors">
                    {topic.title}
                  </p>
                  {topic.description && (
                    <p className="text-reader-muted-foreground truncate text-xs">
                      {topic.description}
                    </p>
                  )}
                </div>
              </div>

              <CaretRightIcon
                size={15}
                weight="bold"
                className="text-reader-muted-foreground group-hover:text-reader-accent-foreground shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
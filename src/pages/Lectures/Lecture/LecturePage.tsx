import { BackButton } from '@/shared/BackButton';
import { useScroll } from '@/shared/lib/useScroll';
import { ScrollProgressBar } from '@/shared/ScrollProgressBar';
import { useMemo } from 'react';
import { useLoaderData } from 'react-router-dom';

export function LecturePage() {
  const { MdxComponent } = useLoaderData();
  const { isScrollingDown } = useScroll();
  const renderedContent = useMemo(() => <MdxComponent />, [MdxComponent]);
  return (
    <div className="bg-reader-background relative min-h-screen w-full px-3 pt-3 pb-12">
      {/* Прогресс-бар */}
      <ScrollProgressBar />

      <main className="relative mx-auto w-full max-w-125">
        {/* Мобильный "Назад" */}
        <div className="sticky top-3 z-40 mb-3 lg:hidden">
          <BackButton collapsed={isScrollingDown} title="Назад" />
        </div>

        {/* Десктопный "Назад" */}
        <aside className="absolute top-0 right-[calc(100%+1.5rem)] bottom-0 hidden h-full lg:block">
          <div className="sticky top-3 z-40">
            <BackButton collapsed={isScrollingDown} title="Назад" />
          </div>
        </aside>

        {/* Контент */}
        <div className="prose prose-invert prose-blockquote:border-s-reader-accent-foreground prose-hr:border-reader-accent-foreground marker:text-reader-foreground/30 prose-p:text-reader-muted-foreground prose-headings:text-reader-foreground prose-strong:text-reader-foreground prose-a:text-reader-accent-foreground hover:prose-a:text-reader-accent-foreground/80 prose-code:text-reader-accent-foreground">
          {renderedContent}
        </div>
      </main>
    </div>
  );
}

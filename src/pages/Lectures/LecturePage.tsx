import { type ComponentType, useEffect, useState } from 'react';
import {
  useLoaderData,
  useOutletContext,
  useSearchParams,
} from 'react-router-dom';
import { ArrowUpIcon } from '@phosphor-icons/react';
import { BackButton } from '@/shared/BackButton';
import type { useZenMode } from '@/shared/hooks/useZenMode';
import { getMdxContent } from '@/shared/lib/getMdxContent';
import { triggerHaptic } from '@/shared/lib/telegram';
import { useScroll } from '@/shared/lib/useScroll';
import { ScrollProgressBar } from '@/shared/ScrollProgressBar';
import {
  DISCIPLINES,
  type DisciplineId,
  useDisciplineStore,
} from '@/shared/store/useDisciplineStore';
import { useSettingsStore } from '@/shared/store/useSettingsStore';
import { LectureProvider } from '@/pages/Lectures/ui/LectureContext';

interface LectureLoaderData {
  MdxComponent?: ComponentType;
  discipline?: DisciplineId;
}

export function LecturePage() {
  const loaderData = useLoaderData() as LectureLoaderData | undefined;
  const [searchParams] = useSearchParams();
  const { discipline, setDiscipline } = useDisciplineStore();

  const [MdxComponent, setMdxComponent] = useState<ComponentType | null>(
    () => loaderData?.MdxComponent ?? null
  );
  const [isLoading, setIsLoading] = useState(!loaderData?.MdxComponent);

  const { isScrollingDown } = useScroll();
  const isLecturesZenMode = useSettingsStore(
    (state) => state.isLecturesZenMode
  );
  const outletContext =
    useOutletContext<ReturnType<typeof useZenMode> | undefined>();

  useEffect(() => {
    if (isLecturesZenMode && outletContext?.enableZenMode) {
      outletContext.enableZenMode();
    }
  }, [isLecturesZenMode, outletContext]);

  useEffect(() => {
    const paramDiscipline = searchParams.get('discipline') as DisciplineId | null;
    if (
      paramDiscipline &&
      DISCIPLINES.some((d) => d.id === paramDiscipline) &&
      paramDiscipline !== discipline
    ) {
      setDiscipline(paramDiscipline);
    }
  }, [searchParams, discipline, setDiscipline]);

  useEffect(() => {
    if (loaderData?.discipline === discipline && loaderData?.MdxComponent) {
      setMdxComponent(() => loaderData.MdxComponent!);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    getMdxContent(discipline).then((Comp) => {
      if (isCancelled) return;
      setMdxComponent(() => Comp);
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [discipline, loaderData]);

  const scrollToToc = () => {
    triggerHaptic('light');
    const toc = document.getElementById('lecture-toc');
    if (toc) {
      toc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentDisciplineLabel =
    DISCIPLINES.find((d) => d.id === discipline)?.label ?? 'Теория';

  return (
    <div className="bg-reader-background relative min-h-screen w-full px-3 pt-3 pb-20">
      <ScrollProgressBar />

      <main className="relative mx-auto w-full max-w-125">
        <div className="sticky top-3 z-40 mb-3 flex items-center justify-between gap-2">
          <BackButton collapsed={isScrollingDown} title="Назад" />

          <button
            type="button"
            onClick={scrollToToc}
            className="bg-background/20 text-foreground hover:bg-background/30 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium backdrop-blur-xl transition-transform active:scale-95"
          >
            <ArrowUpIcon size={14} weight="bold" />
            <span>К оглавлению</span>
          </button>
        </div>

        <div className="mb-4 px-1">
          <span className="text-reader-accent-foreground text-xs font-semibold tracking-wider uppercase">
            {currentDisciplineLabel}
          </span>
        </div>

        {isLoading ? (
          <div className="text-reader-muted-foreground py-12 text-center text-sm">
            Загрузка материала...
          </div>
        ) : MdxComponent ? (
          <div className="prose prose-invert prose-blockquote:border-s-reader-accent-foreground prose-hr:border-reader-accent-foreground marker:text-reader-foreground/30 prose-p:text-reader-muted-foreground prose-headings:text-reader-foreground prose-strong:text-reader-foreground prose-a:text-reader-accent-foreground hover:prose-a:text-reader-accent-foreground/80 prose-code:text-reader-accent-foreground max-w-none">
            <LectureProvider disciplineKey={discipline}>
              <MdxComponent />
            </LectureProvider>
          </div>
        ) : (
          <div className="text-reader-muted-foreground py-12 text-center text-sm">
            Материал для выбранного режима пока не добавлен.
          </div>
        )}
      </main>
    </div>
  );
}
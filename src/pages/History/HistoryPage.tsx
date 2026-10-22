import { useState, useEffect, useMemo, useRef, lazy, Suspense, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  useGameStore,
  type GameMode,
  type MatchRecord,
  type GameSessionRecord,
} from '@/shared/store/gameStore';
import { Button } from '@/shared/Button';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { normalizeMatchWinnerLeft } from '@/shared/ShareSessionDrawer';
import { cn } from '@/shared/lib/utils/cn';
import {
  ArrowsLeftRightIcon,
  ArrowUpIcon,
  CaretDownIcon,
  ClockIcon,
  CopyIcon,
  CrownIcon,
  DownloadSimpleIcon,
  ShareNetworkIcon,
  TrashIcon,
  ClockCounterClockwiseIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/PageHeader';

const MatchScoreChart = lazy(() => import('./MatchScoreChart'));
const ShareSessionDrawer = lazy(() =>
  import('@/shared/ShareSessionDrawer').then((m) => ({
    default: m.ShareSessionDrawer,
  }))
);

const MODE_LABELS: Record<GameMode, string> = {
  'free-pyramid': 'Свободная пирамида',
  'combined-pyramid': 'Комбинированная',
  'dynamic-pyramid': 'Динамичная',
  'classic-pyramid': 'Русская (71 очко)',
  'continuous-free-pyramid': 'Свободная с продолжением',
};

function encodeBackup(matches: MatchRecord[]): string {
  const json = JSON.stringify({ version: 2, matches });
  return btoa(encodeURIComponent(json));
}

function extractMatchesFromParsed(parsed: unknown): MatchRecord[] {
  if (Array.isArray(parsed)) {
    const first = parsed[0] as Record<string, unknown> | undefined;
    if (first && Array.isArray(first.matches)) {
      return (parsed as GameSessionRecord[]).flatMap((s) => s.matches ?? []);
    }
    return parsed as MatchRecord[];
  }
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.matches)) {
      return obj.matches as MatchRecord[];
    }
    if (Array.isArray(obj.sessions)) {
      return (obj.sessions as GameSessionRecord[]).flatMap(
        (s) => s.matches ?? []
      );
    }
  }
  throw new Error('Invalid backup format');
}

function decodeBackup(raw: string): MatchRecord[] {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return extractMatchesFromParsed(parsed);
  } catch {
    const decodedJson = decodeURIComponent(atob(trimmed));
    const parsed = JSON.parse(decodedJson);
    return extractMatchesFromParsed(parsed);
  }
}

function formatTime(ms: number | null) {
  if (ms === null || ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}ч ${m}м`;
  return m > 0 ? `${m}м ${s}с` : `${s}с`;
}

function StatComparisonRow({
  label,
  v1,
  v2,
}: {
  label: string;
  v1: string | number;
  v2: string | number;
}) {
  const n1 = typeof v1 === 'number' ? v1 : parseFloat(String(v1)) || 0;
  const n2 = typeof v2 === 'number' ? v2 : parseFloat(String(v2)) || 0;
  const total = n1 + n2;
  const p1Percent = total > 0 ? Math.round((n1 / total) * 100) : 50;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex justify-between">
        <span className="font-bold">{v1}</span>
        <span className="opacity-60">{label}</span>
        <span className="font-bold">{v2}</span>
      </div>
      <div className="bg-foreground/10 flex h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-approve transition-all"
          style={{ width: `${p1Percent}%` }}
        />
        <div
          className="bg-piramid-ball-shadow transition-all"
          style={{ width: `${100 - p1Percent}%` }}
        />
      </div>
    </div>
  );
}

function MatchAccordionItem({
  match: rawMatch,
  defaultExpanded = false,
  onShare,
  onRequestDelete,
}: {
  match: MatchRecord;
  defaultExpanded?: boolean;
  onShare: (match: MatchRecord) => void;
  onRequestDelete: (match: MatchRecord) => void;
}) {
  const match = useMemo(() => normalizeMatchWinnerLeft(rawMatch), [rawMatch]);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const dateFormatted = new Date(match.endedAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-background/80 text-foreground relative rounded-2xl px-4 py-3 backdrop-blur-lg">
      <div
        onClick={() => setExpanded((prev) => !prev)}
        className="flex cursor-pointer flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 opacity-60">
            <span className="truncate font-medium">
              {MODE_LABELS[match.mode]}
            </span>
            <span>•</span>
            <span className="shrink-0">{dateFormatted}</span>
            <span>•</span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <ClockIcon className="size-3" />
              {formatTime(match.durationMs)}
            </span>
          </div>

          <div className="-mr-1.5 flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              title="Поделиться"
              onClick={(e) => {
                e.stopPropagation();
                onShare(match);
              }}
              className="hover:bg-foreground/10 flex size-7 items-center justify-center rounded-full transition-colors"
            >
              <ShareNetworkIcon className="size-4 opacity-75" />
            </button>

            <button
              type="button"
              title="Удалить партию"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(match);
              }}
              className="text-destructive hover:bg-destructive/15 flex size-7 items-center justify-center rounded-full transition-colors"
            >
              <TrashIcon className="size-4" />
            </button>

            <button
              type="button"
              title={expanded ? 'Свернуть' : 'Развернуть'}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              className="hover:bg-foreground/10 flex size-7 items-center justify-center rounded-full transition-colors"
            >
              <CaretDownIcon
                className={cn(
                  'size-4 opacity-75 transition-transform duration-200',
                  expanded && 'rotate-180'
                )}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {match.winnerId === 'p1' && (
              <CrownIcon weight="fill" className="text-gold size-4 shrink-0" />
            )}
            <span className="truncate text-sm font-bold sm:text-base">
              {match.p1.name}
            </span>
          </div>

          <span className="shrink-0 px-3 py-0.5 text-sm font-extrabold whitespace-nowrap">
            {match.p1.finalScore} : {match.p2.finalScore}
          </span>

          <div className="flex min-w-0 flex-1 items-center justify-end">
            <span className="truncate text-right text-sm font-bold opacity-85 sm:text-base">
              {match.p2.name}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-foreground/10 mt-3 flex flex-col gap-4 border-t pt-3">
          <div className="flex flex-col gap-2.5">
            <StatComparisonRow
              label="Забито с кия"
              v1={match.p1.ballsPotted}
              v2={match.p2.ballsPotted}
            />
            <StatComparisonRow
              label="Макс. серия (шары)"
              v1={match.p1.maxStreakBalls}
              v2={match.p2.maxStreakBalls}
            />
            <StatComparisonRow
              label="Средняя серия"
              v1={match.p1.avgStreakBalls}
              v2={match.p2.avgStreakBalls}
            />
            <StatComparisonRow
              label="Штрафы"
              v1={match.p1.penaltiesCommitted}
              v2={match.p2.penaltiesCommitted}
            />
            <div className="flex justify-between pt-1 text-xs">
              <span className="font-semibold">
                {formatTime(match.p1.avgTimePerPotMs)}
              </span>
              <span className="opacity-60">Среднее время на шар</span>
              <span className="font-semibold">
                {formatTime(match.p2.avgTimePerPotMs)}
              </span>
            </div>
          </div>

          <div className="bg-foreground/5 rounded-2xl p-3">
            <div className="flex items-center justify-between text-xs opacity-75">
              <span>Ход набора очков</span>
            </div>

            <Suspense
              fallback={
                <div className="h-44 w-full animate-pulse rounded-xl bg-foreground/5" />
              }
            >
              <MatchScoreChart match={match} />
            </Suspense>

            <div className="border-foreground/10 mt-2 grid grid-cols-2 gap-2 border-t pt-2 text-xs">
              <div>
                <div className="text-approve font-bold">{match.p1.name}</div>
                <div className="opacity-70">
                  Серии: {match.p1.streaks.join(', ') || '0'}
                </div>
                {match.p1.pottedBallNumbers.length > 0 && (
                  <div className="opacity-70">
                    Шары: {match.p1.pottedBallNumbers.join(', ')}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold">{match.p2.name}</div>
                <div className="opacity-70">
                  Серии: {match.p2.streaks.join(', ') || '0'}
                </div>
                {match.p2.pottedBallNumbers.length > 0 && (
                  <div className="opacity-70">
                    Шары: {match.p2.pottedBallNumbers.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryPage() {
  const { savedMatches = [], deleteMatch, importMatches } = useGameStore();
  const [shareMatch, setShareMatch] = useState<MatchRecord | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<MatchRecord | null>(null);
  const [isBackupDrawerOpen, setIsBackupDrawerOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getScrollTop = () =>
      Math.max(
        window.scrollY || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0
      );

    const handleScroll = () => {
      setShowScrollTop(getScrollTop() > 300);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true,
    });
    return () =>
      window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalBallsPotted = savedMatches.reduce(
    (acc, m) => acc + m.p1.ballsPotted + m.p2.ballsPotted,
    0
  );

  const handleConfirmDelete = () => {
    if (!matchToDelete) return;
    deleteMatch(matchToDelete.id);
    setMatchToDelete(null);
    toast.success('Партия удалена из истории');
  };

  const handleCopyBackupCode = async () => {
    if (savedMatches.length === 0) {
      toast.warning('История пока пуста');
      return;
    }
    try {
      const code = encodeBackup(savedMatches);
      await navigator.clipboard.writeText(code);
      toast.success('Код истории скопирован в буфер обмена');
    } catch {
      toast.error('Не удалось скопировать в буфер');
    }
  };

  const handleExportFile = async () => {
    if (savedMatches.length === 0) {
      toast.warning('История пока пуста');
      return;
    }
    const json = JSON.stringify(
      { version: 2, exportedAt: Date.now(), matches: savedMatches },
      null,
      2
    );
    const datePart = new Date().toISOString().slice(0, 10);
    const fileName = `billiard-history-${datePart}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'История партий — Русский бильярд',
          files: [file],
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Файл истории сохранен');
  };

  const processImportString = (raw: string) => {
    try {
      const parsedMatches = decodeBackup(raw);
      const addedCount = importMatches(parsedMatches);
      if (addedCount > 0) {
        toast.success(`Добавлено новых партий: ${addedCount}`);
      } else {
        toast.info('Все эти партии уже есть в вашей истории');
      }
      setImportText('');
      setIsBackupDrawerOpen(false);
    } catch {
      toast.error('Некорректный формат данных или файла');
    }
  };

  const handleImportFromClipboard = async () => {
    if (importText.trim()) {
      processImportString(importText);
      return;
    }
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        toast.warning('Буфер обмена пуст — вставьте код в поле ниже');
        return;
      }
      processImportString(clip);
    } catch {
      toast.info('Вставьте скопированный код в поле ниже и нажмите Импорт');
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    processImportString(text);
    e.target.value = '';
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-125 flex-col gap-4 px-2 py-3">
      <PageHeader
        actionBtn={
          <button
            type="button"
            title="Экспорт и импорт истории"
            onClick={() => setIsBackupDrawerOpen(true)}
          >
            <ArrowsLeftRightIcon />
          </button>
        }
      >
        История партий
      </PageHeader>

      {savedMatches.length > 0 && (
        <div className="bg-background/80 grid grid-cols-2 gap-2 rounded-2xl p-3 text-center backdrop-blur-lg">
          <div>
            <div className="text-xl font-bold">{savedMatches.length}</div>
            <div className="text-xs opacity-60">Партий</div>
          </div>
          <div>
            <div className="text-xl font-bold">{totalBallsPotted}</div>
            <div className="text-xs opacity-60">Всего забито</div>
          </div>
        </div>
      )}

      {savedMatches.length === 0 ? (
        <div className="bg-background/80 flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center backdrop-blur-lg">
          <ClockCounterClockwiseIcon className="size-12 opacity-40" />
          <p className="text-lg font-medium">История пока пуста</p>
          <p className="text-sm opacity-60">
            Завершите хотя бы одну партию или импортируйте сохраненную историю.
          </p>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setIsBackupDrawerOpen(true)}
            >
              Импортировать историю
            </Button>
            <Link to="/" className="w-full">
              <Button variant="ghost" className="w-full">
                На главную
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {savedMatches.map((match, index) => (
            <MatchAccordionItem
              key={match.id}
              match={match}
              defaultExpanded={index === 0}
              onShare={(m) => setShareMatch(m)}
              onRequestDelete={(m) => setMatchToDelete(m)}
            />
          ))}
        </div>
      )}

      {typeof document !== 'undefined' &&
        createPortal(
          <button
            type="button"
            title="Наверх"
            onClick={handleScrollToTop}
            className={cn(
              'bg-background text-neutral-foreground fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] z-50 flex size-11 items-center justify-center rounded-full shadow-xl transition-all duration-200 active:scale-90',
              showScrollTop
                ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-4 scale-90 opacity-0'
            )}
          >
            <ArrowUpIcon weight="bold" className="size-5" />
          </button>,
          document.body
        )}

      {shareMatch !== null && (
        <Suspense fallback={null}>
          <ShareSessionDrawer
            match={shareMatch}
            isOpen={true}
            onOpenChange={(open) => {
              if (!open) setShareMatch(null);
            }}
          />
        </Suspense>
      )}

      <InfoDrawer
        isOpen={isBackupDrawerOpen}
        onOpenChange={setIsBackupDrawerOpen}
        closeBtn={
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setIsBackupDrawerOpen(false)}
          >
            Закрыть
          </Button>
        }
        content={
          <div className="flex flex-col gap-4 py-2">
            <div>
              <p className="text-lg font-semibold">Экспорт истории</p>
              <p className="text-xs opacity-60">
                Перенесите историю партий между устройствами или сохраните
                резервную копию.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center justify-center gap-1.5"
                  onClick={handleCopyBackupCode}
                >
                  <CopyIcon className="size-4" />В буфер
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center justify-center gap-1.5"
                  onClick={handleExportFile}
                >
                  <DownloadSimpleIcon className="size-4" />
                  json
                </Button>
              </div>
            </div>

            <div className="border-neutral-foreground/10 border-t pt-3">
              <p className="text-lg font-semibold">Импорт истории</p>
              <p className="text-xs opacity-60">
                Новые партии автоматически объединятся с текущими без дублей.
              </p>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Вставьте сюда скопированный код истории (или оставьте пустым для чтения из буфера)..."
                rows={3}
                className="bg-neutral text-neutral-foreground mt-2.5 w-full rounded-2xl p-3 text-xs outline-none"
              />

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  variant="approve"
                  size="sm"
                  className="flex items-center justify-center gap-1.5"
                  onClick={handleImportFromClipboard}
                >
                  <CopyIcon className="size-4" />
                  {importText.trim() ? 'Ок' : 'Из буфера'}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center justify-center gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadSimpleIcon className="size-4" />
                  Из json
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        }
      />

      <InfoDrawer
        isOpen={matchToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setMatchToDelete(null);
        }}
        closeBtn={
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setMatchToDelete(null)}
          >
            Отмена
          </Button>
        }
        content={
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-xl font-medium">Удалить партию из истории?</p>
            <p className="text-neutral-foreground/70 text-sm">
              Партия{' '}
              <strong>
                {matchToDelete?.p1.name} vs {matchToDelete?.p2.name}
              </strong>{' '}
              будет удалена безвозвратно.
            </p>
            <Button
              variant="destructive"
              className="mt-2 w-full"
              onClick={handleConfirmDelete}
            >
              Да, удалить
            </Button>
          </div>
        }
      />
    </div>
  );
}
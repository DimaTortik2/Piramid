import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useGameStore,
  type GameSessionRecord,
  type GameMode,
  type MatchRecord,
} from '@/shared/store/gameStore';
import { Button } from '@/shared/Button';
import { InfoDrawer } from '@/shared/InfoDrawer';
import {
  ShareSessionDrawer,
  normalizeSessionWinnerLeft,
} from '@/shared/ShareSessionDrawer';
import { cn } from '@/shared/lib/utils/cn';
import {
  ArrowsLeftRightIcon,
  CaretDownIcon,
  CopyIcon,
  CrownIcon,
  DownloadSimpleIcon,
  ShareNetworkIcon,
  TrashIcon,
  TrophyIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/PageHeader';

const MODE_LABELS: Record<GameMode, string> = {
  'free-pyramid': 'Свободная пирамида',
  'combined-pyramid': 'Комбинированная',
  'dynamic-pyramid': 'Динамичная',
  'classic-pyramid': 'Русская (71 очко)',
  'continuous-free-pyramid': 'Свободная с продолжением',
};

function encodeBackup(sessions: GameSessionRecord[]): string {
  const json = JSON.stringify({ version: 1, sessions });
  return btoa(encodeURIComponent(json));
}

function decodeBackup(raw: string): GameSessionRecord[] {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.sessions)) return parsed.sessions;
  } catch {
    const decodedJson = decodeURIComponent(atob(trimmed));
    const parsed = JSON.parse(decodedJson);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.sessions)) return parsed.sessions;
  }
  throw new Error('Invalid backup format');
}

function formatTime(ms: number | null) {
  if (ms === null || ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}м ${s}с` : `${s}с`;
}

function MatchScoreChart({ match }: { match: MatchRecord }) {
  const data = [
    { step: '0', [match.p1.name]: 0, [match.p2.name]: 0 },
    ...match.events.map((ev, idx) => ({
      step: `${idx + 1}`,
      [match.p1.name]: ev.scoreAfterP1,
      [match.p2.name]: ev.scoreAfterP2,
    })),
  ];

  if (match.events.length === 0) {
    return (
      <p className="py-4 text-center text-xs opacity-50">
        Нет результативных действий в этой партии
      </p>
    );
  }

  return (
    <div className="h-44 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
          <XAxis dataKey="step" tick={{ fontSize: 10 }} opacity={0.5} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} opacity={0.5} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--neutral)',
              color: 'var(--neutral-foreground)',
              borderRadius: '14px',
              border: 'none',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey={match.p1.name}
            stroke="var(--approve)"
            fill="var(--approve)"
            fillOpacity={0.25}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey={match.p2.name}
            stroke="var(--piramid-ball-shadow)"
            fill="var(--piramid-ball-mid)"
            fillOpacity={0.2}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
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

function SessionAccordionItem({
  session: rawSession,
  defaultExpanded = false,
  onShare,
  onRequestDelete,
}: {
  session: GameSessionRecord;
  defaultExpanded?: boolean;
  onShare: (session: GameSessionRecord) => void;
  onRequestDelete: (session: GameSessionRecord) => void;
}) {
  const session = useMemo(
    () => normalizeSessionWinnerLeft(rawSession),
    [rawSession]
  );

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);

  const activeMatch = session.matches[selectedMatchIdx] ?? session.matches[0];
  const dateFormatted = new Date(session.endedAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-background/80 text-foreground relative rounded-2xl p-3 backdrop-blur-lg">
      <div
        onClick={() => setExpanded((prev) => !prev)}
        className="bg-neutral text-neutral-foreground sticky top-2 z-20 flex cursor-pointer flex-col gap-2 rounded-2xl px-4 py-3 shadow-md transition-all"
      >
        <div className="flex items-center justify-between gap-2 text-[11px] opacity-60">
          <span className="truncate">{MODE_LABELS[session.mode]}</span>
          <span className="shrink-0">{dateFormatted}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {session.winnerId === 'p1' && (
              <CrownIcon weight="fill" className="text-gold size-4 shrink-0" />
            )}
            <span className="truncate text-sm font-bold sm:text-base">
              {session.p1.name}
            </span>
          </div>

          <span className="bg-background/15 shrink-0 rounded-lg px-2.5 py-0.5 text-sm font-extrabold whitespace-nowrap">
            {session.p1.roundsWon} : {session.p2.roundsWon}
          </span>

          <div className="flex min-w-0 flex-1 items-center justify-end">
            <span className="truncate text-right text-sm font-bold opacity-85 sm:text-base">
              {session.p2.name}
            </span>
          </div>
        </div>

        <div className="border-neutral-foreground/10 flex items-center justify-between border-t pt-2">
          <span className="text-[11px] opacity-55">
            Общее время: {formatTime(session.totalDurationMs)}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Поделиться"
              onClick={(e) => {
                e.stopPropagation();
                onShare(session);
              }}
              className="hover:bg-background/20 flex size-8 items-center justify-center rounded-full transition-colors"
            >
              <ShareNetworkIcon className="size-4" />
            </button>

            <button
              type="button"
              title="Удалить сессию"
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(session);
              }}
              className="text-destructive hover:bg-destructive/20 flex size-8 items-center justify-center rounded-full transition-colors"
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
              className="hover:bg-background/20 flex size-8 items-center justify-center rounded-full transition-colors"
            >
              <CaretDownIcon
                className={cn(
                  'size-4 transition-transform duration-200',
                  expanded && 'rotate-180'
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-4 px-1 pt-2">
          <div className="flex flex-col gap-2.5">
            <StatComparisonRow
              label="Забито шаров"
              v1={session.p1.totalBallsPotted}
              v2={session.p2.totalBallsPotted}
            />
            <StatComparisonRow
              label="Общий счет (очки)"
              v1={session.p1.totalScore}
              v2={session.p2.totalScore}
            />
            <StatComparisonRow
              label="Макс. серия (шары)"
              v1={session.p1.maxStreakBalls}
              v2={session.p2.maxStreakBalls}
            />
            <StatComparisonRow
              label="Средняя серия"
              v1={session.p1.avgStreakBalls}
              v2={session.p2.avgStreakBalls}
            />
            <StatComparisonRow
              label="Штрафы"
              v1={session.p1.totalPenaltiesCommitted}
              v2={session.p2.totalPenaltiesCommitted}
            />
            <div className="flex justify-between pt-1 text-xs">
              <span className="font-semibold">
                {formatTime(session.p1.avgTimePerPotMs)}
              </span>
              <span className="opacity-60">Среднее время на шар</span>
              <span className="font-semibold">
                {formatTime(session.p2.avgTimePerPotMs)}
              </span>
            </div>
          </div>

          {session.matches.length > 0 && (
            <div className="border-foreground/10 flex flex-col gap-2 border-t pt-3">
              <p className="text-xs font-semibold tracking-wider uppercase opacity-60">
                Партии внутри сессии
              </p>
              <div className="flex flex-wrap gap-1.5">
                {session.matches.map((m, idx) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setSelectedMatchIdx(idx)}
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-xs transition-all',
                      selectedMatchIdx === idx
                        ? 'bg-neutral text-neutral-foreground font-semibold'
                        : 'bg-foreground/10 text-foreground opacity-70'
                    )}
                  >
                    Партия {m.roundNumber} ({m.p1.finalScore}:{m.p2.finalScore})
                  </button>
                ))}
              </div>

              {activeMatch && (
                <div className="bg-foreground/5 mt-1 rounded-2xl p-3">
                  <div className="flex items-center justify-between text-xs opacity-75">
                    <span>
                      Длительность: {formatTime(activeMatch.durationMs)}
                    </span>
                    <span>Смен лидера: {activeMatch.leadChanges}</span>
                  </div>

                  <MatchScoreChart match={activeMatch} />

                  <div className="border-foreground/10 mt-2 grid grid-cols-2 gap-2 border-t pt-2 text-xs">
                    <div>
                      <div className="text-approve font-bold">
                        {activeMatch.p1.name}
                      </div>
                      <div className="opacity-70">
                        Серии: {activeMatch.p1.streaks.join(', ') || '0'}
                      </div>
                      {activeMatch.p1.pottedBallNumbers.length > 0 && (
                        <div className="opacity-70">
                          Шары: {activeMatch.p1.pottedBallNumbers.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{activeMatch.p2.name}</div>
                      <div className="opacity-70">
                        Серии: {activeMatch.p2.streaks.join(', ') || '0'}
                      </div>
                      {activeMatch.p2.pottedBallNumbers.length > 0 && (
                        <div className="opacity-70">
                          Шары: {activeMatch.p2.pottedBallNumbers.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HistoryPage() {
  const { savedSessions = [], deleteSession, importSessions } = useGameStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shareSession, setShareSession] = useState<GameSessionRecord | null>(
    null
  );
  const [sessionToDelete, setSessionToDelete] =
    useState<GameSessionRecord | null>(null);
  const [isBackupDrawerOpen, setIsBackupDrawerOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const highlightedSessionId = searchParams.get('session');
  const shouldOpenShare = searchParams.get('share') === '1';

  useEffect(() => {
    if (highlightedSessionId && shouldOpenShare) {
      const found = savedSessions.find((s) => s.id === highlightedSessionId);
      if (found) {
        setShareSession(found);
        setSearchParams({ session: highlightedSessionId }, { replace: true });
      }
    }
  }, [highlightedSessionId, shouldOpenShare, savedSessions, setSearchParams]);

  const totalMatchesPlayed = savedSessions.reduce(
    (acc, s) => acc + s.matchesCount,
    0
  );
  const totalBallsPotted = savedSessions.reduce(
    (acc, s) => acc + s.p1.totalBallsPotted + s.p2.totalBallsPotted,
    0
  );

  const handleConfirmDelete = () => {
    if (!sessionToDelete) return;
    deleteSession(sessionToDelete.id);
    setSessionToDelete(null);
    toast.success('Сессия удалена из истории');
  };

  const handleCopyBackupCode = async () => {
    if (savedSessions.length === 0) {
      toast.warning('История пока пуста');
      return;
    }
    try {
      const code = encodeBackup(savedSessions);
      await navigator.clipboard.writeText(code);
      toast.success('Код истории скопирован в буфер обмена');
    } catch {
      toast.error('Не удалось скопировать в буфер');
    }
  };

  const handleExportFile = async () => {
    if (savedSessions.length === 0) {
      toast.warning('История пока пуста');
      return;
    }
    const json = JSON.stringify(
      { version: 1, exportedAt: Date.now(), sessions: savedSessions },
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
          title: 'История матчей — Русский бильярд',
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
      const parsedSessions = decodeBackup(raw);
      const addedCount = importSessions(parsedSessions);
      if (addedCount > 0) {
        toast.success(`Добавлено новых сессий: ${addedCount}`);
      } else {
        toast.info('Все эти сессии уже есть в вашей истории');
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
        История матчей
      </PageHeader>

      {savedSessions.length > 0 && (
        <div className="bg-background/80 grid grid-cols-3 gap-2 rounded-2xl p-3 text-center backdrop-blur-lg">
          <div>
            <div className="text-xl font-bold">{savedSessions.length}</div>
            <div className="text-xs opacity-60">Сессий</div>
          </div>
          <div>
            <div className="text-xl font-bold">{totalMatchesPlayed}</div>
            <div className="text-xs opacity-60">Партий</div>
          </div>
          <div>
            <div className="text-xl font-bold">{totalBallsPotted}</div>
            <div className="text-xs opacity-60">Забито шаров</div>
          </div>
        </div>
      )}

      {savedSessions.length === 0 ? (
        <div className="bg-background/80 flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center backdrop-blur-lg">
          <TrophyIcon className="size-12 opacity-40" />
          <p className="text-lg font-medium">История пока пуста</p>
          <p className="text-sm opacity-60">
            Завершите хотя бы одну игровую сессию или импортируйте сохраненную
            историю.
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
          {savedSessions.map((session, index) => (
            <SessionAccordionItem
              key={session.id}
              session={session}
              defaultExpanded={
                session.id === highlightedSessionId || index === 0
              }
              onShare={(s) => setShareSession(s)}
              onRequestDelete={(s) => setSessionToDelete(s)}
            />
          ))}
        </div>
      )}

      <ShareSessionDrawer
        session={shareSession}
        isOpen={shareSession !== null}
        onOpenChange={(open) => {
          if (!open) setShareSession(null);
        }}
      />

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
                Перенесите историю матчей устройствами или
                сохраните резервную копию.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center justify-center gap-1.5"
                  onClick={handleCopyBackupCode}
                >
                  <CopyIcon className="size-4" />
                  В буфер
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
                Новые матчи автоматически объединятся с текущими без дублей.
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
        isOpen={sessionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null);
        }}
        closeBtn={
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setSessionToDelete(null)}
          >
            Отмена
          </Button>
        }
        content={
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-xl font-medium">Удалить сессию из истории?</p>
            <p className="text-neutral-foreground/70 text-sm">
              Матч{' '}
              <strong>
                {sessionToDelete?.p1.name} vs {sessionToDelete?.p2.name}
              </strong>{' '}
              будет удален безвозвратно.
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

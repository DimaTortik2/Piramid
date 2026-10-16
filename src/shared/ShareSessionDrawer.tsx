import { useEffect, useMemo, useState } from 'react';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { Button } from '@/shared/Button';
import { Circle } from '@/shared/Circle';
import type { GameSessionRecord, GameMode } from '@/shared/store/gameStore';
import {
  ShareNetworkIcon,
  DownloadSimpleIcon,
  CopyIcon,
  CheckIcon,
  CrownIcon,
  FireIcon,
  ClockIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils/cn';

const MODE_NAMES: Record<GameMode, string> = {
  'free-pyramid': 'Свободная пирамида',
  'combined-pyramid': 'Комбинированная пирамида',
  'dynamic-pyramid': 'Динамичная пирамида',
  'classic-pyramid': 'Русская пирамида (71)',
  'continuous-free-pyramid': 'Свободная с продолжением',
};

export function normalizeSessionWinnerLeft(
  session: GameSessionRecord
): GameSessionRecord {
  if (session.winnerId !== 'p2') return session;

  return {
    ...session,
    winnerId: 'p1',
    p1: session.p2,
    p2: session.p1,
    matches: session.matches.map((m) => ({
      ...m,
      winnerId:
        m.winnerId === 'p1' ? 'p2' : m.winnerId === 'p2' ? 'p1' : m.winnerId,
      p1: { ...m.p2, playerId: 'p1' },
      p2: { ...m.p1, playerId: 'p2' },
      maxLeadP1: m.maxLeadP2,
      maxLeadP2: m.maxLeadP1,
      events: m.events.map((ev) => ({
        ...ev,
        playerId: ev.playerId === 'p1' ? 'p2' : 'p1',
        beneficiaryId: ev.beneficiaryId === 'p1' ? 'p2' : 'p1',
        pointsDeltaP1: ev.pointsDeltaP2,
        pointsDeltaP2: ev.pointsDeltaP1,
        scoreAfterP1: ev.scoreAfterP2,
        scoreAfterP2: ev.scoreAfterP1,
      })),
    })),
  };
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h} ч ${m} мин`;
  if (m > 0) return `${m} мин ${s} сек`;
  return `${s} сек`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCrownIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  const w = size;
  const h = size * 0.78;
  const left = cx - w / 2;
  const top = cy - h / 2;

  ctx.beginPath();
  ctx.moveTo(left + w * 0.08, top + h);
  ctx.lineTo(left, top + h * 0.22);
  ctx.lineTo(left + w * 0.28, top + h * 0.52);
  ctx.lineTo(cx, top);
  ctx.lineTo(left + w * 0.72, top + h * 0.52);
  ctx.lineTo(left + w, top + h * 0.22);
  ctx.lineTo(left + w * 0.92, top + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

async function generateSessionCardBlob(
  rawSession: GameSessionRecord
): Promise<Blob | null> {
  const session = normalizeSessionWinnerLeft(rawSession);
  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1180;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bgMain = '#1c1c1f';
  const bgCard = '#27272b';
  const textLight = '#f4efe1';
  const textMuted = 'rgba(244, 239, 225, 0.52)';
  const accentGreen = '#52b765';
  const goldColor = '#f5c451';
  const ballShadowColor = '#bdb397';

  roundRect(ctx, 0, 0, W, H, 64);
  ctx.fillStyle = bgMain;
  ctx.fill();

  const topGlow = ctx.createRadialGradient(W / 2, 100, 30, W / 2, 180, 520);
  topGlow.addColorStop(0, 'rgba(245, 196, 81, 0.14)');
  topGlow.addColorStop(1, 'rgba(245, 196, 81, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 560);

  const dateStr = new Date(session.endedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ctx.font = '700 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = accentGreen;
  ctx.textAlign = 'left';
  ctx.fillText(MODE_NAMES[session.mode].toUpperCase(), 68, 92);

  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 68, 92);

  // Главное табло со счетом
  roundRect(ctx, 64, 136, W - 128, 350, 48);
  ctx.fillStyle = bgCard;
  ctx.fill();

  const hasWinner = session.winnerId === 'p1';

  if (hasWinner) {
    const badgeX = 260;
    roundRect(ctx, badgeX - 115, 172, 230, 46, 23);
    ctx.fillStyle = 'rgba(245, 196, 81, 0.18)';
    ctx.fill();

    drawCrownIcon(ctx, badgeX - 68, 194, 26, goldColor);

    ctx.font = '700 23px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = goldColor;
    ctx.textAlign = 'center';
    ctx.fillText('ПОБЕДА', badgeX + 14, 203);
  } else {
    ctx.font = '700 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('НИЧЬЯ', W / 2, 204);
  }

  ctx.font = '800 156px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';

  ctx.fillStyle = hasWinner ? accentGreen : textLight;
  ctx.fillText(String(session.p1.roundsWon), 260, 364);

  ctx.fillStyle = 'rgba(244, 239, 225, 0.22)';
  ctx.fillText(':', W / 2, 352);

  ctx.fillStyle = textLight;
  ctx.fillText(String(session.p2.roundsWon), W - 260, 364);

  ctx.font = '700 38px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(session.p1.name.slice(0, 15), 260, 438, 360);
  ctx.fillText(session.p2.name.slice(0, 15), W - 260, 438, 360);

  // Секция: Забитые шары (противостояние двух цветов)
  roundRect(ctx, 64, 518, W - 128, 215, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();

  ctx.font = '600 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'center';
  ctx.fillText('ЗАБИТО ШАРОВ', W / 2, 580);

  ctx.font = '800 62px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.textAlign = 'left';
  ctx.fillText(String(session.p1.totalBallsPotted), 112, 648);

  ctx.textAlign = 'right';
  ctx.fillText(String(session.p2.totalBallsPotted), W - 112, 648);

  const barX = 112;
  const barY = 676;
  const barW = W - 224;
  const barH = 22;
  const totalBalls =
    session.p1.totalBallsPotted + session.p2.totalBallsPotted;
  const p1Ratio =
    totalBalls > 0 ? session.p1.totalBallsPotted / totalBalls : 0.5;

  // Правая сторона (цвет бильярдного шара)
  roundRect(ctx, barX, barY, barW, barH, 11);
  ctx.fillStyle = ballShadowColor;
  ctx.fill();

  // Левая сторона (цвет победителя/акцента)
  if (p1Ratio > 0) {
    const p1BarW =
      p1Ratio >= 1
        ? barW
        : Math.max(22, Math.min(barW - 22, barW * p1Ratio));
    roundRect(ctx, barX, barY, p1BarW, barH, 11);
    ctx.fillStyle = accentGreen;
    ctx.fill();
  }

  // Две нижние карточки: Лучшая серия и Время в игре
  const halfW = (W - 128 - 32) / 2;

  roundRect(ctx, 64, 765, halfW, 275, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();

  ctx.font = '600 25px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'left';
  ctx.fillText('ЛУЧШАЯ СЕРИЯ', 106, 828);

  const bestStreak = Math.max(
    session.p1.maxStreakBalls,
    session.p2.maxStreakBalls
  );
  const streakHolder =
    session.p1.maxStreakBalls >= session.p2.maxStreakBalls
      ? session.p1.name
      : session.p2.name;

  ctx.font = '800 76px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = accentGreen;
  ctx.fillText(`${bestStreak}`, 106, 924);

  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(
    bestStreak > 0
      ? `${streakHolder.slice(0, 12)} (${session.p1.maxStreakBalls} vs ${session.p2.maxStreakBalls})`
      : 'Без серий',
    106,
    990,
    halfW - 84
  );

  // Правая карточка: Время и под ним количество партий
  const rightX = 64 + halfW + 32;
  roundRect(ctx, rightX, 765, halfW, 275, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();

  ctx.font = '600 25px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'left';
  ctx.fillText('ВРЕМЯ В ИГРЕ', rightX + 42, 828);

  ctx.font = '800 50px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(
    formatDuration(session.totalDurationMs),
    rightX + 42,
    915,
    halfW - 84
  );

  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.fillText(
    `Сыграно партий: ${session.matchesCount}`,
    rightX + 42,
    990,
    halfW - 84
  );

  ctx.font = '600 24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244, 239, 225, 0.35)';
  ctx.textAlign = 'center';
  ctx.fillText('РУССКИЙ БИЛЬЯРД • ИТОГИ МАТЧА', W / 2, 1116);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1);
  });
}

export function ShareSessionDrawer({
  session: rawSession,
  isOpen,
  onOpenChange,
}: {
  session: GameSessionRecord | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const session = useMemo(
    () => (rawSession ? normalizeSessionWinnerLeft(rawSession) : null),
    [rawSession]
  );

  const [pngBlob, setPngBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (session && isOpen) {
      setCopied(false);
      generateSessionCardBlob(session).then((blob) => {
        if (active) setPngBlob(blob);
      });
    } else {
      setPngBlob(null);
    }
    return () => {
      active = false;
    };
  }, [session, isOpen]);

  if (!session) return null;

  const dateStr = new Date(session.endedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalBalls =
    session.p1.totalBallsPotted + session.p2.totalBallsPotted;
  const p1Ratio =
    totalBalls > 0
      ? Math.round((session.p1.totalBallsPotted / totalBalls) * 100)
      : 50;

  const bestStreak = Math.max(
    session.p1.maxStreakBalls,
    session.p2.maxStreakBalls
  );
  const bestStreakHolder =
    session.p1.maxStreakBalls >= session.p2.maxStreakBalls
      ? session.p1.name
      : session.p2.name;

  const ensureBlob = async () => {
    if (pngBlob) return pngBlob;
    return await generateSessionCardBlob(session);
  };

  const handleDownload = async () => {
    const blob = await ensureBlob();
    if (!blob) {
      toast.error('Не удалось создать изображение');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billiard-${session.id.slice(0, 6)}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Изображение скачано');
  };

  const handleCopy = async () => {
    try {
      const blob = await ensureBlob();
      if (!blob) throw new Error('No blob');
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      toast.success('Картинка скопирована в буфер обмена');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Браузер не поддержал копирование картинки');
    }
  };

  const handleShare = async () => {
    try {
      const blob = await ensureBlob();
      if (!blob) throw new Error('No blob');
      const file = new File([blob], `billiard-${session.id.slice(0, 6)}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${session.p1.name} vs ${session.p2.name}`,
          text: `${MODE_NAMES[session.mode]} — ${session.p1.roundsWon}:${session.p2.roundsWon}`,
          files: [file],
        });
      } else {
        await handleCopy();
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        await handleDownload();
      }
    }
  };

  return (
    <InfoDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      closeBtn={
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Закрыть
        </Button>
      }
      content={
        <div className="flex flex-col items-center gap-4 py-1">
          <div className="bg-neutral text-neutral-foreground relative w-full overflow-hidden rounded-3xl p-4 sm:p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
              <span className="text-approve truncate font-semibold tracking-wider uppercase">
                {MODE_NAMES[session.mode]}
              </span>
              <span className="shrink-0 opacity-50">{dateStr}</span>
            </div>

            <div className="bg-background/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  {session.winnerId === 'p1' ? (
                    <span className="bg-gold/15 text-gold flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      <CrownIcon weight="fill" className="size-3.5" /> Победа
                    </span>
                  ) : (
                    <span className="h-5" />
                  )}
                  <span
                    className={cn(
                      'text-5xl font-extrabold tracking-tight',
                      session.winnerId === 'p1' && 'text-approve'
                    )}
                  >
                    {session.p1.roundsWon}
                  </span>
                  <span className="w-full truncate text-center text-sm font-bold">
                    {session.p1.name}
                  </span>
                </div>

                <div className="text-3xl font-bold opacity-25">:</div>

                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="h-5" />
                  <span className="text-5xl font-extrabold tracking-tight">
                    {session.p2.roundsWon}
                  </span>
                  <span className="w-full truncate text-center text-sm font-bold">
                    {session.p2.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-background/10 mt-3 rounded-2xl p-3.5">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-lg font-extrabold">
                  {session.p1.totalBallsPotted}
                </span>
                <span className="text-[11px] tracking-wider uppercase opacity-60">
                  Забито шаров
                </span>
                <span className="text-lg font-extrabold">
                  {session.p2.totalBallsPotted}
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-approve transition-all"
                  style={{ width: `${p1Ratio}%` }}
                />
                <div
                  className="bg-piramid-ball-shadow transition-all"
                  style={{ width: `${100 - p1Ratio}%` }}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-background/10 flex flex-col justify-between rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase opacity-60">
                  <FireIcon
                    weight="fill"
                    className="text-approve size-3.5 shrink-0"
                  />
                  <span className="truncate">Лучшая серия</span>
                </div>
                <div className="mt-1.5 flex flex-col">
                  <span className="text-approve text-2xl font-extrabold leading-none">
                    {bestStreak}
                  </span>
                  <span className="mt-1 truncate text-[11px] opacity-75">
                    {bestStreak > 0
                      ? `${bestStreakHolder} (${session.p1.maxStreakBalls} vs ${session.p2.maxStreakBalls})`
                      : 'Без серий'}
                  </span>
                </div>
              </div>

              <div className="bg-background/10 flex flex-col justify-between rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase opacity-60">
                  <ClockIcon weight="fill" className="size-3.5 shrink-0" />
                  <span className="truncate">Время в игре</span>
                </div>
                <div className="mt-1.5 flex flex-col">
                  <span className="truncate text-base sm:text-lg font-extrabold leading-tight">
                    {formatDuration(session.totalDurationMs)}
                  </span>
                  <span className="mt-1 text-[11px] opacity-60">
                    Сыграно партий: {session.matchesCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 pt-1">
            <Button
              variant="primary"
              className="flex flex-1 items-center justify-center gap-2"
              onClick={handleShare}
            >
              <ShareNetworkIcon className="size-5" />
              Поделиться
            </Button>

            <button
              type="button"
              onClick={handleCopy}
              title="Скопировать PNG в буфер"
            >
              <Circle className="bg-neutral text-neutral-foreground hover:bg-neutral/80 size-12">
                {copied ? (
                  <CheckIcon className="text-approve size-5" />
                ) : (
                  <CopyIcon className="size-5" />
                )}
              </Circle>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Скачать PNG"
            >
              <Circle className="bg-neutral text-neutral-foreground hover:bg-neutral/80 size-12">
                <DownloadSimpleIcon className="size-5" />
              </Circle>
            </button>
          </div>
        </div>
      }
    />
  );
}
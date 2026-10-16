import { useEffect, useState } from 'react';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { Button } from '@/shared/Button';
import { Circle } from '@/shared/Circle';
import type { GameSessionRecord, GameMode } from '@/shared/store/gameStore';
import {
  ShareNetworkIcon,
  DownloadSimpleIcon,
  CopyIcon,
  CheckIcon,
  TrophyIcon,
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

function drawBilliardBall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  active: boolean
) {
  ctx.save();
  if (!active) {
    ctx.globalAlpha = 0.22;
  }
  const grad = ctx.createRadialGradient(
    cx - r * 0.3,
    cy - r * 0.3,
    r * 0.1,
    cx,
    cy,
    r
  );
  grad.addColorStop(0, '#f0ebd8');
  grad.addColorStop(0.65, '#d6cfb7');
  grad.addColorStop(1, '#bdb397');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

async function generateSessionCardBlob(
  session: GameSessionRecord
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1280;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bgMain = '#161618';
  const bgCard = '#202024';
  const textLight = '#f4efe1';
  const textMuted = 'rgba(244, 239, 225, 0.5)';
  const accentGreen = '#52b765';
  const woodShelf = '#3d2817';

  // Основной фон карточки
  roundRect(ctx, 0, 0, W, H, 64);
  ctx.fillStyle = bgMain;
  ctx.fill();

  // Мягкое зеленое свечение сверху
  const topGlow = ctx.createRadialGradient(W / 2, 120, 40, W / 2, 200, 560);
  topGlow.addColorStop(0, 'rgba(82, 183, 101, 0.18)');
  topGlow.addColorStop(1, 'rgba(82, 183, 101, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 650);

  // Верхняя плашка: режим и дата
  const dateStr = new Date(session.endedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ctx.font = '600 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = accentGreen;
  ctx.textAlign = 'left';
  ctx.fillText(MODE_NAMES[session.mode].toUpperCase(), 72, 96);

  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 72, 96);

  // Главное табло со счетом
  roundRect(ctx, 64, 145, W - 128, 430, 48);
  ctx.fillStyle = bgCard;
  ctx.fill();

  const p1Won = session.winnerId === 'p1';
  const p2Won = session.winnerId === 'p2';

  // Бейдж победителя
  ctx.font = '700 24px system-ui, -apple-system, sans-serif';
  if (p1Won || p2Won) {
    const badgeX = p1Won ? 245 : W - 245;
    roundRect(ctx, badgeX - 110, 182, 220, 44, 22);
    ctx.fillStyle = 'rgba(82, 183, 101, 0.2)';
    ctx.fill();
    ctx.fillStyle = accentGreen;
    ctx.textAlign = 'center';
    ctx.fillText('★ ПОБЕДА', badgeX, 212);
  } else {
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('НИЧЬЯ', W / 2, 212);
  }

  // Гигантский счет по партиям
  ctx.font = '800 164px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';

  ctx.fillStyle = p1Won ? accentGreen : textLight;
  ctx.fillText(String(session.p1.roundsWon), 245, 380);

  ctx.fillStyle = 'rgba(244, 239, 225, 0.22)';
  ctx.fillText(':', W / 2, 368);

  ctx.fillStyle = p2Won ? accentGreen : textLight;
  ctx.fillText(String(session.p2.roundsWon), W - 245, 380);

  // Имена игроков
  ctx.font = '700 38px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(session.p1.name.slice(0, 14), 245, 455);
  ctx.fillText(session.p2.name.slice(0, 14), W - 245, 455);

  // Полки с бильярдными шарами (визуализация доминации)
  const totalBalls =
    session.p1.totalBallsPotted + session.p2.totalBallsPotted || 1;
  const p1ShelfBalls = Math.max(
    1,
    Math.round((session.p1.totalBallsPotted / totalBalls) * 5)
  );
  const p2ShelfBalls = Math.max(
    1,
    Math.round((session.p2.totalBallsPotted / totalBalls) * 5)
  );

  for (let i = 0; i < 5; i++) {
    drawBilliardBall(
      ctx,
      145 + i * 50,
      508,
      18,
      session.p1.totalBallsPotted > 0 && i < p1ShelfBalls
    );
    drawBilliardBall(
      ctx,
      W - 345 + i * 50,
      508,
      18,
      session.p2.totalBallsPotted > 0 && i < p2ShelfBalls
    );
  }

  roundRect(ctx, 115, 532, 260, 14, 7);
  ctx.fillStyle = woodShelf;
  ctx.fill();

  roundRect(ctx, W - 375, 532, 260, 14, 7);
  ctx.fillStyle = woodShelf;
  ctx.fill();

  // Секция: Забитые шары (Полоса сравнения)
  roundRect(ctx, 64, 610, W - 128, 220, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();

  ctx.font = '600 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'center';
  ctx.fillText('ЗАБИТО ШАРОВ ЗА СЕССИЮ', W / 2, 668);

  ctx.font = '800 64px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.textAlign = 'left';
  ctx.fillText(String(session.p1.totalBallsPotted), 115, 745);

  ctx.textAlign = 'right';
  ctx.fillText(String(session.p2.totalBallsPotted), W - 115, 745);

  // Полоса баланса шаров
  const barX = 115;
  const barY = 775;
  const barW = W - 230;
  const barH = 22;
  const p1Ratio =
    session.p1.totalBallsPotted + session.p2.totalBallsPotted > 0
      ? session.p1.totalBallsPotted /
        (session.p1.totalBallsPotted + session.p2.totalBallsPotted)
      : 0.5;

  roundRect(ctx, barX, barY, barW, barH, 11);
  ctx.fillStyle = 'rgba(244, 239, 225, 0.14)';
  ctx.fill();

  const p1BarW = Math.max(22, Math.min(barW - 22, barW * p1Ratio));
  roundRect(ctx, barX, barY, p1BarW, barH, 11);
  ctx.fillStyle = accentGreen;
  ctx.fill();

  // Две нижние выразительные карточки: Лучшая серия и Время сессии
  const halfW = (W - 128 - 32) / 2;

  // Левая карточка: Максимальная серия
  roundRect(ctx, 64, 862, halfW, 270, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();

  ctx.font = '600 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'left';
  ctx.fillText('ЛУЧШАЯ СЕРИЯ', 108, 924);

  const bestStreak = Math.max(
    session.p1.maxStreakBalls,
    session.p2.maxStreakBalls
  );
  const streakHolder =
    session.p1.maxStreakBalls >= session.p2.maxStreakBalls
      ? session.p1.name
      : session.p2.name;

  ctx.font = '800 84px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = accentGreen;
  ctx.fillText(`${bestStreak}`, 108, 1028);

  ctx.font = '500 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(
    bestStreak > 0
      ? `${streakHolder.slice(0, 14)} (${session.p1.maxStreakBalls} vs ${session.p2.maxStreakBalls})`
      : 'Без серий',
    108,
    1088
  );

  // Правая карточка: Время и темп
  const rightX = 64 + halfW + 32;
  roundRect(ctx, rightX, 862, halfW, 270, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();

  ctx.font = '600 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.fillText('ВРЕМЯ В ИГРЕ', rightX + 44, 924);

  ctx.font = '800 68px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(formatDuration(session.totalDurationMs), rightX + 44, 1020);

  ctx.font = '500 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.fillText(
    `Сыграно партий: ${session.matchesCount}`,
    rightX + 44,
    1088
  );

  // Нижний колонтитул
  ctx.font = '600 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244, 239, 225, 0.35)';
  ctx.textAlign = 'center';
  ctx.fillText('РУССКИЙ БИЛЬЯРД • ИТОГИ МАТЧА', W / 2, 1210);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1);
  });
}

const MiniShelf = ({ activeBalls }: { activeBalls: number }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'size-3.5 rounded-full transition-all',
            i < activeBalls
              ? 'bg-piramid-ball-main shadow-inner'
              : 'bg-piramid-ball-mid/25'
          )}
        />
      ))}
    </div>
    <div className="bg-billiard-border h-1.5 w-24 rounded-full" />
  </div>
);

export function ShareSessionDrawer({
  session,
  isOpen,
  onOpenChange,
}: {
  session: GameSessionRecord | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
    month: 'short',
  });

  const totalBalls =
    session.p1.totalBallsPotted + session.p2.totalBallsPotted || 1;
  const p1Ratio = Math.round((session.p1.totalBallsPotted / totalBalls) * 100);
  const p1Shelf =
    session.p1.totalBallsPotted > 0
      ? Math.max(1, Math.round((session.p1.totalBallsPotted / totalBalls) * 5))
      : 0;
  const p2Shelf =
    session.p2.totalBallsPotted > 0
      ? Math.max(1, Math.round((session.p2.totalBallsPotted / totalBalls) * 5))
      : 0;

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
          {/* Выразительная карточка в цветах дизайн-системы */}
          <div className="bg-neutral text-neutral-foreground relative w-full overflow-hidden rounded-3xl p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-approve font-semibold tracking-wider uppercase">
                {MODE_NAMES[session.mode]}
              </span>
              <span className="opacity-50">{dateStr}</span>
            </div>

            <div className="bg-background/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 flex-col items-center gap-1.5">
                  {session.winnerId === 'p1' ? (
                    <span className="bg-approve/20 text-approve flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      <TrophyIcon weight="fill" className="size-3" /> Победа
                    </span>
                  ) : (
                    <span className="h-4" />
                  )}
                  <span
                    className={cn(
                      'text-5xl font-extrabold tracking-tight',
                      session.winnerId === 'p1' && 'text-approve'
                    )}
                  >
                    {session.p1.roundsWon}
                  </span>
                  <span className="max-w-[110px] truncate text-sm font-semibold">
                    {session.p1.name}
                  </span>
                  <MiniShelf activeBalls={p1Shelf} />
                </div>

                <div className="text-3xl font-bold opacity-25">:</div>

                <div className="flex flex-1 flex-col items-center gap-1.5">
                  {session.winnerId === 'p2' ? (
                    <span className="bg-approve/20 text-approve flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      <TrophyIcon weight="fill" className="size-3" /> Победа
                    </span>
                  ) : (
                    <span className="h-4" />
                  )}
                  <span
                    className={cn(
                      'text-5xl font-extrabold tracking-tight',
                      session.winnerId === 'p2' && 'text-approve'
                    )}
                  >
                    {session.p2.roundsWon}
                  </span>
                  <span className="max-w-[110px] truncate text-sm font-semibold">
                    {session.p2.name}
                  </span>
                  <MiniShelf activeBalls={p2Shelf} />
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
              <div className="bg-neutral-foreground/15 flex h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-approve transition-all"
                  style={{ width: `${p1Ratio}%` }}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-background/10 flex flex-col justify-between rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] uppercase opacity-60">
                  <FireIcon weight="fill" className="text-approve size-4" />
                  Лучшая серия
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-approve text-2xl font-extrabold">
                    {bestStreak}
                  </span>
                  <span className="truncate text-xs opacity-75">
                    {bestStreak > 0 ? bestStreakHolder : '—'}
                  </span>
                </div>
              </div>

              <div className="bg-background/10 flex flex-col justify-between rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] uppercase opacity-60">
                  <ClockIcon weight="fill" className="size-4" />
                  Время в игре
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-extrabold">
                    {formatDuration(session.totalDurationMs)}
                  </span>
                  <span className="text-xs opacity-50">
                    {session.matchesCount} парт.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Панель действий: целевая кнопка Поделиться + иконки Копировать и Скачать */}
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
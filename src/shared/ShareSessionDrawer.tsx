import { useEffect, useMemo, useState } from 'react';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { Button } from '@/shared/Button';
import { Circle } from '@/shared/Circle';
import type { MatchRecord, GameMode } from '@/shared/store/gameStore';
import {
  ShareNetworkIcon,
  DownloadSimpleIcon,
  CopyIcon,
  CheckIcon,
  CrownIcon,
  FireIcon,
  ClockIcon,
  CameraIcon,
  ArrowArcLeftIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils/cn';
import { isTelegramMiniApp, shareToTelegram } from '@/shared/lib/telegram';

const MODE_NAMES: Record<GameMode, string> = {
  'free-pyramid': 'Свободная пирамида',
  'combined-pyramid': 'Комбинированная пирамида',
  'dynamic-pyramid': 'Динамичная пирамида',
  'classic-pyramid': 'Русская пирамида',
  'continuous-free-pyramid': 'Свободная с продолжением',
};

export function normalizeMatchWinnerLeft(match: MatchRecord): MatchRecord {
  if (match.winnerId !== 'p2') return match;

  return {
    ...match,
    winnerId: 'p1',
    p1: { ...match.p2, playerId: 'p1' },
    p2: { ...match.p1, playerId: 'p2' },
    maxLeadP1: match.maxLeadP2,
    maxLeadP2: match.maxLeadP1,
    events: match.events.map((ev) => ({
      ...ev,
      playerId: ev.playerId === 'p1' ? 'p2' : 'p1',
      beneficiaryId: ev.beneficiaryId === 'p1' ? 'p2' : 'p1',
      pointsDeltaP1: ev.pointsDeltaP2,
      pointsDeltaP2: ev.pointsDeltaP1,
      scoreAfterP1: ev.scoreAfterP2,
      scoreAfterP2: ev.scoreAfterP1,
    })),
  };
}

export const normalizeSessionWinnerLeft = normalizeMatchWinnerLeft;

export function buildShareCaption(match: MatchRecord): string {
  const m = normalizeMatchWinnerLeft(match);
  const winnerLine =
    m.winnerId === 'draw' ? 'Ничья!' : `Победа: ${m.p1.name}`;
  return `Русский бильярд!\n${winnerLine}\n${MODE_NAMES[m.mode]} — ${m.p1.finalScore}:${m.p2.finalScore}`;
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

interface CardAsset {
  blob: Blob;
  file: File;
}

async function generateMatchCardAsset(
  rawMatch: MatchRecord
): Promise<CardAsset | null> {
  const match = normalizeMatchWinnerLeft(rawMatch);
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

  const dateStr = new Date(match.endedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ctx.font = '700 28px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = accentGreen;
  ctx.textAlign = 'left';
  ctx.fillText(MODE_NAMES[match.mode].toUpperCase(), 68, 92);

  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, W - 68, 92);

  roundRect(ctx, 64, 136, W - 128, 350, 48);
  ctx.fillStyle = bgCard;
  ctx.fill();

  const hasWinner = match.winnerId === 'p1';

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
  ctx.fillText(String(match.p1.finalScore), 260, 364);

  ctx.fillStyle = 'rgba(244, 239, 225, 0.22)';
  ctx.fillText(':', W / 2, 352);

  ctx.fillStyle = textLight;
  ctx.fillText(String(match.p2.finalScore), W - 260, 364);

  ctx.font = '700 38px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(match.p1.name.slice(0, 15), 260, 438, 360);
  ctx.fillText(match.p2.name.slice(0, 15), W - 260, 438, 360);

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
  ctx.fillText(String(match.p1.ballsPotted), 112, 648);

  ctx.textAlign = 'right';
  ctx.fillText(String(match.p2.ballsPotted), W - 112, 648);

  const barX = 112;
  const barY = 676;
  const barW = W - 224;
  const barH = 22;
  const totalBalls = match.p1.ballsPotted + match.p2.ballsPotted;
  const p1Ratio = totalBalls > 0 ? match.p1.ballsPotted / totalBalls : 0.5;

  roundRect(ctx, barX, barY, barW, barH, 11);
  ctx.fillStyle = ballShadowColor;
  ctx.fill();

  if (p1Ratio > 0) {
    const p1BarW =
      p1Ratio >= 1
        ? barW
        : Math.max(22, Math.min(barW - 22, barW * p1Ratio));
    roundRect(ctx, barX, barY, p1BarW, barH, 11);
    ctx.fillStyle = accentGreen;
    ctx.fill();
  }

  const halfW = (W - 128 - 32) / 2;

  roundRect(ctx, 64, 765, halfW, 275, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();

  ctx.font = '600 25px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'left';
  ctx.fillText('ЛУЧШАЯ СЕРИЯ', 106, 828);

  const bestStreak = Math.max(match.p1.maxStreakBalls, match.p2.maxStreakBalls);
  const streakHolder =
    match.p1.maxStreakBalls >= match.p2.maxStreakBalls
      ? match.p1.name
      : match.p2.name;

  ctx.font = '800 76px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = accentGreen;
  ctx.fillText(`${bestStreak}`, 106, 924);

  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(
    bestStreak > 0 ? streakHolder.slice(0, 15) : 'Без серий',
    106,
    990,
    halfW - 84
  );

  const rightX = 64 + halfW + 32;
  roundRect(ctx, rightX, 765, halfW, 275, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();

  ctx.font = '600 25px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.textAlign = 'left';
  ctx.fillText('ВРЕМЯ ПАРТИИ', rightX + 42, 828);

  ctx.font = '800 50px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textLight;
  ctx.fillText(
    formatDuration(match.durationMs),
    rightX + 42,
    915,
    halfW - 84
  );

  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = textMuted;
  ctx.fillText(
    `Штрафы: ${match.p1.penaltiesCommitted} : ${match.p2.penaltiesCommitted}`,
    rightX + 42,
    990,
    halfW - 84
  );

  ctx.font = '600 24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244, 239, 225, 0.35)';
  ctx.textAlign = 'center';
  ctx.fillText('РУССКИЙ БИЛЬЯРД • ИТОГИ ПАРТИИ', W / 2, 1116);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const fileName = `billiard-${match.id.slice(0, 6)}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        resolve({ blob, file });
      },
      'image/png',
      1
    );
  });
}

export function ShareSessionDrawer({
  match: rawMatch,
  session: legacyMatchProp,
  isOpen,
  onOpenChange,
  onUndo,
  closeLabel = 'Закрыть',
}: {
  match?: MatchRecord | null;
  session?: MatchRecord | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUndo?: () => void;
  closeLabel?: string;
}) {
  const targetMatch = rawMatch ?? legacyMatchProp ?? null;
  const match = useMemo(
    () => (targetMatch ? normalizeMatchWinnerLeft(targetMatch) : null),
    [targetMatch]
  );

  const [cardAsset, setCardAsset] = useState<CardAsset | null>(null);
  const [copied, setCopied] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);

  useEffect(() => {
    let active = true;
    if (match && isOpen) {
      setCopied(false);
      setScreenshotMode(false);
      generateMatchCardAsset(match).then((asset) => {
        if (active) setCardAsset(asset);
      });
    } else {
      setCardAsset(null);
      setScreenshotMode(false);
    }
    return () => {
      active = false;
    };
  }, [match, isOpen]);

  if (!match) return null;

  const shareText = buildShareCaption(match);
  const inTMA = isTelegramMiniApp();

  const dateStr = new Date(match.endedAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalBalls = match.p1.ballsPotted + match.p2.ballsPotted;
  const p1Ratio =
    totalBalls > 0 ? Math.round((match.p1.ballsPotted / totalBalls) * 100) : 50;

  const bestStreak = Math.max(match.p1.maxStreakBalls, match.p2.maxStreakBalls);
  const bestStreakHolder =
    match.p1.maxStreakBalls >= match.p2.maxStreakBalls
      ? match.p1.name
      : match.p2.name;

  const handleCopy = async () => {
    if (inTMA) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        toast.success('Текст результата скопирован');
        setTimeout(() => setCopied(false), 2500);
      } catch {
        toast.error('Не удалось скопировать');
      }
      return;
    }

    if (!cardAsset) return;
    try {
      const item = new ClipboardItem({
        'image/png': Promise.resolve(cardAsset.blob),
      });
      await navigator.clipboard.write([item]);
      setCopied(true);
      toast.success('Картинка скопирована в буфер обмена');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Скопирован текст результата');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    if (!cardAsset) return;
    const url = URL.createObjectURL(cardAsset.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cardAsset.file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Изображение скачано');
  };

  const handleShare = async () => {
    if (
      cardAsset &&
      navigator.canShare &&
      navigator.canShare({ files: [cardAsset.file] })
    ) {
      try {
        await navigator.share({
          files: [cardAsset.file],
          text: shareText,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    if (inTMA) {
      shareToTelegram(shareText);
      return;
    }

    await handleCopy();
  };

  return (
    <InfoDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      closeBtn={
        !screenshotMode ? (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {closeLabel}
          </Button>
        ) : undefined
      }
      content={
        <div className="flex flex-col items-center gap-3 py-1">
          <div
            onClick={() => inTMA && setScreenshotMode((prev) => !prev)}
            className="bg-neutral text-neutral-foreground relative w-full overflow-hidden rounded-3xl p-4 shadow-xl sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
              <span className="text-approve truncate font-semibold tracking-wider uppercase">
                {MODE_NAMES[match.mode]}
              </span>
              <span className="shrink-0 opacity-50">{dateStr}</span>
            </div>

            <div className="bg-background/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  {match.winnerId === 'p1' ? (
                    <span className="bg-gold/15 text-gold flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      <CrownIcon weight="fill" className="size-3.5" /> Победа
                    </span>
                  ) : (
                    <span className="h-5" />
                  )}
                  <span
                    className={cn(
                      'text-5xl font-extrabold tracking-tight',
                      match.winnerId === 'p1' && 'text-approve'
                    )}
                  >
                    {match.p1.finalScore}
                  </span>
                  <span className="w-full truncate text-center text-sm font-bold">
                    {match.p1.name}
                  </span>
                </div>

                <div className="text-3xl font-bold opacity-25">:</div>

                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="h-5" />
                  <span className="text-5xl font-extrabold tracking-tight">
                    {match.p2.finalScore}
                  </span>
                  <span className="w-full truncate text-center text-sm font-bold">
                    {match.p2.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-background/10 mt-3 rounded-2xl p-3.5">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-lg font-extrabold">
                  {match.p1.ballsPotted}
                </span>
                <span className="text-[11px] tracking-wider uppercase opacity-60">
                  Забито шаров
                </span>
                <span className="text-lg font-extrabold">
                  {match.p2.ballsPotted}
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
                <div className="flex items-center gap-1.5 text-[10px] uppercase opacity-60 sm:text-[11px]">
                  <FireIcon
                    weight="fill"
                    className="text-approve size-3.5 shrink-0"
                  />
                  <span className="truncate">Лучшая серия</span>
                </div>
                <div className="mt-1.5 flex flex-col">
                  <span className="text-approve text-2xl leading-none font-extrabold">
                    {bestStreak}
                  </span>
                  <span className="mt-1 truncate text-[11px] opacity-75">
                    {bestStreak > 0 ? bestStreakHolder : 'Без серий'}
                  </span>
                </div>
              </div>

              <div className="bg-background/10 flex flex-col justify-between rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase opacity-60 sm:text-[11px]">
                  <ClockIcon weight="fill" className="size-3.5 shrink-0" />
                  <span className="truncate">Время партии</span>
                </div>
                <div className="mt-1.5 flex flex-col">
                  <span className="truncate text-base leading-tight font-extrabold sm:text-lg">
                    {formatDuration(match.durationMs)}
                  </span>
                  <span className="mt-1 text-[11px] opacity-60">
                    Штрафы: {match.p1.penaltiesCommitted} :{' '}
                    {match.p2.penaltiesCommitted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!screenshotMode && (
            <>
              {inTMA && (
                <div
                  onClick={() => setScreenshotMode(true)}
                  className="bg-neutral/80 text-neutral-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center text-xs"
                >
                  <CameraIcon className="text-approve size-4 shrink-0" />
                  <span>Сделайте скриншот карточки для отправки фото</span>
                </div>
              )}

              <div className="flex w-full items-center gap-2">
                <Button
                  variant="primary"
                  className="flex flex-1 items-center justify-center gap-2"
                  onClick={handleShare}
                  disabled={!cardAsset}
                >
                  <ShareNetworkIcon className="size-5" />
                  {inTMA ? 'Отправить результат в чат' : 'Поделиться'}
                </Button>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!cardAsset}
                  title={
                    inTMA
                      ? 'Скопировать текст результата'
                      : 'Скопировать PNG в буфер'
                  }
                >
                  <Circle className="bg-neutral text-neutral-foreground hover:bg-neutral/80 size-12">
                    {copied ? (
                      <CheckIcon className="text-approve size-5" />
                    ) : (
                      <CopyIcon className="size-5" />
                    )}
                  </Circle>
                </button>

                {!inTMA && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!cardAsset}
                    title="Скачать PNG"
                  >
                    <Circle className="bg-neutral text-neutral-foreground hover:bg-neutral/80 size-12">
                      <DownloadSimpleIcon className="size-5" />
                    </Circle>
                  </button>
                )}
              </div>

              {onUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="text-neutral-foreground/70 hover:text-neutral-foreground flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors"
                >
                  <ArrowArcLeftIcon className="size-4" />
                  Отменить последний шар и вернуться в игру
                </button>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
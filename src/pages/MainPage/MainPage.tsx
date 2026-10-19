import { WelcomeBanner } from '@/pages/MainPage/ui/WelcomeBanner';
import { WelcomeBanner as OldWelcomeBanner } from '@/pages/MainPage/ui/OldWelcomeBanner';
import { ActionCard } from '@/shared/ActionCard';
import { Button } from '@/shared/Button';
import { ChooseGameDrawer } from '@/shared/ChooseGameDrawer';
import type { useZenMode } from '@/shared/hooks/useZenMode';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { triggerHaptic } from '@/shared/lib/telegram';
import { cn } from '@/shared/lib/utils/cn';
import { adjustHex, isLightColor } from '@/shared/lib/utils/color';
import { useGameStore } from '@/shared/store/gameStore';
import {
  useSettingsStore,
  resolveSlotColor,
} from '@/shared/store/useSettingsStore';
import {
  ClockCounterClockwiseIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

function PlayBallGraphic({
  isPressed,
  ballColor,
}: {
  isPressed: boolean;
  ballColor: string;
}) {
  const isLight = isLightColor(ballColor);
  const stopHighlight = adjustHex(ballColor, isLight ? 14 : 28);
  const stopMid = adjustHex(ballColor, isLight ? -24 : -10);
  const stopShadow = adjustHex(ballColor, isLight ? -72 : -26);
  const playTriangleColor = isLight ? '#561C18' : '#F0EBD8';

  return (
    <svg
      viewBox="86 3 176 176"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'size-[150px] select-none transition-transform duration-150 ease-out',
        isPressed
          ? 'scale-90'
          : 'group-hover:scale-105 group-active:scale-90'
      )}
    >
      <circle cx="174" cy="91" r="88" fill="url(#playBallGradDynamic)" />
      <ellipse
        cx="192"
        cy="36"
        rx="29"
        ry="16"
        fill="#FFFFFF"
        fillOpacity={isLight ? 0.85 : 0.22}
      />
      <path
        d="M169 68.5C169 64.8 173.1 62.5 176.2 64.5L209.5 85.8C212.5 87.7 212.5 92.1 209.5 94L176.2 115.3C173.1 117.3 169 115 169 111.3V68.5Z"
        fill={playTriangleColor}
      />
      <defs>
        <radialGradient
          id="playBallGradDynamic"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(195 65) rotate(135) scale(140)"
        >
          <stop offset="0" stopColor={stopHighlight} />
          <stop offset="0.38" stopColor={ballColor} />
          <stop offset="0.78" stopColor={stopMid} />
          <stop offset="1" stopColor={stopShadow} />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function MainPage() {
  const { isActiveGame, mode, endGame, finishCurrentRound } = useGameStore();
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [isBallPressed, setIsBallPressed] = useState(false);

  const isGameZenMode = useSettingsStore((state) => state.isGameZenMode);
  const mainPageStyle = useSettingsStore((state) => state.mainPageStyle);
  const disciplineThemes = useSettingsStore((state) => state.disciplineThemes);

  const playBallColor = resolveSlotColor(
    disciplineThemes,
    'pyramid',
    'playBall'
  );

  const { enableZenMode } = useOutletContext<ReturnType<typeof useZenMode>>();

  const handleGameStart = () => {
    if (isGameZenMode) {
      enableZenMode();
    }
  };

  const triggerBallPress = () => {
    setIsBallPressed(true);
    triggerHaptic('light');
    window.setTimeout(() => {
      setIsBallPressed(false);
    }, 160);
  };

  return (
    <div className="mx-auto flex w-full max-w-125 flex-1 flex-col justify-between px-5 pt-2 pb-2">
      {mainPageStyle === 'classic' ? (
        <div className="flex flex-col gap-3">
          <OldWelcomeBanner pyramidClassName="w-[17.5rem]" />

          {isActiveGame && (
            <ActionCard
              title="Текущая партия"
              desc="Вы не закончили матч."
              actions={
                <Link className="w-full" to={`/game/${mode}`}>
                  <Button
                    onClick={handleGameStart}
                    className="flex w-full items-center justify-center gap-2"
                  >
                    Вернуться в игру
                  </Button>
                </Link>
              }
              headerAddon={
                <button
                  onClick={() => setIsDeleteDrawerOpen(true)}
                  className="text-destructive transition-opacity hover:opacity-70"
                >
                  <TrashIcon className="size-6" />
                </button>
              }
            />
          )}

          <ActionCard
            title="Дисплей для матча"
            desc="Вы можете сыграть, а мы будем вам помогать"
            actions={
              <ChooseGameDrawer
                trigger={<Button className="w-full">Играть</Button>}
              />
            }
          />

          <div className="flex justify-start">
            <Link
              to="/history"
              className="bg-background/80 text-foreground hover:bg-background flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium backdrop-blur-lg transition-transform active:scale-95"
            >
              <ClockCounterClockwiseIcon className="size-5" />
              <span>История</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <WelcomeBanner />

            {isActiveGame && (
              <ActionCard
                title="Текущая партия"
                desc="Вы не закончили матч."
                actions={
                  <Link className="w-full" to={`/game/${mode}`}>
                    <Button
                      onClick={handleGameStart}
                      className="flex w-full items-center justify-center gap-2"
                    >
                      Вернуться в игру
                    </Button>
                  </Link>
                }
                headerAddon={
                  <button
                    onClick={() => setIsDeleteDrawerOpen(true)}
                    className="text-destructive transition-opacity hover:opacity-70"
                  >
                    <TrashIcon className="size-6" />
                  </button>
                }
              />
            )}
          </div>

          <div className="flex flex-1 items-center justify-center py-4">
            <ChooseGameDrawer
              trigger={
                <button
                  type="button"
                  aria-label="Новая игра"
                  onPointerDown={triggerBallPress}
                  className="group relative flex items-center justify-center rounded-full focus:outline-none"
                >
                  <PlayBallGraphic
                    isPressed={isBallPressed}
                    ballColor={playBallColor}
                  />
                </button>
              }
            />
          </div>

          <div className="flex justify-end pr-1">
            <Link
              to="/history"
              className="bg-background/37 text-foreground hover:bg-background/60 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium backdrop-blur-lg transition-transform active:scale-95"
            >
              <ClockCounterClockwiseIcon className="size-5" />
              <span>История</span>
            </Link>
          </div>
        </>
      )}

      <InfoDrawer
        isOpen={isDeleteDrawerOpen}
        onOpenChange={setIsDeleteDrawerOpen}
        closeBtn={
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setIsDeleteDrawerOpen(false)}
          >
            Отмена
          </Button>
        }
        content={
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="text-xl font-medium">Завершить или удалить матч?</p>
            <p className="text-neutral-foreground/70 text-sm">
              Вы можете завершить текущую партию с сохранением статистики в
              историю или полностью удалить её.
            </p>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button
                variant="approve"
                className="w-full"
                onClick={() => {
                  const saved = finishCurrentRound();
                  if (!saved) endGame();
                  setIsDeleteDrawerOpen(false);
                  toast.success(
                    saved ? 'Партия сохранена в историю' : 'Партия завершена'
                  );
                }}
              >
                Завершить и сохранить в историю
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  endGame();
                  setIsDeleteDrawerOpen(false);
                  toast.success('Партия удалена');
                }}
              >
                Удалить без сохранения
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
}
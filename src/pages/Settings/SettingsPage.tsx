import {
  MonitorPlayIcon,
  DropSlashIcon,
  DeviceRotateIcon,
  ColumnsIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react';
import { Toggle } from '@/shared/Toggle';
import { cn } from '@/shared/lib/utils/cn';
import {
  useSettingsStore,
  type MainPageStyle,
  type BackgroundMode,
} from '@/shared/store/useSettingsStore';
import { PageHeader } from '@/shared/PageHeader';
import { isTelegramMiniApp, triggerHaptic } from '@/shared/lib/telegram';

function MiniPyramidSvg({ isDark }: { isDark: boolean }) {
  const ballFill = isDark ? '#15161a' : '#f0ebd8';

  return (
    <svg
      viewBox="0 0 289 212"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="-mb-2.5 w-14 shrink-0"
    >
      <path
        d="M127.668 40.9844C135.149 28.0273 153.851 28.0273 161.332 40.9844L242.563 181.682C250.044 194.639 240.693 210.835 225.731 210.835H63.2686C48.3071 210.835 38.956 194.639 46.4365 181.682L127.668 40.9844Z"
        strokeWidth="16"
        className="stroke-piramid-border"
      />
      <g fill={ballFill}>
        <circle cx="66.5" cy="188.5" r="19.5" />
        <circle cx="105.5" cy="188.5" r="19.5" />
        <circle cx="144.5" cy="188.5" r="19.5" />
        <circle cx="183.5" cy="188.5" r="19.5" />
        <circle cx="222.5" cy="188.5" r="19.5" />
        <circle cx="83.4854" cy="156.484" r="19.5" />
        <circle cx="122.485" cy="156.484" r="19.5" />
        <circle cx="162.485" cy="156.484" r="19.5" />
        <circle cx="203.485" cy="156.484" r="19.5" />
        <circle cx="104.271" cy="123.485" r="19.5" />
        <circle cx="143.271" cy="123.485" r="19.5" />
        <circle cx="183.271" cy="123.485" r="19.5" />
        <circle cx="125.056" cy="90.485" r="19.5" />
        <circle cx="164.056" cy="90.485" r="19.5" />
        <circle cx="145.841" cy="57.4854" r="19.5" />
      </g>
    </svg>
  );
}

function MainLayoutPreviewCard({
  active,
  title,
  subtitle,
  variant,
  isDarkPlayBall,
  isDarkPyramidBalls,
  onSelect,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  variant: MainPageStyle;
  isDarkPlayBall: boolean;
  isDarkPyramidBalls: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('light');
        onSelect();
      }}
      className={cn(
        'relative flex flex-col items-start gap-2.5 rounded-2xl p-3 text-left transition-all',
        active
          ? 'bg-foreground/15 opacity-100'
          : 'bg-foreground/5 opacity-55 hover:opacity-85'
      )}
    >
      <div className="relative flex h-32 w-full flex-col justify-between overflow-hidden rounded-xl bg-[#11311c] p-2.5">
        {variant === 'modern' ? (
          <>
            <div className="h-6 w-full rounded-lg rounded-bl-none bg-[#171513] px-2 py-1.5">
              <div className="h-1.5 w-12 rounded-full bg-[#f0ebd8]/85" />
            </div>

            <div className="my-auto flex items-center justify-center">
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-full',
                  isDarkPlayBall ? 'bg-[#15161a]' : 'bg-[#f0ebd8]'
                )}
              >
                <div
                  className={cn(
                    'ml-0.5 size-0 border-y-[4px] border-l-[7px] border-y-transparent',
                    isDarkPlayBall ? 'border-l-[#f0ebd8]' : 'border-l-[#561C18]'
                  )}
                />
              </div>
            </div>

            <div className="ml-auto h-2.5 w-8 rounded-full bg-[#171513]/80" />
          </>
        ) : (
          <div className="flex w-full flex-col gap-1.5">
            <div className="flex w-full flex-col items-center">
              <MiniPyramidSvg isDark={isDarkPyramidBalls} />
              <div className="z-10 h-5 w-full rounded-lg bg-[#171513] px-2 py-1.5">
                <div className="h-1.5 w-11 rounded-full bg-[#f0ebd8]/85" />
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-lg bg-[#171513] p-1.5">
              <div className="h-1 w-10 rounded-full bg-[#f0ebd8]/70" />
              <div className="h-3 w-full rounded-full bg-[#f0ebd8]" />
            </div>

            <div className="h-2.5 w-8 rounded-full bg-[#171513]" />
          </div>
        )}
      </div>

      <div className="flex w-full items-center justify-between gap-1">
        <div>
          <div className="text-foreground text-sm font-semibold">{title}</div>
          <div className="text-muted-foreground text-[11px] leading-tight">
            {subtitle}
          </div>
        </div>
        {active && (
          <CheckCircleIcon
            weight="fill"
            className="size-5 shrink-0 text-white"
          />
        )}
      </div>
    </button>
  );
}

const BG_MODES: { id: BackgroundMode; label: string; desc: string }[] = [
  {
    id: 'full',
    label: 'Шары и сукно',
    desc: 'Движение сукна и столкновения шаров',
  },
  {
    id: 'cloth-only',
    label: 'Только сукно',
    desc: 'Плавное движение сукна без шаров',
  },
  {
    id: 'static',
    label: 'Статичный',
    desc: 'Без анимации для экономии заряда',
  },
];

export function SettingsPage() {
  const {
    isLecturesZenMode,
    toggleLecturesZenMode,
    isGameZenMode,
    toggleGameZenMode,
    isDarkBalls,
    setDarkBalls,
    isDarkBgBalls,
    setDarkBgBalls,
    isDarkPlayBall,
    setDarkPlayBall,
    disableBlur,
    toggleDisableBlur,
    backgroundMode,
    setBackgroundMode,
    autoRotateSimulator,
    toggleAutoRotateSimulator,
    showTableBorders,
    toggleShowTableBorders,
    mainPageStyle,
    setMainPageStyle,
  } = useSettingsStore();

  const isTma = isTelegramMiniApp();

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-125 flex-col gap-4 px-4 py-6">
      <PageHeader>Настройки</PageHeader>

      <section className="bg-background/80 flex flex-col gap-3.5 rounded-2xl p-3.5 backdrop-blur-lg">
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            Главная страница
          </h2>
          <p className="text-muted-foreground text-xs">
            Выберите компоновку стартового экрана
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <MainLayoutPreviewCard
            active={mainPageStyle === 'modern'}
            variant="modern"
            title="С шаром"
            subtitle="Кнопка-шар по центру"
            isDarkPlayBall={isDarkPlayBall}
            isDarkPyramidBalls={isDarkBalls}
            onSelect={() => setMainPageStyle('modern')}
          />
          <MainLayoutPreviewCard
            active={mainPageStyle === 'classic'}
            variant="classic"
            title="С пирамидой"
            subtitle="Пирамида и карточка"
            isDarkPlayBall={isDarkPlayBall}
            isDarkPyramidBalls={isDarkBalls}
            onSelect={() => setMainPageStyle('classic')}
          />
        </div>

        {mainPageStyle === 'modern' ? (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              Цвет шара-кнопки
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setDarkPlayBall(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all',
                  !isDarkPlayBall
                    ? 'bg-foreground/15 opacity-100'
                    : 'bg-foreground/5 opacity-55 hover:opacity-85'
                )}
              >
                <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-[#f0ebd8] via-[#d6cfb7] to-[#8e8976]" />
                <span className="text-xs font-medium">Светлый</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setDarkPlayBall(true);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all',
                  isDarkPlayBall
                    ? 'bg-foreground/15 opacity-100'
                    : 'bg-foreground/5 opacity-55 hover:opacity-85'
                )}
              >
                <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-[#2c2e33] via-[#111215] to-black" />
                <span className="text-xs font-medium">Черный</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              Шары в пирамиде
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setDarkBalls(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all',
                  !isDarkBalls
                    ? 'bg-foreground/15 opacity-100'
                    : 'bg-foreground/5 opacity-55 hover:opacity-85'
                )}
              >
                <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-[#f0ebd8] via-[#d6cfb7] to-[#8e8976]" />
                <span className="text-xs font-medium">Светлые</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setDarkBalls(true);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all',
                  isDarkBalls
                    ? 'bg-foreground/15 opacity-100'
                    : 'bg-foreground/5 opacity-55 hover:opacity-85'
                )}
              >
                <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-[#2c2e33] via-[#111215] to-black" />
                <span className="text-xs font-medium">Черные</span>
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="bg-background/80 flex flex-col gap-3.5 rounded-2xl p-3.5 backdrop-blur-lg">
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            Фон бильярдного стола
          </h2>
          <p className="text-muted-foreground text-xs">
            Анимация сукна, фоновые шары и борты
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {BG_MODES.map((item) => {
            const active = backgroundMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setBackgroundMode(item.id);
                }}
                className={cn(
                  'flex flex-col justify-between gap-1 rounded-xl p-2.5 text-left transition-all',
                  active
                    ? 'bg-foreground/15 opacity-100'
                    : 'bg-foreground/5 opacity-55 hover:opacity-85'
                )}
              >
                <span className="text-foreground text-xs font-semibold">
                  {item.label}
                </span>
                <span className="text-muted-foreground text-[10px] leading-tight">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        {backgroundMode === 'full' && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              Шары на фоне
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setDarkBgBalls(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all',
                  !isDarkBgBalls
                    ? 'bg-foreground/15 opacity-100'
                    : 'bg-foreground/5 opacity-55 hover:opacity-85'
                )}
              >
                <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-[#f0ebd8] via-[#d6cfb7] to-[#8e8976]" />
                <span className="text-xs font-medium">Светлые</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setDarkBgBalls(true);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all',
                  isDarkBgBalls
                    ? 'bg-foreground/15 opacity-100'
                    : 'bg-foreground/5 opacity-55 hover:opacity-85'
                )}
              >
                <span className="size-6 shrink-0 rounded-full bg-gradient-to-br from-[#2c2e33] via-[#111215] to-black" />
                <span className="text-xs font-medium">Черные</span>
              </button>
            </div>
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl py-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                showTableBorders ? 'opacity-100' : 'opacity-25'
              )}
            >
              <ColumnsIcon size={18} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                Боковые борты стола
              </span>
              <span className="text-muted-foreground text-xs">
                Минималистичные борты по краям экрана
              </span>
            </div>
          </div>
          <Toggle
            checked={showTableBorders}
            onCheckedChange={toggleShowTableBorders}
            aria-label="Показывать боковые борты стола"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl py-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                disableBlur ? 'opacity-100' : 'opacity-25'
              )}
            >
              <DropSlashIcon size={18} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                Отключить размытия
              </span>
              <span className="text-muted-foreground text-xs">
                Непрозрачные плашки для повышения производительности
              </span>
            </div>
          </div>
          <Toggle
            checked={disableBlur}
            onCheckedChange={toggleDisableBlur}
            aria-label="Отключить размытия"
          />
        </label>
      </section>

      <section className="bg-background/80 flex flex-col gap-3 rounded-2xl p-3.5 backdrop-blur-lg">
        <h2 className="text-foreground text-sm font-semibold">
          Режимы и экран
        </h2>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl py-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                autoRotateSimulator ? 'opacity-100' : 'opacity-25'
              )}
            >
              <DeviceRotateIcon size={18} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                Автоповорот тренажера
              </span>
              <span className="text-muted-foreground text-xs">
                Горизонтальный стол при открытии на узких экранах
              </span>
            </div>
          </div>
          <Toggle
            checked={autoRotateSimulator}
            onCheckedChange={toggleAutoRotateSimulator}
            aria-label="Автоповорот тренажера"
          />
        </label>

        {!isTma && (
          <>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl py-1">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                    isGameZenMode ? 'opacity-100' : 'opacity-25'
                  )}
                >
                  <MonitorPlayIcon size={18} weight="fill" />
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-medium">
                    Дзен-режим в матче
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Полный экран, дисплей не гаснет
                  </span>
                </div>
              </div>
              <Toggle
                checked={isGameZenMode}
                onCheckedChange={toggleGameZenMode}
                aria-label="Дзен-режим в матче"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl py-1">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                    isLecturesZenMode ? 'opacity-100' : 'opacity-25'
                  )}
                >
                  <MonitorPlayIcon size={18} weight="fill" />
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-medium">
                    Дзен-режим в лекциях
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Полный экран, дисплей не гаснет
                  </span>
                </div>
              </div>
              <Toggle
                checked={isLecturesZenMode}
                onCheckedChange={toggleLecturesZenMode}
                aria-label="Дзен-режим в лекциях"
              />
            </label>
          </>
        )}
      </section>
    </div>
  );
}
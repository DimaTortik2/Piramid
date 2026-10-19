import { useRef, useState, type MouseEvent, type WheelEvent } from 'react';
import {
  MonitorPlayIcon,
  DropSlashIcon,
  DeviceRotateIcon,
  ColumnsIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  ClipboardTextIcon,
  CopyIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Toggle } from '@/shared/Toggle';
import { Button } from '@/shared/Button';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { cn } from '@/shared/lib/utils/cn';
import { isLightColor } from '@/shared/lib/utils/color';
import {
  useSettingsStore,
  getDisciplineThemesList,
  getActiveTheme,
  resolveSlotColor,
  encodeThemeShareCode,
  decodeThemeShareCode,
  type MainPageStyle,
  type BackgroundMode,
  type ThemeColorSlot,
  type AppTheme,
} from '@/shared/store/useSettingsStore';
import {
  DISCIPLINES,
  type DisciplineId,
} from '@/shared/store/useDisciplineStore';
import { PageHeader } from '@/shared/PageHeader';
import { isTelegramMiniApp, triggerHaptic } from '@/shared/lib/telegram';

const SLOT_META: {
  slot: ThemeColorSlot;
  label: string;
  swatches: string[];
}[] = [
  {
    slot: 'cloth',
    label: 'Сукно стола',
    swatches: [
      '#11311c',
      '#0b1f12',
      '#0d2b22',
      '#133238',
      '#121c30',
      '#331419',
      '#261b16',
      '#1c2026',
    ],
  },
  {
    slot: 'playBall',
    label: 'Главный шар-кнопка',
    swatches: [
      '#f0ebd8',
      '#d6cfb7',
      '#111215',
      '#24262b',
      '#e3c376',
      '#7a2020',
      '#244c66',
      '#2a5235',
    ],
  },
  {
    slot: 'pyramidBalls',
    label: 'Шары в пирамиде',
    swatches: [
      '#f0ebd8',
      '#d6cfb7',
      '#111215',
      '#24262b',
      '#e3c376',
      '#7a2020',
      '#244c66',
      '#2a5235',
    ],
  },
  {
    slot: 'bgBalls',
    label: 'Шары на фоне',
    swatches: [
      '#f0ebd8',
      '#d6cfb7',
      '#111215',
      '#24262b',
      '#e3c376',
      '#7a2020',
      '#244c66',
      '#2a5235',
    ],
  },
  {
    slot: 'rails',
    label: 'Борты стола',
    swatches: [
      '#141210',
      '#090807',
      '#241811',
      '#332218',
      '#15171c',
      '#1c1417',
      '#0e1c14',
      '#f0ebd8',
    ],
  },
];

function MiniPyramidSvg({ ballColor }: { ballColor: string }) {
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
      <g fill={ballColor}>
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
  clothColor,
  playBallColor,
  pyramidBallsColor,
  onSelect,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  variant: MainPageStyle;
  clothColor: string;
  playBallColor: string;
  pyramidBallsColor: string;
  onSelect: () => void;
}) {
  const isLightBall = isLightColor(playBallColor);

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
      <div
        style={{ backgroundColor: clothColor }}
        className="relative flex h-32 w-full flex-col justify-between overflow-hidden rounded-xl p-2.5 transition-colors"
      >
        {variant === 'modern' ? (
          <>
            <div className="h-6 w-full rounded-lg rounded-bl-none bg-[#171513] px-2 py-1.5">
              <div className="h-1.5 w-12 rounded-full bg-[#f0ebd8]/85" />
            </div>

            <div className="my-auto flex items-center justify-center">
              <div
                style={{ backgroundColor: playBallColor }}
                className="flex size-9 items-center justify-center rounded-full transition-colors"
              >
                <div
                  className={cn(
                    'ml-0.5 size-0 border-y-[4px] border-l-[7px] border-y-transparent',
                    isLightBall ? 'border-l-[#561C18]' : 'border-l-[#f0ebd8]'
                  )}
                />
              </div>
            </div>

            <div className="ml-auto h-2.5 w-8 rounded-full bg-[#171513]/80" />
          </>
        ) : (
          <div className="flex w-full flex-col gap-1.5">
            <div className="flex w-full flex-col items-center">
              <MiniPyramidSvg ballColor={pyramidBallsColor} />
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

function ThemeCard({
  theme,
  active,
  onSelect,
  onEdit,
}: {
  theme: AppTheme;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        triggerHaptic('light');
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'relative flex w-28 shrink-0 cursor-pointer flex-col gap-2 rounded-2xl p-2.5 text-left transition-all select-none',
        active
          ? 'bg-foreground/15 opacity-100'
          : 'bg-foreground/5 opacity-60 hover:opacity-90'
      )}
    >
      <div
        style={{ backgroundColor: theme.colors.cloth }}
        className="relative flex h-14 w-full items-center justify-between overflow-hidden rounded-xl px-2.5"
      >
        <div
          style={{ backgroundColor: theme.colors.rails }}
          className="absolute inset-y-1.5 left-0 w-1 rounded-r-full"
        />
        <div
          style={{ backgroundColor: theme.colors.rails }}
          className="absolute inset-y-1.5 right-0 w-1 rounded-l-full"
        />

        <div className="mx-auto flex items-center gap-1.5">
          <span
            style={{ backgroundColor: theme.colors.playBall }}
            className="size-5 rounded-full"
          />
          <span
            style={{ backgroundColor: theme.colors.bgBalls }}
            className="size-3.5 rounded-full opacity-85"
          />
        </div>

        <button
          type="button"
          aria-label="Настроить тему"
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onEdit();
          }}
          className="bg-background/65 text-foreground hover:bg-background/90 absolute top-1 right-1 flex size-6 items-center justify-center rounded-full backdrop-blur-md transition-colors"
        >
          <PencilSimpleIcon className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-1 px-0.5">
        <span className="text-foreground truncate text-xs font-medium">
          {theme.name}
        </span>
        {active && (
          <CheckCircleIcon
            weight="fill"
            className="size-4 shrink-0 text-white"
          />
        )}
      </div>
    </div>
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
  const [selectedDiscipline, setSelectedDiscipline] =
    useState<DisciplineId>('pyramid');
  const [editingTheme, setEditingTheme] = useState<AppTheme | null>(null);
  const [activeSlot, setActiveSlot] = useState<ThemeColorSlot>('cloth');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCode, setImportCode] = useState('');

  const sliderRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const {
    isLecturesZenMode,
    toggleLecturesZenMode,
    isGameZenMode,
    toggleGameZenMode,
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
    disciplineThemes,
    setActiveTheme,
    saveTheme,
    deleteCustomTheme,
  } = useSettingsStore();

  const isTma = isTelegramMiniApp();

  const themesList = getDisciplineThemesList(
    disciplineThemes,
    selectedDiscipline
  );
  const activeTheme = getActiveTheme(disciplineThemes, selectedDiscipline);

  const previewClothColor = resolveSlotColor(
    disciplineThemes,
    'pyramid',
    'cloth'
  );
  const previewPlayBallColor = resolveSlotColor(
    disciplineThemes,
    'pyramid',
    'playBall'
  );
  const previewPyramidBallsColor = resolveSlotColor(
    disciplineThemes,
    'pyramid',
    'pyramidBalls'
  );

  const handleSliderWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      sliderRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleSliderMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    dragState.current = {
      isDown: true,
      startX: e.pageX - sliderRef.current.offsetLeft,
      scrollLeft: sliderRef.current.scrollLeft,
      moved: false,
    };
  };

  const handleSliderMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragState.current.isDown || !sliderRef.current) return;
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = x - dragState.current.startX;
    if (Math.abs(walk) > 5) {
      dragState.current.moved = true;
      sliderRef.current.scrollLeft = dragState.current.scrollLeft - walk;
    }
  };

  const handleSliderMouseUp = () => {
    dragState.current.isDown = false;
  };

  const openEditorForTheme = (theme: AppTheme) => {
    if (dragState.current.moved) return;
    setActiveSlot('cloth');
    if (theme.isBuiltin) {
      setEditingTheme({
        id: `custom-${Date.now()}`,
        name: `${theme.name} +`,
        colors: { ...theme.colors },
      });
    } else {
      setEditingTheme({
        ...theme,
        colors: { ...theme.colors },
      });
    }
  };

  const openNewThemeCreator = () => {
    if (dragState.current.moved) return;
    triggerHaptic('light');
    setActiveSlot('cloth');
    setEditingTheme({
      id: `custom-${Date.now()}`,
      name: 'Моя тема',
      colors: { ...activeTheme.colors },
    });
  };

  const handleSaveEditingTheme = () => {
    if (!editingTheme) return;
    const cleanName = editingTheme.name.trim() || 'Моя тема';
    saveTheme(selectedDiscipline, {
      ...editingTheme,
      name: cleanName,
      isBuiltin: false,
    });
    setEditingTheme(null);
    toast.success('Тема сохранена');
  };

  const handleCopyThemeCode = async (theme: AppTheme) => {
    const code = encodeThemeShareCode(theme);
    try {
      await navigator.clipboard.writeText(code);
      triggerHaptic('light');
      toast.success('Код темы скопирован');
    } catch {
      toast.error('Не удалось скопировать код');
    }
  };

  const handleImportSubmit = () => {
    const decoded = decodeThemeShareCode(importCode);
    if (!decoded) {
      toast.error('Неверный формат кода темы');
      return;
    }

    const newTheme: AppTheme = {
      id: `custom-${Date.now()}`,
      name: decoded.name,
      colors: decoded.colors,
    };

    saveTheme(selectedDiscipline, newTheme);
    setImportCode('');
    setIsImportOpen(false);
    toast.success(`Тема «${newTheme.name}» добавлена`);
  };

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
            clothColor={previewClothColor}
            playBallColor={previewPlayBallColor}
            pyramidBallsColor={previewPyramidBallsColor}
            onSelect={() => setMainPageStyle('modern')}
          />
          <MainLayoutPreviewCard
            active={mainPageStyle === 'classic'}
            variant="classic"
            title="С пирамидой"
            subtitle="Пирамида и карточка"
            clothColor={previewClothColor}
            playBallColor={previewPlayBallColor}
            pyramidBallsColor={previewPyramidBallsColor}
            onSelect={() => setMainPageStyle('classic')}
          />
        </div>
      </section>

      <section className="bg-background/80 flex flex-col gap-3.5 rounded-2xl p-3.5 backdrop-blur-lg">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-foreground text-sm font-semibold">
              Темы оформления
            </h2>
            <p className="text-muted-foreground text-xs">
              Цветовые темы стола, шаров и бортов
            </p>
          </div>

          {selectedDiscipline === 'pyramid' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Поделиться текущей темой"
                onClick={() => handleCopyThemeCode(activeTheme)}
                className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center transition-colors active:scale-90"
              >
                <ShareNetworkIcon className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Импортировать тему по коду"
                onClick={() => {
                  triggerHaptic('light');
                  setIsImportOpen(true);
                }}
                className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center transition-colors active:scale-90"
              >
                <ClipboardTextIcon className="size-5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {DISCIPLINES.map((disc) => {
            const active = selectedDiscipline === disc.id;
            const isLocked = disc.id !== 'pyramid';
            return (
              <button
                key={disc.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDiscipline(disc.id);
                }}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-all',
                  active
                    ? 'bg-foreground/15 opacity-100'
                    : 'bg-foreground/5 opacity-55 hover:opacity-85'
                )}
              >
                <span className="truncate text-xs font-semibold">
                  {disc.id === 'pyramid' ? 'Русский бильярд' : 'Новые игры'}
                </span>
                {isLocked && (
                  <LockSimpleIcon className="text-muted-foreground size-3.5 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {selectedDiscipline === 'pyramid' ? (
          <div
            ref={sliderRef}
            onWheel={handleSliderWheel}
            onMouseDown={handleSliderMouseDown}
            onMouseMove={handleSliderMouseMove}
            onMouseUp={handleSliderMouseUp}
            onMouseLeave={handleSliderMouseUp}
            className="-mx-1 flex cursor-grab gap-2 overflow-x-auto px-1 pb-0.5 active:cursor-grabbing"
          >
            {themesList.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                active={activeTheme.id === theme.id}
                onSelect={() => {
                  if (!dragState.current.moved) {
                    setActiveTheme('pyramid', theme.id);
                  }
                }}
                onEdit={() => openEditorForTheme(theme)}
              />
            ))}

            <button
              type="button"
              onClick={openNewThemeCreator}
              className="bg-foreground/5 hover:bg-foreground/10 flex w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl p-2.5 transition-colors select-none"
            >
              <div className="bg-foreground/10 flex size-9 items-center justify-center rounded-full">
                <PlusIcon className="size-4" />
              </div>
              <span className="text-foreground text-xs font-medium">
                Создать
              </span>
            </button>
          </div>
        ) : (
          <div className="bg-foreground/5 flex flex-col items-center gap-2 rounded-xl px-4 py-5 text-center">
            <LockSimpleIcon className="text-muted-foreground size-5" />
            <div className="text-foreground text-xs font-medium">
              Темы в разработке
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Настройка тем для других дисциплин появится с выходом новых игр
            </p>
          </div>
        )}
      </section>

      <section className="bg-background/80 flex flex-col gap-3.5 rounded-2xl p-3.5 backdrop-blur-lg">
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            Фон и эффекты стола
          </h2>
          <p className="text-muted-foreground text-xs">
            Режим анимации сукна, борты и производительность
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
                Минималистичные борты и лузы по краям экрана
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

      <InfoDrawer
        isOpen={Boolean(editingTheme)}
        onOpenChange={(open) => {
          if (!open) setEditingTheme(null);
        }}
        closeBtn={
          <Button
            variant="approve"
            className="w-full"
            onClick={handleSaveEditingTheme}
          >
            Сохранить тему
          </Button>
        }
        content={
          editingTheme && (
            <div className="flex flex-col gap-3.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={editingTheme.name}
                  maxLength={24}
                  placeholder="Название темы"
                  onChange={(e) =>
                    setEditingTheme({ ...editingTheme, name: e.target.value })
                  }
                  className="bg-foreground/10 text-foreground placeholder:text-muted-foreground flex-1 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none"
                />

                <button
                  type="button"
                  aria-label="Скопировать код темы"
                  onClick={() => handleCopyThemeCode(editingTheme)}
                  className="text-muted-foreground hover:text-foreground flex size-10 shrink-0 items-center justify-center transition-colors"
                >
                  <CopyIcon className="size-5" />
                </button>

                {disciplineThemes[selectedDiscipline].customThemes.some(
                  (t) => t.id === editingTheme.id
                ) && (
                  <button
                    type="button"
                    aria-label="Удалить тему"
                    onClick={() => {
                      deleteCustomTheme(selectedDiscipline, editingTheme.id);
                      setEditingTheme(null);
                      toast.success('Тема удалена');
                    }}
                    className="text-destructive hover:opacity-75 flex size-10 shrink-0 items-center justify-center transition-opacity"
                  >
                    <TrashIcon className="size-5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                {SLOT_META.map((item) => {
                  const isSelected = activeSlot === item.slot;
                  const currentColor = editingTheme.colors[item.slot];

                  return (
                    <div
                      key={item.slot}
                      className="bg-foreground/5 flex flex-col rounded-xl transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setActiveSlot(item.slot);
                        }}
                        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
                      >
                        <span className="text-foreground text-xs font-medium">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-[11px] uppercase">
                            {currentColor}
                          </span>
                          <span
                            style={{ backgroundColor: currentColor }}
                            className="size-5 rounded-full"
                          />
                        </div>
                      </button>

                      {isSelected && (
                        <div className="flex items-center justify-between gap-2 px-3.5 pt-0.5 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.swatches.map((hex) => {
                              const isSwatchActive =
                                currentColor.toLowerCase() ===
                                hex.toLowerCase();
                              return (
                                <button
                                  key={hex}
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic('light');
                                    setEditingTheme({
                                      ...editingTheme,
                                      colors: {
                                        ...editingTheme.colors,
                                        [item.slot]: hex,
                                      },
                                    });
                                  }}
                                  style={{ backgroundColor: hex }}
                                  className={cn(
                                    'flex size-6 items-center justify-center rounded-full transition-transform',
                                    isSwatchActive
                                      ? 'scale-110'
                                      : 'opacity-70 hover:opacity-100'
                                  )}
                                >
                                  {isSwatchActive && (
                                    <span
                                      className={cn(
                                        'size-2 rounded-full',
                                        isLightColor(hex)
                                          ? 'bg-black/75'
                                          : 'bg-white/90'
                                      )}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <label className="bg-foreground/10 hover:bg-foreground/20 text-foreground relative flex shrink-0 cursor-pointer items-center justify-center rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors">
                            <input
                              type="color"
                              value={currentColor}
                              onChange={(e) =>
                                setEditingTheme({
                                  ...editingTheme,
                                  colors: {
                                    ...editingTheme.colors,
                                    [item.slot]: e.target.value.toLowerCase(),
                                  },
                                })
                              }
                              className="absolute inset-0 size-0 opacity-0"
                            />
                            Свой
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        }
      />

      <InfoDrawer
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        closeBtn={
          <Button
            variant="approve"
            className="w-full"
            onClick={handleImportSubmit}
          >
            Импортировать
          </Button>
        }
        content={
          <div className="flex flex-col gap-3 py-3 text-center">
            <h3 className="text-base font-medium">Импорт темы</h3>
            <p className="text-muted-foreground text-xs">
              Вставьте код темы, которым с вами поделились (начинается с PRM-)
            </p>
            <input
              type="text"
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="PRM-11311C-141210-..."
              className="bg-foreground/10 text-foreground placeholder:text-muted-foreground w-full rounded-xl px-3.5 py-3 text-center font-mono text-xs focus:outline-none"
            />
          </div>
        }
      />
    </div>
  );
}
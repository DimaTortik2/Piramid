import { Button } from '@/shared/Button';
import type { useZenMode } from '@/shared/hooks/useZenMode';
import { InfoDrawer, type InfoDrawerProps } from '@/shared/InfoDrawer';
import { getTelegramUserName } from '@/shared/lib/telegram';
import { cn } from '@/shared/lib/utils/cn';
import { useGameStore, type GameMode } from '@/shared/store/gameStore';
import { useSettingsStore } from '@/shared/store/useSettingsStore';
import {
  ArrowsLeftRightIcon,
  CirclesThreePlusIcon,
  CrownIcon,
  InfinityIcon,
  LightningIcon,
  QuestionIcon,
  TargetIcon,
  TrashIcon,
  UsersIcon,
  XIcon,
  type Icon,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

interface ChooseGameDrawerProps extends Omit<InfoDrawerProps, 'content'> {}

const GAME_DATA: {
  id: number;
  title: string;
  tag: string;
  lectureHref: string;
  icon: Icon;
  piramidName: GameMode;
}[] = [
  {
    id: 1,
    title: 'Американка',
    tag: 'Любой шар',
    piramidName: 'free-pyramid',
    lectureHref: '/lectures/first',
    icon: CirclesThreePlusIcon,
  },
  {
    id: 2,
    title: 'Московка',
    tag: 'Один биток',
    piramidName: 'combined-pyramid',
    lectureHref: '/lectures/first',
    icon: TargetIcon,
  },
  {
    id: 3,
    title: 'Невская',
    tag: 'Биток с руки',
    piramidName: 'dynamic-pyramid',
    lectureHref: '/lectures/first',
    icon: LightningIcon,
  },
  {
    id: 4,
    title: 'Классика',
    tag: 'До 71 очка',
    piramidName: 'classic-pyramid',
    lectureHref: '/lectures/first',
    icon: CrownIcon,
  },
  {
    id: 5,
    title: 'С продолжением',
    tag: 'Без лимита',
    piramidName: 'continuous-free-pyramid',
    lectureHref: '/lectures/first',
    icon: InfinityIcon,
  },
];

const SELECTED_PIRAMID_DEFAULT_ID = 1;

function PlayerInputPopover({
  value,
  onChange,
  placeholder,
  savedNames,
  onSelectName,
  onDeleteName,
  align = 'left',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  savedNames: string[];
  onSelectName: (name: string) => void;
  onDeleteName: (name: string) => void;
  align?: 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const showTooltip = isOpen && savedNames.length > 0;

  return (
    <div ref={containerRef} className="relative flex flex-1 items-center">
      <div
        className={cn(
          'bg-neutral text-neutral-foreground relative flex w-full items-center rounded-2xl transition-all',
          isOpen && 'ring-primary/50 ring-2'
        )}
      >
        <input
          className="w-full bg-transparent py-2.5 pr-7 pl-3 text-sm outline-none placeholder:opacity-45"
          value={value}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {value && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange('');
              setIsOpen(true);
            }}
            className="absolute right-2 p-1 opacity-40 hover:opacity-80"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      <div
        className={cn(
          'bg-background/95 text-foreground border-foreground/10 absolute bottom-full z-50 mb-3 min-w-48 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-lg transition-all duration-200',
          align === 'left'
            ? 'left-0 origin-bottom-left'
            : 'right-0 origin-bottom-right',
          showTooltip
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0'
        )}
      >
        <div className="flex max-h-44 flex-col gap-0.5 overflow-y-auto">
          {savedNames.map((name) => {
            const isSelected =
              value.trim().toLowerCase() === name.toLowerCase();
            return (
              <div
                key={name}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-foreground/10'
                )}
              >
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectName(name);
                    setIsOpen(false);
                  }}
                  className="flex-1 truncate text-left"
                >
                  {name}
                </button>
                <button
                  type="button"
                  title="Удалить"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteName(name);
                  }}
                  className="text-destructive/80 hover:text-destructive shrink-0 p-0.5 transition-opacity"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ChooseGameDrawer({ ...props }: ChooseGameDrawerProps) {
  const [selectedPiramidId, setSelectedPiramidId] = useState<number>(
    SELECTED_PIRAMID_DEFAULT_ID
  );

  const defaultP1Name = useGameStore((state) => state.defaultP1Name);
  const storeP2Name = useGameStore((state) => state.p2.name);
  const recentPlayers = useGameStore((state) => state.recentPlayers);
  const removedPresetNames = useGameStore((state) => state.removedPresetNames);
  const savedMatches = useGameStore((state) => state.savedMatches);
  const removeRecentPlayer = useGameStore((state) => state.removeRecentPlayer);
  const startGame = useGameStore((state) => state.startGame);

  const [p1Name, setP1Name] = useState(
    () => getTelegramUserName() || defaultP1Name || ''
  );
  const [p2Name, setP2Name] = useState(() =>
    storeP2Name && storeP2Name !== 'Оппонент' ? storeP2Name : ''
  );

  const isGameZenMode = useSettingsStore((state) => state.isGameZenMode);
  const { enableZenMode } = useOutletContext<ReturnType<typeof useZenMode>>();

  const savedNames = useMemo(() => {
    const set = new Set<string>();
    const removedSet = new Set(
      (removedPresetNames ?? []).map((n) => n.toLowerCase())
    );
    const result: string[] = [];
    const candidates = [
      ...(recentPlayers ?? []),
      ...(savedMatches ?? []).flatMap((m) => [m.p2.name, m.p1.name]),
    ];

    for (const raw of candidates) {
      const name = raw?.trim();
      if (!name) continue;
      const lower = name.toLowerCase();
      if (
        lower === 'вы' ||
        lower === 'оппонент' ||
        removedSet.has(lower) ||
        set.has(lower)
      ) {
        continue;
      }
      set.add(lower);
      result.push(name);
      if (result.length >= 12) break;
    }
    return result;
  }, [recentPlayers, savedMatches, removedPresetNames]);

  const selectedPiramid =
    GAME_DATA.find((el) => el.id === selectedPiramidId) || GAME_DATA[0];

  const handleSwapNames = () => {
    setP1Name(p2Name);
    setP2Name(p1Name);
  };

  const handleDeleteName = (name: string) => {
    if (p1Name.trim().toLowerCase() === name.toLowerCase()) {
      setP1Name('');
    }
    if (p2Name.trim().toLowerCase() === name.toLowerCase()) {
      setP2Name('');
    }
    removeRecentPlayer(name);
  };

  const handleStartGame = () => {
    startGame(
      selectedPiramid.piramidName,
      p1Name.trim() || 'Вы',
      p2Name.trim() || 'Оппонент'
    );
    if (isGameZenMode) {
      enableZenMode();
    }
  };

  return (
    <InfoDrawer
      onOpenChange={(open) => {
        if (!open) {
          setSelectedPiramidId(SELECTED_PIRAMID_DEFAULT_ID);
        }
      }}
      content={
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CirclesThreePlusIcon
                  size={18}
                  weight="fill"
                  className="opacity-70"
                />
                <p className="text-lg font-medium">Пирамида</p>
              </div>
              <Link
                to={selectedPiramid.lectureHref}
                className="flex items-center gap-1 text-xs opacity-60 transition-opacity hover:opacity-100"
              >
                <span>Правила</span>
                <QuestionIcon className="size-4" weight="bold" />
              </Link>
            </div>

            <div
              data-no-tab-swipe
              className="-mx-1 flex gap-2 overflow-x-auto px-1 py-0.5 sm:mx-0 sm:flex-col sm:overflow-visible sm:px-0 pointer-fine:mx-0 pointer-fine:flex-col pointer-fine:overflow-visible pointer-fine:px-0"
            >
              {GAME_DATA.map((d) => {
                const IconComponent = d.icon;
                const isSelected = selectedPiramidId === d.id;

                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setSelectedPiramidId(d.id)}
                    className={cn(
                      'flex min-w-[130px] shrink-0 flex-col items-start gap-1.5 rounded-2xl p-3 text-left transition-all sm:min-w-0 sm:w-full sm:flex-row sm:items-center sm:justify-between sm:px-3.5 sm:py-2.5 pointer-fine:min-w-0 pointer-fine:w-full pointer-fine:flex-row pointer-fine:items-center pointer-fine:justify-between pointer-fine:px-3.5 pointer-fine:py-2.5',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-neutral text-neutral-foreground opacity-80 hover:opacity-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent size={20} weight="fill" />
                      <span className="text-sm leading-tight font-semibold">
                        {d.title}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-65">{d.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <UsersIcon size={18} weight="fill" className="opacity-70" />
              <p className="text-lg font-medium">Игроки</p>
            </div>

            <div className="flex items-center gap-1.5">
              <PlayerInputPopover
                value={p1Name}
                onChange={setP1Name}
                placeholder="Вы"
                savedNames={savedNames}
                onSelectName={setP1Name}
                onDeleteName={handleDeleteName}
                align="left"
              />

              <button
                type="button"
                title="Поменять местами"
                onClick={handleSwapNames}
                className="bg-neutral text-neutral-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl opacity-75 transition-opacity hover:opacity-100"
              >
                <ArrowsLeftRightIcon className="size-4" />
              </button>

              <PlayerInputPopover
                value={p2Name}
                onChange={setP2Name}
                placeholder="Оппонент"
                savedNames={savedNames}
                onSelectName={setP2Name}
                onDeleteName={handleDeleteName}
                align="right"
              />
            </div>
          </div>
        </div>
      }
      {...props}
      closeBtn={
        <Link to={'/game/' + selectedPiramid.piramidName}>
          <Button onClick={handleStartGame}>Разбить пирамиду!</Button>
        </Link>
      }
    />
  );
}
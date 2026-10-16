import {
  NavLink,
  Outlet,
  useLocation,
  useMatches,
  useNavigate,
  ScrollRestoration,
} from 'react-router-dom';
import {
  HouseIcon,
  TextAlignCenterIcon,
  BarbellIcon,
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';
import { NavigationLoader } from '@/shared/Loaders/NavigationLoader';
import { BilliardsBackground } from '@/shared/BilliardsBackground';
import { useZenMode } from '@/shared/hooks/useZenMode';
import { type TouchEvent, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/shared/store/useSettingsStore';
import {
  getTelegramWebApp,
  initTelegramMiniApp,
  triggerHaptic,
} from '@/shared/lib/telegram';

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Главная',
    icon: HouseIcon,
    align: 'justify-self-start',
    to: '/',
  },
  {
    id: 'materials',
    label: 'Материал',
    icon: TextAlignCenterIcon,
    align: 'justify-self-center',
    to: '/lectures',
  },
  {
    id: 'practice',
    label: 'Практика',
    icon: BarbellIcon,
    align: 'justify-self-end',
    to: '/training',
  },
] as const;

const SWIPE_TAB_ROUTES: string[] = NAV_ITEMS.map((item) => item.to);

export const NavBar = ({ className }: { className?: string }) => {
  return (
    <div className={cn('bg-background pb-safe w-full', className)}>
      <nav className="mx-auto grid max-w-md grid-cols-3 items-center px-4 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              replace
              to={item.to}
              key={item.id}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 text-xs md:text-sm',
                  'text-muted-foreground/50 hover:text-foreground transition-all',
                  isActive && 'text-foreground',
                  item.align
                )
              }
            >
              <Icon className="size-[1.75em]" />
              <span className="font-medium tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export function RootLayout() {
  const matches = useMatches();
  const hideNavBar = matches.some(
    (match) => (match.handle as { hideNavBar?: boolean })?.hideNavBar
  );
  const isPaused = matches.some(
    (match) => (match.handle as { pauseBackground?: boolean })?.pauseBackground
  );

  const location = useLocation();
  const navigate = useNavigate();
  const zenMode = useZenMode();

  const touchState = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    lastX: number;
    lastTime: number;
    instantVelocityX: number;
    lockedAxis: 'x' | 'y' | null;
    ignored: boolean;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
    instantVelocityX: 0,
    lockedAxis: null,
    ignored: false,
  });

  useEffect(() => {
    const isGamePage = location.pathname.match(/^\/game\/.+/);
    const isLectureSpecificPage = location.pathname.match(/^\/lectures\/.+/);
    const isSpectatorPage = location.pathname.startsWith('/spectator');

    if (!isLectureSpecificPage && !isSpectatorPage && !isGamePage) {
      zenMode.disableZenMode();
    }
  }, [location.pathname, zenMode.disableZenMode]);

  const disableBlur = useSettingsStore((state) => state.disableBlur);

  useEffect(() => {
    document.documentElement.classList.toggle('no-blur', disableBlur);
  }, [disableBlur]);

  useEffect(() => {
    initTelegramMiniApp();
  }, []);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg?.BackButton) return;

    const handleBack = () => navigate(-1);

    if (location.pathname !== '/') {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton?.offClick(handleBack);
    };
  }, [location.pathname, navigate]);

  const currentTabIndex = SWIPE_TAB_ROUTES.indexOf(location.pathname);
  const canSwipeTabs = !hideNavBar && currentTabIndex !== -1;

  const handleTouchStart = (e: TouchEvent<HTMLElement>) => {
    if (!canSwipeTabs || e.touches.length !== 1) return;

    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const now = performance.now();

    // Игнорируем системные жесты «Назад» у самых краев экрана
    const isEdgeSwipe = x < 24 || x > window.innerWidth - 24;

    const target = e.target as HTMLElement | null;
    const isInteractiveOrDrawer = Boolean(
      target?.closest(
        'input, textarea, select, [data-vaul-drawer], [data-no-tab-swipe]'
      )
    );

    touchState.current = {
      startX: x,
      startY: y,
      startTime: now,
      lastX: x,
      lastTime: now,
      instantVelocityX: 0,
      lockedAxis: null,
      ignored: isEdgeSwipe || isInteractiveOrDrawer,
    };
  };

  const handleTouchMove = (e: TouchEvent<HTMLElement>) => {
    const st = touchState.current;
    if (!canSwipeTabs || st.ignored || e.touches.length !== 1) return;

    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const now = performance.now();

    const dx = x - st.startX;
    const dy = y - st.startY;

    if (!st.lockedAxis) {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      st.lockedAxis = Math.abs(dx) > Math.abs(dy) * 1.6 ? 'x' : 'y';
    }

    const dt = now - st.lastTime;
    if (dt > 0) {
      st.instantVelocityX = (x - st.lastX) / dt;
      st.lastX = x;
      st.lastTime = now;
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLElement>) => {
    const st = touchState.current;
    if (
      !canSwipeTabs ||
      st.ignored ||
      st.lockedAxis !== 'x' ||
      e.changedTouches.length !== 1
    ) {
      return;
    }

    const now = performance.now();
    const dx = e.changedTouches[0].clientX - st.startX;
    const dy = e.changedTouches[0].clientY - st.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const totalDuration = Math.max(1, now - st.startTime);
    const timeSinceLastMove = now - st.lastTime;

    // Если палец остановился перед отпусканием или жест ушел по диагонали — отменяем
    if (timeSinceLastMove > 90 || absDx < absDy * 1.8) return;

    const avgVelocity = absDx / totalDuration;
    const peakVelocity = Math.max(avgVelocity, Math.abs(st.instantVelocityX));

    const isFastFlick =
      absDx >= 65 && peakVelocity >= 0.5 && totalDuration <= 360;
    const isLongDeliberateSwipe =
      absDx >= window.innerWidth * 0.45 && peakVelocity >= 0.22;

    if (!isFastFlick && !isLongDeliberateSwipe) return;

    if (dx < 0 && currentTabIndex < SWIPE_TAB_ROUTES.length - 1) {
      triggerHaptic('tab');
      navigate(SWIPE_TAB_ROUTES[currentTabIndex + 1], { replace: true });
    } else if (dx > 0 && currentTabIndex > 0) {
      triggerHaptic('tab');
      navigate(SWIPE_TAB_ROUTES[currentTabIndex - 1], { replace: true });
    }
  };

  return (
    <div className="animate-app-fade-in text-foreground relative flex min-h-dvh w-full flex-col bg-cover bg-center bg-no-repeat">
      <ScrollRestoration />
      <BilliardsBackground isPaused={isPaused} className="h-full w-full" />
      <main
        className="relative z-10 flex-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <NavigationLoader />
        <Outlet context={zenMode} />
      </main>
      <div
        key={location.pathname}
        aria-hidden="true"
        className="animate-page-reveal pointer-events-none fixed inset-0 z-40 bg-[#0d0b09]"
      />
      {!hideNavBar && <NavBar className="sticky bottom-0 z-50" />}
    </div>
  );
}
import {
  NavLink,
  Outlet,
  useLocation,
  useMatches,
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
import { useEffect } from 'react';
import { useSettingsStore } from '@/shared/store/useSettingsStore';

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
  const zenMode = useZenMode();

  //Выключает Zen Mode когда мы не на лекции или спектаторе
  useEffect(() => {
    const isGamePage = location.pathname.match(/^\/game\/.+/);
    const isLectureSpecificPage = location.pathname.match(/^\/lectures\/.+/);
    const isSpectatorPage = location.pathname.startsWith('/spectator');

    if (!isLectureSpecificPage && !isSpectatorPage && !isGamePage) {
      zenMode.disableZenMode();
    }
  }, [location.pathname, zenMode.disableZenMode]);

  //blur Setting
  const disableBlur = useSettingsStore((state) => state.disableBlur);

  useEffect(() => {
    document.documentElement.classList.toggle('no-blur', disableBlur);
  }, [disableBlur]);
  //

  return (
    <div className="animate-app-fade-in text-foreground relative flex min-h-dvh w-full flex-col bg-cover bg-center bg-no-repeat">
      <ScrollRestoration />
      <BilliardsBackground isPaused={isPaused} className="h-full w-full" />
      <main className="relative z-10 flex-1">
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

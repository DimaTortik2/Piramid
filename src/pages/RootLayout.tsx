import { NavLink, Outlet, useMatches } from 'react-router-dom';
import {
  HouseIcon,
  TextAlignCenterIcon,
  BarbellIcon,
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';
import suknoBg from '@/assets/sukno.jpg';
import { NavigationLoader } from '@/shared/Loaders/NavigationLoader';

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
  return (
    <div
      className="text-foreground flex min-h-dvh w-full flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${suknoBg})` }}
    >
      <main className="relative z-10 flex-1">
        <NavigationLoader />
        <Outlet />
      </main>
      {!hideNavBar && <NavBar className='sticky z-50 bottom-0' />}
    </div>
  );
}

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
  TextAlignLeftIcon,
  DotsThreeVerticalIcon,
  GearSixIcon,
  EyeIcon,
  QuestionIcon,
  GraduationCapIcon,
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';
import { NavigationLoader } from '@/shared/Loaders/NavigationLoader';
import { BilliardsBackground } from '@/shared/BilliardsBackground';
import { useZenMode } from '@/shared/hooks/useZenMode';
import { type TouchEvent, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/shared/store/useSettingsStore';
import {
  DISCIPLINES,
  useDisciplineStore,
} from '@/shared/store/useDisciplineStore';
import { Popover } from '@/shared/Popover';
import { InfoDrawer } from '@/shared/InfoDrawer';
import { Faq } from '@/shared/Faq';
import { FAQS } from '@/app/data/faqs';
import { ActionCard } from '@/shared/ActionCard';
import { Button } from '@/shared/Button';
import {
  getTelegramWebApp,
  initTelegramMiniApp,
  triggerHaptic,
} from '@/shared/lib/telegram';
import { startMainOnboardingTour } from '@/shared/lib/onboarding';

function DisciplineIndicator() {
  const { discipline, setDiscipline } = useDisciplineStore();

  return (
    <div
      id="tour-discipline-switcher"
      className="mx-auto flex w-full max-w-125 items-center gap-2.5 px-4 pt-3 pb-1"
    >
      {DISCIPLINES.map((item) => {
        const isActive = item.id === discipline;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => {
              triggerHaptic('tab');
              setDiscipline(item.id);
            }}
            className={cn(
              'h-4 rounded-full transition-all duration-300',
              isActive
                ? 'w-12 bg-white'
                : 'w-4 bg-white/40 hover:bg-white/60'
            )}
          />
        );
      })}
    </div>
  );
}

export const NavBar = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { discipline, setDiscipline } = useDisciplineStore();
  const completeMainTour = useSettingsStore((state) => state.completeMainTour);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const ensurePyramidMode = () => {
    if (discipline !== 'pyramid') {
      setDiscipline('pyramid');
    }
  };

  return (
    <>
      <div
        className={cn(
          'pointer-events-none sticky bottom-0 z-50 w-full px-3 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]',
          className
        )}
      >
        <nav className="bg-background/35 pointer-events-auto mx-auto grid max-w-125 grid-cols-3 items-center rounded-full px-7 py-3.5 backdrop-blur-lg">
          <NavLink
            id="tour-nav-lectures"
            to="/lectures"
            onClick={() => triggerHaptic('tab')}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-self-start transition-colors',
                'text-muted-foreground/60 hover:text-foreground',
                isActive && 'text-foreground'
              )
            }
          >
            <TextAlignLeftIcon className="size-7" />
          </NavLink>

          <NavLink
            id="tour-nav-home"
            to="/"
            onClick={ensurePyramidMode}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-self-center transition-colors',
                'text-muted-foreground/60 hover:text-foreground',
                isActive && discipline === 'pyramid' && 'text-foreground'
              )
            }
          >
            <HouseIcon className="size-7" />
          </NavLink>

          <div id="tour-nav-menu" className="justify-self-end">
            <Popover
              trigger={({ isOpen, toggle }) => (
                <button
                  type="button"
                  aria-label="Меню"
                  onClick={() => {
                    triggerHaptic('tab');
                    toggle();
                  }}
                  className={cn(
                    'flex items-center justify-center transition-colors',
                    'text-muted-foreground/60 hover:text-foreground',
                    isOpen && 'text-foreground'
                  )}
                >
                  <DotsThreeVerticalIcon className="size-7" weight="bold" />
                </button>
              )}
            >
              {({ close }) => (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      ensurePyramidMode();
                      navigate('/settings');
                    }}
                    className="hover:bg-foreground/10 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors"
                  >
                    <GearSixIcon className="size-5 shrink-0" />
                    <span>Настройки</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      close();
                      ensurePyramidMode();
                      navigate('/spectator');
                    }}
                    className="hover:bg-foreground/10 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors"
                  >
                    <EyeIcon className="size-5 shrink-0" />
                    <span>Созерцать</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      close();
                      ensurePyramidMode();
                      setTimeout(() => {
                        startMainOnboardingTour(completeMainTour);
                      }, 150);
                    }}
                    className="hover:bg-foreground/10 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors"
                  >
                    <GraduationCapIcon className="size-5 shrink-0" />
                    <span>Обучение</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setIsFaqOpen(true);
                    }}
                    className="hover:bg-foreground/10 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors"
                  >
                    <QuestionIcon className="size-5 shrink-0" />
                    <span>Частые вопросы</span>
                  </button>
                </div>
              )}
            </Popover>
          </div>
        </nav>
      </div>

      <InfoDrawer
        isOpen={isFaqOpen}
        onOpenChange={setIsFaqOpen}
        content={
          <div className="flex max-h-[70dvh] flex-col gap-3 overflow-y-auto py-2">
            <h3 className="mb-1 text-center text-lg font-medium">
              Частые вопросы
            </h3>
            {FAQS.map((faq) => (
              <Faq key={faq.question} answer={faq.answer}>
                {faq.question}
              </Faq>
            ))}
          </div>
        }
      />
    </>
  );
};

export function RootLayout() {
  const matches = useMatches();
  const isPaused = matches.some(
    (match) => (match.handle as { pauseBackground?: boolean })?.pauseBackground
  );

  const location = useLocation();
  const navigate = useNavigate();
  const zenMode = useZenMode();

  const isMainPage = location.pathname === '/';

  const { discipline, setDiscipline, nextDiscipline, prevDiscipline } =
    useDisciplineStore();

  const hasSeenMainTour = useSettingsStore((state) => state.hasSeenMainTour);
  const completeMainTour = useSettingsStore((state) => state.completeMainTour);

  const activeDisciplineIndex = Math.max(
    0,
    DISCIPLINES.findIndex((d) => d.id === discipline)
  );

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
    if (!isMainPage || hasSeenMainTour || discipline !== 'pyramid') return;

    const timer = setTimeout(() => {
      const driverInstance = startMainOnboardingTour(() => {
        completeMainTour();
      });
      return () => driverInstance.destroy();
    }, 650);

    return () => clearTimeout(timer);
  }, [isMainPage, hasSeenMainTour, discipline, completeMainTour]);

  useEffect(() => {
    const isGamePage = location.pathname.match(/^\/game\/.+/);
    const isLecturePage = location.pathname.startsWith('/lectures');
    const isSpectatorPage = location.pathname.startsWith('/spectator');

    if (!isLecturePage && !isSpectatorPage && !isGamePage) {
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

  const handleTouchStart = (e: TouchEvent<HTMLElement>) => {
    if (!isMainPage || e.touches.length !== 1) return;

    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const now = performance.now();

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
    if (!isMainPage || st.ignored || e.touches.length !== 1) return;

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
      !isMainPage ||
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

    if (timeSinceLastMove > 90 || absDx < absDy * 1.8) return;

    const avgVelocity = absDx / totalDuration;
    const peakVelocity = Math.max(avgVelocity, Math.abs(st.instantVelocityX));

    const isFastFlick =
      absDx >= 50 && peakVelocity >= 0.35 && totalDuration <= 400;
    const isLongDeliberateSwipe =
      absDx >= window.innerWidth * 0.35 && peakVelocity >= 0.18;

    if (!isFastFlick && !isLongDeliberateSwipe) return;

    if (dx < 0) {
      if (nextDiscipline()) triggerHaptic('tab');
    } else if (dx > 0) {
      if (prevDiscipline()) triggerHaptic('tab');
    }
  };

  return (
    <div className="animate-app-fade-in text-foreground relative flex min-h-dvh w-full flex-col bg-cover bg-center bg-no-repeat">
      <ScrollRestoration />
      <BilliardsBackground isPaused={isPaused} className="h-full w-full" />

      {isMainPage && <DisciplineIndicator />}

      <main
        className="relative z-10 flex flex-1 flex-col overflow-x-clip"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <NavigationLoader />
        {!isMainPage ? (
          <Outlet context={zenMode} />
        ) : (
          <div
            className="flex flex-1 transition-transform duration-300 ease-out"
            style={{
              transform: `translate3d(-${activeDisciplineIndex * 100}%, 0, 0)`,
            }}
          >
            <div
              id="tour-main-play-area"
              className="flex w-full shrink-0 flex-col"
            >
              <Outlet context={zenMode} />
            </div>

            {DISCIPLINES.slice(1).map((item) => (
              <div
                key={item.id}
                className="flex w-full shrink-0 flex-col items-center justify-center px-4 text-center"
              >
                <div className="w-full max-w-125">
                  <ActionCard
                    title={
                      <span className="text-xl font-medium">В разработке</span>
                    }
                    desc={
                      <span className="mt-2 block text-base">
                        При дальнейшем развитии проекта есть возможность выпуска
                        новых бильярдных игр
                      </span>
                    }
                    actions={
                      <Button
                        onClick={() => {
                          triggerHaptic('tab');
                          setDiscipline('pyramid');
                        }}
                      >
                        Вернуться
                      </Button>
                    }
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div
        key={location.pathname}
        aria-hidden="true"
        className="animate-page-reveal pointer-events-none fixed inset-0 z-40 bg-[#0d0b09]"
      />
      {isMainPage && <NavBar />}
    </div>
  );
}
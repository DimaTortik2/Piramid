import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import Matter from 'matter-js';
import { cn } from '@/shared/lib/utils/cn';
import { adjustHex, hexToRgba, isLightColor } from '@/shared/lib/utils/color';
import {
  useSettingsStore,
  resolveSlotColor,
} from '@/shared/store/useSettingsStore';
import { useDisciplineStore } from '@/shared/store/useDisciplineStore';

const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E`;

const CONFIG = {
  FPS: 60,
  DRIFT_PX: 300,
  DRIFT_MS: 4000,
  BALL_RADIUS: 20,
  PYRAMID_CHANCE: 0.03,
  WALL_THICKNESS: 60,
  WALL_HEIGHT: 10000,
  PYRAMID_START_Y: -160,
  CUE_BALL_START_Y: -50,
  CUE_BALL_SPEED: 36,
  IMPACT_Y_RATIO: 0.2,

  BALL_OPTIONS: {
    restitution: 0.95,
    frictionAir: 0.007,
    render: { fillStyle: '#F0EBD8' },
  },
};
export function TableSideRails({
  railMeasureRef,
  railColor,
}: {
  railMeasureRef: RefObject<HTMLDivElement | null>;
  railColor: string;
}) {
  const isLight = isLightColor(railColor);
  const dotColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
  const pocketColor = '#060608';

  const renderDots = () => (
    <>
      <span
        className="size-[3px] rounded-full sm:size-1"
        style={{ backgroundColor: dotColor }}
      />
      <span
        className="size-[3px] rounded-full sm:size-1"
        style={{ backgroundColor: dotColor }}
      />
      <span
        className="size-[3px] rounded-full sm:size-1"
        style={{ backgroundColor: dotColor }}
      />
    </>
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      <div
        ref={railMeasureRef}
        className="absolute inset-y-0 left-0 w-2.5 sm:w-3.5 lg:w-4 transition-colors duration-300"
        style={{
          backgroundColor: railColor,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
        
        <div className="absolute top-[12%] bottom-[55%] left-0 right-0 z-10 flex flex-col items-center justify-evenly">
          {renderDots()}
        </div>
        <div className="absolute top-[55%] bottom-[12%] left-0 right-0 z-10 flex flex-col items-center justify-evenly">
          {renderDots()}
        </div>
      </div>

      <div
        className="absolute top-0 left-0 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 rounded-br-full"
        style={{
          backgroundColor: pocketColor,
          boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="absolute top-1/2 left-0 h-6 w-3 -translate-y-1/2 rounded-r-full sm:h-8 sm:w-4 lg:h-10 lg:w-5"
        style={{
          backgroundColor: pocketColor,
          boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 rounded-tr-full"
        style={{
          backgroundColor: pocketColor,
          boxShadow: 'inset 1px -1px 2px rgba(0,0,0,0.5)',
        }}
      />

      <div
        className="absolute inset-y-0 right-0 w-2.5 sm:w-3.5 lg:w-4 transition-colors duration-300"
        style={{
          backgroundColor: railColor,
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent" />

        <div className="absolute top-[12%] bottom-[55%] left-0 right-0 z-10 flex flex-col items-center justify-evenly">
          {renderDots()}
        </div>
        <div className="absolute top-[55%] bottom-[12%] left-0 right-0 z-10 flex flex-col items-center justify-evenly">
          {renderDots()}
        </div>
      </div>

      <div
        className="absolute top-0 right-0 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 rounded-bl-full"
        style={{
          backgroundColor: pocketColor,
          boxShadow: 'inset -1px 1px 2px rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="absolute top-1/2 right-0 h-6 w-3 -translate-y-1/2 rounded-l-full sm:h-8 sm:w-4 lg:h-10 lg:w-5"
        style={{
          backgroundColor: pocketColor,
          boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 rounded-tl-full"
        style={{
          backgroundColor: pocketColor,
          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
}


function useInit<T extends HTMLElement = HTMLElement>(
  sceneRef: RefObject<T | null>,
  railMeasureRef: RefObject<HTMLDivElement | null>,
  isPaused: boolean,
  isBallsDisabled: boolean,
  showTableBorders: boolean
): {
  isPausedRef: RefObject<boolean | null>;
  engineRef: RefObject<Matter.Engine | null>;
  railWidthRef: RefObject<number>;
} {
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const railWidthRef = useRef(0);

  useEffect(() => {
    if (!sceneRef.current || isBallsDisabled) return;

    const { Engine, Render, Runner, Bodies, World, Body, Events } = Matter;

    const container = sceneRef.current;
    const getBounds = () => ({
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
      rail:
        showTableBorders && railMeasureRef.current
          ? railMeasureRef.current.getBoundingClientRect().width
          : 0,
    });

    const initial = getBounds();
    railWidthRef.current = initial.rail;

    const engine = Engine.create();
    engineRef.current = engine;
    engine.gravity.y = 0;

    const render = Render.create({
      element: container,
      engine: engine,
      options: {
        width: initial.width,
        height: initial.height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.75),
      },
    });

    if (render.canvas) {
      render.canvas.style.width = '100%';
      render.canvas.style.height = '100%';
    }

    const leftWall = Bodies.rectangle(
      initial.rail - CONFIG.WALL_THICKNESS / 2,
      initial.height / 2,
      CONFIG.WALL_THICKNESS,
      CONFIG.WALL_HEIGHT,
      {
        isStatic: true,
        render: { visible: false },
      }
    );
    const rightWall = Bodies.rectangle(
      initial.width - initial.rail + CONFIG.WALL_THICKNESS / 2,
      initial.height / 2,
      CONFIG.WALL_THICKNESS,
      CONFIG.WALL_HEIGHT,
      {
        isStatic: true,
        render: { visible: false },
      }
    );

    World.add(engine.world, leftWall);
    World.add(engine.world, rightWall);

    const runner = Runner.create({
      delta: 1000 / CONFIG.FPS,
    });

    if (!isPausedRef.current) {
      Render.run(render);
      Runner.run(runner, engine);
    }

    renderRef.current = render;
    runnerRef.current = runner;

    let lastTime = performance.now();
    const handleBeforeUpdate = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      const safeDelta = Math.min(delta, 100);
      const driftY = (CONFIG.DRIFT_PX / CONFIG.DRIFT_MS) * safeDelta;
      const maxY = (container.clientHeight || window.innerHeight) + 100;

      const bodies = engine.world.bodies;
      for (let i = bodies.length - 1; i >= 0; i--) {
        const body = bodies[i];
        if (!body.isStatic) {
          Body.translate(body, { x: 0, y: driftY });
          if (body.position.y > maxY) {
            World.remove(engine.world, body);
          }
        }
      }
    };

    Events.on(engine, 'beforeUpdate', handleBeforeUpdate);

    const syncSizeAndWalls = () => {
      const { width, height, rail } = getBounds();
      railWidthRef.current = rail;

      Render.setSize(render, width, height);
      if (render.canvas) {
        render.canvas.style.width = '100%';
        render.canvas.style.height = '100%';
      }

      Body.setPosition(leftWall, {
        x: rail - CONFIG.WALL_THICKNESS / 2,
        y: height / 2,
      });

      Body.setPosition(rightWall, {
        x: width - rail + CONFIG.WALL_THICKNESS / 2,
        y: height / 2,
      });

      const minX = rail + CONFIG.BALL_RADIUS;
      const maxX = width - rail - CONFIG.BALL_RADIUS;
      if (maxX > minX) {
        engine.world.bodies.forEach((body) => {
          if (!body.isStatic) {
            if (body.position.x < minX) {
              Body.setPosition(body, { x: minX, y: body.position.y });
            } else if (body.position.x > maxX) {
              Body.setPosition(body, { x: maxX, y: body.position.y });
            }
          }
        });
      }
    };

    const resizeObserver = new ResizeObserver(syncSizeAndWalls);
    resizeObserver.observe(container);
    if (railMeasureRef.current) {
      resizeObserver.observe(railMeasureRef.current);
    }

    window.addEventListener('resize', syncSizeAndWalls);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncSizeAndWalls);
      Events.off(engine, 'beforeUpdate', handleBeforeUpdate);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      Engine.clear(engine);
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
    };
  }, [isBallsDisabled, showTableBorders, sceneRef, railMeasureRef]);

  useEffect(() => {
    if (
      isBallsDisabled ||
      !runnerRef.current ||
      !renderRef.current ||
      !engineRef.current
    ) {
      return;
    }

    if (isPaused) {
      Matter.Runner.stop(runnerRef.current);
      Matter.Render.stop(renderRef.current);
    } else {
      Matter.Runner.stop(runnerRef.current);
      Matter.Render.stop(renderRef.current);
      Matter.Runner.run(runnerRef.current, engineRef.current);
      Matter.Render.run(renderRef.current);
    }
  }, [isPaused, isBallsDisabled]);

  return { isPausedRef, engineRef, railWidthRef };
}

function useBallsSpawner(
  engineRef: RefObject<Matter.Engine | null>,
  isPausedRef: RefObject<boolean | null>,
  railWidthRef: RefObject<number>,
  ballColor: string,
  isBallsDisabled: boolean
) {
  const activeColorRef = useRef(ballColor);

  useEffect(() => {
    activeColorRef.current = ballColor;

    if (engineRef.current) {
      engineRef.current.world.bodies.forEach((body) => {
        if (!body.isStatic) {
          body.render.fillStyle = ballColor;
        }
      });
    }
  }, [ballColor, engineRef]);

  useEffect(() => {
    if (isBallsDisabled || !engineRef.current) return;

    const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const runWithTimeout = (callback: () => void, delay: number) => {
      const id = setTimeout(() => {
        activeTimeouts.delete(id);
        callback();
      }, delay);
      activeTimeouts.add(id);
    };

    const { Bodies, World, Body } = Matter;

    const spawnBall = () => {
      if (!document.hidden && !isPausedRef.current && engineRef.current) {
        const currentBallOptions = {
          ...CONFIG.BALL_OPTIONS,
          render: { fillStyle: activeColorRef.current },
        };

        if (Math.random() < CONFIG.PYRAMID_CHANCE) {
          const r = CONFIG.BALL_RADIUS;
          const d = r * 2.05;

          const margin = Math.max(120, railWidthRef.current + 110);
          const availWidth = Math.max(40, window.innerWidth - margin * 2);
          const startX = Math.random() * availWidth + margin;
          const startY = CONFIG.PYRAMID_START_Y;

          const angle = (Math.random() - 0.5) * (Math.PI / 6);
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
              const baseX = startX - row * (d / 2) + col * d;
              const baseY = startY + row * (r * Math.sqrt(3));

              const dx = baseX - startX;
              const dy = baseY - startY;

              const rotatedX = startX + dx * cosA - dy * sinA;
              const rotatedY = startY + dx * sinA + dy * cosA;

              const ball = Bodies.circle(
                rotatedX,
                rotatedY,
                r,
                currentBallOptions
              );

              Body.setVelocity(ball, { x: 0, y: 0 });
              World.add(engineRef.current.world, ball);
            }
          }

          const targetY = window.innerHeight * CONFIG.IMPACT_Y_RATIO;
          const pyramidDistance = targetY - CONFIG.PYRAMID_START_Y;
          const driftSpeedPerMs = CONFIG.DRIFT_PX / CONFIG.DRIFT_MS;
          const pyramidTimeToTarget = pyramidDistance / driftSpeedPerMs;

          const cueDistance = targetY - CONFIG.CUE_BALL_START_Y;
          const cueSpeedPerMs = (CONFIG.CUE_BALL_SPEED * CONFIG.FPS) / 1000;
          const cueFlightTime = cueDistance / cueSpeedPerMs;

          const calculatedDelay = pyramidTimeToTarget - cueFlightTime;
          const cueDelay = Math.max(
            0,
            calculatedDelay + (Math.random() - 0.5) * 400
          );

          runWithTimeout(() => {
            if (document.hidden || isPausedRef.current || !engineRef.current)
              return;

            const cueBall = Bodies.circle(
              startX,
              CONFIG.CUE_BALL_START_Y,
              r,
              currentBallOptions
            );
            World.add(engineRef.current.world, cueBall);

            const aimX = (Math.random() - 0.5) * 6;
            Body.setVelocity(cueBall, { x: aimX, y: CONFIG.CUE_BALL_SPEED });
          }, cueDelay);

          runWithTimeout(spawnBall, pyramidTimeToTarget + 3000);
          return;
        }

        const railPad = railWidthRef.current + CONFIG.BALL_RADIUS + 6;
        const spawnSpan = Math.max(20, window.innerWidth - railPad * 2);
        const randomX = Math.random() * spawnSpan + railPad;
        const newBall = Bodies.circle(
          randomX,
          -50,
          CONFIG.BALL_RADIUS,
          currentBallOptions
        );

        World.add(engineRef.current.world, newBall);

        const isStationary = Math.random() < 0.2;
        if (isStationary) {
          Body.setVelocity(newBall, { x: 0, y: 0 });
        } else {
          const isStrongHit = Math.random() > 0.6;
          const speedY = isStrongHit
            ? Math.random() * 10 + 10
            : Math.random() * 3 + 2;
          const speedX = (Math.random() - 0.5) * (isStrongHit ? 12 : 4);
          Body.setVelocity(newBall, { x: speedX, y: speedY });
        }
      }

      const nextSpawnTime = Math.random() * 1000 + 200;
      runWithTimeout(spawnBall, nextSpawnTime);
    };

    spawnBall();

    return () => {
      activeTimeouts.forEach(clearTimeout);
    };
  }, [isBallsDisabled, engineRef, isPausedRef, railWidthRef]);
}

export function BilliardsBackground({
  className,
  isPaused = false,
}: {
  className?: string;
  isPaused: boolean;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const railMeasureRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const backgroundMode = useSettingsStore((state) => state.backgroundMode);
  const showTableBorders = useSettingsStore((state) => state.showTableBorders);
  const disciplineThemes = useSettingsStore((state) => state.disciplineThemes);
  const discipline = useDisciplineStore((state) => state.discipline);

  const activeDiscipline = location.pathname === '/' ? discipline : 'pyramid';

  const clothColor = resolveSlotColor(
    disciplineThemes,
    activeDiscipline,
    'cloth'
  );
  const railColor = resolveSlotColor(
    disciplineThemes,
    activeDiscipline,
    'rails'
  );
  const bgBallColor = resolveSlotColor(
    disciplineThemes,
    activeDiscipline,
    'bgBalls'
  );

  const clothGlow = hexToRgba(adjustHex(clothColor, 65), 0.05);
  const bottomVignette = '#070b08';

  const isStaticCloth = backgroundMode === 'static';
  const isBallsDisabled = backgroundMode !== 'full';

  const { isPausedRef, engineRef, railWidthRef } = useInit(
    sceneRef,
    railMeasureRef,
    isPaused,
    isBallsDisabled,
    showTableBorders
  );
  useBallsSpawner(
    engineRef,
    isPausedRef,
    railWidthRef,
    bgBallColor,
    isBallsDisabled
  );

  return (
    <>
      <style>
        {`
          @keyframes slideFelt {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(0, ${CONFIG.DRIFT_PX}px, 0); }
          }
          
          .cloth-texture {
            background-image: 
              repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px),
              repeating-linear-gradient(-45deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 4px),
              url("${NOISE_SVG}");
            background-size: 4px 4px, 4px 4px, 200px 200px;
            opacity: 0.18;
          }

          .cloth-texture-animated {
            will-change: transform;
            animation: slideFelt ${CONFIG.DRIFT_MS}ms linear infinite;
          }
        `}
      </style>

      <div
        style={{ backgroundColor: clothColor }}
        className={cn(
          'fixed inset-0 -z-10 overflow-hidden transition-colors duration-700 ease-in-out',
          isPaused && 'invisible opacity-0',
          className
        )}
      >
        <div
          style={
            isStaticCloth
              ? undefined
              : {
                  top: -CONFIG.DRIFT_PX,
                  height: `calc(100% + ${CONFIG.DRIFT_PX}px)`,
                }
          }
          className={cn(
            'cloth-texture pointer-events-none absolute inset-0 w-full opacity-80',
            !isStaticCloth && 'cloth-texture-animated',
            isPaused && '[animation-play-state:paused]'
          )}
        />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,230,0.08)_0%,transparent_60%)]" />

        {!isBallsDisabled && (
          <div ref={sceneRef} className="absolute inset-0" />
        )}

        <div
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${clothGlow} 0%, transparent 55%)`,
          }}
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        />

        <div
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.45), ${bottomVignette})`,
          }}
          className="pointer-events-none absolute inset-0 transition-colors duration-700"
        />

        {showTableBorders && (
          <TableSideRails
            railMeasureRef={railMeasureRef}
            railColor={railColor}
          />
        )}
      </div>
    </>
  );
}
import { useEffect, useRef, type RefObject } from 'react';
import Matter from 'matter-js';
import { cn } from '@/shared/lib/utils/cn';
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E`;

const CONFIG = {
  FPS: 60,
  DRIFT_PX: 300,
  DRIFT_MS: 4000,
  BALL_RADIUS: 20,
  PYRAMID_CHANCE: 0.03,
  WALL_THICKNESS: 50,
  WALL_HEIGHT: 10000,
  PYRAMID_START_Y: -160,
  CUE_BALL_START_Y: -50,
  CUE_BALL_SPEED: 36,
  IMPACT_Y_RATIO: 0.2,

  BALL_OPTIONS: {
    restitution: 0.95,
    frictionAir: 0.007,
    render: { fillStyle: '#f5f5f5' },
  },
};

function useInit<T extends HTMLElement = HTMLElement>(
  sceneRef: RefObject<T | null>,
  isPaused: boolean
): {
  isPausedRef: RefObject<boolean | null>;
  engineRef: RefObject<Matter.Engine | null>;
} {
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    const { Engine, Render, Runner, Bodies, World, Body, Events } = Matter;

    const engine = Engine.create();
    engineRef.current = engine;
    engine.gravity.y = 0;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
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
      -CONFIG.WALL_THICKNESS / 2,
      window.innerHeight / 2,
      CONFIG.WALL_THICKNESS,
      CONFIG.WALL_HEIGHT,
      {
        isStatic: true,
      }
    );
    const rightWall = Bodies.rectangle(
      window.innerWidth + CONFIG.WALL_THICKNESS / 2,
      window.innerHeight / 2,
      CONFIG.WALL_THICKNESS,
      CONFIG.WALL_HEIGHT,
      {
        isStatic: true,
      }
    );

    World.add(engine.world, leftWall);
    World.add(engine.world, rightWall);

    const runner = Runner.create({
      delta: 1000 / CONFIG.FPS, // Строго 60 FPS
    });

    if (!isPausedRef.current) {
      Render.run(render);
      Runner.run(runner, engine);
    }

    renderRef.current = render;
    runnerRef.current = runner;

    // Очищаем вылетевшее вниз
    // И двигаем все вниз для эффекта полета камеры
    let lastTime = performance.now();
    const handleBeforeUpdate = () => {
      const now = performance.now();
      // Сколько реальных миллисекунд прошло с прошлого кадра (на 60Hz это ~16ms, на 120Hz это ~8ms)
      const delta = now - lastTime;
      lastTime = now;

      // Защита от скачка, если вкладку свернули и развернули
      const safeDelta = Math.min(delta, 100);

      // Сдвиг строго за миллисекунду: (200px / 4000ms) * delta
      const driftY = (CONFIG.DRIFT_PX / CONFIG.DRIFT_MS) * safeDelta;

      const bodies = engine.world.bodies;
      for (let i = bodies.length - 1; i >= 0; i--) {
        const body = bodies[i];
        if (!body.isStatic) {
          Body.translate(body, { x: 0, y: driftY });
          if (body.position.y > window.innerHeight + 100) {
            World.remove(engine.world, body);
          }
        }
      }
    };

    Events.on(engine, 'beforeUpdate', handleBeforeUpdate);

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      Render.setSize(render, newWidth, newHeight);

      Body.setPosition(rightWall, {
        x: newWidth + CONFIG.WALL_THICKNESS / 2,
        y: newHeight / 2,
      });

      Body.setPosition(leftWall, {
        x: -CONFIG.WALL_THICKNESS / 2,
        y: newHeight / 2,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      Events.off(engine, 'beforeUpdate', handleBeforeUpdate);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      Engine.clear(engine);
      window.removeEventListener('resize', handleResize);
      engineRef.current = null;
      renderRef.current = null;
      runnerRef.current = null;
    };
  }, []);

  //Отвечает за то, на паузе ли bg
  useEffect(() => {
    if (!runnerRef.current || !renderRef.current || !engineRef.current) return;

    if (isPaused) {
      // Пользователь зашел на лекцию: глушим движок и рендер!
      Matter.Runner.stop(runnerRef.current);
      Matter.Render.stop(renderRef.current);
    } else {
      // Превентивный stop защищает от двойного запуска requestAnimationFrame
      Matter.Runner.stop(runnerRef.current);
      Matter.Render.stop(renderRef.current);
      // Пользователь вышел с лекции: снимаем с паузы!
      Matter.Runner.run(runnerRef.current, engineRef.current);
      Matter.Render.run(renderRef.current);
    }
  }, [isPaused]);

  return { isPausedRef, engineRef };
}

function useBallsSpawner(
  engineRef: RefObject<Matter.Engine | null>,
  isPausedRef: RefObject<boolean | null>
) {
  useEffect(() => {
    if (!engineRef.current) return;

    const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
    // Запускает setTimeout, добавляет его в Set, а после выполнения - удаляет.
    const runWithTimeout = (callback: () => void, delay: number) => {
      const id = setTimeout(() => {
        activeTimeouts.delete(id);
        callback();
      }, delay);
      activeTimeouts.add(id);
    };

    const { Bodies, World, Body } = Matter;

    // Стреляем шарами рандомно
    const spawnBall = () => {
      if (!document.hidden && !isPausedRef.current && engineRef.current) {
        // 3% шанс на появление целой пирамиды
        if (Math.random() < CONFIG.PYRAMID_CHANCE) {
          const r = CONFIG.BALL_RADIUS;
          const d = r * 2.05;

          const margin = 150;
          const startX =
            Math.random() * (window.innerWidth - margin * 2) + margin;
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
                CONFIG.BALL_OPTIONS
              );

              Body.setVelocity(ball, { x: 0, y: 0 });
              World.add(engineRef.current.world, ball);
            }
          }

          const targetY = window.innerHeight * CONFIG.IMPACT_Y_RATIO;

          // Сколько миллисекунд пирамида будет ползти до центра
          const pyramidDistance = targetY - CONFIG.PYRAMID_START_Y;
          const driftSpeedPerMs = CONFIG.DRIFT_PX / CONFIG.DRIFT_MS;
          const pyramidTimeToTarget = pyramidDistance / driftSpeedPerMs;

          // За сколько миллисекунд биток долетит от своего спавна (-50) до центра
          const cueDistance = targetY - CONFIG.CUE_BALL_START_Y;
          const cueSpeedPerMs = (CONFIG.CUE_BALL_SPEED * CONFIG.FPS) / 1000;
          const cueFlightTime = cueDistance / cueSpeedPerMs;

          // Задержка перед выстрелом битка:
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
              CONFIG.BALL_OPTIONS
            );
            World.add(engineRef.current.world, cueBall);

            // Небольшой разброс по горизонтали (aimX), чтобы удар был не идеально в лоб, а сочный
            const aimX = (Math.random() - 0.5) * 6;

            // Сила удара берется из CONFIG.CUE_BALL_SPEED
            Body.setVelocity(cueBall, { x: aimX, y: CONFIG.CUE_BALL_SPEED });
          }, cueDelay);

          // Пауза перед следующим шаром: ждем пока пирамида доедет, получит удар + 3 секунды полюбоваться разлетом
          runWithTimeout(spawnBall, pyramidTimeToTarget + 3000);
          return;
        }

        const randomX = Math.random() * (window.innerWidth - 100) + 50;
        const newBall = Bodies.circle(randomX, -50, 20, CONFIG.BALL_OPTIONS);

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
    // Запускаем рекурсивный цикл
    spawnBall();

    return () => {
      activeTimeouts.forEach(clearTimeout);
    };
  }, []);
}

export function BilliardsBackground({
  className,
  isPaused = false,
}: {
  className?: string;
  isPaused: boolean;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);

  const { isPausedRef, engineRef } = useInit(sceneRef, isPaused);

  useBallsSpawner(engineRef, isPausedRef);

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
            will-change: transform;
            animation: slideFelt ${CONFIG.DRIFT_MS}ms linear infinite;
          }
        `}
      </style>

      <div
        className={cn(
          'fixed inset-0 -z-10 overflow-hidden bg-[#11311c]',
          isPaused && 'invisible opacity-0',
          className
        )}
      >
        {/* Анимированная фактура сукна */}
        <div
          style={{
            top: -CONFIG.DRIFT_PX,
            height: `calc(100% + ${CONFIG.DRIFT_PX}px)`,
          }}
          className={cn(
            'cloth-texture pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-80',
            isPaused && '[animation-play-state:paused]'
          )}
        />

        {/* Бильярдная лампа */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,230,0.08)_0%,transparent_60%)]" />

        {/* Физический движок */}
        <div ref={sceneRef} className="absolute inset-0" />

        {/* Дымка */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(164,255,188,0.03)_0%,transparent_50%)]" />

        {/* Градиент глубины */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/45 to-[#0a120c]" />
      </div>
    </>
  );
}

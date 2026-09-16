import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { cn } from '@/shared/lib/utils/cn';
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E`;

const BALL_OPTIONS = {
  restitution: 0.95,
  frictionAir: 0.007,
  render: { fillStyle: '#f5f5f5' },
};

export function BilliardsBackground({ className }: { className?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);

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
      },
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Очищаем вылетевшее вниз
    // И двигаем все вниз для эффекта полета камеры
    Events.on(engine, 'beforeUpdate', () => {
      const bodies = engine.world.bodies;

      // Смещение 200px за 4 сек при 60 fps
      const driftY = (200 / 4000) * (1000 / 60);

      bodies.forEach((body) => {
        if (!body.isStatic) {
          //  Сдвигаем шар вместе с сукном (это не меняет его физический импульс)
          Body.translate(body, { x: 0, y: driftY });

          // Очищаем то, что улетело за пределы экрана
          if (body.position.y > window.innerHeight + 100) {
            World.remove(engine.world, body);
          }
        }
      });
    });

    // ==========================================
    const wallThickness = 50;
    const height = window.innerHeight;
    const width = window.innerWidth;

    const leftWall = Bodies.rectangle(
      -wallThickness / 2,
      height / 2,
      wallThickness,
      height,
      {
        isStatic: true,
      }
    );
    const rightWall = Bodies.rectangle(
      width + wallThickness / 2,
      height / 2,
      wallThickness,
      height,
      {
        isStatic: true,
      }
    );
    World.add(engine.world, leftWall);
    World.add(engine.world, rightWall);

    // Стреляем шарами рандомно
    let spawnBallTimeoutId: ReturnType<typeof setTimeout>;
    let piramidEventTimeoutId: ReturnType<typeof setTimeout>;

    const spawnBall = () => {
      if (!document.hidden) {
        // 3% шанс на появление целой пирамиды
        if (Math.random() < 0.03) {
          const r = 20;
          const d = r * 2.05;

          const margin = 150;
          const startX =
            Math.random() * (window.innerWidth - margin * 2) + margin;
          const startY = -250;

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

              const ball = Bodies.circle(rotatedX, rotatedY, r, BALL_OPTIONS);

              Body.setVelocity(ball, { x: 0, y: 0 });
              World.add(engine.world, ball);
            }
          }

          // 4. Ждем 5-7 секунды.
          // Биток спавним ровно по центру начального X и бьем вниз.
          piramidEventTimeoutId = setTimeout(
            () => {
              if (document.hidden) return;

              const cueBall = Bodies.circle(startX, -50, r, BALL_OPTIONS);
              World.add(engine.world, cueBall);

              const aimX = (Math.random() - 0.5) * 6;

              Body.setVelocity(cueBall, { x: aimX, y: 24 });
            },
            Math.random() * 2000 + 9000
          );

          // Ставим долгую паузу перед следующим обычным шаром
          spawnBallTimeoutId = setTimeout(spawnBall, 6000);
          return;
        }

        const randomX = Math.random() * (window.innerWidth - 100) + 50;
        const newBall = Bodies.circle(randomX, -50, 20, BALL_OPTIONS);

        World.add(engine.world, newBall);

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
      spawnBallTimeoutId = setTimeout(spawnBall, nextSpawnTime);
    };
    // Запускаем рекурсивный цикл
    spawnBall();

    Events.on(render, 'beforeRender', () => {
      const context = render.context;
      context.shadowColor = 'rgba(0, 0, 0, 0.4)';
      context.shadowBlur = 10;
      context.shadowOffsetX = 5;
      context.shadowOffsetY = 5;
    });
    // ==========================================

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      render.canvas.width = newWidth;
      render.canvas.height = newHeight;
      render.options.width = newWidth;
      render.options.height = newHeight;

      Body.setPosition(rightWall, {
        x: newWidth + wallThickness / 2,
        y: newHeight / 2,
      });

      Body.setPosition(leftWall, {
        x: -wallThickness / 2,
        y: height / 2,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.remove();
      }
      Engine.clear(engine);
      clearTimeout(spawnBallTimeoutId);
      clearTimeout(piramidEventTimeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes slideFelt {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(0, 200px, 0); }
          }
          
          .cloth-texture {
            background-image: 
              repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px),
              repeating-linear-gradient(-45deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 4px),
              url("${NOISE_SVG}");
            background-size: 4px 4px, 4px 4px, 200px 200px;
            opacity: 0.18;
            will-change: transform;
            animation: slideFelt 4s linear infinite;
          }
        `}
      </style>

      <div
        className={cn(
          'fixed inset-0 -z-10 overflow-hidden bg-[#0d1c12]',
          className
        )}
      >
        {/* Анимированная фактура сукна */}
        <div className="cloth-texture pointer-events-none absolute inset-x-0 -top-[200px] bottom-0 h-[calc(100%+200px)] w-full opacity-80" />

        {/* Бильярдная лампа */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,230,0.08)_0%,transparent_60%)]" />

        {/* Физический движок */}
        <div ref={sceneRef} className="absolute inset-0" />

        {/* Дымка */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(164,255,188,0.03)_0%,transparent_50%)]" />

        {/* Градиент глубины */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-[#0a120c]" />
      </div>
    </>
  );
}

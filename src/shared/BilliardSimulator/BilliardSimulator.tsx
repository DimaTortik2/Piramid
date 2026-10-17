/**
 * ============================================================================
 * ИНСТРУКЦИЯ ПО НАСТРОЙКЕ СИМУЛЯТОРА УДАРОВ (BilliardSimulator)
 * ============================================================================
 *
 * 1. ОДИНОЧНЫЙ РЕЖИМ ИЛИ СЛАЙДЕР (slides):
 *    Передайте массив `slides={[ ... ]}` для переключения между вариантами
 *    удара или разбора правил («Штраф» / «Как надо») внутри одного блока.
 *
 * 2. КООРДИНАТЫ, БОРТА И ЛУЗЫ:
 *    - Виртуальный стол по умолчанию: 800 x 420 (центр: x = 400, y = 210).
 *    - walls: 'all' (все борта), 'none' (без бортов, шары улетают за край),
 *      либо { top?: boolean, bottom?: boolean, left?: boolean, right?: boolean }.
 *    - pockets: true (6 луз), false (без луз), либо массив [{ x, y, radius }].
 *
 * 3. СПОСОБЫ НАВЕДЕНИЯ УДАРА (shots):
 *    В каждом объекте удара можно выбрать любой из 3 способов прицеливания:
 *    А) Автоприцел в лузу через шар (`aimAt`):
 *       aimAt: {
 *         ballId: 1,
 *         pocket: 'top-right', // 'top-left' | 'top-middle' | 'top-right' | 'bottom-left' | 'bottom-middle' | 'bottom-right'
 *         cutOffset?: 0 // 0 = точно в лузу, >0.6 или <-0.6 = намеренный промах
 *       }
 *       Если вместе с `aimAt` задан `spin.curve`, симулятор автоматически
 *       рассчитает стартовый угол дуги так, чтобы биток по дуге пришел
 *       ровно в точку резки прицельного шара!
 *    Б) Прицел в конкретную координату стола (`target`):
 *       target: { x: 450, y: 160 }
 *    В) Прицел по углу в градусах (`angle`):
 *       angle: -15 (0 = вправо, 90 = вниз, 180 = влево, -90 = вверх)
 *
 * 4. СИЛА И ВРАЩЕНИЕ БИТКА (power, spin):
 *    - power: сила удара (4..32)
 *    - jumpOffTable?: true — шар при ударе в борт вылетает за пределы стола
 *    - spin:
 *        * top: -1 (оттяжка назад), 0 (клапштос / остановка / 90°), +1 (накат вперед)
 *        * side: -1 (левый боковой винт), +1 (правый винт)
 *        * curve: от -1 до +1 (массе / дуговик — <0 дуга вверх/влево, >0 дуга вниз/вправо)
 *
 * 5. ПЛАШКА ВЕРДИКТА (verdict):
 *    verdict: { type: 'foul' | 'valid', title: '...', subtitle: '...' }
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import {
  ArrowCounterClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  EyeIcon,
  GaugeIcon,
  PauseIcon,
  PlayIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';
import { useSettingsStore } from '@/shared/store/useSettingsStore';

export type PocketPresetName =
  | 'top-left'
  | 'top-middle'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-middle'
  | 'bottom-right';

export interface BallSpinConfig {
  top?: number;
  side?: number;
  curve?: number;
}

export interface SimulatorBallConfig {
  id: string | number;
  x: number;
  y: number;
  radius?: number;
  number?: number | string;
  isCue?: boolean;
}

export interface SimulatorAimAtConfig {
  ballId: string | number;
  pocket?: PocketPresetName | { x: number; y: number };
  cutOffset?: number;
}

export interface SimulatorShotConfig {
  ballId: string | number;
  angle?: number;
  target?: { x: number; y: number };
  aimAt?: SimulatorAimAtConfig;
  power: number;
  spin?: BallSpinConfig;
  delayMs?: number;
  jumpOffTable?: boolean;
}

export interface SimulatorPocketConfig {
  x: number;
  y: number;
  radius?: number;
  kind?: 'corner' | 'middle' | 'custom';
  cornerX?: -1 | 1;
  cornerY?: -1 | 1;
  middleY?: -1 | 1;
}

export interface SimulatorWallsConfig {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

export interface SimulatorMarkerConfig {
  x: number;
  y: number;
  radius?: number;
  color?: string;
  label?: string;
}

export interface SimulatorArrowConfig {
  from: [number, number];
  to: [number, number];
  color?: string;
  dashed?: boolean;
}

export interface SimulatorVerdictConfig {
  type: 'foul' | 'valid';
  title: string;
  subtitle?: string;
}

export interface BilliardSimulatorSlide {
  label: string;
  title?: string;
  description?: string;
  balls: SimulatorBallConfig[];
  shots?: SimulatorShotConfig[];
  walls?: 'all' | 'none' | SimulatorWallsConfig;
  pockets?: boolean | SimulatorPocketConfig[];
  markers?: SimulatorMarkerConfig[];
  arrows?: SimulatorArrowConfig[];
  verdict?: SimulatorVerdictConfig;
}

export interface BilliardSimulatorProps {
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  ballRadius?: number;
  balls?: SimulatorBallConfig[];
  shots?: SimulatorShotConfig[];
  walls?: 'all' | 'none' | SimulatorWallsConfig;
  pockets?: boolean | SimulatorPocketConfig[];
  markers?: SimulatorMarkerConfig[];
  arrows?: SimulatorArrowConfig[];
  verdict?: SimulatorVerdictConfig;
  slides?: BilliardSimulatorSlide[];
  showTrajectories?: boolean;
  showAimLine?: boolean;
  showCue?: boolean;
  showSpinHud?: boolean;
  autoPlay?: boolean;
  autoLoop?: boolean;
  loopDelayMs?: number;
  controls?: boolean;
  className?: string;
}

export function createPyramidRack({
  apexX,
  apexY,
  rows = 5,
  ballRadius = 14,
  direction = 'right',
  startNumber = 1,
}: {
  apexX: number;
  apexY: number;
  rows?: number;
  ballRadius?: number;
  direction?: 'right' | 'left' | 'up' | 'down';
  startNumber?: number;
}): SimulatorBallConfig[] {
  const result: SimulatorBallConfig[] = [];
  const gap = ballRadius * 2.04;
  const rowStep = ballRadius * Math.sqrt(3) * 1.02;
  let num = startNumber;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      const lateralOffset = (col - row / 2) * gap;
      const depthOffset = row * rowStep;

      let x = apexX;
      let y = apexY;

      if (direction === 'right') {
        x = apexX + depthOffset;
        y = apexY + lateralOffset;
      } else if (direction === 'left') {
        x = apexX - depthOffset;
        y = apexY + lateralOffset;
      } else if (direction === 'down') {
        x = apexX + lateralOffset;
        y = apexY + depthOffset;
      } else {
        x = apexX + lateralOffset;
        y = apexY - depthOffset;
      }

      result.push({
        id: `rack-${num}`,
        x,
        y,
        radius: ballRadius,
        number: num,
      });
      num++;
    }
  }

  return result;
}

interface InternalBallMeta {
  config: SimulatorBallConfig;
  radius: number;
  topSpin: number;
  sideSpin: number;
  curve: number;
  initialAngle: number;
  arcLength: number;
  spinAxisAngle: number;
  spinEnergy: number;
  hasHitBall: boolean;
  ticksAfterHit: number;
  jumpOffTable: boolean;
  isAirborne: boolean;
  trail: { x: number; y: number }[];
  potted?: boolean;
  potAnimation?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    pocketX: number;
    pocketY: number;
    progress: number;
  };
}

const CUSHION_SIZE = 26;
const CURVE_K = 0.0022;

const resolvePocketAimTarget = (
  pocket: PocketPresetName | { x: number; y: number } | undefined,
  width: number,
  height: number
): { x: number; y: number } => {
  if (pocket && typeof pocket === 'object') {
    return pocket;
  }
  const cornerTarget = 22;
  const middleTargetY = 18;
  switch (pocket) {
    case 'top-left':
      return { x: cornerTarget, y: cornerTarget };
    case 'top-middle':
      return { x: width / 2, y: middleTargetY };
    case 'bottom-left':
      return { x: cornerTarget, y: height - cornerTarget };
    case 'bottom-middle':
      return { x: width / 2, y: height - middleTargetY };
    case 'bottom-right':
      return { x: width - cornerTarget, y: height - cornerTarget };
    case 'top-right':
    default:
      return { x: width - cornerTarget, y: cornerTarget };
  }
};

const resolveGhostAndLaunch = (
  shot: SimulatorShotConfig,
  strikerX: number,
  strikerY: number,
  strikerRadius: number,
  balls: SimulatorBallConfig[],
  defaultRadius: number,
  width: number,
  height: number
): { launchAngle: number; ghostX?: number; ghostY?: number; chordDist?: number } => {
  const curve = Math.max(-1, Math.min(1, shot.spin?.curve ?? 0));
  const kappa = curve * CURVE_K;

  if (shot.aimAt) {
    const objBall = balls.find((b) => b.id === shot.aimAt?.ballId);
    if (objBall) {
      const objR = objBall.radius ?? defaultRadius;
      const sumR = strikerRadius + objR;
      const pocketPos = resolvePocketAimTarget(
        shot.aimAt.pocket,
        width,
        height
      );

      const dx = pocketPos.x - objBall.x;
      const dy = pocketPos.y - objBall.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;

      const perpX = -uy;
      const perpY = ux;
      const offset = (shot.aimAt.cutOffset ?? 0) * sumR;

      const ghostX = objBall.x - ux * sumR + perpX * offset;
      const ghostY = objBall.y - uy * sumR + perpY * offset;

      const chordDx = ghostX - strikerX;
      const chordDy = ghostY - strikerY;
      const chordDist = Math.hypot(chordDx, chordDy) || 1;
      const chordAngle = Math.atan2(chordDy, chordDx);

      const halfTurnArg = Math.max(-0.85, Math.min(0.85, (kappa * chordDist) / 2));
      const launchAngle = chordAngle - Math.asin(halfTurnArg);

      return { launchAngle, ghostX, ghostY, chordDist };
    }
  }

  if (shot.target) {
    const chordDx = shot.target.x - strikerX;
    const chordDy = shot.target.y - strikerY;
    const chordDist = Math.hypot(chordDx, chordDy) || 1;
    const chordAngle = Math.atan2(chordDy, chordDx);
    const halfTurnArg = Math.max(-0.85, Math.min(0.85, (kappa * chordDist) / 2));
    return {
      launchAngle: chordAngle - Math.asin(halfTurnArg),
      ghostX: shot.target.x,
      ghostY: shot.target.y,
      chordDist,
    };
  }

  return { launchAngle: ((shot.angle ?? 0) * Math.PI) / 180 };
};

export function BilliardSimulator({
  title,
  description,
  width = 800,
  height = 420,
  ballRadius = 15,
  balls = [],
  shots = [],
  walls = 'all',
  pockets = true,
  markers = [],
  arrows = [],
  verdict,
  slides,
  showTrajectories = true,
  showAimLine = true,
  showCue = true,
  showSpinHud = true,
  autoPlay = true,
  autoLoop = true,
  loopDelayMs = 2000,
  controls = true,
  className,
}: BilliardSimulatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isDarkBalls = useSettingsStore((state) => state.isDarkBalls);

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isVisible, setIsVisible] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 0.5 | 0.25>(1);
  const [trajectoriesVisible, setTrajectoriesVisible] =
    useState(showTrajectories);
  const [restartSeed, setRestartSeed] = useState(0);
  const [showVerdictBanner, setShowVerdictBanner] = useState(false);

  const currentSlide =
    slides && slides.length > 0
      ? slides[Math.min(activeSlideIdx, slides.length - 1)]
      : null;

  const activeTitle = currentSlide?.title ?? title;
  const activeDescription = currentSlide?.description ?? description;
  const activeBalls = currentSlide ? currentSlide.balls : balls;
  const activeShots = currentSlide ? (currentSlide.shots ?? []) : shots;
  const activeWalls = currentSlide ? (currentSlide.walls ?? walls) : walls;
  const activePockets = currentSlide
    ? (currentSlide.pockets ?? pockets)
    : pockets;
  const activeMarkers = currentSlide ? (currentSlide.markers ?? []) : markers;
  const activeArrows = currentSlide ? (currentSlide.arrows ?? []) : arrows;
  const activeVerdict = currentSlide ? currentSlide.verdict : verdict;

  const speedMultiplierRef = useRef(speedMultiplier);
  speedMultiplierRef.current = speedMultiplier;

  const trajectoriesVisibleRef = useRef(trajectoriesVisible);
  trajectoriesVisibleRef.current = trajectoriesVisible;

  const isDarkBallsRef = useRef(isDarkBalls);
  isDarkBallsRef.current = isDarkBalls;

  const startLoopRef = useRef<(() => void) | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);

  const triggerRestart = useCallback(() => {
    setShowVerdictBanner(false);
    setIsPlaying(true);
    setRestartSeed((prev) => prev + 1);
  }, []);

  const selectSlide = (idx: number) => {
    setShowVerdictBanner(false);
    setActiveSlideIdx(idx);
    setIsPlaying(true);
    setRestartSeed((prev) => prev + 1);
  };

  const cycleSpeed = () => {
    setSpeedMultiplier((prev) => (prev === 1 ? 0.5 : prev === 0.5 ? 0.25 : 1));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setShowVerdictBanner(false);

    const { Engine, World, Bodies, Body, Events } = Matter;
    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    });

    const resolvedWalls: Required<SimulatorWallsConfig> =
      activeWalls === 'all'
        ? { top: true, bottom: true, left: true, right: true }
        : activeWalls === 'none'
          ? { top: false, bottom: false, left: false, right: false }
          : {
              top: Boolean(activeWalls.top),
              bottom: Boolean(activeWalls.bottom),
              left: Boolean(activeWalls.left),
              right: Boolean(activeWalls.right),
            };

    const resolvedPockets: SimulatorPocketConfig[] = [];
    if (Array.isArray(activePockets)) {
      resolvedPockets.push(
        ...activePockets.map((p) => ({ ...p, kind: p.kind ?? 'custom' }))
      );
    } else if (activePockets) {
      const cornerR = 14;
      const middleR = 13;
      if (resolvedWalls.top && resolvedWalls.left)
        resolvedPockets.push({
          x: 16,
          y: 16,
          radius: cornerR,
          kind: 'corner',
          cornerX: -1,
          cornerY: -1,
        });
      if (resolvedWalls.top && resolvedWalls.right)
        resolvedPockets.push({
          x: width - 16,
          y: 16,
          radius: cornerR,
          kind: 'corner',
          cornerX: 1,
          cornerY: -1,
        });
      if (resolvedWalls.bottom && resolvedWalls.left)
        resolvedPockets.push({
          x: 16,
          y: height - 16,
          radius: cornerR,
          kind: 'corner',
          cornerX: -1,
          cornerY: 1,
        });
      if (resolvedWalls.bottom && resolvedWalls.right)
        resolvedPockets.push({
          x: width - 16,
          y: height - 16,
          radius: cornerR,
          kind: 'corner',
          cornerX: 1,
          cornerY: 1,
        });
      if (resolvedWalls.top && width >= 520)
        resolvedPockets.push({
          x: width / 2,
          y: 14,
          radius: middleR,
          kind: 'middle',
          middleY: -1,
        });
      if (resolvedWalls.bottom && width >= 520)
        resolvedPockets.push({
          x: width / 2,
          y: height - 14,
          radius: middleR,
          kind: 'middle',
          middleY: 1,
        });
    }

    const wallBodies: Matter.Body[] = [];
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      restitution: 0.88,
      friction: 0.005,
      frictionStatic: 0,
      slop: 0.01,
      collisionFilter: { category: 0x0002 },
    };

    const hasPockets = resolvedPockets.length > 0;
    const cornerCut = hasPockets ? 40 : CUSHION_SIZE;
    const middleCut = hasPockets && width >= 520 ? 22 : 0;

    if (resolvedWalls.top) {
      if (middleCut > 0) {
        const segW = width / 2 - cornerCut - middleCut;
        wallBodies.push(
          Bodies.rectangle(
            cornerCut + segW / 2,
            CUSHION_SIZE / 2,
            segW,
            CUSHION_SIZE,
            { ...wallOptions, chamfer: { radius: 5 }, label: 'wall-top' }
          ),
          Bodies.rectangle(
            width / 2 + middleCut + segW / 2,
            CUSHION_SIZE / 2,
            segW,
            CUSHION_SIZE,
            { ...wallOptions, chamfer: { radius: 5 }, label: 'wall-top' }
          )
        );
      } else {
        const segW = width - cornerCut * 2;
        wallBodies.push(
          Bodies.rectangle(width / 2, CUSHION_SIZE / 2, segW, CUSHION_SIZE, {
            ...wallOptions,
            chamfer: { radius: 5 },
            label: 'wall-top',
          })
        );
      }
    }

    if (resolvedWalls.bottom) {
      if (middleCut > 0) {
        const segW = width / 2 - cornerCut - middleCut;
        wallBodies.push(
          Bodies.rectangle(
            cornerCut + segW / 2,
            height - CUSHION_SIZE / 2,
            segW,
            CUSHION_SIZE,
            { ...wallOptions, chamfer: { radius: 5 }, label: 'wall-bottom' }
          ),
          Bodies.rectangle(
            width / 2 + middleCut + segW / 2,
            height - CUSHION_SIZE / 2,
            segW,
            CUSHION_SIZE,
            { ...wallOptions, chamfer: { radius: 5 }, label: 'wall-bottom' }
          )
        );
      } else {
        const segW = width - cornerCut * 2;
        wallBodies.push(
          Bodies.rectangle(
            width / 2,
            height - CUSHION_SIZE / 2,
            segW,
            CUSHION_SIZE,
            { ...wallOptions, chamfer: { radius: 5 }, label: 'wall-bottom' }
          )
        );
      }
    }

    if (resolvedWalls.left) {
      const segH = height - cornerCut * 2;
      wallBodies.push(
        Bodies.rectangle(CUSHION_SIZE / 2, height / 2, CUSHION_SIZE, segH, {
          ...wallOptions,
          chamfer: { radius: 5 },
          label: 'wall-left',
        })
      );
    }

    if (resolvedWalls.right) {
      const segH = height - cornerCut * 2;
      wallBodies.push(
        Bodies.rectangle(
          width - CUSHION_SIZE / 2,
          height / 2,
          CUSHION_SIZE,
          segH,
          { ...wallOptions, chamfer: { radius: 5 }, label: 'wall-right' }
        )
      );
    }

    World.add(engine.world, wallBodies);

    const bodyMap = new Map<string | number, Matter.Body>();
    const metaMap = new Map<number, InternalBallMeta>();

    activeBalls.forEach((b) => {
      const r = b.radius ?? ballRadius;
      const body = Bodies.circle(b.x, b.y, r, {
        restitution: 0.95,
        friction: 0.002,
        frictionAir: 0.0135,
        frictionStatic: 0,
        slop: 0.005,
        density: 0.002,
        collisionFilter: { category: 0x0001, mask: 0x0001 | 0x0002 },
        label: `ball-${b.id}`,
      });

      bodyMap.set(b.id, body);
      metaMap.set(body.id, {
        config: b,
        radius: r,
        topSpin: 0,
        sideSpin: 0,
        curve: 0,
        initialAngle: 0,
        arcLength: 0,
        spinAxisAngle: 0,
        spinEnergy: 0,
        hasHitBall: false,
        ticksAfterHit: 0,
        jumpOffTable: false,
        isAirborne: false,
        trail: [{ x: b.x, y: b.y }],
      });

      World.add(engine.world, body);
    });

    const postStepImpulses: (() => void)[] = [];

    const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const metaA = metaMap.get(pair.bodyA.id);
        const metaB = metaMap.get(pair.bodyB.id);

        if (metaA && metaB) {
          const dx = pair.bodyB.position.x - pair.bodyA.position.x;
          const dy = pair.bodyB.position.y - pair.bodyA.position.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;

          const registerBallHit = (
            strikerBody: Matter.Body,
            strikerMeta: InternalBallMeta,
            targetBody: Matter.Body,
            normalX: number,
            normalY: number
          ) => {
            if (strikerMeta.hasHitBall) return;
            strikerMeta.hasHitBall = true;
            strikerMeta.ticksAfterHit = 0;

            const preSpeed = Math.hypot(
              strikerBody.velocity.x,
              strikerBody.velocity.y
            );
            if (preSpeed > 0.2) {
              strikerMeta.spinAxisAngle = Math.atan2(
                strikerBody.velocity.y,
                strikerBody.velocity.x
              );
            }

            const top = strikerMeta.topSpin;
            const side = strikerMeta.sideSpin;
            const energy = Math.min(strikerMeta.spinEnergy, 16);

            postStepImpulses.push(() => {
              if (Math.abs(top) < 0.08 && energy > 2) {
                const vx = strikerBody.velocity.x;
                const vy = strikerBody.velocity.y;
                const dot = vx * normalX + vy * normalY;
                Body.setVelocity(strikerBody, {
                  x: (vx - dot * normalX) * 0.88,
                  y: (vy - dot * normalY) * 0.88,
                });
              }

              if (Math.abs(side) > 0.05) {
                const tangentX = -normalY;
                const tangentY = normalX;
                const throwForce = -side * energy * 0.055;
                Body.setVelocity(targetBody, {
                  x: targetBody.velocity.x + tangentX * throwForce,
                  y: targetBody.velocity.y + tangentY * throwForce,
                });
              }
            });
          };

          if (metaA.spinEnergy > 0.1 && !metaA.hasHitBall) {
            registerBallHit(pair.bodyA, metaA, pair.bodyB, nx, ny);
          }
          if (metaB.spinEnergy > 0.1 && !metaB.hasHitBall) {
            registerBallHit(pair.bodyB, metaB, pair.bodyA, -nx, -ny);
          }
        } else if (metaA || metaB) {
          const ballBody = metaA ? pair.bodyA : pair.bodyB;
          const wallBody = metaA ? pair.bodyB : pair.bodyA;
          const ballMeta = (metaA || metaB)!;

          ballMeta.curve = 0;

          if (Math.abs(ballMeta.sideSpin) > 0.04) {
            const side = ballMeta.sideSpin;
            const spinEn = ballMeta.spinEnergy;
            const wLabel = wallBody.label;
            ballMeta.sideSpin *= 0.45;

            postStepImpulses.push(() => {
              const speed = Math.hypot(
                ballBody.velocity.x,
                ballBody.velocity.y
              );
              const boost = side * Math.max(speed * 0.48, spinEn * 0.22);

              let tx = 0;
              let ty = 0;
              if (wLabel === 'wall-top') tx = 1;
              else if (wLabel === 'wall-bottom') tx = -1;
              else if (wLabel === 'wall-left') ty = -1;
              else if (wLabel === 'wall-right') ty = 1;

              Body.setVelocity(ballBody, {
                x: ballBody.velocity.x + tx * boost,
                y: ballBody.velocity.y + ty * boost,
              });
            });
          }
        }
      }
    };

    Events.on(engine, 'collisionStart', handleCollision);

    const cueLeadInTicks = showCue && activeShots.length > 0 ? 32 : 0;
    let elapsedTicks = 0;
    let stepAccumulator = 0;
    const shotFiredFlags = activeShots.map(() => false);
    let verdictShown = false;
    let loopTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    const fireShot = (shot: SimulatorShotConfig) => {
      const body = bodyMap.get(shot.ballId);
      if (!body) return;
      const meta = metaMap.get(body.id);
      if (!meta || meta.potted) return;

      const { launchAngle } = resolveGhostAndLaunch(
        shot,
        body.position.x,
        body.position.y,
        meta.radius,
        activeBalls,
        ballRadius,
        width,
        height
      );

      const vx = Math.cos(launchAngle) * shot.power;
      const vy = Math.sin(launchAngle) * shot.power;

      meta.topSpin = Math.max(-1, Math.min(1, shot.spin?.top ?? 0));
      meta.sideSpin = Math.max(-1, Math.min(1, shot.spin?.side ?? 0));
      meta.curve = Math.max(-1, Math.min(1, shot.spin?.curve ?? 0));
      meta.initialAngle = launchAngle;
      meta.arcLength = 0;
      meta.spinAxisAngle = launchAngle;
      meta.spinEnergy = shot.power;
      meta.hasHitBall = false;
      meta.ticksAfterHit = 0;
      meta.jumpOffTable = Boolean(shot.jumpOffTable);

      if (meta.jumpOffTable) {
        body.collisionFilter.mask = 0x0001;
      }

      Body.setVelocity(body, { x: vx, y: vy });
    };

    const stepFixedPhysics = () => {
      activeShots.forEach((shot, idx) => {
        if (shotFiredFlags[idx]) return;
        const triggerTick =
          cueLeadInTicks + Math.round(((shot.delayMs ?? 0) / 1000) * 60);
        if (elapsedTicks >= triggerTick) {
          shotFiredFlags[idx] = true;
          fireShot(shot);
        }
      });

      metaMap.forEach((meta, bodyId) => {
        const body = engine.world.bodies.find((b) => b.id === bodyId);
        if (!body || meta.potted) return;

        if (!meta.hasHitBall && Math.abs(meta.curve) > 0.01) {
          const speed = Math.hypot(body.velocity.x, body.velocity.y);
          if (speed > 0.25) {
            const ds = speed * (1 - body.frictionAir);
            const kappa = meta.curve * CURVE_K;
            const stepAngle =
              meta.initialAngle + kappa * (meta.arcLength + ds * 0.5);
            Body.setVelocity(body, {
              x: Math.cos(stepAngle) * speed,
              y: Math.sin(stepAngle) * speed,
            });
            meta.arcLength += ds;
          }
        }

        if (meta.hasHitBall && Math.abs(meta.topSpin) > 0.04) {
          meta.ticksAfterHit += 1;
          if (meta.ticksAfterHit <= 38 && meta.spinEnergy > 0.2) {
            const pullStrength = meta.topSpin * meta.spinEnergy * 0.028;
            Body.setVelocity(body, {
              x:
                body.velocity.x +
                Math.cos(meta.spinAxisAngle) * pullStrength,
              y:
                body.velocity.y +
                Math.sin(meta.spinAxisAngle) * pullStrength,
            });
          }
        }

        meta.spinEnergy *= 0.992;

        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        if (
          speed > 0 &&
          speed < 0.08 &&
          (!meta.hasHitBall || meta.ticksAfterHit > 18)
        ) {
          Body.setVelocity(body, { x: 0, y: 0 });
        }

        if (
          meta.jumpOffTable &&
          (body.position.x < CUSHION_SIZE + meta.radius ||
            body.position.x > width - CUSHION_SIZE - meta.radius ||
            body.position.y < CUSHION_SIZE + meta.radius ||
            body.position.y > height - CUSHION_SIZE - meta.radius)
        ) {
          meta.isAirborne = true;
        }

        const lastPt = meta.trail[meta.trail.length - 1];
        if (
          !lastPt ||
          Math.hypot(body.position.x - lastPt.x, body.position.y - lastPt.y) > 3
        ) {
          meta.trail.push({ x: body.position.x, y: body.position.y });
        }

        if (!meta.isAirborne) {
          for (const pocket of resolvedPockets) {
            const pr = pocket.radius ?? 14;
            const dx = pocket.x - body.position.x;
            const dy = pocket.y - body.position.y;
            const dist = Math.hypot(dx, dy);

            if (dist < pr + 4.5) {
              meta.potted = true;
              meta.potAnimation = {
                x: body.position.x,
                y: body.position.y,
                vx: body.velocity.x,
                vy: body.velocity.y,
                pocketX: pocket.x,
                pocketY: pocket.y,
                progress: 0,
              };
              World.remove(engine.world, body);
              break;
            } else if (dist < pr + 12) {
              const ux = dx / (dist || 1);
              const uy = dy / (dist || 1);
              const velTowards =
                body.velocity.x * ux + body.velocity.y * uy;
              if (velTowards > -0.2) {
                Body.setVelocity(body, {
                  x: body.velocity.x + ux * 0.22,
                  y: body.velocity.y + uy * 0.22,
                });
              }
            }
          }
        }

        const margin = meta.radius * 3.5;
        if (
          body.position.x < -margin ||
          body.position.x > width + margin ||
          body.position.y < -margin ||
          body.position.y > height + margin
        ) {
          meta.potted = true;
          World.remove(engine.world, body);
        }
      });

      Engine.update(engine, 1000 / 60);

      while (postStepImpulses.length > 0) {
        const fn = postStepImpulses.shift();
        fn?.();
      }

      elapsedTicks += 1;
    };

    const drawScene = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(width * dpr);
      const targetH = Math.round(height * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);

      const feltGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        30,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      feltGrad.addColorStop(0, '#163d23');
      feltGrad.addColorStop(1, '#0e2817');
      ctx.fillStyle = feltGrad;
      ctx.fillRect(0, 0, width, height);

      const railColor = '#24160e';
      const c = CUSHION_SIZE;
      ctx.fillStyle = railColor;
      if (resolvedWalls.top) ctx.fillRect(0, 0, width, c);
      if (resolvedWalls.bottom) ctx.fillRect(0, height - c, width, c);
      if (resolvedWalls.left) ctx.fillRect(0, 0, c, height);
      if (resolvedWalls.right) ctx.fillRect(width - c, 0, c, height);

      for (const pocket of resolvedPockets) {
        const pr = pocket.radius ?? 14;

        ctx.fillStyle = '#0e2817';
        if (pocket.kind === 'middle' && pocket.middleY) {
          const isTop = pocket.middleY === -1;
          const railEdgeY = isTop ? c : height - c;
          ctx.beginPath();
          ctx.moveTo(pocket.x - 21, railEdgeY);
          ctx.lineTo(pocket.x - pr, pocket.y);
          ctx.lineTo(pocket.x + pr, pocket.y);
          ctx.lineTo(pocket.x + 21, railEdgeY);
          ctx.closePath();
          ctx.fill();
        } else if (
          pocket.kind === 'corner' &&
          pocket.cornerX &&
          pocket.cornerY
        ) {
          const isLeft = pocket.cornerX === -1;
          const isTop = pocket.cornerY === -1;
          const xEdge = isLeft ? c : width - c;
          const yEdge = isTop ? c : height - c;
          const xJaw = isLeft ? 40 : width - 40;
          const yJaw = isTop ? 40 : height - 40;

          ctx.beginPath();
          ctx.moveTo(xJaw, yEdge);
          ctx.lineTo(pocket.x + (isLeft ? 8 : -8), pocket.y - (isTop ? 8 : -8));
          ctx.lineTo(pocket.x - (isLeft ? 8 : -8), pocket.y + (isTop ? 8 : -8));
          ctx.lineTo(xEdge, yJaw);
          ctx.lineTo(xEdge, yEdge);
          ctx.closePath();
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = '#060a08';
        ctx.fill();
      }

      for (const marker of activeMarkers) {
        const mr = marker.radius ?? ballRadius * 1.25;
        ctx.save();
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, mr, 0, Math.PI * 2);
        ctx.fillStyle = marker.color
          ? `${marker.color}20`
          : 'rgba(234, 179, 8, 0.12)';
        ctx.fill();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = marker.color || 'rgba(234, 179, 8, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        if (marker.label) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.font = '600 11px sans-serif';
          ctx.textAlign = 'center';
          const labelY =
            marker.y - mr - 8 < CUSHION_SIZE + 10
              ? marker.y + mr + 14
              : marker.y - mr - 7;
          ctx.fillText(marker.label, marker.x, labelY);
        }
      }

      for (const arrow of activeArrows) {
        const [x1, y1] = arrow.from;
        const [x2, y2] = arrow.to;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.save();
        ctx.beginPath();
        if (arrow.dashed) ctx.setLineDash([5, 5]);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = arrow.color || 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.75;
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - 8 * Math.cos(angle - Math.PI / 6),
          y2 - 8 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - 8 * Math.cos(angle + Math.PI / 6),
          y2 - 8 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = arrow.color || 'rgba(255,255,255,0.35)';
        ctx.fill();
        ctx.restore();
      }

      if (
        showAimLine &&
        activeShots.length > 0 &&
        elapsedTicks <= cueLeadInTicks + 2
      ) {
        const firstShot = activeShots[0];
        const cueBody = bodyMap.get(firstShot.ballId);
        const cueMeta = cueBody ? metaMap.get(cueBody.id) : undefined;
        if (cueBody && cueMeta) {
          const sx = cueBody.position.x;
          const sy = cueBody.position.y;
          const { launchAngle, ghostX, ghostY, chordDist } =
            resolveGhostAndLaunch(
              firstShot,
              sx,
              sy,
              cueMeta.radius,
              activeBalls,
              ballRadius,
              width,
              height
            );

          const curveVal = Math.max(
            -1,
            Math.min(1, firstShot.spin?.curve ?? 0)
          );

          if (Math.abs(curveVal) > 0.02) {
            const kappa = curveVal * CURVE_K;
            const maxArc = chordDist ? chordDist * 1.06 : 380;
            const stepS = 8;
            let px = sx;
            let py = sy;
            let hitGhost: { x: number; y: number } | null = null;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 5]);
            ctx.moveTo(px, py);

            for (let s = 0; s < maxArc; s += stepS) {
              const ang = launchAngle + kappa * (s + stepS * 0.5);
              px += Math.cos(ang) * stepS;
              py += Math.sin(ang) * stepS;
              ctx.lineTo(px, py);

              if (
                ghostX !== undefined &&
                ghostY !== undefined &&
                Math.hypot(px - ghostX, py - ghostY) < stepS * 0.8
              ) {
                hitGhost = { x: ghostX, y: ghostY };
                break;
              }
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 1.25;
            ctx.stroke();

            if (hitGhost) {
              ctx.beginPath();
              ctx.arc(hitGhost.x, hitGhost.y, cueMeta.radius, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
              ctx.stroke();
            }
            ctx.restore();
          } else {
            const dirX = Math.cos(launchAngle);
            const dirY = Math.sin(launchAngle);

            let closestDist = 900;
            metaMap.forEach((m, bId) => {
              if (m.config.id === firstShot.ballId) return;
              const other = engine.world.bodies.find((b) => b.id === bId);
              if (!other) return;
              const ox = other.position.x - sx;
              const oy = other.position.y - sy;
              const proj = ox * dirX + oy * dirY;
              if (proj <= 0) return;
              const perpSq = ox * ox + oy * oy - proj * proj;
              const sumR = cueMeta.radius + m.radius;
              if (perpSq < sumR * sumR) {
                const hitDist = proj - Math.sqrt(sumR * sumR - perpSq);
                if (hitDist > 0 && hitDist < closestDist) {
                  closestDist = hitDist;
                }
              }
            });

            const endX = sx + dirX * closestDist;
            const endY = sy + dirY * closestDist;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 5]);
            ctx.moveTo(sx, sy);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 1.25;
            ctx.stroke();

            if (closestDist < 890) {
              ctx.beginPath();
              ctx.arc(endX, endY, cueMeta.radius, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }

      if (trajectoriesVisibleRef.current) {
        metaMap.forEach((meta) => {
          if (meta.trail.length < 2) return;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(meta.trail[0].x, meta.trail[0].y);
          for (let i = 1; i < meta.trail.length; i++) {
            ctx.lineTo(meta.trail[i].x, meta.trail[i].y);
          }
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = meta.config.isCue
            ? 'rgba(248, 113, 113, 0.6)'
            : 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = meta.config.isCue ? 2 : 1.5;
          ctx.stroke();
          ctx.restore();
        });
      }

      const drawSingleBall = (
        x: number,
        y: number,
        r: number,
        meta: InternalBallMeta,
        scale = 1
      ) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        const grad = ctx.createRadialGradient(
          -r * 0.3,
          -r * 0.3,
          r * 0.1,
          0,
          0,
          r
        );
        if (meta.config.isCue) {
          grad.addColorStop(0, '#b93843');
          grad.addColorStop(0.65, '#7f1821');
          grad.addColorStop(1, '#4c0d13');
        } else if (isDarkBallsRef.current) {
          grad.addColorStop(0, '#2c2f37');
          grad.addColorStop(0.65, '#141519');
          grad.addColorStop(1, '#070709');
        } else {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.65, '#f0ebd8');
          grad.addColorStop(1, '#c5bba0');
        }

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (meta.config.number !== undefined) {
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();

          ctx.fillStyle = '#111215';
          ctx.font = `700 ${Math.round(r * 0.6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(meta.config.number), 0, 0.5);
        }

        ctx.restore();
      };

      metaMap.forEach((meta, bodyId) => {
        if (meta.potted) {
          if (meta.potAnimation && meta.potAnimation.progress < 1) {
            const anim = meta.potAnimation;
            anim.progress = Math.min(1, anim.progress + 0.11);
            anim.x += (anim.pocketX - anim.x) * 0.25;
            anim.y += (anim.pocketY - anim.y) * 0.25;
            const scale = 1 - anim.progress;
            if (scale > 0.05) {
              drawSingleBall(anim.x, anim.y, meta.radius, meta, scale);
            }
          }
          return;
        }

        const body = engine.world.bodies.find((b) => b.id === bodyId);
        if (!body) return;
        const scale = meta.isAirborne ? 1.22 : 1;
        drawSingleBall(
          body.position.x,
          body.position.y,
          meta.radius,
          meta,
          scale
        );
      });

      if (showCue && activeShots.length > 0 && elapsedTicks < cueLeadInTicks) {
        const firstShot = activeShots[0];
        const cueBody = bodyMap.get(firstShot.ballId);
        const cueMeta = cueBody ? metaMap.get(cueBody.id) : undefined;
        if (cueBody && cueMeta) {
          const progress = elapsedTicks / cueLeadInTicks;
          const maxPull = 14 + firstShot.power * 1.15;
          const pullback =
            progress < 0.74
              ? (progress / 0.74) * maxPull
              : (1 - (progress - 0.74) / 0.26) * maxPull;

          const { launchAngle } = resolveGhostAndLaunch(
            firstShot,
            cueBody.position.x,
            cueBody.position.y,
            cueMeta.radius,
            activeBalls,
            ballRadius,
            width,
            height
          );

          ctx.save();
          ctx.translate(cueBody.position.x, cueBody.position.y);
          ctx.rotate(launchAngle + Math.PI);

          const tipX = cueMeta.radius + 6 + pullback;
          const cueLen = 155;

          ctx.beginPath();
          ctx.moveTo(tipX, -1.6);
          ctx.lineTo(tipX + cueLen * 0.55, -2.5);
          ctx.lineTo(tipX + cueLen * 0.55, 2.5);
          ctx.lineTo(tipX, 1.6);
          ctx.closePath();
          ctx.fillStyle = '#e7dac2';
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(tipX + cueLen * 0.55, -2.5);
          ctx.lineTo(tipX + cueLen, -3.6);
          ctx.lineTo(tipX + cueLen, 3.6);
          ctx.lineTo(tipX + cueLen * 0.55, 2.5);
          ctx.closePath();
          ctx.fillStyle = '#2d1c11';
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(tipX - 2, -1.6, 2, 3.2);
          ctx.restore();
        }
      }

      ctx.restore();
    };

    const tick = () => {
      rafId = null;

      stepAccumulator += speedMultiplierRef.current;
      let stepped = false;
      while (stepAccumulator >= 1) {
        stepFixedPhysics();
        stepAccumulator -= 1;
        stepped = true;
      }

      if (stepped) {
        drawScene();
      }

      const allPendingShotsFired = shotFiredFlags.every(Boolean);
      let anyActiveMotion = false;

      metaMap.forEach((meta, bodyId) => {
        if (
          meta.potAnimation &&
          meta.potAnimation.progress > 0 &&
          meta.potAnimation.progress < 1
        ) {
          anyActiveMotion = true;
        }
        if (meta.potted) return;
        const body = engine.world.bodies.find((b) => b.id === bodyId);
        if (!body) return;
        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        if (
          speed > 0.08 ||
          (!meta.hasHitBall && Math.abs(meta.curve) > 0.05 && speed > 0.2) ||
          (meta.hasHitBall &&
            meta.ticksAfterHit < 38 &&
            Math.abs(meta.topSpin) > 0.04)
        ) {
          anyActiveMotion = true;
        }
      });

      if (
        allPendingShotsFired &&
        !anyActiveMotion &&
        elapsedTicks > cueLeadInTicks + 12
      ) {
        if (activeVerdict && !verdictShown) {
          verdictShown = true;
          setShowVerdictBanner(true);
        }

        if (autoLoop && !loopTimeoutId) {
          const waitTime = activeVerdict ? loopDelayMs + 900 : loopDelayMs;
          loopTimeoutId = setTimeout(() => {
            setShowVerdictBanner(false);
            setRestartSeed((s) => s + 1);
          }, waitTime);
        }
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    startLoopRef.current = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    stopLoopRef.current = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (loopTimeoutId) {
        clearTimeout(loopTimeoutId);
        loopTimeoutId = null;
      }
    };

    drawScene();

    if (isVisible && isPlaying) {
      startLoopRef.current();
    }

    return () => {
      stopLoopRef.current?.();
      Events.off(engine, 'collisionStart', handleCollision);
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [
    activeBalls,
    activeShots,
    activeWalls,
    activePockets,
    activeMarkers,
    activeArrows,
    activeVerdict,
    width,
    height,
    ballRadius,
    showAimLine,
    showCue,
    autoLoop,
    loopDelayMs,
    restartSeed,
  ]);

  useEffect(() => {
    if (isVisible && isPlaying) {
      startLoopRef.current?.();
    } else {
      stopLoopRef.current?.();
    }
  }, [isVisible, isPlaying]);

  const primarySpin = activeShots[0]?.spin;
  const hudSideOffset =
    primarySpin?.side && Math.abs(primarySpin.side) > 0.05
      ? primarySpin.side
      : (primarySpin?.curve ?? 0) * 0.8;

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-background/80 flex flex-col overflow-hidden rounded-2xl p-3 backdrop-blur-lg',
        className
      )}
    >
      {slides && slides.length > 1 && (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSlide(idx)}
                className={cn(
                  'rounded-xl px-3 py-1 text-xs font-medium transition-colors',
                  activeSlideIdx === idx
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-neutral text-neutral-foreground opacity-65 hover:opacity-100'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                selectSlide((activeSlideIdx - 1 + slides.length) % slides.length)
              }
              className="bg-neutral text-neutral-foreground flex size-7 items-center justify-center rounded-lg"
              aria-label="Предыдущий вариант"
            >
              <CaretLeftIcon size={14} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => selectSlide((activeSlideIdx + 1) % slides.length)}
              className="bg-neutral text-neutral-foreground flex size-7 items-center justify-center rounded-lg"
              aria-label="Следующий вариант"
            >
              <CaretRightIcon size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {(activeTitle || activeDescription) && (
        <div className="mb-2.5 flex items-start justify-between gap-3 px-0.5">
          <div>
            {activeTitle && (
              <h3 className="text-foreground text-base font-semibold leading-snug">
                {activeTitle}
              </h3>
            )}
            {activeDescription && (
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {activeDescription}
              </p>
            )}
          </div>

          {showSpinHud && primarySpin && (
            <div
              className="bg-neutral/80 flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-1.5"
              title="Точка удара наклейки кия по битку"
            >
              <div className="relative size-6 rounded-full bg-[#f0ebd8]">
                <div className="absolute inset-x-0 top-1/2 h-px bg-black/15" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-black/15" />
                <div
                  style={{
                    left: `${50 + hudSideOffset * 34}%`,
                    top: `${50 - (primarySpin.top ?? 0) * 34}%`,
                  }}
                  className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600"
                />
              </div>
              <div className="flex flex-col text-[10px] leading-tight">
                <span className="text-neutral-foreground font-medium">
                  {(primarySpin.top ?? 0) > 0.15
                    ? 'Накат'
                    : (primarySpin.top ?? 0) < -0.15
                      ? 'Оттяжка'
                      : 'Клапштос'}
                </span>
                <span className="text-neutral-foreground/60">
                  {(primarySpin.curve ?? 0) !== 0
                    ? 'Дуговик'
                    : (primarySpin.side ?? 0) > 0.1
                      ? 'Правый винт'
                      : (primarySpin.side ?? 0) < -0.1
                        ? 'Левый винт'
                        : 'Центр'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden rounded-xl">
        <canvas
          ref={canvasRef}
          style={{ aspectRatio: `${width} / ${height}` }}
          className="block w-full select-none"
        />

        {activeVerdict && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 px-4 transition-opacity duration-300',
              showVerdictBanner ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div
              className={cn(
                'flex max-w-xs flex-col items-center gap-1 rounded-2xl px-5 py-3.5 text-center',
                activeVerdict.type === 'foul'
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-approve text-approve-foreground'
              )}
            >
              <div className="flex items-center gap-1.5 text-sm font-bold">
                {activeVerdict.type === 'foul' ? (
                  <WarningCircleIcon size={18} weight="fill" />
                ) : (
                  <CheckCircleIcon size={18} weight="fill" />
                )}
                <span>{activeVerdict.title}</span>
              </div>
              {activeVerdict.subtitle && (
                <p className="text-xs opacity-90">{activeVerdict.subtitle}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {controls && (
        <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Пауза' : 'Пуск'}
              className="bg-neutral text-neutral-foreground hover:bg-primary hover:text-primary-foreground flex size-8 items-center justify-center rounded-xl transition-colors"
            >
              {isPlaying ? (
                <PauseIcon size={15} weight="fill" />
              ) : (
                <PlayIcon size={15} weight="fill" />
              )}
            </button>

            <button
              type="button"
              onClick={triggerRestart}
              aria-label="Повтор"
              className="bg-neutral text-neutral-foreground hover:bg-primary hover:text-primary-foreground flex size-8 items-center justify-center rounded-xl transition-colors"
            >
              <ArrowCounterClockwiseIcon size={15} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => setTrajectoriesVisible((v) => !v)}
              aria-label="Показать или скрыть траекторию"
              className={cn(
                'flex size-8 items-center justify-center rounded-xl transition-colors',
                trajectoriesVisible
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-neutral text-neutral-foreground opacity-50'
              )}
            >
              <EyeIcon size={15} weight="bold" />
            </button>
          </div>

          <button
            type="button"
            onClick={cycleSpeed}
            className="bg-neutral text-neutral-foreground flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-medium transition-colors"
          >
            <GaugeIcon size={14} weight="bold" />
            {speedMultiplier}x
          </button>
        </div>
      )}
    </div>
  );
}
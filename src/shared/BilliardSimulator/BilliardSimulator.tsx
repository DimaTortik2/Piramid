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
 *       выстроит точную круговую дугу от битка до точки резки прицельного шара.
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
 *        * side: -1 (левый боковой винт), +1 (правый боковой винт)
 *        * curve: от -1 до +1 (массе / дуговик — изгиб траектории до удара)
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
  mouthX?: number;
  mouthY?: number;
  radius?: number;
  captureRadius?: number;
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
  const gap = ballRadius * 2.03;
  const rowStep = ballRadius * Math.sqrt(3) * 1.015;
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
  vx: number;
  vy: number;
  topSpin: number;
  sideSpin: number;
  curve: number;
  arcAngularVel: number;
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
    pocketX: number;
    pocketY: number;
    progress: number;
  };
}

interface RailSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sideTag: 'top' | 'bottom' | 'left' | 'right' | 'jaw';
}

const CUSHION_SIZE = 26;
const SUBSTEPS = 8;

const resolvePocketAimTarget = (
  pocket: PocketPresetName | { x: number; y: number } | undefined,
  width: number,
  height: number
): { x: number; y: number } => {
  if (pocket && typeof pocket === 'object') {
    return pocket;
  }
  const cornerAim = 28;
  const middleAimY = 22;
  switch (pocket) {
    case 'top-left':
      return { x: cornerAim, y: cornerAim };
    case 'top-middle':
      return { x: width / 2, y: middleAimY };
    case 'bottom-left':
      return { x: cornerAim, y: height - cornerAim };
    case 'bottom-middle':
      return { x: width / 2, y: height - middleAimY };
    case 'bottom-right':
      return { x: width - cornerAim, y: height - cornerAim };
    case 'top-right':
    default:
      return { x: width - cornerAim, y: cornerAim };
  }
};

const computeShotGeometry = (
  shot: SimulatorShotConfig,
  strikerX: number,
  strikerY: number,
  strikerRadius: number,
  balls: SimulatorBallConfig[],
  defaultRadius: number,
  width: number,
  height: number
): {
  launchAngle: number;
  ghostX?: number;
  ghostY?: number;
  chordDist?: number;
  curveRadius?: number;
  halfTurnAngle: number;
} => {
  const curve = Math.max(-1, Math.min(1, shot.spin?.curve ?? 0));
  const halfTurnAngle = curve * 0.44;

  let targetX: number | undefined;
  let targetY: number | undefined;

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

      targetX = objBall.x - ux * sumR + perpX * offset;
      targetY = objBall.y - uy * sumR + perpY * offset;
    }
  } else if (shot.target) {
    targetX = shot.target.x;
    targetY = shot.target.y;
  }

  if (targetX !== undefined && targetY !== undefined) {
    const chordDx = targetX - strikerX;
    const chordDy = targetY - strikerY;
    const chordDist = Math.hypot(chordDx, chordDy) || 1;
    const chordAngle = Math.atan2(chordDy, chordDx);

    if (Math.abs(halfTurnAngle) > 0.01) {
      const curveRadius = chordDist / (2 * Math.sin(halfTurnAngle));
      const launchAngle = chordAngle - halfTurnAngle;
      return {
        launchAngle,
        ghostX: targetX,
        ghostY: targetY,
        chordDist,
        curveRadius,
        halfTurnAngle,
      };
    }

    return {
      launchAngle: chordAngle,
      ghostX: targetX,
      ghostY: targetY,
      chordDist,
      halfTurnAngle: 0,
    };
  }

  const baseAngle = ((shot.angle ?? 0) * Math.PI) / 180;
  if (Math.abs(halfTurnAngle) > 0.01) {
    return {
      launchAngle: baseAngle,
      curveRadius: 340 / (2 * Math.sin(halfTurnAngle)),
      halfTurnAngle,
    };
  }

  return { launchAngle: baseAngle, halfTurnAngle: 0 };
};

const closestPointOnSegment = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: x1, y: y1 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return { x: x1 + t * dx, y: y1 + t * dy };
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

    const { Engine, World, Bodies, Body } = Matter;
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
        ...activePockets.map((p) => ({
          ...p,
          mouthX: p.mouthX ?? p.x,
          mouthY: p.mouthY ?? p.y,
          radius: p.radius ?? 16,
          captureRadius: p.captureRadius ?? 22,
        }))
      );
    } else if (activePockets) {
      if (resolvedWalls.top && resolvedWalls.left) {
        resolvedPockets.push({
          x: 18,
          y: 18,
          mouthX: 28,
          mouthY: 28,
          radius: 16,
          captureRadius: 23,
        });
      }
      if (resolvedWalls.top && resolvedWalls.right) {
        resolvedPockets.push({
          x: width - 18,
          y: 18,
          mouthX: width - 28,
          mouthY: 28,
          radius: 16,
          captureRadius: 23,
        });
      }
      if (resolvedWalls.bottom && resolvedWalls.left) {
        resolvedPockets.push({
          x: 18,
          y: height - 18,
          mouthX: 28,
          mouthY: height - 28,
          radius: 16,
          captureRadius: 23,
        });
      }
      if (resolvedWalls.bottom && resolvedWalls.right) {
        resolvedPockets.push({
          x: width - 18,
          y: height - 18,
          mouthX: width - 28,
          mouthY: height - 28,
          radius: 16,
          captureRadius: 23,
        });
      }
      if (resolvedWalls.top && width >= 520) {
        resolvedPockets.push({
          x: width / 2,
          y: 14,
          mouthX: width / 2,
          mouthY: 22,
          radius: 15,
          captureRadius: 21,
        });
      }
      if (resolvedWalls.bottom && width >= 520) {
        resolvedPockets.push({
          x: width / 2,
          y: height - 14,
          mouthX: width / 2,
          mouthY: height - 22,
          radius: 15,
          captureRadius: 21,
        });
      }
    }

    const hasPockets = resolvedPockets.length > 0;
    const hasMiddlePockets = hasPockets && width >= 520;
    const c = CUSHION_SIZE;
    const cornerCut = hasPockets ? 52 : c;
    const cornerOuter = 30;
    const midCut = 28;
    const midOuter = 16;

    const railPolygons: { x: number; y: number }[][] = [];
    const railSegments: RailSegment[] = [];

    if (resolvedWalls.top) {
      if (hasMiddlePockets) {
        railPolygons.push([
          { x: hasPockets ? cornerOuter : 0, y: 0 },
          { x: width / 2 - midOuter, y: 0 },
          { x: width / 2 - midOuter, y: 10 },
          { x: width / 2 - midCut, y: c },
          { x: cornerCut, y: c },
          { x: hasPockets ? cornerOuter : 0, y: hasPockets ? 10 : c },
        ]);
        railPolygons.push([
          { x: width / 2 + midOuter, y: 0 },
          { x: hasPockets ? width - cornerOuter : width, y: 0 },
          {
            x: hasPockets ? width - cornerOuter : width,
            y: hasPockets ? 10 : c,
          },
          { x: width - cornerCut, y: c },
          { x: width / 2 + midCut, y: c },
          { x: width / 2 + midOuter, y: 10 },
        ]);

        railSegments.push(
          {
            x1: cornerCut,
            y1: c,
            x2: width / 2 - midCut,
            y2: c,
            sideTag: 'top',
          },
          {
            x1: width / 2 + midCut,
            y1: c,
            x2: width - cornerCut,
            y2: c,
            sideTag: 'top',
          },
          {
            x1: cornerOuter,
            y1: 10,
            x2: cornerCut,
            y2: c,
            sideTag: 'jaw',
          },
          {
            x1: width / 2 - midCut,
            y1: c,
            x2: width / 2 - midOuter,
            y2: 10,
            sideTag: 'jaw',
          },
          {
            x1: width / 2 + midOuter,
            y1: 10,
            x2: width / 2 + midCut,
            y2: c,
            sideTag: 'jaw',
          },
          {
            x1: width - cornerCut,
            y1: c,
            x2: width - cornerOuter,
            y2: 10,
            sideTag: 'jaw',
          }
        );
      } else {
        railPolygons.push([
          { x: hasPockets ? cornerOuter : 0, y: 0 },
          { x: hasPockets ? width - cornerOuter : width, y: 0 },
          {
            x: hasPockets ? width - cornerOuter : width,
            y: hasPockets ? 10 : c,
          },
          { x: width - cornerCut, y: c },
          { x: cornerCut, y: c },
          { x: hasPockets ? cornerOuter : 0, y: hasPockets ? 10 : c },
        ]);
        railSegments.push({
          x1: cornerCut,
          y1: c,
          x2: width - cornerCut,
          y2: c,
          sideTag: 'top',
        });
      }
    }

    if (resolvedWalls.bottom) {
      if (hasMiddlePockets) {
        railPolygons.push([
          { x: hasPockets ? cornerOuter : 0, y: height },
          { x: width / 2 - midOuter, y: height },
          { x: width / 2 - midOuter, y: height - 10 },
          { x: width / 2 - midCut, y: height - c },
          { x: cornerCut, y: height - c },
          {
            x: hasPockets ? cornerOuter : 0,
            y: hasPockets ? height - 10 : height - c,
          },
        ]);
        railPolygons.push([
          { x: width / 2 + midOuter, y: height },
          { x: hasPockets ? width - cornerOuter : width, y: height },
          {
            x: hasPockets ? width - cornerOuter : width,
            y: hasPockets ? height - 10 : height - c,
          },
          { x: width - cornerCut, y: height - c },
          { x: width / 2 + midCut, y: height - c },
          { x: width / 2 + midOuter, y: height - 10 },
        ]);

        railSegments.push(
          {
            x1: cornerCut,
            y1: height - c,
            x2: width / 2 - midCut,
            y2: height - c,
            sideTag: 'bottom',
          },
          {
            x1: width / 2 + midCut,
            y1: height - c,
            x2: width - cornerCut,
            y2: height - c,
            sideTag: 'bottom',
          },
          {
            x1: cornerOuter,
            y1: height - 10,
            x2: cornerCut,
            y2: height - c,
            sideTag: 'jaw',
          },
          {
            x1: width / 2 - midCut,
            y1: height - c,
            x2: width / 2 - midOuter,
            y2: height - 10,
            sideTag: 'jaw',
          },
          {
            x1: width / 2 + midOuter,
            y1: height - 10,
            x2: width / 2 + midCut,
            y2: height - c,
            sideTag: 'jaw',
          },
          {
            x1: width - cornerCut,
            y1: height - c,
            x2: width - cornerOuter,
            y2: height - 10,
            sideTag: 'jaw',
          }
        );
      } else {
        railPolygons.push([
          { x: hasPockets ? cornerOuter : 0, y: height },
          { x: hasPockets ? width - cornerOuter : width, y: height },
          {
            x: hasPockets ? width - cornerOuter : width,
            y: hasPockets ? height - 10 : height - c,
          },
          { x: width - cornerCut, y: height - c },
          { x: cornerCut, y: height - c },
          {
            x: hasPockets ? cornerOuter : 0,
            y: hasPockets ? height - 10 : height - c,
          },
        ]);
        railSegments.push({
          x1: cornerCut,
          y1: height - c,
          x2: width - cornerCut,
          y2: height - c,
          sideTag: 'bottom',
        });
      }
    }

    if (resolvedWalls.left) {
      railPolygons.push([
        { x: 0, y: hasPockets ? cornerOuter : 0 },
        { x: hasPockets ? 10 : c, y: hasPockets ? cornerOuter : 0 },
        { x: c, y: cornerCut },
        { x: c, y: height - cornerCut },
        {
          x: hasPockets ? 10 : c,
          y: hasPockets ? height - cornerOuter : height,
        },
        { x: 0, y: hasPockets ? height - cornerOuter : height },
      ]);
      railSegments.push({
        x1: c,
        y1: cornerCut,
        x2: c,
        y2: height - cornerCut,
        sideTag: 'left',
      });
      if (hasPockets) {
        railSegments.push(
          { x1: 10, y1: cornerOuter, x2: c, y2: cornerCut, sideTag: 'jaw' },
          {
            x1: c,
            y1: height - cornerCut,
            x2: 10,
            y2: height - cornerOuter,
            sideTag: 'jaw',
          }
        );
      }
    }

    if (resolvedWalls.right) {
      railPolygons.push([
        { x: width, y: hasPockets ? cornerOuter : 0 },
        {
          x: hasPockets ? width - 10 : width - c,
          y: hasPockets ? cornerOuter : 0,
        },
        { x: width - c, y: cornerCut },
        { x: width - c, y: height - cornerCut },
        {
          x: hasPockets ? width - 10 : width - c,
          y: hasPockets ? height - cornerOuter : height,
        },
        { x: width, y: hasPockets ? height - cornerOuter : height },
      ]);
      railSegments.push({
        x1: width - c,
        y1: cornerCut,
        x2: width - c,
        y2: height - cornerCut,
        sideTag: 'right',
      });
      if (hasPockets) {
        railSegments.push(
          {
            x1: width - 10,
            y1: cornerOuter,
            x2: width - c,
            y2: cornerCut,
            sideTag: 'jaw',
          },
          {
            x1: width - c,
            y1: height - cornerCut,
            x2: width - 10,
            y2: height - cornerOuter,
            sideTag: 'jaw',
          }
        );
      }
    }

    const bodyList: Matter.Body[] = [];
    const bodyMap = new Map<string | number, Matter.Body>();
    const metaMap = new Map<number, InternalBallMeta>();

    activeBalls.forEach((b) => {
      const r = b.radius ?? ballRadius;
      const body = Bodies.circle(b.x, b.y, r, {
        isSensor: true,
        label: `ball-${b.id}`,
      });

      bodyList.push(body);
      bodyMap.set(b.id, body);
      metaMap.set(body.id, {
        config: b,
        radius: r,
        vx: 0,
        vy: 0,
        topSpin: 0,
        sideSpin: 0,
        curve: 0,
        arcAngularVel: 0,
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

      const { launchAngle, curveRadius } = computeShotGeometry(
        shot,
        body.position.x,
        body.position.y,
        meta.radius,
        activeBalls,
        ballRadius,
        width,
        height
      );

      meta.vx = Math.cos(launchAngle) * shot.power;
      meta.vy = Math.sin(launchAngle) * shot.power;
      meta.topSpin = Math.max(-1, Math.min(1, shot.spin?.top ?? 0));
      meta.sideSpin = Math.max(-1, Math.min(1, shot.spin?.side ?? 0));
      meta.curve = Math.max(-1, Math.min(1, shot.spin?.curve ?? 0));
      meta.arcAngularVel = curveRadius ? 1 / curveRadius : 0;
      meta.spinAxisAngle = launchAngle;
      meta.spinEnergy = shot.power;
      meta.hasHitBall = false;
      meta.ticksAfterHit = 0;
      meta.jumpOffTable = Boolean(shot.jumpOffTable);
    };

    const stepSubPhysics = () => {
      const dtScale = 1 / SUBSTEPS;
      const dragPerSub = Math.pow(0.9865, dtScale);

      for (const body of bodyList) {
        const meta = metaMap.get(body.id);
        if (!meta || meta.potted) continue;

        if (!meta.hasHitBall && Math.abs(meta.arcAngularVel) > 0.00001) {
          const speed = Math.hypot(meta.vx, meta.vy);
          if (speed > 0.2) {
            const ds = speed * dtScale;
            const dTheta = ds * meta.arcAngularVel;
            const cosT = Math.cos(dTheta);
            const sinT = Math.sin(dTheta);
            const nx = meta.vx * cosT - meta.vy * sinT;
            const ny = meta.vx * sinT + meta.vy * cosT;
            meta.vx = nx;
            meta.vy = ny;
          }
        }

        if (meta.hasHitBall && Math.abs(meta.topSpin) > 0.04) {
          if (meta.ticksAfterHit <= 38 && meta.spinEnergy > 0.2) {
            const pull = meta.topSpin * meta.spinEnergy * 0.029 * dtScale;
            meta.vx += Math.cos(meta.spinAxisAngle) * pull;
            meta.vy += Math.sin(meta.spinAxisAngle) * pull;
          }
        }

        const nextX = body.position.x + meta.vx * dtScale;
        const nextY = body.position.y + meta.vy * dtScale;
        Body.setPosition(body, { x: nextX, y: nextY });

        meta.vx *= dragPerSub;
        meta.vy *= dragPerSub;

        const speed = Math.hypot(meta.vx, meta.vy);
        if (speed > 0) {
          const decel = 0.0032 * dtScale;
          const newSpeed = Math.max(0, speed - decel);
          if (
            newSpeed < 0.075 &&
            (!meta.hasHitBall ||
              meta.ticksAfterHit > 20 ||
              Math.abs(meta.topSpin) < 0.05)
          ) {
            meta.vx = 0;
            meta.vy = 0;
          } else {
            const ratio = newSpeed / speed;
            meta.vx *= ratio;
            meta.vy *= ratio;
          }
        }

        if (
          meta.jumpOffTable &&
          (body.position.x < c + meta.radius ||
            body.position.x > width - c - meta.radius ||
            body.position.y < c + meta.radius ||
            body.position.y > height - c - meta.radius)
        ) {
          meta.isAirborne = true;
        }

        if (!meta.isAirborne) {
          for (const pocket of resolvedPockets) {
            const capR = pocket.captureRadius ?? 22;
            const mx = pocket.mouthX ?? pocket.x;
            const my = pocket.mouthY ?? pocket.y;
            const distHole = Math.hypot(
              body.position.x - pocket.x,
              body.position.y - pocket.y
            );
            const distMouth = Math.hypot(
              body.position.x - mx,
              body.position.y - my
            );

            if (distHole <= capR || distMouth <= 13) {
              meta.potted = true;
              meta.vx = 0;
              meta.vy = 0;
              meta.potAnimation = {
                x: body.position.x,
                y: body.position.y,
                pocketX: pocket.x,
                pocketY: pocket.y,
                progress: 0,
              };
              break;
            }
          }
        }

        if (meta.potted || meta.jumpOffTable) continue;

        for (const seg of railSegments) {
          const closest = closestPointOnSegment(
            body.position.x,
            body.position.y,
            seg.x1,
            seg.y1,
            seg.x2,
            seg.y2
          );
          const dx = body.position.x - closest.x;
          const dy = body.position.y - closest.y;
          const dist = Math.hypot(dx, dy);

          if (dist < meta.radius && dist > 0.0001) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = meta.radius - dist;

            Body.setPosition(body, {
              x: body.position.x + nx * overlap,
              y: body.position.y + ny * overlap,
            });

            const vn = meta.vx * nx + meta.vy * ny;
            if (vn < 0) {
              const restitution = seg.sideTag === 'jaw' ? 0.55 : 0.86;
              meta.vx -= (1 + restitution) * vn * nx;
              meta.vy -= (1 + restitution) * vn * ny;
              meta.arcAngularVel = 0;

              if (Math.abs(meta.sideSpin) > 0.04 && seg.sideTag !== 'jaw') {
                const curSpeed = Math.hypot(meta.vx, meta.vy);
                const boost =
                  meta.sideSpin * Math.max(curSpeed * 0.48, meta.spinEnergy * 0.22);
                let tx = 0;
                let ty = 0;
                if (seg.sideTag === 'top') tx = 1;
                else if (seg.sideTag === 'bottom') tx = -1;
                else if (seg.sideTag === 'left') ty = -1;
                else if (seg.sideTag === 'right') ty = 1;

                meta.vx += tx * boost;
                meta.vy += ty * boost;
                meta.sideSpin *= 0.45;
              }
            }
          }
        }
      }

      for (let i = 0; i < bodyList.length; i++) {
        const bodyA = bodyList[i];
        const metaA = metaMap.get(bodyA.id);
        if (!metaA || metaA.potted) continue;

        for (let j = i + 1; j < bodyList.length; j++) {
          const bodyB = bodyList[j];
          const metaB = metaMap.get(bodyB.id);
          if (!metaB || metaB.potted) continue;

          const dx = bodyB.position.x - bodyA.position.x;
          const dy = bodyB.position.y - bodyA.position.y;
          const dist = Math.hypot(dx, dy);
          const minDist = metaA.radius + metaB.radius;

          if (dist < minDist && dist > 0.0001) {
            const nx = dx / dist;
            const ny = dy / dist;
            const tx = -ny;
            const ty = nx;

            const overlap = minDist - dist;
            Body.setPosition(bodyA, {
              x: bodyA.position.x - nx * (overlap * 0.5),
              y: bodyA.position.y - ny * (overlap * 0.5),
            });
            Body.setPosition(bodyB, {
              x: bodyB.position.x + nx * (overlap * 0.5),
              y: bodyB.position.y + ny * (overlap * 0.5),
            });

            const vAn = metaA.vx * nx + metaA.vy * ny;
            const vAt = metaA.vx * tx + metaA.vy * ty;
            const vBn = metaB.vx * nx + metaB.vy * ny;
            const vBt = metaB.vx * tx + metaB.vy * ty;

            if (vAn - vBn > 0) {
              const aWasStriker = !metaA.hasHitBall && metaA.spinEnergy > 0.1;
              const bWasStriker = !metaB.hasHitBall && metaB.spinEnergy > 0.1;

              if (aWasStriker) {
                metaA.hasHitBall = true;
                metaA.ticksAfterHit = 0;
                metaA.arcAngularVel = 0;
                metaA.spinAxisAngle = Math.atan2(metaA.vy, metaA.vx);
              }
              if (bWasStriker) {
                metaB.hasHitBall = true;
                metaB.ticksAfterHit = 0;
                metaB.arcAngularVel = 0;
                metaB.spinAxisAngle = Math.atan2(metaB.vy, metaB.vx);
              }

              const restitution = 0.96;
              let nextVAn = vBn * restitution;
              let nextVBn = vAn * restitution;

              if (aWasStriker && Math.abs(metaA.topSpin) < 0.08) {
                nextVAn = 0;
              }
              if (bWasStriker && Math.abs(metaB.topSpin) < 0.08) {
                nextVBn = 0;
              }

              metaA.vx = vAt * tx + nextVAn * nx;
              metaA.vy = vAt * ty + nextVAn * ny;
              metaB.vx = vBt * tx + nextVBn * nx;
              metaB.vy = vBt * ty + nextVBn * ny;
            }
          }
        }
      }
    };

    const stepOneFrame = () => {
      activeShots.forEach((shot, idx) => {
        if (shotFiredFlags[idx]) return;
        const triggerTick =
          cueLeadInTicks + Math.round(((shot.delayMs ?? 0) / 1000) * 60);
        if (elapsedTicks >= triggerTick) {
          shotFiredFlags[idx] = true;
          fireShot(shot);
        }
      });

      for (let s = 0; s < SUBSTEPS; s++) {
        stepSubPhysics();
      }

      for (const body of bodyList) {
        const meta = metaMap.get(body.id);
        if (!meta || meta.potted) continue;

        if (meta.hasHitBall) {
          meta.ticksAfterHit += 1;
        }
        meta.spinEnergy *= 0.992;

        const lastPt = meta.trail[meta.trail.length - 1];
        if (
          !lastPt ||
          Math.hypot(body.position.x - lastPt.x, body.position.y - lastPt.y) > 3
        ) {
          meta.trail.push({ x: body.position.x, y: body.position.y });
        }

        const margin = meta.radius * 3.5;
        if (
          body.position.x < -margin ||
          body.position.x > width + margin ||
          body.position.y < -margin ||
          body.position.y > height + margin
        ) {
          meta.potted = true;
          meta.vx = 0;
          meta.vy = 0;
        }
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

      if (hasPockets) {
        ctx.fillStyle = '#180f0a';
        const backSize = 34;
        if (resolvedWalls.top && resolvedWalls.left)
          ctx.fillRect(0, 0, backSize, backSize);
        if (resolvedWalls.top && resolvedWalls.right)
          ctx.fillRect(width - backSize, 0, backSize, backSize);
        if (resolvedWalls.bottom && resolvedWalls.left)
          ctx.fillRect(0, height - backSize, backSize, backSize);
        if (resolvedWalls.bottom && resolvedWalls.right)
          ctx.fillRect(width - backSize, height - backSize, backSize, backSize);
        if (resolvedWalls.top && hasMiddlePockets)
          ctx.fillRect(width / 2 - 20, 0, 40, 14);
        if (resolvedWalls.bottom && hasMiddlePockets)
          ctx.fillRect(width / 2 - 20, height - 14, 40, 14);
      }

      ctx.fillStyle = '#24160e';
      for (const poly of railPolygons) {
        if (poly.length === 0) continue;
        ctx.beginPath();
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }

      for (const pocket of resolvedPockets) {
        const pr = pocket.radius ?? 16;
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
          const {
            launchAngle,
            ghostX,
            ghostY,
            chordDist,
            curveRadius,
            halfTurnAngle,
          } = computeShotGeometry(
            firstShot,
            sx,
            sy,
            cueMeta.radius,
            activeBalls,
            ballRadius,
            width,
            height
          );

          if (Math.abs(halfTurnAngle) > 0.01 && curveRadius) {
            const totalArc =
              chordDist !== undefined
                ? Math.abs(2 * halfTurnAngle * curveRadius)
                : 340;
            const steps = 36;
            const stepLen = totalArc / steps;
            let px = sx;
            let py = sy;
            let curAng = launchAngle;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 5]);
            ctx.moveTo(px, py);

            for (let i = 0; i < steps; i++) {
              curAng += (stepLen / curveRadius) * 0.5;
              px += Math.cos(curAng) * stepLen;
              py += Math.sin(curAng) * stepLen;
              curAng += (stepLen / curveRadius) * 0.5;
              ctx.lineTo(px, py);
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.lineWidth = 1.25;
            ctx.stroke();

            if (ghostX !== undefined && ghostY !== undefined) {
              ctx.beginPath();
              ctx.arc(ghostX, ghostY, cueMeta.radius, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
              ctx.stroke();
            }
            ctx.restore();
          } else {
            const dirX = Math.cos(launchAngle);
            const dirY = Math.sin(launchAngle);

            let closestDist = 900;
            for (const other of bodyList) {
              const m = metaMap.get(other.id);
              if (!m || m.config.id === firstShot.ballId) continue;
              const ox = other.position.x - sx;
              const oy = other.position.y - sy;
              const proj = ox * dirX + oy * dirY;
              if (proj <= 0) continue;
              const perpSq = ox * ox + oy * oy - proj * proj;
              const sumR = cueMeta.radius + m.radius;
              if (perpSq < sumR * sumR) {
                const hitDist = proj - Math.sqrt(sumR * sumR - perpSq);
                if (hitDist > 0 && hitDist < closestDist) {
                  closestDist = hitDist;
                }
              }
            }

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

      for (const body of bodyList) {
        const meta = metaMap.get(body.id);
        if (!meta) continue;

        if (meta.potted) {
          if (meta.potAnimation && meta.potAnimation.progress < 1) {
            const anim = meta.potAnimation;
            anim.progress = Math.min(1, anim.progress + 0.12);
            anim.x += (anim.pocketX - anim.x) * 0.28;
            anim.y += (anim.pocketY - anim.y) * 0.28;
            const scale = 1 - anim.progress;
            if (scale > 0.05) {
              drawSingleBall(anim.x, anim.y, meta.radius, meta, scale);
            }
          }
          continue;
        }

        const scale = meta.isAirborne ? 1.22 : 1;
        drawSingleBall(
          body.position.x,
          body.position.y,
          meta.radius,
          meta,
          scale
        );
      }

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

          const { launchAngle } = computeShotGeometry(
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
        stepOneFrame();
        stepAccumulator -= 1;
        stepped = true;
      }

      if (stepped) {
        drawScene();
      }

      const allPendingShotsFired = shotFiredFlags.every(Boolean);
      let anyActiveMotion = false;

      metaMap.forEach((meta) => {
        if (
          meta.potAnimation &&
          meta.potAnimation.progress > 0 &&
          meta.potAnimation.progress < 1
        ) {
          anyActiveMotion = true;
        }
        if (meta.potted) return;
        const speed = Math.hypot(meta.vx, meta.vy);
        if (
          speed > 0.075 ||
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
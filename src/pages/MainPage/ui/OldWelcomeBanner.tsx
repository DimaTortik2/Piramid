import { ActionCard } from '@/shared/ActionCard';
import { cn } from '@/shared/lib/utils/cn';
import { adjustHex, isLightColor } from '@/shared/lib/utils/color';
import {
  useSettingsStore,
  resolveSlotColor,
} from '@/shared/store/useSettingsStore';

interface WelcomeBannerProps {
  className?: string;
  pyramidClassName?: string;
}

export function WelcomeBanner({
  className,
  pyramidClassName,
}: WelcomeBannerProps) {
  const disciplineThemes = useSettingsStore((state) => state.disciplineThemes);
  const ballColor = resolveSlotColor(disciplineThemes, 'pyramid', 'pyramidBalls');
  const isLight = isLightColor(ballColor);

  const stopHighlight = adjustHex(ballColor, isLight ? 16 : 32);
  const stopMid = adjustHex(ballColor, isLight ? -20 : -8);
  const stopShadow = adjustHex(ballColor, isLight ? -58 : -24);

  return (
    <section
      className={cn('relative flex w-full flex-col items-center', className)}
    >
      <div
        className={cn(
          'relative z-0 flex w-[140px] justify-center transition-all duration-300',
          '[clip-path:inset(-100%_-100%_0px_-100%)]',
          pyramidClassName
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 289 212"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="-mb-[10%] h-auto w-full drop-shadow-md transition-all duration-300"
        >
          <path
            d="M127.668 40.9844C135.149 28.0273 153.851 28.0273 161.332 40.9844L242.563 181.682C250.044 194.639 240.693 210.835 225.731 210.835H63.2686C48.3071 210.835 38.956 194.639 46.4365 181.682L127.668 40.9844Z"
            strokeWidth="11.8304"
            className="stroke-piramid-border"
          />

          <defs>
            <radialGradient
              id="pyramid-ball-volume"
              cx="35%"
              cy="35%"
              r="65%"
              fx="35%"
              fy="35%"
            >
              <stop offset="0%" stopColor={stopHighlight} />
              <stop offset="45%" stopColor={ballColor} />
              <stop offset="80%" stopColor={stopMid} />
              <stop offset="100%" stopColor={stopShadow} />
            </radialGradient>
          </defs>

          <g
            fill="url(#pyramid-ball-volume)"
            stroke={!isLight ? 'rgba(255, 255, 255, 0.08)' : undefined}
            strokeWidth={!isLight ? 0.5 : undefined}
          >
            <circle cx="66.5" cy="188.5" r="19.5" />
            <circle cx="105.5" cy="188.5" r="19.5" />
            <circle cx="144.5" cy="188.5" r="19.5" />
            <circle cx="183.5" cy="188.5" r="19.5" />
            <circle cx="222.5" cy="188.5" r="19.5" />

            <circle cx="83.4854" cy="156.484" r="19.5" />
            <circle cx="122.485" cy="156.484" r="19.5" />
            <circle cx="162.485" cy="156.484" r="19.5" />
            <circle cx="203.485" cy="156.484" r="19.5" />

            <circle cx="104.271" cy="123.485" r="19.5" />
            <circle cx="143.271" cy="123.485" r="19.5" />
            <circle cx="183.271" cy="123.485" r="19.5" />

            <circle cx="125.056" cy="90.485" r="19.5" />
            <circle cx="164.056" cy="90.485" r="19.5" />

            <circle cx="145.841" cy="57.4854" r="19.5" />
          </g>
        </svg>
      </div>

      <ActionCard
        title={
          <span className="text-foreground text-[28px] leading-tight tracking-wide dark:text-neutral-50">
            Снова привет
          </span>
        }
        desc={
          <span className="mt-0.5 text-[20px] text-neutral-600 dark:text-neutral-400">
            от Pyramid
          </span>
        }
        className="relative z-10 w-full"
      />
    </section>
  );
}
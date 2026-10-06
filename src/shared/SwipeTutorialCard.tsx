import React, { type HTMLAttributes } from 'react';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';

interface PhosphorArrowProps {
  direction: 'up' | 'down';
  tall?: boolean;
  className?: string;
}

// Компонент удлиненной стрелки Phosphor без геометрических искажений наконечника
const ElongatedArrow: React.FC<PhosphorArrowProps> = ({
  direction,
  tall = false,
  className = '',
}) => {
  const isUp = direction === 'up';
  // Высота хвоста под наконечником: длинная или короткая
  const stemHeightClass = tall ? 'h-7' : 'h-3.5';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}
    >
      {isUp ? (
        <>
          <ArrowUp size={34} weight="regular" className="shrink-0" />
          {/* Ствол, стыкующийся с наконечником без искажения шеврона */}
          <span
            className={`w-[2.5px] -mt-[14px] rounded-b-full bg-current ${stemHeightClass}`}
          />
        </>
      ) : (
        <>
          {/* Ствол стрелки вниз */}
          <span
            className={`w-[2.5px] -mb-[14px] rounded-t-full bg-current ${stemHeightClass}`}
          />
          <ArrowDown size={34} weight="regular" className="shrink-0" />
        </>
      )}
    </div>
  );
};

export const SwipeTutorialCard = ({className, ...props}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div {...props} className={cn("relative flex w-full flex-col justify-between rounded-[32px] border-[3px] border-dashed border-piramid-border p-6 select-none", className)}>
      {/* Верхний ряд: 5 стрелок approve (чередование короткая - длинная, по нижнему краю) */}
      <div className="flex h-16 items-end justify-between px-2 text-approve">
        <ElongatedArrow direction="up" tall={false} />
        <ElongatedArrow direction="up" tall={true} />
        <ElongatedArrow direction="up" tall={false} />
        <ElongatedArrow direction="up" tall={true} />
        <ElongatedArrow direction="up" tall={false} />
      </div>

      {/* Информационный блок */}
      <div className="my-8 flex flex-col gap-10">
        {/* Свайп вверх */}
        <div className="flex items-center justify-end gap-3 pl-2 pr-4">
          <div className="flex flex-col">
            <span className="text-[23px] font-semibold tracking-tight text-foreground">
              Свайп вверх
            </span>
            <span className="mt-0.5 text-[15px] font-medium text-approve">
              + 1 шар этому игроку
            </span>
          </div>

          <div className="text-approve">
            <ElongatedArrow direction="up" tall={true} />
          </div>
        </div>

        {/* Свайп вниз */}
        <div className="flex items-center gap-6 pl-4">
          <div className="text-destructive">
            <ElongatedArrow direction="down" tall={true} />
          </div>

          <div className="flex flex-col">
            <span className="text-[23px] font-semibold tracking-tight text-foreground">
              Свайп вниз
            </span>
            <span className="mt-0.5 text-[15px] font-medium text-destructive">
              - 1 шар этому игроку
            </span>
          </div>
        </div>
      </div>

      {/* Нижний ряд: 5 стрелок destructive (чередование короткая - длинная, по верхнему краю) */}
      <div className="flex h-16 items-start justify-between px-2 text-destructive">
        <ElongatedArrow direction="down" tall={false} />
        <ElongatedArrow direction="down" tall={true} />
        <ElongatedArrow direction="down" tall={false} />
        <ElongatedArrow direction="down" tall={true} />
        <ElongatedArrow direction="down" tall={false} />
      </div>
    </div>
  );
};

export default SwipeTutorialCard;
import { Circle } from '@/shared/Circle';
import { cn } from '@/shared/lib/utils/cn';
import { useState, type ComponentProps } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';

interface FaqProps extends ComponentProps<'div'> {
  answer: string;
}

export function Faq({ answer, children, className, ...props }: FaqProps) {
  const [answerVisible, setAnswerVisible] = useState(false);

  return (
    <div
      className={cn(
        'bg-background/80 text-foreground rounded-lg p-5 shadow-2xl backdrop-blur-lg',
        className
      )}
      {...props}
    >
      <button
        onClick={() => setAnswerVisible((prev) => !prev)}
        className="flex justify-between w-full group"
      >
        <p className={cn('text-start transition-colors' ,answerVisible && 'text-muted-foreground ')}>
        {children}
        </p>
        <Circle className={cn('group-hover:bg-muted-foreground group-hover:translate-y-[-3px] transition-transform', answerVisible && 'bg-muted-foreground group-hover:bg-foreground')}>{ <CaretDownIcon className={cn('transition-transform',answerVisible && 'rotate-180')} />}</Circle>
      </button>
      {answerVisible &&
      <>
        <div className='h-[2px] w-full rounded-full bg-foreground/20 mt-4 mb-3' />
      <p  >{answer}</p>
      </>
      }
    </div>
  );
}

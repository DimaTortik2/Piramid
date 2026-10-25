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
        'bg-foreground/5 rounded-2xl p-4 transition-colors',
        className
      )}
      {...props}
    >
      <button
        onClick={() => setAnswerVisible((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 group"
      >
        <p 
          className={cn(
            'text-start font-medium transition-colors', 
            answerVisible ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {children}
        </p>
        <Circle 
          className={cn(
            'shrink-0 transition-transform group-hover:bg-muted-foreground group-hover:translate-y-[-2px]', 
            answerVisible && 'bg-muted-foreground group-hover:bg-foreground'
          )}
        >
          <CaretDownIcon 
            className={cn(
              'transition-transform duration-300',
              answerVisible && 'rotate-180'
            )} 
          />
        </Circle>
      </button>
      
      {answerVisible && (
        <div className="mt-3 animate-app-fade-in text-muted-foreground">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
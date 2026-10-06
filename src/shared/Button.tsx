import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/shared/lib/utils/cn';

const variants = {
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  background: 'bg-background text-foreground hover:bg-background/90',
  white: 'bg-white text-black hover:bg-white/90',
  outline: 'border-2 border-primary/20 bg-transparent hover:bg-primary/10',
  ghost: 'bg-transparent hover:bg-white/10',
  ghostApprove: 'bg-transparent hover:bg-approve/10',
  ghostDestructive: 'bg-transparent hover:bg-destructive/20',
} as const;

const sizes = {
  sm: 'h-9 px-4 text-sm rounded-lg',
  md: 'h-11 px-6 text-base rounded-lg',
  lg: 'h-[52px] px-8 text-[17px] font-medium rounded-lg',
  icon: 'h-11 w-11 flex justify-center rounded-lg',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 whitespace-nowrap transition-colors active:scale-[0.98]',
          'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:opacity-50',
          'cursor-pointer transition-transform hover:translate-y-[-2px]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <CircleNotch
            weight="bold"
            className="absolute h-5 w-5 animate-spin"
          />
        )}

        <span
          className={cn(
            'inline-flex items-center gap-2',
            isLoading && 'opacity-0'
          )}
        >
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

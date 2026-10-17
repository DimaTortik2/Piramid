import { ActionCard } from '@/shared/ActionCard';
import { cn } from '@/shared/lib/utils/cn';

interface WelcomeBannerProps {
  className?: string;
}

export function WelcomeBanner({ className }: WelcomeBannerProps) {
  return (
    <section className={cn('relative flex w-full flex-col items-center', className)}>
      <ActionCard
        title={
          <span className="text-foreground block text-[32px] font-normal leading-tight tracking-wide dark:text-neutral-50">
            Снова привет
          </span>
        }
        desc={
          <span className="text-foreground/85 mt-1 block text-[20px] dark:text-neutral-300">
            от Pyramid
          </span>
        }
        className="w-full rounded-3xl rounded-bl-none px-6 py-5"
      />
    </section>
  );
}
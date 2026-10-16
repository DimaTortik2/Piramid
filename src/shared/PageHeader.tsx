import { cn } from '@/shared/lib/utils/cn';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  backLink?: string;
  actionBtn?: ReactNode;
}

export function PageHeader({
  className,
  backLink = '/',
  children,
  actionBtn,
  ...props
}: HeaderProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'bg-background/80 flex items-center justify-between rounded-2xl px-5 py-3 backdrop-blur-lg',
        className
      )}
    >
      <Link to={backLink}>
        <ArrowLeftIcon />
      </Link>
      <h1 className="text-xl font-bold">{children}</h1>
      {actionBtn ? actionBtn : <div className="w-10" />}
    </div>
  );
}

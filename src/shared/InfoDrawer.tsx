import { Button } from '@/shared/Button';
import type { ReactNode } from 'react';
import { Drawer } from 'vaul';

export interface InfoDrawerProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  content: ReactNode;
  a11yTitle?: string;
  snapPoints?: (number | string)[];
  activeSnapPoint?: number | string | null;
  setActiveSnapPoint?: (snapPoint: number | string | null) => void;
  fadeFromIndex?: number;
  closeBtn?: ReactNode;
}

export function InfoDrawer({
  isOpen,
  onOpenChange,
  trigger,
  content,
  a11yTitle = 'Информация',
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  fadeFromIndex,
  closeBtn,
}: InfoDrawerProps) {
  const snapProps =
    snapPoints && snapPoints.length > 0
      ? { snapPoints, activeSnapPoint, setActiveSnapPoint, fadeFromIndex }
      : {};

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange} {...snapProps}>
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <Drawer.Content
          className={`bg-background fixed inset-x-0 bottom-0 z-50 mx-auto mt-24 flex w-full max-w-125 flex-col rounded-t-[32px] transition-all outline-none ${
            snapPoints && snapPoints.length > 0 ? 'h-[90vh]' : 'max-h-[90vh]'
          }`}
        >
          {/* Ползунок */}
          <div className="shrink-0 pt-4 pb-2">
            <div className="mx-auto h-1 w-12 rounded-full bg-[#48484A]" />
          </div>

          <Drawer.Title className="sr-only">{a11yTitle}</Drawer.Title>

          {/* Контент со скроллом */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>

          {/* Кнопка закрытия */}
          <div className="pb-safe-or-4 shrink-0 px-6 pt-4">
            <Drawer.Close asChild>
              {closeBtn ? closeBtn : <Button variant="neutral">Закрыть</Button>}
            </Drawer.Close>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

import {
  MonitorPlayIcon,
  DiscoBallIcon,
  DropSlashIcon,
} from '@phosphor-icons/react';
import { Toggle } from '@/shared/Toggle';
import { cn } from '@/shared/lib/utils/cn';
import { useSettingsStore } from '@/shared/store/useSettingsStore';

interface SettingsPageProps {}

export function SettingsPage({}: SettingsPageProps) {
  const isLecturesZenMode = useSettingsStore(
    (state) => state.isLecturesZenMode
  );
  const toggleLecturesZenMode = useSettingsStore(
    (state) => state.toggleLecturesZenMode
  );

  const isGameZenMode = useSettingsStore((state) => state.isGameZenMode);
  const toggleGameZenMode = useSettingsStore(
    (state) => state.toggleGameZenMode
  );

  const isDarkBalls = useSettingsStore((state) => state.isDarkBalls);
  const toggleisDarkBalls = useSettingsStore(
    (state) => state.toggleisDarkBalls
  );

  const disableBlur = useSettingsStore((state) => state.disableBlur);
  const toggleDisableBlur = useSettingsStore(
    (state) => state.toggleDisableBlur
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-125 flex-col gap-1 px-4 py-6">
      {/* Основной контент */}
      <div className="bg-background/80 flex flex-col gap-1 rounded-2xl p-2 backdrop-blur-lg">
        {/* Настройка: Zen Mode в игре */}
        <label className="group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                isGameZenMode ? 'opacity-100' : 'opacity-20'
              )}
            >
              <MonitorPlayIcon size={18} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                Дзен-режим в дисплее для матча
              </span>
              <span className="text-muted-backbg-background text-xs">
                Полный экран, дисплей не гаснет
              </span>
            </div>
          </div>
          <Toggle
            checked={isGameZenMode}
            onCheckedChange={toggleGameZenMode}
            aria-label="Включить дзен-режим в дисплее для матча"
          />
        </label>
        {/* Настройка: Zen Mode в лекциях */}
        <label className="group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                isLecturesZenMode ? 'opacity-100' : 'opacity-20'
              )}
            >
              <MonitorPlayIcon size={18} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                Дзен-режим в лекциях
              </span>
              <span className="text-muted-backbg-background text-xs">
                Полный экран, дисплей не гаснет
              </span>
            </div>
          </div>
          <Toggle
            checked={isLecturesZenMode}
            onCheckedChange={toggleLecturesZenMode}
            aria-label="Включить дзен-режим"
          />
        </label>

        {/* Настройка: Черных шаров */}
        <label className="group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                isDarkBalls ? 'opacity-100' : 'opacity-20'
              )}
            >
              <DiscoBallIcon size={18} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                Черные шары
              </span>
              <span className="text-muted-backbg-background text-xs">
                Сделаем шары в главном меню черными
              </span>
            </div>
          </div>
          <Toggle
            checked={isDarkBalls}
            onCheckedChange={toggleisDarkBalls}
            aria-label="Включить черные шары"
          />
        </label>

        {/* Настройка: отключения блюра */}
        <label className="group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                disableBlur ? 'opacity-100' : 'opacity-20'
              )}
            >
              <DropSlashIcon size={18} weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                Отключить размытия
              </span>
              <span className="text-muted-backbg-background text-xs">
                Отключает размытия некоторых блоков, делая их непрозрачными. Это
                может повысить производительность
              </span>
            </div>
          </div>
          <Toggle
            checked={disableBlur}
            onCheckedChange={toggleDisableBlur}
            aria-label="Отключить размытия на сайте"
          />
        </label>
      </div>
    </div>
  );
}

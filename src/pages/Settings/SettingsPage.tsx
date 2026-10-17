import {
  MonitorPlayIcon,
  DiscoBallIcon,
  DropSlashIcon,
  SparkleIcon,
  DeviceRotateIcon,
  type Icon,
} from '@phosphor-icons/react';
import { Toggle } from '@/shared/Toggle';
import { cn } from '@/shared/lib/utils/cn';
import { useSettingsStore } from '@/shared/store/useSettingsStore';
import { PageHeader } from '@/shared/PageHeader';
import { isTelegramMiniApp } from '@/shared/lib/telegram';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  ariaLabel: string;
  icon: Icon;
  checked: boolean;
  onChange: () => void;
  hidden?: boolean;
}

export function SettingsPage() {
  const {
    isLecturesZenMode,
    toggleLecturesZenMode,
    isGameZenMode,
    toggleGameZenMode,
    isDarkBalls,
    toggleisDarkBalls,
    disableBlur,
    toggleDisableBlur,
    disableDynamicBackground,
    toggleDisableDynamicBackground,
    autoRotateSimulator,
    toggleAutoRotateSimulator,
  } = useSettingsStore();

  const isTma = isTelegramMiniApp();

  const settings: SettingItem[] = [
    {
      id: 'game-zen',
      title: 'Дзен-режим в дисплее для матча',
      description: 'Полный экран, дисплей не гаснет',
      ariaLabel: 'Включить дзен-режим в дисплее для матча',
      icon: MonitorPlayIcon,
      checked: isGameZenMode,
      onChange: toggleGameZenMode,
      hidden: isTma,
    },
    {
      id: 'lectures-zen',
      title: 'Дзен-режим в лекциях',
      description: 'Полный экран, дисплей не гаснет',
      ariaLabel: 'Включить дзен-режим в лекциях',
      icon: MonitorPlayIcon,
      checked: isLecturesZenMode,
      onChange: toggleLecturesZenMode,
      hidden: isTma,
    },
    {
      id: 'auto-rotate-simulator',
      title: 'Автоповорот тренажера',
      description:
        'Поворачивает бильярдный стол горизонтально при открытии на узких экранах',
      ariaLabel: 'Включить автоповорот тренажера на узких экранах',
      icon: DeviceRotateIcon,
      checked: autoRotateSimulator,
      onChange: toggleAutoRotateSimulator,
    },
    {
      id: 'dark-balls',
      title: 'Черные шары',
      description: 'Сделаем шары в главном меню черными',
      ariaLabel: 'Включить черные шары',
      icon: DiscoBallIcon,
      checked: isDarkBalls,
      onChange: toggleisDarkBalls,
    },
    {
      id: 'disable-blur',
      title: 'Отключить размытия',
      description:
        'Отключает размытия некоторых блоков, делая их непрозрачными. Это может повысить производительность',
      ariaLabel: 'Отключить размытия на сайте',
      icon: DropSlashIcon,
      checked: disableBlur,
      onChange: toggleDisableBlur,
    },
    {
      id: 'disable-dynamic-bg',
      title: 'Статичный фон',
      description:
        'Отключает физику шаров и движение сукна на фоне для повышения производительности',
      ariaLabel: 'Отключить динамический фон',
      icon: SparkleIcon,
      checked: disableDynamicBackground,
      onChange: toggleDisableDynamicBackground,
    },
  ];

  const visibleSettings = settings.filter((item) => !item.hidden);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-125 flex-col gap-1 px-4 py-6">
      <PageHeader className="mb-4">Настройки</PageHeader>
      <div className="bg-background/80 flex flex-col gap-1 rounded-2xl p-2 backdrop-blur-lg">
        {visibleSettings.map((item) => {
          const IconComponent = item.icon;
          return (
            <label
              key={item.id}
              className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'text-foreground flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity',
                    item.checked ? 'opacity-100' : 'opacity-20'
                  )}
                >
                  <IconComponent size={18} weight="fill" />
                </div>
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {item.description}
                  </span>
                </div>
              </div>
              <Toggle
                checked={item.checked}
                onCheckedChange={item.onChange}
                aria-label={item.ariaLabel}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
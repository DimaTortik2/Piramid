interface TelegramWebApp {
  initData: string;
  platform?: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
  BackButton?: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (
      style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
    ) => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  const tg = window.Telegram?.WebApp;
  if (tg && tg.initData && tg.initData.length > 0) {
    return tg;
  }
  return null;
}

export function isTelegramMiniApp(): boolean {
  return getTelegramWebApp() !== null;
}

export function initTelegramMiniApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;

  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes?.();
  tg.enableClosingConfirmation?.();
  tg.setHeaderColor?.('#161618');
  tg.setBackgroundColor?.('#161618');
}

export function getTelegramUserName(): string | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user?.first_name || null;
}

export function triggerHaptic(
  type: 'pot' | 'undo' | 'penalty' | 'win' | 'tab' = 'pot'
) {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    if (type === 'pot') tg.HapticFeedback.impactOccurred('medium');
    else if (type === 'undo') tg.HapticFeedback.impactOccurred('light');
    else if (type === 'tab') tg.HapticFeedback.selectionChanged();
    else if (type === 'penalty')
      tg.HapticFeedback.notificationOccurred('warning');
    else if (type === 'win') tg.HapticFeedback.notificationOccurred('success');
    return;
  }

  if ('vibrate' in navigator) {
    if (type === 'pot') navigator.vibrate(15);
    else if (type === 'undo' || type === 'tab') navigator.vibrate(8);
    else if (type === 'penalty') navigator.vibrate([25, 40, 25]);
    else if (type === 'win') navigator.vibrate([20, 50, 40]);
  }
}

export function shareToTelegram(text: string) {
  const shareUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
  const tg = getTelegramWebApp();
  if (tg) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }
}
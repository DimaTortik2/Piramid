import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { toast } from 'sonner';
import type { GameMode } from '@/shared/store/gameStore';

const ARROW_UP_SVG = `<svg width="18" height="18" viewBox="0 0 256 256" fill="none" stroke="#84e89b" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><line x1="128" y1="216" x2="128" y2="40"/><polyline points="56 112 128 40 200 112"/></svg>`;

const ARROW_DOWN_SVG = `<svg width="18" height="18" viewBox="0 0 256 256" fill="none" stroke="#ff9494" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><line x1="128" y1="40" x2="128" y2="216"/><polyline points="56 144 128 216 200 144"/></svg>`;

const FIRE_SVG = `<svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M185.82,53.19A159.4,159.4,0,0,0,141.45,17a8,8,0,0,0-11,5.24l-13,44.33L94.39,46.46a8,8,0,0,0-12.56,2.14C62.21,82.5,44,113.84,44,140a84,84,0,0,0,168,0C212,107.09,202.94,77,185.82,53.19Z"/></svg>`;

const UNDO_SVG = `<svg width="17" height="17" viewBox="0 0 256 256" fill="none" stroke="#f5d17a" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"><polyline points="88 136 40 88 88 40"/><path d="M40,88H168a56,56,0,0,1,0,112H112"/></svg>`;

const QUESTION_SVG = `<svg width="17" height="17" viewBox="0 0 256 256" fill="none" stroke="#f5d17a" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="128" r="96"/><path d="M104,100a24,24,0,1,1,32,22.62V140"/><circle cx="128" cy="180" r="6" fill="#f5d17a"/></svg>`;

const BLOCKED_EVENTS = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'touchstart',
  'touchmove',
  'touchend',
  'mousedown',
  'mouseup',
  'click',
] as const;

function lockTourInteractions() {
  const handler = (e: Event) => {
    const target = e.target as Element | null;
    if (!target) return;

    if (
      target.closest('.driver-popover') ||
      target.closest('[data-sonner-toaster]')
    ) {
      return;
    }

    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.cancelable) {
      e.preventDefault();
    }

    if (e.type === 'pointerdown' && !target.closest('.driver-overlay')) {
      toast.info('Попробуйте после обучения', { id: 'tour-lock-toast' });
    }
  };

  BLOCKED_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, handler, {
      capture: true,
      passive: false,
    });
  });

  return () => {
    BLOCKED_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, handler, { capture: true });
    });
  };
}

const MODE_TOUR_INFO: Record<
  GameMode,
  {
    title: string;
    rulesHtml: string;
    scoringHtml: string;
    penaltyHtml: string;
  }
> = {
  'free-pyramid': {
    title: 'Американка',
    rulesHtml: `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <span class="tour-chip tour-chip-green">До 8 шаров</span>
        <span class="tour-chip tour-chip-gold">Любой шар битком</span>
      </div>
      Игра ведется любым шаром по любому. В зачет идут как <b>чужие шары</b>, так и <b>свояки</b>
    `,
    scoringHtml: `
      <div class="tour-card">
        <span class="tour-icon">${ARROW_UP_SVG}</span>
        <div><b>Свайп вверх</b> по полке игрока начисляет <b>+1 шар</b></div>
      </div>
      <div class="tour-card">
        <span class="tour-icon">${ARROW_DOWN_SVG}</span>
        <div><b>Свайп вниз</b> убирает <b>-1 шар</b>, если нажали случайно</div>
      </div>
    `,
    penaltyHtml: `
      За фол (шар выскочил за борт, промах мимо всех шаров и т.д.) нажмите <span class="tour-chip tour-chip-red">Штраф</span> у нарушителя - <b>сопернику прибавится 1 шар</b>
    `,
  },
  'combined-pyramid': {
    title: 'Московка',
    rulesHtml: `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <span class="tour-chip tour-chip-green">До 8 шаров</span>
        <span class="tour-chip tour-chip-gold">Один биток</span>
      </div>
      Удары наносятся <b>только одним цветным битком</b>. Забитый свояк выставляется на точку в доме, а со стола на полку снимается любой белый шар
    `,
    scoringHtml: `
      <div class="tour-card">
        <span class="tour-icon">${ARROW_UP_SVG}</span>
        <div><b>Свайп вверх</b> по полке игрока добавляет <b>+1 шар</b></div>
      </div>
      <div class="tour-card">
        <span class="tour-icon">${ARROW_DOWN_SVG}</span>
        <div><b>Свайп вниз</b> списывает <b>-1 шар</b> с полки</div>
      </div>
    `,
    penaltyHtml: `
      Нажмите <span class="tour-chip tour-chip-red">Штраф</span> на карточке нарушителя - соперник получит <b>+1 штрафной шар</b>, а серия нарушителя прервется
    `,
  },
  'dynamic-pyramid': {
    title: 'Невская',
    rulesHtml: `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <span class="tour-chip tour-chip-green">До 8 шаров</span>
        <span class="tour-chip tour-chip-gold">Биток с руки</span>
      </div>
      Игра одним битком. После забитого свояка игрок снимает со стола чужой шар и бьет битком <b>с руки из любой точки стола</b> (забивать с руки можно только чужой шар)
    `,
    scoringHtml: `
      <div class="tour-card">
        <span class="tour-icon">${ARROW_UP_SVG}</span>
        <div><b>Свайп вверх</b> по полке игрока добавляет <b>+1 шар</b></div>
      </div>
      <div class="tour-card">
        <span class="tour-icon">${ARROW_DOWN_SVG}</span>
        <div><b>Свайп вниз</b> отменяет шар (<b>-1</b>)</div>
      </div>
    `,
    penaltyHtml: `
      При нажатии на <span class="tour-chip tour-chip-red">Штраф</span> сопернику начисляется <b>+1 шар</b> и переходит право удара
    `,
  },
  'classic-pyramid': {
    title: 'Классика (71 очко)',
    rulesHtml: `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <span class="tour-chip tour-chip-green">До 71 очка</span>
        <span class="tour-chip tour-chip-gold">По номерам</span>
      </div>
      Шары считаются по номиналу номера (2-15). <b>Шар №1 (туз) дает 11 очков</b>, а последний оставшийся на столе шар приносит <b>+10 бонусных очков</b>
    `,
    scoringHtml: `
      <div class="tour-card">
        <span class="tour-icon">${ARROW_UP_SVG}</span>
        <div><b>Свайп вверх</b> открывает выбор номера забитого шара (1-15)</div>
      </div>
      <div class="tour-card">
        <span class="tour-icon">${ARROW_DOWN_SVG}</span>
        <div><b>Свайп вниз</b> возвращает последний забитый шар обратно на стол</div>
      </div>
    `,
    penaltyHtml: `
      В классике кнопка <span class="tour-chip tour-chip-red">Штраф</span> <b>списывает 5 очков</b> у нарушителя и <b>прибавляет 5 очков</b> сопернику
    `,
  },
  'continuous-free-pyramid': {
    title: 'С продолжением',
    rulesHtml: `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <span class="tour-chip tour-chip-green">Без лимита</span>
        <span class="tour-chip tour-chip-gold">Игра на серии</span>
      </div>
      Когда на столе остается последний шар, 14 забитых шаров снова выставляются в пирамиду, а серия продолжается без остановки
    `,
    scoringHtml: `
      <div class="tour-card">
        <span class="tour-icon">${ARROW_UP_SVG}</span>
        <div><b>Свайп вверх</b> по карточке игрока прибавляет <b>+1 шар</b></div>
      </div>
      <div class="tour-card">
        <span class="tour-icon">${ARROW_DOWN_SVG}</span>
        <div><b>Свайп вниз</b> убавляет <b>-1 шар</b></div>
      </div>
    `,
    penaltyHtml: `
      При нажатии на <span class="tour-chip tour-chip-red">Штраф</span> сопернику прибавляется <b>+1 очко</b>, а серия нарушителя завершается
    `,
  },
};

function findMainPlayButton(): Element | null {
  const directBtn = document.querySelector('#tour-main-play-btn');
  if (directBtn) return directBtn;

  const area = document.querySelector('#tour-main-play-area');
  if (!area) return null;

  const buttons = Array.from(area.querySelectorAll('button')).filter(
    (btn) =>
      !btn.closest('a[href="/history"]') &&
      !btn.closest('nav') &&
      !btn.classList.contains('text-destructive') &&
      !btn.closest('.text-destructive')
  );

  return buttons[0] ?? null;
}

export function startMainOnboardingTour(onComplete?: () => void) {
  const playBtn = findMainPlayButton();
  const historyBtn = document.querySelector('a[href="/history"]');

  const rawSteps: DriveStep[] = [
    {
      element: playBtn ?? '#tour-main-play-area',
      popover: {
        title: 'Добро пожаловать в Пирамиду',
        description: `
          <div style="margin-bottom:8px;">
            <span class="tour-chip tour-chip-gold">Вспомогательный дисплей для матча</span>
          </div>
          Нажмите на <b>главный шар</b>, чтобы выбрать дисциплину, указать имена игроков и начать партию. Вы сможете отмечать забитые шары и штрафы, чтобы в итоге получить <b>подробную статистику</b>
        `,
        side: 'bottom',
        align: 'center',
      },
    },
    ...(historyBtn
      ? ([
          {
            element: historyBtn,
            popover: {
              title: 'История и аналитика',
              description: `
                Все сыгранные матчи сохраняются здесь: <b>график набора очков, лучшие серии, темп ударов</b> и готовая карточка результата, которой легко поделиться
              `,
              side: 'top',
              align: 'center',
            },
          },
        ] as DriveStep[])
      : []),
    {
      element: '#tour-nav-lectures',
      popover: {
        title: 'Правила',
        description: `
          Иллюстрированные лекции по русскому бильярду ждут вас там
        `,
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '#tour-nav-menu',
      popover: {
        title: 'Темы стола и настройки',
        description: `
          Настройте <b>тему</b> под свой вкус, включите режим созерцания или перезапустите это обучение в любой момент
        `,
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '#tour-discipline-switcher',
      popover: {
        title: 'Переключение дисциплин',
        description: `
          Свайпайте главный экран влево-вправо или нажимайте на индикаторы сверху для перехода между бильярдными режимами
        `,
        side: 'bottom',
        align: 'center',
      },
    },
  ];

  const steps = rawSteps.filter((step) => {
    if (!step.element) return true;
    if (typeof step.element === 'string') {
      return Boolean(document.querySelector(step.element));
    }
    return true;
  });

  const unlockInteractions = lockTourInteractions();

  const driverObj = driver({
    popoverClass: 'billiard-tour-popover',
    showProgress: true,
    animate: true,
    allowClose: false,
    allowKeyboardControl: false,
    showButtons: ['next', 'previous'],
    overlayColor: '#070605',
    overlayOpacity: 0.8,
    stagePadding: 10,
    stageRadius: 28,
    nextBtnText: 'Далее',
    prevBtnText: 'Назад',
    doneBtnText: 'Играть!',
    progressText: '{{current}} из {{total}}',
    steps,
    onPopoverRender: (popover, { state }) => {
      if (state.activeIndex === 0) {
        popover.previousButton.removeAttribute('disabled');
        popover.previousButton.classList.remove('driver-popover-btn-disabled');
      }
    },
    onPrevClick: (_element, _step, { state, driver: drv }) => {
      if (state.activeIndex === 0) {
        drv.destroy();
      } else {
        drv.movePrevious();
      }
    },
    onDestroyed: () => {
      unlockInteractions();
      onComplete?.();
    },
  });

  driverObj.drive();
  return driverObj;
}

export function startGameModeOnboardingTour(
  mode: GameMode,
  onComplete?: () => void
) {
  const info = MODE_TOUR_INFO[mode] ?? MODE_TOUR_INFO['free-pyramid'];

  const rawSteps: DriveStep[] = [
    {
      element: '#tour-game-header',
      popover: {
        title: info.title,
        description: info.rulesHtml,
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-player-board',
      popover: {
        title: 'Управление счетом',
        description: info.scoringHtml,
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-player-name-row',
      popover: {
        title: 'Как фиксировать серии',
        description: `
          Когда игрок забивает шары подряд, рядом с его именем загорается бейдж <span class="tour-chip tour-chip-green">${FIRE_SVG} Серия</span>.<br/><br/>
          Как только подход завершился, <b>нажмите на этот бейдж</b> - он пропадет, серия закончится и сохранится в статистику
        `,
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-penalty-btn',
      popover: {
        title: 'Штраф за нарушение',
        description: info.penaltyHtml,
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-game-timer',
      popover: {
        title: 'Таймер и пауза',
        description: `
          Нажмите на время партии вверху экрана, если нужно <b>поставить матч на паузу</b>
        `,
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-bottom-actions',
      popover: {
        title: 'Нижняя панель',
        description: `
          <div class="tour-card">
            <span class="tour-icon">${UNDO_SVG}</span>
            <div><b>Отмена действия</b> возвращает счет на шаг назад</div>
          </div>
          <div class="tour-card">
            <span class="tour-icon">${QUESTION_SVG}</span>
            <div>Кнопка справа всегда повторно покажет правила <b>${info.title}</b></div>
          </div>
        `,
        side: 'top',
        align: 'center',
      },
    },
  ];

  const steps = rawSteps.filter((step) => {
    if (!step.element) return true;
    if (typeof step.element === 'string') {
      return Boolean(document.querySelector(step.element));
    }
    return true;
  });

  const unlockInteractions = lockTourInteractions();

  const driverObj = driver({
    popoverClass: 'billiard-tour-popover',
    showProgress: true,
    animate: true,
    allowClose: false,
    allowKeyboardControl: false,
    showButtons: ['next', 'previous'],
    overlayColor: '#070605',
    overlayOpacity: 0.8,
    stagePadding: 6,
    stageRadius: 20,
    nextBtnText: 'Далее',
    prevBtnText: 'Назад',
    doneBtnText: 'К столу!',
    progressText: '{{current}} из {{total}}',
    steps,
    onPopoverRender: (popover, { state }) => {
      if (state.activeIndex === 0) {
        popover.previousButton.removeAttribute('disabled');
        popover.previousButton.classList.remove('driver-popover-btn-disabled');
      }
    },
    onPrevClick: (_element, _step, { state, driver: drv }) => {
      if (state.activeIndex === 0) {
        drv.destroy();
      } else {
        drv.movePrevious();
      }
    },
    onDestroyed: () => {
      unlockInteractions();
      onComplete?.();
    },
  });

  driverObj.drive();
  return driverObj;
}
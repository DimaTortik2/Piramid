import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import type { GameMode } from '@/shared/store/gameStore';

const badgeStyle = (bg: string, color: string) =>
  `display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-weight:700;font-size:11px;background:${bg};color:${color};`;

const rowCardStyle =
  'display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:14px;background:rgba(240,235,216,0.06);margin-top:6px;';

const MODE_TOUR_INFO: Record<
  GameMode,
  {
    title: string;
    subtitle: string;
    targetText: string;
    rulesHtml: string;
    scoringHtml: string;
    penaltyHtml: string;
  }
> = {
  'free-pyramid': {
    title: 'Американка',
    subtitle: 'Свободная пирамида',
    targetText: 'Партия до 8 шаров',
    rulesHtml: `
      <div style="margin-bottom:8px;">
        <span style="${badgeStyle('rgba(110,200,130,0.2)', '#7be092')}">До 8 шаров</span>
        <span style="${badgeStyle('rgba(240,235,216,0.12)', '#f0ebd8')};margin-left:4px;">Любой шар</span>
      </div>
      Бить можно <b>любым шаром по любому</b>. В зачет идут как чужие шары, так и свояки (биток, упавший в лузу от прицельного шара).
    `,
    scoringHtml: `
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(110,200,130,0.22)', '#7be092')}">↑ Вверх</span>
        <div><b>+1 шар</b> — свайпните вверх по полке забившего игрока.</div>
      </div>
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(210,85,85,0.25)', '#ff8a8a')}">↓ Вниз</span>
        <div><b>-1 шар</b> — свайпните вниз, если начислили шар случайно.</div>
      </div>
    `,
    penaltyHtml: `
      Если игрок нарушил правила (выскочил шар, туш или промах мимо всех шаров), нажмите <b>«Штраф»</b> на его карточке — <b>сопернику прибавится 1 шар</b>.
    `,
  },
  'combined-pyramid': {
    title: 'Московка',
    subtitle: 'Комбинированная пирамида',
    targetText: 'Партия до 8 шаров',
    rulesHtml: `
      <div style="margin-bottom:8px;">
        <span style="${badgeStyle('rgba(110,200,130,0.2)', '#7be092')}">До 8 шаров</span>
        <span style="${badgeStyle('rgba(240,235,216,0.12)', '#f0ebd8')};margin-left:4px;">Один биток</span>
      </div>
      Удары выполняются <b>только одним цветным битком</b>. После забитого свояка биток выставляется в дом, а судья/игрок снимает со стола любой белый шар на полку.
    `,
    scoringHtml: `
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(110,200,130,0.22)', '#7be092')}">↑ Вверх</span>
        <div><b>+1 шар</b> — свайпните вверх по полке игрока.</div>
      </div>
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(210,85,85,0.25)', '#ff8a8a')}">↓ Вниз</span>
        <div><b>-1 шар</b> — свайпните вниз для отмены шара.</div>
      </div>
    `,
    penaltyHtml: `
      Нажмите <b>«Штраф»</b> на карточке нарушителя — сопернику автоматически начислится <b>+1 штрафной шар</b>, а активная серия прервется.
    `,
  },
  'dynamic-pyramid': {
    title: 'Невская',
    subtitle: 'Динамичная пирамида',
    targetText: 'Партия до 8 шаров',
    rulesHtml: `
      <div style="margin-bottom:8px;">
        <span style="${badgeStyle('rgba(110,200,130,0.2)', '#7be092')}">До 8 шаров</span>
        <span style="${badgeStyle('rgba(240,235,216,0.12)', '#f0ebd8')};margin-left:4px;">Биток с руки</span>
      </div>
      Игра идет одним битком. Забив свояк, игрок снимает со стола чужой шар и бьет битком <b>с руки из любой точки стола</b>, но только по чужому шару.
    `,
    scoringHtml: `
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(110,200,130,0.22)', '#7be092')}">↑ Вверх</span>
        <div><b>+1 шар</b> — свайпните вверх по полке игрока.</div>
      </div>
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(210,85,85,0.25)', '#ff8a8a')}">↓ Вниз</span>
        <div><b>-1 шар</b> — свайпните вниз для отмены шара.</div>
      </div>
    `,
    penaltyHtml: `
      Нажмите <b>«Штраф»</b> на карточке нарушившего игрока — соперник получит <b>+1 шар</b> и право удара с руки.
    `,
  },
  'classic-pyramid': {
    title: 'Классика',
    subtitle: 'Русская пирамида (71 очко)',
    targetText: 'Партия до 71 очка',
    rulesHtml: `
      <div style="margin-bottom:8px;">
        <span style="${badgeStyle('rgba(110,200,130,0.2)', '#7be092')}">До 71 очка</span>
        <span style="${badgeStyle('rgba(240,235,216,0.12)', '#f0ebd8')};margin-left:4px;">Номиналы шаров</span>
      </div>
      Каждый шар приносит очки по своему номеру (2–15). <b>Шар №1 (туз) дает 11 очков</b>, а последний 15-й шар на столе приносит <b>+10 бонусных очков</b>.
    `,
    scoringHtml: `
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(110,200,130,0.22)', '#7be092')}">↑ Вверх</span>
        <div>Откроется <b>выбор номера забитого шара (1–15)</b>. Очки посчитаются сами.</div>
      </div>
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(210,85,85,0.25)', '#ff8a8a')}">↓ Вниз</span>
        <div>Отменяет последний забитый шар этого игрока и возвращает его на стол.</div>
      </div>
    `,
    penaltyHtml: `
      В классике при нажатии на <b>«Штраф»</b> со счета нарушителя <b>списывается 5 очков</b>, а сопернику <b>прибавляется 5 очков</b>.
    `,
  },
  'continuous-free-pyramid': {
    title: 'С продолжением',
    subtitle: 'Игра на серии без лимита',
    targetText: 'Без лимита очков',
    rulesHtml: `
      <div style="margin-bottom:8px;">
        <span style="${badgeStyle('rgba(110,200,130,0.2)', '#7be092')}">Без лимита</span>
        <span style="${badgeStyle('rgba(240,235,216,0.12)', '#f0ebd8')};margin-left:4px;">Длинные серии</span>
      </div>
      Когда на столе остается последний шар, 14 забитых шаров снова выставляются в пирамиду, а серия продолжается без остановки. Завершить матч можно в любой момент через кнопку выхода.
    `,
    scoringHtml: `
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(110,200,130,0.22)', '#7be092')}">↑ Вверх</span>
        <div><b>+1 шар</b> — свайпните вверх по карточке игрока.</div>
      </div>
      <div style="${rowCardStyle}">
        <span style="${badgeStyle('rgba(210,85,85,0.25)', '#ff8a8a')}">↓ Вниз</span>
        <div><b>-1 шар</b> — свайпните вниз для отмены.</div>
      </div>
    `,
    penaltyHtml: `
      При нажатии на <b>«Штраф»</b> сопернику начисляется <b>+1 очко</b>, а текущая серия нарушителя закрывается.
    `,
  },
};

function findMainPlayButton(): Element | null {
  const area = document.querySelector('#tour-main-play-area');
  if (!area) return null;

  const buttons = Array.from(area.querySelectorAll('button')).filter(
    (btn) => !btn.closest('a[href="/history"]') && !btn.closest('nav')
  );

  if (buttons.length > 0) {
    return buttons[0];
  }

  return null;
}

export function startMainOnboardingTour(onComplete?: () => void) {
  const playBtn = findMainPlayButton();
  const historyBtn = document.querySelector('a[href="/history"]');

  const rawSteps: DriveStep[] = [
    {
      element: playBtn ?? '#tour-main-play-area',
      popover: {
        title: 'Добро пожаловать в Пирамиду! 🎱',
        description: `
          Нажмите на <b>главный шар</b>, чтобы начать партию: выбрать дисциплину (<i>Американка, Московка, Невская, Классика</i>), вписать имена игроков и разбить пирамиду.
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
              title: 'История и статистика',
              description: `
                Здесь хранятся все сыгранные партии: <b>график хода игры, максимальные серии, среднее время на шар</b> и красивые карточки матча, которыми можно поделиться с друзьями.
              `,
              side: 'top',
              align: 'end',
            },
          },
        ] as DriveStep[])
      : []),
    {
      element: '#tour-nav-lectures',
      popover: {
        title: 'Лекции и 2D-тренажер',
        description: `
          Раздел с наглядными правилами русского бильярда, разбором свояков и чужих, а также <b>интерактивным физическим столом</b> для тренировки ударов.
        `,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#tour-nav-menu',
      popover: {
        title: 'Темы оформления и меню',
        description: `
          Здесь можно поменять <b>цвет сукна, шаров и бортов</b>, включить залипательный режим <b>«Созерцать»</b>, открыть FAQ или заново запустить это обучение.
        `,
        side: 'top',
        align: 'end',
      },
    },
    {
      element: '#tour-discipline-switcher',
      popover: {
        title: 'Переключение разделов',
        description: `
          Свайпайте главный экран влево-вправо или нажимайте на полоски сверху для переключения между бильярдными дисциплинами.
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

  const driverObj = driver({
    popoverClass: 'billiard-tour-popover',
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: '#070605',
    overlayOpacity: 0.78,
    stagePadding: 10,
    stageRadius: 24,
    nextBtnText: 'Далее →',
    prevBtnText: 'Назад',
    doneBtnText: 'Начать!',
    progressText: '{{current}} из {{total}}',
    steps,
    onDestroyed: () => {
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
        title: `${info.title} — правила режима`,
        description: info.rulesHtml,
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-player-board',
      popover: {
        title: 'Как считать шары',
        description: info.scoringHtml,
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '#tour-player-name-row',
      popover: {
        title: 'Учет серий (подходов)',
        description: `
          Когда игрок забивает шары подряд, рядом с именем загорается кнопка <span style="${badgeStyle('rgba(110,200,130,0.22)', '#7be092')}">🔥 Серия</span>.<br/><br/>
          Если игрок <b>промахнулся или отыгрался</b>, нажмите на эту кнопку, чтобы завершить подход — так статистика серий в истории будет идеально точной!
        `,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-penalty-btn',
      popover: {
        title: 'Штрафы за фол',
        description: info.penaltyHtml,
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '#tour-game-timer',
      popover: {
        title: 'Таймер и пауза',
        description: `
          Приложение считает чистое время партии и среднюю скорость забития шаров. <b>Нажмите на время</b>, если хотите поставить матч на паузу.
        `,
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '#tour-bottom-actions',
      popover: {
        title: 'Панель управления матчем',
        description: `
          • <b>Выход (слева)</b> — завершить партию досрочно или выйти в меню на паузе.<br/>
          • <b>Отмена действия</b> — вернуть счет на шаг назад.<br/>
          • <b>Кнопка «?» (справа)</b> — всегда откроет эти правила снова.
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

  const driverObj = driver({
    popoverClass: 'billiard-tour-popover',
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: '#070605',
    overlayOpacity: 0.78,
    stagePadding: 6,
    stageRadius: 18,
    nextBtnText: 'Далее →',
    prevBtnText: 'Назад',
    doneBtnText: 'К столу! 🎱',
    progressText: '{{current}} из {{total}}',
    steps,
    onDestroyed: () => {
      onComplete?.();
    },
  });

  driverObj.drive();
  return driverObj;
}
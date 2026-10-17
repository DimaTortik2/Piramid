import { useState } from 'react';
import { PageHeader } from '@/shared/PageHeader';
import {
  BilliardSimulator,
  createPyramidRack,
} from '@/shared/BilliardSimulator/BilliardSimulator';
import {
  ArrowCounterClockwiseIcon,
  SlidersHorizontalIcon,
} from '@phosphor-icons/react';

export function TrainingPage() {
  const [power, setPower] = useState(17);
  const [angle, setAngle] = useState(0);
  const [topSpin, setTopSpin] = useState(0);
  const [sideSpin, setSideSpin] = useState(0);
  const [curve, setCurve] = useState(0);

  const handleResetLab = () => {
    setPower(17);
    setAngle(0);
    setTopSpin(0);
    setSideSpin(0);
    setCurve(0);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-125 flex-col gap-4 px-4 py-6 pb-24">
      <PageHeader className="mb-1">Практика и разбор ударов</PageHeader>

      <div className="bg-background/80 flex flex-col gap-3 rounded-2xl p-3.5 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontalIcon size={20} weight="bold" />
            <h2 className="text-base font-semibold">
              Интерактивная лаборатория
            </h2>
          </div>

          <button
            type="button"
            onClick={handleResetLab}
            className="bg-neutral text-neutral-foreground hover:bg-primary hover:text-primary-foreground flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            <ArrowCounterClockwiseIcon size={13} weight="bold" />
            Сбросить
          </button>
        </div>

        <BilliardSimulator
          className="bg-transparent p-0 backdrop-blur-none"
          balls={[
            { id: 'cue', x: 180, y: 211.5, isCue: true },
            { id: 1, x: 520, y: 195, number: 1 },
            { id: 2, x: 612, y: 326, number: 2 },
          ]}
          shots={[
            {
              ballId: 'cue',
              angle,
              power,
              spin: { top: topSpin, side: sideSpin, curve },
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-2 pt-1 text-xs sm:grid-cols-2">
          <label className="bg-neutral/70 text-neutral-foreground flex flex-col gap-1 rounded-xl p-2.5">
            <div className="flex justify-between">
              <span>Сила удара</span>
              <span className="font-semibold">{power}</span>
            </div>
            <input
              type="range"
              min={4}
              max={30}
              step={1}
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              className="accent-primary w-full"
            />
          </label>

          <label className="bg-neutral/70 text-neutral-foreground flex flex-col gap-1 rounded-xl p-2.5">
            <div className="flex justify-between">
              <span>Угол удара</span>
              <span className="font-semibold">{angle}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              step={1}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="accent-primary w-full"
            />
          </label>

          <label className="bg-neutral/70 text-neutral-foreground flex flex-col gap-1 rounded-xl p-2.5">
            <div className="flex justify-between">
              <span>Оттяжка / Накат</span>
              <span className="font-semibold">
                {topSpin > 0 ? `+${topSpin}` : topSpin}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={topSpin}
              onChange={(e) => setTopSpin(Number(e.target.value))}
              className="accent-primary w-full"
            />
          </label>

          <label className="bg-neutral/70 text-neutral-foreground flex flex-col gap-1 rounded-xl p-2.5">
            <div className="flex justify-between">
              <span>Боковой винт</span>
              <span className="font-semibold">
                {sideSpin > 0 ? `+${sideSpin}` : sideSpin}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={sideSpin}
              onChange={(e) => setSideSpin(Number(e.target.value))}
              className="accent-primary w-full"
            />
          </label>

          <label className="bg-neutral/70 text-neutral-foreground flex flex-col gap-1 rounded-xl p-2.5 sm:col-span-2">
            <div className="flex justify-between">
              <span>Массе / Дуговик</span>
              <span className="font-semibold">
                {curve > 0 ? `+${curve}` : curve}
              </span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={curve}
              onChange={(e) => setCurve(Number(e.target.value))}
              className="accent-primary w-full"
            />
          </label>
        </div>
      </div>

      <BilliardSimulator
        slides={[
          {
            label: '1. Штраф: Промах',
            title: 'Штраф за промах мимо всех шаров',
            description:
              'Биток проходит мимо прицельных шаров, ударяется в дальний борт и останавливается, не коснувшись ни одного шара.',
            balls: [
              { id: 'cue', x: 180, y: 260, isCue: true },
              { id: 1, x: 430, y: 120, number: 1 },
              { id: 2, x: 480, y: 320, number: 2 },
            ],
            shots: [
              {
                ballId: 'cue',
                angle: -4,
                power: 10,
              },
            ],
            verdict: {
              type: 'foul',
              title: 'ШТРАФ: Промах по шару',
              subtitle: 'Биток не коснулся ни одного прицельного шара',
            },
          },
          {
            label: '2. Штраф: Без борта',
            title: 'Штраф при отыгрыше (нет касания борта)',
            description:
              'После соударения битка с прицельным шаром ни один шар не упал в лузу и ни один шар не дошел до борта.',
            balls: [
              { id: 'cue', x: 220, y: 210, isCue: true },
              { id: 4, x: 410, y: 210, number: 4 },
            ],
            shots: [
              {
                ballId: 'cue',
                target: { x: 385, y: 196 },
                power: 5,
              },
            ],
            verdict: {
              type: 'foul',
              title: 'ШТРАФ: Недовод до борта',
              subtitle: 'После соударения ни один шар не коснулся борта',
            },
          },
          {
            label: '3. Штраф: Вылет за борт',
            title: 'Штраф за вылет шара за пределы стола',
            description:
              'При чрезмерно сильном ударе шар перелетает через борт за пределы игрового поля.',
            balls: [
              { id: 'cue', x: 260, y: 290, isCue: true },
              { id: 7, x: 480, y: 120, number: 7 },
            ],
            shots: [
              {
                ballId: 'cue',
                angle: -34,
                power: 22,
                jumpOffTable: true,
              },
            ],
            verdict: {
              type: 'foul',
              title: 'ШТРАФ: Вылет шара за борт',
              subtitle: 'Шар покинул пределы игрового стола',
            },
          },
          {
            label: '4. Как надо: Отыгрыш',
            title: 'Правильный отыгрыш к борту',
            description:
              'После касания шара №4 прицельный шар доходит до верхнего борта, а биток уходит к нижнему — правила отыгрыша соблюдены.',
            balls: [
              { id: 'cue', x: 220, y: 210, isCue: true },
              { id: 4, x: 410, y: 210, number: 4 },
            ],
            shots: [
              {
                ballId: 'cue',
                target: { x: 385, y: 224 },
                power: 12,
              },
            ],
            verdict: {
              type: 'valid',
              title: 'ПРАВИЛЬНО: Чистый отыгрыш',
              subtitle: 'Шары коснулись бортов после соударения',
            },
          },
        ]}
      />

      <BilliardSimulator
        slides={[
          {
            label: 'Оттяжка',
            title: '1. Чистая оттяжка (Нижний винт)',
            description:
              'Удар в нижнюю часть битка. Шар №1 точно падает в правую верхнюю лузу, а биток за счет обратного вращения возвращается назад.',
            balls: [
              { id: 'cue', x: 210, y: 210, isCue: true },
              { id: 1, x: 490, y: 135, number: 1 },
            ],
            shots: [
              {
                ballId: 'cue',
                aimAt: { ballId: 1, pocket: 'top-right' },
                power: 17,
                spin: { top: -0.95, side: 0 },
              },
            ],
          },
          {
            label: 'Клапштос (90°)',
            title: '2. Клапштос (Остановка и угол 90°)',
            description:
              'Плотный удар в центр битка без верхнего и нижнего вращения. Шар №5 падает в угол, а биток уходит строго под 90° по касательной.',
            balls: [
              { id: 'cue', x: 200, y: 250, isCue: true },
              { id: 5, x: 470, y: 155, number: 5 },
            ],
            shots: [
              {
                ballId: 'cue',
                aimAt: { ballId: 5, pocket: 'top-right' },
                power: 17,
                spin: { top: 0, side: 0 },
              },
            ],
          },
          {
            label: 'Накат',
            title: '3. Накат по дуге (Верхний винт)',
            description:
              'Шар №3 уходит в угловую лузу, а верхнее вращение захватывает сукно и вытягивает биток вперед по дуге.',
            balls: [
              { id: 'cue', x: 180, y: 260, isCue: true },
              { id: 3, x: 460, y: 155, number: 3 },
            ],
            shots: [
              {
                ballId: 'cue',
                aimAt: { ballId: 3, pocket: 'top-right' },
                power: 16,
                spin: { top: 0.95, side: 0.2 },
              },
            ],
          },
        ]}
      />

      <BilliardSimulator
        title="Работа бокового винта от борта"
        description="Два шара бьются в верхний борт под одинаковым углом, но с противоположным боковым винтом: один уходит круто вправо, второй — почти вертикально вниз."
        pockets={false}
        walls={{ top: true, bottom: true, left: true, right: true }}
        balls={[
          { id: 'left-spin', x: 260, y: 310, isCue: true },
          { id: 'right-spin', x: 420, y: 310, number: 8 },
        ]}
        shots={[
          {
            ballId: 'left-spin',
            angle: -75,
            power: 14,
            spin: { side: -0.95 },
          },
          {
            ballId: 'right-spin',
            angle: -75,
            power: 14,
            spin: { side: 0.95 },
          },
        ]}
      />

      <BilliardSimulator
        title="Массе / Дуговик (Обвод шара-маски)"
        description="Прямую линию перекрывает шар №9. Биток выходит ниже маски, по дуге заворачивает вверх в линию створа и укладывает шар №1 в правую верхнюю лузу."
        balls={[
          { id: 'cue', x: 160, y: 260, isCue: true },
          { id: 9, x: 336, y: 196, number: 9 },
          { id: 1, x: 540, y: 140, number: 1 },
        ]}
        shots={[
          {
            ballId: 'cue',
            aimAt: { ballId: 1, pocket: 'top-right' },
            power: 18,
            spin: { curve: -0.85, top: 0.2, side: -0.7 },
          },
        ]}
      />

      <BilliardSimulator
        title="Открытый фрагмент поля (Без бортов)"
        description="Режим walls='none': борта и лузы отключены, шары свободно вылетают за границу видимости и удаляются из симуляции."
        walls="none"
        pockets={false}
        height={320}
        balls={[
          { id: 'cue', x: 180, y: 160, isCue: true },
          { id: 1, x: 430, y: 160, number: 1 },
          { id: 2, x: 458, y: 143, number: 2 },
          { id: 3, x: 458, y: 177, number: 3 },
        ]}
        shots={[
          {
            ballId: 'cue',
            angle: 0,
            power: 20,
            spin: { top: -0.6 },
          },
        ]}
      />

      <BilliardSimulator
        title="Разбой полной пирамиды (15 шаров)"
        description="Генерация пирамиды через хелпер createPyramidRack и начальный удар с оттяжкой."
        balls={[
          { id: 'cue', x: 175, y: 210, isCue: true },
          ...createPyramidRack({
            apexX: 520,
            apexY: 210,
            rows: 5,
            ballRadius: 14,
          }),
        ]}
        ballRadius={14}
        shots={[
          {
            ballId: 'cue',
            target: { x: 520, y: 204 },
            power: 28,
            spin: { top: -0.35, side: 0.15 },
          },
        ]}
      />
    </div>
  );
}
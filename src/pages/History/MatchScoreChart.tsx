import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { MatchRecord } from '@/shared/store/gameStore';

export default function MatchScoreChart({ match }: { match: MatchRecord }) {
  const data = [
    { step: '0', [match.p1.name]: 0, [match.p2.name]: 0 },
    ...match.events.map((ev, idx) => ({
      step: `${idx + 1}`,
      [match.p1.name]: ev.scoreAfterP1,
      [match.p2.name]: ev.scoreAfterP2,
    })),
  ];

  if (match.events.length === 0) {
    return (
      <p className="py-4 text-center text-xs opacity-50">
        Нет результативных действий в этой партии
      </p>
    );
  }

  return (
    <div className="h-44 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
          <XAxis dataKey="step" tick={{ fontSize: 10 }} opacity={0.5} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} opacity={0.5} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--neutral)',
              color: 'var(--neutral-foreground)',
              borderRadius: '14px',
              border: 'none',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey={match.p1.name}
            stroke="var(--approve)"
            fill="var(--approve)"
            fillOpacity={0.25}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey={match.p2.name}
            stroke="var(--piramid-ball-shadow)"
            fill="var(--piramid-ball-mid)"
            fillOpacity={0.2}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
import { cn } from '@/shared/lib/utils/cn';
import { Link } from 'react-router-dom';

interface LecturesListPageProps {}

const ListElement = ({ title, desc }: { title: string; desc: string }) => {
  return (
    <div
      className={cn(
        'bg-background/80 text-foreground hover:bg-background/90 rounded-lg p-5 text-sm backdrop-blur-lg shadow-2xl',
        'w-full whitespace-nowrap transition-colors active:scale-[0.98]'
      )}
    >
      <p className="text-lg">{title}</p>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
};

const LECTURES_DATA: {
  title: string;
  desc: string;
  to: string;
}[] = [
  {
    title: 'Базовые правила',
    desc: 'То, без чего нельзя начать.',
    to: '/first',
  },
  {
    title: 'Другая очень важная тема',
    desc: 'Про кии и мячики',
    to: '/second',
  },
];

export function LecturesListPage({}: LecturesListPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-125 flex-col gap-3 px-1 py-3">
      {LECTURES_DATA.map((d) => (
        <Link key={d.to} to={'/lectures/' + d.to}>
          <ListElement desc={d.desc} title={d.title} />
        </Link>
      ))}
    </div>
  );
}

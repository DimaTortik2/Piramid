import { BackButton } from '@/shared/BackButton';
import { useLoaderData } from 'react-router-dom';

export function LecturePage() {
  const { MdxComponent } = useLoaderData();
  return (
    <div className="bg-background w-full p-3 pb-12">
      <div className="prose prose-invert marker:text-foreground/30 prose-p:text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-code:text-primary mx-auto max-w-125">
        <BackButton title="Назад" className="mb-3" />
        <MdxComponent />
      </div>
    </div>
  );
}

import { BackButton } from '@/shared/BackButton';
import { useLoaderData } from 'react-router-dom';

export function LecturePage() {
  const { MdxComponent } = useLoaderData();
  return (
    <div className="bg-reader-background w-full p-3 pb-12">
      <div className="prose prose-invert prose-hr:border-reader-accent-foreground marker:text-reader-foreground/30 prose-p:text-reader-muted-foreground prose-headings:text-reader-foreground prose-strong:text-reader-foreground prose-a:text-reader-accent-foreground hover:prose-a:text-reader-accent-foreground/80 prose-code:text-reader-accent-foreground mx-auto max-w-125">
        <BackButton title="Назад" className="mb-3" />
        <MdxComponent />
      </div>
    </div>
  );
}

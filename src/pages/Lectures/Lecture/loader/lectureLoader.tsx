import { getMdxContent } from '@/shared/lib/getMdxContent';
import type { LoaderFunctionArgs } from 'react-router-dom';

export async function lectureLoader({ params }: LoaderFunctionArgs) {
  const slug = params.slug;

  const MdxComponent = await getMdxContent(slug);

  if (!MdxComponent) {
    throw new Response('Лекция не найдена', { status: 404 });
  }

  return { MdxComponent };
}

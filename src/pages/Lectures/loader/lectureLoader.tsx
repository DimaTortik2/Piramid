import { getMdxContent } from '@/shared/lib/getMdxContent';
import {
  DISCIPLINES,
  type DisciplineId,
  useDisciplineStore,
} from '@/shared/store/useDisciplineStore';
import type { LoaderFunctionArgs } from 'react-router-dom';

export async function lectureLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const paramDiscipline = url.searchParams.get('discipline') as DisciplineId | null;

  const store = useDisciplineStore.getState();
  let activeDiscipline: DisciplineId = store.discipline;

  if (
    paramDiscipline &&
    DISCIPLINES.some((d) => d.id === paramDiscipline)
  ) {
    activeDiscipline = paramDiscipline;
    if (store.discipline !== paramDiscipline) {
      store.setDiscipline(paramDiscipline);
    }
  }

  const MdxComponent = await getMdxContent(activeDiscipline);

  if (!MdxComponent) {
    throw new Response('Лекция не найдена', { status: 404 });
  }

  return { MdxComponent, discipline: activeDiscipline };
}
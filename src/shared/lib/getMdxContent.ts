import type { DisciplineId } from '@/shared/store/useDisciplineStore';
import type { ComponentType } from 'react';

const mdxModules = import.meta.glob('../../content/lectures/*.mdx');
const moduleCache = new Map<string, ComponentType>();

export async function getMdxContent(
  discipline: DisciplineId
): Promise<ComponentType | null> {
  const path = `../../content/lectures/${discipline}.mdx`;

  if (moduleCache.has(path)) {
    return moduleCache.get(path)!;
  }

  const loader = mdxModules[path];
  if (!loader) {
    return null;
  }

  const module = (await loader()) as { default: ComponentType };
  moduleCache.set(path, module.default);

  return module.default;
}
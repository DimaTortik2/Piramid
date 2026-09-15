const mdxModules = import.meta.glob('../../content/lectures/*.mdx');

export async function getMdxContent(slug?: string) {
  const path = `../../content/lectures/${slug}.mdx`;

  if (!mdxModules[path]) {
    return null;
  }

  const module = (await mdxModules[path]()) as any;

  return module.default;
}

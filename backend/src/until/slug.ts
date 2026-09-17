function slugify(source: string): string {
  return source
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function uniqueSlug(
  source: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(source) || 'muc';

  if (!(await isTaken(base))) {
    return base;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;

    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error(`Không tạo được slug duy nhất từ "${source}"`);
}
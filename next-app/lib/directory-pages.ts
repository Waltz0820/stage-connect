type PageResult<T> = { data: T[] | null; error: unknown };

// Continue to an empty page: the API can cap results below the requested range.
export async function readDirectoryPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 500;
  for (;;) {
    const { data, error } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) throw error;
    if (!data?.length) return rows;
    rows.push(...data);
  }
}

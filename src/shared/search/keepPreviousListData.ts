/** Keep a list visible while its criteria change, never across business scopes. */
export function keepPreviousListData(scope: readonly (string | number | boolean)[]) {
  return <T>(previous: T | undefined, query: { queryKey: readonly unknown[] } | undefined): T | undefined =>
    query && scope.every((value, index) => query.queryKey[index] === value) ? previous : undefined
}

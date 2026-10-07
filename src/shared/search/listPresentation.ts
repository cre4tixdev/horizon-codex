const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true })
export type ResultGroup<T> = { key: string; label: string; items: T[]; total: number }

export function sortResults<T>(items: readonly T[], sort: string, value: (item: T, field: string) => string): T[] {
  const [field = 'name', direction] = sort.split(':')
  return [...items].sort((left, right) => collator.compare(value(left, field), value(right, field)) * (direction === 'desc' ? -1 : 1))
}

export function groupResults<T>(items: readonly T[], identify: (item: T) => { key: string; label: string }): ResultGroup<T>[] {
  const groups = new Map<string, ResultGroup<T>>()
  for (const item of items) {
    const { key, label } = identify(item)
    const group = groups.get(key) || { key, label, items: [], total: 0 }
    group.items.push(item); group.total++; groups.set(key, group)
  }
  return [...groups.values()].sort((left, right) => collator.compare(left.label, right.label))
}

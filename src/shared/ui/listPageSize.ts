export type ListSizeMode = 'list' | 'cards'
export function automaticPageSize({ height, top, rowHeight, columns = 1, gap = 0, mode = 'list' }: { height: number; top: number; rowHeight: number; columns?: number; gap?: number; mode?: ListSizeMode }): number {
  const count = Math.max(1, Math.floor(columns)), row = Math.max(1, rowHeight), space = Math.max(0, height - top - 24)
  const rows = Math.max(mode === 'list' ? 5 : 1, Math.floor((space + gap) / (row + gap)))
  return Math.min(100, rows * count)
}
export function selectedPageSize(value: string | null): number | undefined {
  return ['25', '50', '100'].includes(value || '') ? Number(value) : undefined
}

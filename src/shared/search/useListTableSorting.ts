import { useSearchParams } from 'react-router'

export type ListTableSorting = { value: string; fields: Record<string, string>; onChange: (value: string) => void; encoding: 'prefix' | 'colon' }

/** Keeps header sorting and the search panel on the same URL criterion. */
export function useListTableSorting(defaultValue: string, fields: Record<string, string>, encoding: 'prefix' | 'colon' = 'prefix'): ListTableSorting {
  const [params, setParams] = useSearchParams()
  return { value: params.get('sort') || defaultValue, fields, encoding, onChange: (value) => setParams((current) => {
    const next = new URLSearchParams(current)
    if (value === defaultValue) next.delete('sort'); else next.set('sort', value)
    next.delete('page')
    return next
  }) }
}

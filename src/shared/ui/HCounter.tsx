import { useDisplayPreferences } from '../../core/preferences/displayPreferencesContext'
import { highlightCounter } from '../../core/preferences/displayPreferences'

/** Personal display only: the business count and the action remain unchanged. */
export function HCounter({ count, as: Tag = 'small', className = '', highlight = false }: { count: number | undefined; as?: 'small' | 'strong'; className?: string; highlight?: boolean }) {
  const { preference, pending } = useDisplayPreferences()
  if (pending || !preference.showCounters) return null
  return <Tag className={`h-counter ${className}`} data-highlight={highlight ? highlightCounter(count, preference) : undefined}>{count === undefined ? '—' : count.toLocaleString('fr-FR')}</Tag>
}

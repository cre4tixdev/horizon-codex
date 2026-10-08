import { cn } from '../lib/cn'

/** Pas de texte visible ; l’anneau n’apparaît que si le chargement se prolonge. */
export function HLoadingIndicator({ label = 'Chargement…', inline = false }: { label?: string; inline?: boolean }) {
  return <div className={cn('h-loading', inline && 'h-loading--inline')} role="status" aria-label={label}><span className="h-loading-ring" aria-hidden="true" /></div>
}

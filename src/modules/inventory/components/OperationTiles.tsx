import { Link } from 'react-router'
import { ArrowUpRight, Plus } from 'lucide-react'
import '../../../shared/dashboard.css'
import { OperationForecast } from './OperationForecast'
import type { OperationForecast as Forecast } from '../schemas/operations'
import { operationTiles } from '../operationPresentation'
import { HButton } from '../../../shared/ui/HButton'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import type { z } from 'zod'
import type { operationsPageSchema } from '../schemas/operations'

export function OperationTiles({ summary, forecast, canCreate, context = '' }: { forecast?: Forecast | null | undefined; summary: z.infer<typeof operationsPageSchema>['summary'] | undefined; canCreate: boolean; context?: string }) {
  function tile({ key, tone, kind, label, description, icon: Icon, variant }: typeof operationTiles[number]) {
    const filters = new URLSearchParams(context)
    filters.set('kind', kind); filters.delete('page'); filters.set('view', 'list')
    if (variant) filters.set('variant', variant); else filters.delete('variant')
    const pending = new URLSearchParams(filters); pending.set('status', 'open')
    return <article className="stock-operation-tile h-dashboard-card h-tone" data-tone={tone} data-operation={key} key={key}>
      <Link className="stock-tile-heading" to={`/inventory/operations?${filters}`}><span className="stock-tile-icon h-dashboard-icon"><Icon size={28} strokeWidth={1.6} /></span><span className="stock-tile-copy"><h2>{label}</h2><span>{description}</span></span><ArrowUpRight size={14} className="stock-tile-arrow" /></Link>
      <OperationForecast forecast={forecast} seriesKey={key} label={label} />
      <footer><Link className="stock-tile-pending" to={`/inventory/operations?${pending}`} aria-label={`${label} : pièces en cours`}><strong>{summary?.[key] ?? '—'}</strong><span>à traiter</span></Link>{canCreate ? <HButton size="small" asChild><Link to={`/inventory/operations/new?kind=${kind}${variant ? `&variant=${variant}` : ''}`}><Plus size={14} />Créer</Link></HButton> : <HButton variant="ghost" size="small" asChild><Link to={`/inventory/operations?${filters}`}>Consulter</Link></HButton>}</footer>
    </article>
  }
  return <section className="stock-operation-catalog" aria-label="Types d’opérations">
    <div className="stock-operation-tiles">{operationTiles.slice(0, 4).map(tile)}</div>
    <HSectionHeading title="Retours et opérations spécifiques" />
    <div className="stock-operation-tiles stock-operation-tiles--secondary">{operationTiles.slice(4).map(tile)}</div>
  </section>
}

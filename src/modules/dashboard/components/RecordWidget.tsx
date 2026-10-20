import { WidgetRecordsView } from './WidgetRecordsView'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ArrowUpRight, Database } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { hasPermission, type HorizonUser } from '../../../core/auth/types/session'
import { sources, type WidgetDataSpec } from '../schemas/widgetData'
import { loadWidgetRecords, widgetRecordHref, widgetRange, type WidgetRange } from '../services/widgetRecords'
type Props = { data: WidgetDataSpec; range: WidgetRange; user: HorizonUser | undefined; embedded?: boolean }
export function RecordWidget(props: Props) {
  const data = useDebouncedValue(props.data, 250), range = widgetRange(data.period, props.range)
  return <RecordsContent key={JSON.stringify([data, range?.start, range?.end])} {...props} data={data} />
}
function RecordsContent({ data, range, user, embedded = false }: Props) {
  const [page, setPage] = useState(1)
  const allowed = Boolean(user && hasPermission(user, data.source === 'opportunities' ? 'crm.read' : data.source === 'invoices' ? 'billing.read' : 'sales.read'))
  const selectedRange = widgetRange(data.period, range), title = data.title || sources[data.source]
  const query = useQuery({ queryKey: ['dashboard', 'records', user?.id, data, selectedRange?.start, selectedRange?.end, page], queryFn: () => loadWidgetRecords(data, user!.id, range, page), enabled: allowed, retry: false, staleTime: 60_000, refetchOnMount: 'always' })
  if (allowed && query.data) return <WidgetRecordsView data={data} items={query.data.items} totalItems={query.data.totalItems} totalPages={query.data.totalPages} page={page} busy={query.isFetching} period={selectedRange?.label || 'Toutes périodes'} href={widgetRecordHref(data, user!.id, range)} embedded={embedded} onPage={setPage} notice={query.error && <p role="alert" className="field-error">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>} />
  return <section className={`panel h-dashboard-card h-tone dashboard-record-widget${embedded ? ' dashboard-record-widget--embedded' : ''}`} data-tone="navy" aria-label={title}>
    <div className="panel-heading"><h2><Database size={17} />{title}</h2>{allowed && <Link className="panel-icon-link" aria-label={`Tout voir : ${title}`} to={widgetRecordHref(data, user!.id, range)}><ArrowUpRight size={16} /></Link>}</div>
    <div className="dashboard-widget-body">{!allowed ? <HEmptyState icon={Database} title="Accès non autorisé" description="Ce widget respecte vos droits métier." /> : query.error ? <p role="alert" className="field-error">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p> : <HLoadingIndicator label={`Chargement : ${title}`} />}</div>
  </section>
}

import { normalizeSalesFilters } from '../searchFilters'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { FilePenLine, FileText, Mail, ShoppingBag } from 'lucide-react'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { quoteStatusTones } from '../schemas/quotes'
import { salesService } from '../services/SalesService'

export function QuoteSummary() {
  const [params] = useSearchParams()
  const selected = normalizeSalesFilters(params)
  const context = { state: selected.get('state') || 'active', q: params.get('q') || '', opportunity: params.get('opportunity') || '', company: params.get('company') || '' }
  const summary = useQuery({ queryKey: ['sales', 'quotes', 'summary', context], queryFn: () => salesService.summary(context), retry: false })
  const metrics = [
    { key: 'draft', label: 'Brouillon', icon: FilePenLine },
    { key: 'validated', label: 'Devis', icon: FileText },
    { key: 'sent', label: 'Envoyé', icon: Mail },
    { key: 'accepted', label: 'Commandes clients', icon: ShoppingBag },
  ] as const
  return <HSummaryCards label="Synthèse des ventes" items={metrics.map(({ key, label, icon }) => {
    const next = normalizeSalesFilters(params); next.set('kind', key === 'accepted' ? 'order' : 'quote'); if (key === 'accepted') next.delete('status'); else next.set('status', key); next.delete('order_status'); next.delete('page')
    return { label, icon, tone: quoteStatusTones[key], count: summary.data?.[key], detail: context.state === 'archived' ? 'Archivés' : 'Non archivés', accessibleLabel: `Filtrer les devis : ${label}`, href: `/sales/quotes?${next}` }
  })} error={summary.error ? summary.error.message : undefined} onRetry={() => { void summary.refetch() }} />
}

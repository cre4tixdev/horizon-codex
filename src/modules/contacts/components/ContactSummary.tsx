import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { Building2, UsersRound, Handshake, Truck } from 'lucide-react'
import { contactsService } from '../services/ContactsService'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'

export function ContactSummary() {
  const [params] = useSearchParams()
  const view = params.get('view') === 'list' ? 'list' : 'cards'
  const summary = useQuery({ queryKey: ['contacts', 'summary'], queryFn: () => contactsService.summary(), retry: false })
  const metrics = [{ key: 'customers', label: 'Clients', icon: Handshake }, { key: 'suppliers', label: 'Fournisseurs', icon: Truck }, { key: 'companies', label: 'Sociétés', icon: Building2 }, { key: 'people', label: 'Personnes', icon: UsersRound }] as const
  const tones = { customers: 'violet', suppliers: 'amber', companies: 'blue', people: 'rose' } as const
  return <HSummaryCards label="Synthèse du répertoire" items={metrics.map(({ key, label, icon }) => ({ label, icon, tone: tones[key], count: summary.data?.[key], detail: 'Actifs', accessibleLabel: `${label} actifs`, href: `${key === 'people' ? '/contacts/people' : '/contacts'}?view=${view}${key === 'customers' ? '&role=customer' : key === 'suppliers' ? '&role=supplier' : ''}` }))} error={summary.error ? 'Synthèse indisponible.' : undefined} onRetry={() => { void summary.refetch() }} />
}

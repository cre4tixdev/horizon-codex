import { CalendarDays, Clock3, CircleCheck, TimerReset } from 'lucide-react'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { displayDays, type LeaveBalance, type LeaveChoices } from '../schemas/leave'
export function LeaveBalances({ balances, choices, year, href = '/leave' }: { balances: LeaveBalance[]; choices: LeaveChoices; year: string; href?: string }) {
  const find = (code: string) => balances.find((b) => b.type === choices.types.find((t) => t.code === code)?.id)
  const paid = find('paid'), recovery = find('recovery'), typeLink = (type: string) => `${href}?year=${year}&type=${type}`
  return <HSummaryCards label="Soldes des congés" error={undefined} onRetry={() => undefined} items={[
    { label: 'Congés payés disponibles', icon: CalendarDays, tone: 'rose', count: undefined, value: paid ? displayDays(paid.available) : '—', detail: paid ? `${displayDays(paid.allocated)} alloués · ${displayDays(paid.used)} validés` : 'Aucune donnée disponible', href: typeLink('paid') },
    { label: 'Récupération disponible', icon: TimerReset, tone: 'violet', count: undefined, value: recovery ? displayDays(recovery.available) : '—', detail: recovery ? `${displayDays(recovery.allocated)} alloués · ${displayDays(recovery.used)} validés` : 'Aucune donnée disponible', href: typeLink('recovery') },
    { label: 'Jours réservés', icon: Clock3, tone: 'amber', count: undefined, value: balances.length ? displayDays(balances.reduce((n, b) => n + b.pending, 0)) : '—', detail: 'CP et récupération en attente de validation', href: `${href}?year=${year}&status=submitted` },
    { label: 'Jours validés', icon: CircleCheck, tone: 'green', count: undefined, value: balances.length ? displayDays(balances.reduce((n, b) => n + b.used, 0)) : '—', detail: 'CP et récupération · annulations en attente incluses', href: `${href}?year=${year}&status=approved,cancel_requested` },
  ]} />
}

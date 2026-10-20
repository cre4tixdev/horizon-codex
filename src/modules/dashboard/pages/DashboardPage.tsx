import { useState, useSyncExternalStore } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { dashboardPeriodRange, parisToday, type DashboardPeriod } from '../services/dashboardPeriod'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { DashboardFeeds } from '../components/DashboardFeeds'
import { IndicatorWidget } from '../components/IndicatorWidget'
import { RecordWidget } from '../components/RecordWidget'
import { ShortcutWidget, TimeWidget, LeaveWidget, ApprovalWidget } from '../components/WorkspaceWidgets'
import { BusinessCarousel } from '../components/BusinessCarousel'
import { DashboardWorkspace } from '../components/DashboardWorkspace'
import '../../../shared/dashboard.css'

export function DashboardPage() {
  const [{ period, anchor }, setSelection] = useState<{ period: DashboardPeriod; anchor: string }>(() => ({ period: 'month', anchor: parisToday() }))
  const range = dashboardPeriodRange(period, anchor)
  const setPeriod = (value: DashboardPeriod, date = anchor) => setSelection({ period: value, anchor: date })
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const can = (permission: string) => Boolean(user && hasPermission(user, permission))
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date())

  return <div className="horizon-dashboard">
    <HPageHeader title="Dashboard" titleAccessory={<span className="dashboard-date"><CalendarDays size={15} aria-hidden="true" />{date}</span>} actionsPlacement="inline" actions={<div className="dashboard-period-toolbar">
      <div className="dashboard-period-controls">
      <div className="contact-view-switch" role="group" aria-label="Période des indicateurs et du pilotage">{([{ value: 'month', label: 'Mois' }, { value: 'quarter', label: 'Trimestre' }, { value: 'year', label: 'Année' }] as const).map(({ value, label }) => <HButton key={value} size="small" variant="ghost" aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</HButton>)}</div>
      <div className="dashboard-period-navigation" role="group" aria-label="Navigation temporelle">
        <HButton size="icon" variant="ghost" aria-label="Période précédente" title="Période précédente" onClick={() => setPeriod(period, range.previous)}><ChevronLeft size={15} /></HButton>
        <span aria-live="polite" title={range.description}>{range.label}</span>
        <HButton size="icon" variant="ghost" aria-label="Période suivante" title="Période suivante" onClick={() => setPeriod(period, range.next)}><ChevronRight size={15} /></HButton>
      </div>
      </div>
    </div>} />
    <p className="dashboard-period-caption">Indicateurs et pilotage · {range.description}</p>
    <DashboardWorkspace key={user?.id || 'anonymous'} userId={user?.id || ''} renderWidget={(widget, editing, dashboardId) => {
      if (widget.type === 'business') return <BusinessCarousel key={`${dashboardId}:${widget.id}`} instanceId={`${dashboardId}.${widget.id}`} config={widget.config} range={range} user={user} editing={editing} />
      if (widget.type === 'records') return <RecordWidget data={{ ...widget.config.data, title: widget.config.title || widget.config.data.title }} range={range} user={user} />
      if (widget.type === 'shortcuts') return <ShortcutWidget widget={widget} user={user} />
      if (widget.type === 'time') return <TimeWidget widget={widget} range={range} user={user} />
      if (widget.type === 'leave') return <LeaveWidget widget={widget} range={range} user={user} />
      if (widget.type === 'approvals') return <ApprovalWidget widget={widget} user={user} />
      if (widget.type === 'planning' || widget.type === 'activity') return <DashboardFeeds title={widget.config.title} kind={widget.type} userId={user?.id || ''} canCalendar={can('crm.read') || can('calendar.read')} canActivity={['documents.read', 'contacts.read', 'crm.read', 'sales.read', 'inventory.read', 'purchasing.read', 'billing.read', 'expenses.read', 'leave.read'].some(can)} />
      return <IndicatorWidget widget={widget} range={range} user={user} />
    }} />
  </div>
}

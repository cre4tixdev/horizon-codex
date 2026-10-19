import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, UsersRound, Building2 } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HViewSwitch } from '../../../shared/ui/HViewSwitch'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmployeeAvatar } from '../../../shared/ui/HEmployeeAvatar'
import { HResourceTimeline } from '../../../shared/ui/HResourceTimeline'
import { shiftDate, timelinePeriod, timelinePosition, timelineColor } from '../../../shared/calendar/timeline'
import { keepPreviousListData } from '../../../shared/search/keepPreviousListData'
import { LeaveCalendarDetail } from './LeaveCalendarDetail'
import { displayDate, displayDays, type LeaveCalendarItem } from '../schemas/leave'
import { leaveService } from '../services/LeaveService'
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function LeaveCalendar() {
  const trigger = useRef<HTMLButtonElement | null>(null)
  const [selected, setSelected] = useState<LeaveCalendarItem>()
  const [params, setParams] = useSearchParams(), today = iso(new Date()), raw = params.get('date') || (params.get('month') ? `${params.get('month')}-01` : today)
  const date = /^(20\d{2}|21\d{2}|2200)-\d{2}-\d{2}$/.test(raw) && Number.isFinite(Date.parse(raw)) && new Date(raw).toISOString().slice(0, 10) === raw ? raw : today, view = params.get('view') === 'week' ? 'week' : 'month'
  const { first, last } = timelinePeriod(date, view), scope = params.get('scope') || '', search = params.get('q') || '', page = params.get('page') || '1'
  const data = useQuery({ queryKey: ['leave', 'calendar', first, last, scope, search, page], queryFn: () => leaveService.calendar({ from: first, to: last, ...(scope ? { scope } : {}), q: search, page }), retry: false, refetchInterval: 30_000, placeholderData: keepPreviousListData(['leave', 'calendar', first, last, scope]) })
  const update = (values: Record<string, string>) => setParams((current) => { const next = new URLSearchParams(current); next.delete('page'); next.delete('month'); for (const [key, value] of Object.entries(values)) next.set(key, value); return next })
  const move = (direction: number) => { const current = new Date(`${first}T12:00:00Z`); update({ date: view === 'week' ? shiftDate(first, direction * 7) : new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + direction, 1)).toISOString().slice(0, 10) }) }
  const result = data.data
  return <section className="business-calendar leave-calendar" aria-label="Calendrier des congés" aria-busy={data.isFetching}><div className="calendar-navigation"><div className="calendar-toolbar"><div><HButton size="icon" aria-label="Période précédente" onClick={() => move(-1)}><ChevronLeft size={14} /></HButton><HInput type={view === 'month' ? 'month' : 'date'} aria-label="Période du calendrier des congés" value={view === 'month' ? date.slice(0, 7) : date} onChange={(event) => { if (event.target.value) update({ date: view === 'month' ? `${event.target.value}-01` : event.target.value }) }} /><HButton size="icon" aria-label="Période suivante" onClick={() => move(1)}><ChevronRight size={14} /></HButton><HButton onClick={() => update({ date: today })}>Aujourd’hui</HButton></div><HViewSwitch label="Période des congés" value={view} items={[{ value: 'week', label: 'Semaine', icon: CalendarRange }, { value: 'month', label: 'Mois', icon: CalendarDays }]} onChange={(value) => update({ view: value, date })} />{result?.can_company && <HViewSwitch label="Périmètre des congés" value={result.scope} items={[{ value: 'team', label: 'Mon équipe', icon: UsersRound, disabled: !result.has_team }, { value: 'company', label: 'Entreprise', icon: Building2 }]} onChange={(value) => update({ scope: value, date })} />}</div><div className="calendar-legend"><span className="leave-state-key"><span className="leave-state-sample" />Validé</span><span className="leave-state-key"><span className="leave-state-sample" data-tentative />En attente</span><span className="contact-muted">Dates et disponibilités · motifs confidentiels</span></div></div>
    {data.isPending && <HLoadingIndicator label="Chargement des absences" />}{data.error && <p role="alert" className="field-error">{data.error.message}<HButton onClick={() => void data.refetch()}>Réessayer</HButton></p>}
    {result && <><HListPagination placement="inline" label="Pagination du calendrier des congés" page={result.page} totalPages={result.totalPages} busy={data.isFetching} onPageChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(value)); return next })} />{result.employees.length ? <HResourceTimeline label="Absences par collaborateur" today={today} days={result.days} rows={result.employees} rowKey={(row) => row.id} identity={(row) => <span className="h-resource-timeline-identity" title={row.name}><HEmployeeAvatar name={row.name} queryKey={['leave', 'photo', row.id, row.photo_revision]} hasPhoto={row.has_photo} load={() => leaveService.photo(row.id)} /><span className="h-data-table-record-name">{row.name}</span></span>} bars={(row) => result.items.filter((item) => item.employee === row.id).flatMap((item, index) => {
      const position = timelinePosition(first, result.days.length, item.start_date, item.end_date, item.start_half, item.end_half)
      if (!position) return []
      const state = item.status === 'cancel_requested' ? 'Annulation demandée' : item.pending ? 'En attente' : 'Validé', range = `${displayDate(item.start_date)} ${item.start_half === 'pm' ? 'après-midi' : 'matin'} au ${displayDate(item.end_date)} ${item.end_half === 'am' ? 'matin' : 'après-midi'}`
      return [{ key: item.id || `${row.id}:${index}`, label: `${row.name} · ${item.type_label || 'Absence'} · ${displayDays(item.duration)}`, title: `${row.name} · ${item.type_label || 'Absence'} · ${range} · ${displayDays(item.duration)} · ${state}`, tone: 'blue' as const, color: timelineColor(row.id), tentative: item.pending || item.status === 'cancel_requested', position, href: '', onClick: (event) => { trigger.current = event.currentTarget; setSelected(item) } }]
    })} total={(index) => { const day = result.days[index]!, count = day.absent + day.pending; return <div className="h-resource-timeline-count" title={`${day.date} · ${day.absent} validé(s), ${day.pending} en attente · équivalents journée`}><span>{count ? new Intl.NumberFormat('fr-FR').format(count) : ''}</span></div> }} /> : <p className="calendar-empty">Aucun congé sur cette période.</p>}<p className="contact-muted">{result.totalItems} collaborateur(s) en congé · {result.scope === 'company' ? 'Entreprise' : 'Mon équipe'} · total quotidien en équivalents journée, en attente incluses{result.totalPages > 1 ? ' · total sur toutes les pages' : ''}.</p></>}
    {selected && <LeaveCalendarDetail item={selected} backQuery={params.toString()} onClose={() => setSelected(undefined)} onCloseFocus={() => { if (trigger.current?.isConnected) trigger.current.focus() }} />}
  </section>
}

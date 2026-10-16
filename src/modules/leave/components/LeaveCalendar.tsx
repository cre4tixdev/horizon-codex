import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { leaveService } from '../services/LeaveService'
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function LeaveCalendar() {
  const [params, setParams] = useSearchParams(), raw = params.get('month') || '', today = new Date(), month = /^(?:20\d{2}|21\d{2}|2200)-(0[1-9]|1[0-2])$/.test(raw) ? new Date(raw + '-01T12:00:00') : new Date(today.getFullYear(), today.getMonth(), 1, 12)
  const first = iso(month), last = iso(new Date(month.getFullYear(), month.getMonth() + 1, 0, 12)), days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(), offset = (month.getDay() + 6) % 7
  const data = useQuery({ queryKey: ['leave', 'calendar', first, params.get('q')], queryFn: () => leaveService.calendar({ from: first, to: last, q: params.get('q') || '' }), retry: false, refetchInterval: 30_000 })
  const move = (delta: number) => setParams((current) => { const next = new URLSearchParams(current); next.set('month', iso(new Date(month.getFullYear(), month.getMonth() + delta, 1, 12)).slice(0, 7)); return next })
  return <section className="business-calendar" aria-label="Calendrier des congés"><div className="calendar-navigation"><div className="calendar-toolbar"><div><HButton size="icon" aria-label="Mois précédent" onClick={() => move(-1)}><ChevronLeft size={14} /></HButton><strong>{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong><HButton size="icon" aria-label="Mois suivant" onClick={() => move(1)}><ChevronRight size={14} /></HButton><HButton onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.delete('month'); return next })}>Aujourd’hui</HButton></div></div><div className="calendar-legend"><span className="h-tone" data-tone="amber">En attente</span><span className="h-tone" data-tone="green">Validé</span><span className="contact-muted">Indisponibilités uniquement · motifs confidentiels</span></div></div>
    {data.isPending && <HLoadingIndicator label="Chargement des absences" />}{data.error && <p role="alert" className="field-error">{data.error.message}<HButton onClick={() => void data.refetch()}>Réessayer</HButton></p>}
    <div className="calendar-months" data-period="month"><div className="calendar-month"><div className="calendar-grid">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => <span key={d} className="calendar-weekday">{d}</span>)}{Array.from({ length: offset }, (_, i) => <div className="calendar-day calendar-day--empty" key={`empty-${i}`} />)}{Array.from({ length: days }, (_, i) => {
      const date = `${first.slice(0, 8)}${String(i + 1).padStart(2, '0')}`
      return <div key={date} className="calendar-day" data-today={date === iso(today)}><time dateTime={date}>{i + 1}</time>{data.data?.items.filter((r) => r.start_date <= date && r.end_date >= date).map((r, index) => {
        const label = `${r.employee_name}${date === r.start_date && r.start_half === 'pm' ? ' · après-midi' : date === r.end_date && r.end_half === 'am' ? ' · matin' : ''}`, className = 'calendar-event h-tone', tone = r.pending ? 'amber' : 'green', title = `${label} · ${r.pending ? 'En attente' : 'Validé'}`
        return r.href ? <Link key={r.id} to={r.href} className={className} data-tone={tone} title={title}>{label}</Link> : <span key={index} className={className} data-tone={tone} title={title}>{label}</span>
      })}</div>
    })}{Array.from({ length: (7 - (offset + days) % 7) % 7 }, (_, i) => <div className="calendar-day calendar-day--empty" key={`tail-${i}`} />)}</div></div></div>{data.data && !data.data.items.length && <p className="calendar-empty"><CalendarDays size={16} />Aucune absence sur cette période.</p>}
  </section>
}

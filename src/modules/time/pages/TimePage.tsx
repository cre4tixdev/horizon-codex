import { useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Clock3, UserRound, UsersRound, History } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HInput } from '../../../shared/ui/HInput'
import { HButton } from '../../../shared/ui/HButton'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { useTimeAccess, useTimeChoices } from '../hooks/useTime'
import { timeService } from '../services/TimeService'
import { TimeWeek } from '../components/TimeWeek'
import { TimeOverview } from '../components/TimeOverview'
import { addDays, civilToday, dateLabel, monday, type TimeSheet } from '../schemas/time'
import '../time.css'
export function TimePage() {
  const access = useTimeAccess(), choices = useTimeChoices(access.canRead), [params, setParams] = useSearchParams(), client = useQueryClient()
  const personal = Boolean(choices.data?.tracks_time || choices.data?.has_history)
  const area = params.get('area') === 'review' || !params.get('area') && !choices.data?.tracks_time && choices.data?.can_review ? 'review' : 'own'
  const view = params.get('view') === 'year' ? 'year' : params.get('view') === 'week' || !params.get('view') && params.has('date') && area === 'own' ? 'week' : 'month'
  const raw = view === 'month' && params.get('month') ? params.get('month') + '-01' : params.get('date') || civilToday()
  const date = /^20\d{2}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw)) ? raw : civilToday(), start = monday(date)
  const sheetKey = ['time', 'week', start], sheet = useQuery({ queryKey: sheetKey, queryFn: () => timeService.week(start), enabled: access.canRead && Boolean(choices.data?.employee) && personal && view === 'week' && area === 'own', retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false })
  const change = (values: Record<string, string>) => setParams((current) => { const next = new URLSearchParams(current); next.set('area', area); Object.entries(values).forEach(([key, value]) => next.set(key, value)); next.delete('page'); return next })
  const move = (direction: number) => { const next = view === 'week' ? addDays(start, direction * 7) : new Date(Date.UTC(Number(date.slice(0, 4)) + (view === 'year' ? direction : 0), view === 'year' ? 0 : Number(date.slice(5, 7)) - 1 + direction, 1)).toISOString().slice(0, 10); change({ date: next, month: next.slice(0, 7) }) }
  const saved = (r: TimeSheet) => client.setQueryData(sheetKey, r)
  if (!access.canRead) return <HEmptyState icon={Clock3} title="TimeReport" description="Vous ne disposez pas de l’accès aux feuilles de temps." />
  return <div className="contact-directory time-page"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'TimeReport' }]} /><HPageHeader title="TimeReport" />
    {choices.isPending && <HLoadingIndicator label="Chargement des accès TimeReport" />}
    {choices.error && <p className="field-error" role="alert">{choices.error.message}<HButton onClick={() => void choices.refetch()}>Réessayer</HButton></p>}
    {choices.data && <>
      {!personal && !choices.data.can_review ? <HEmptyState icon={Clock3} title="Saisie des heures non activée" description={choices.data.entry_reason} /> : <>
        <HRecordTabs label="Vues TimeReport" idPrefix="time-area" value={area} onChange={(value) => change({ area: value, status: '', view: 'month' })} items={[
          ...(personal ? [{ value: 'own', label: choices.data.tracks_time ? 'Mes temps' : 'Historique', icon: choices.data.tracks_time ? UserRound : History, panel: 'time-main-panel' }] : []),
          ...(choices.data.can_review ? [{ value: 'review', label: 'Équipe', icon: UsersRound, panel: 'time-main-panel' }] : []),
        ]} actions={<div className="time-period-actions"><div className="view-toggle" role="group" aria-label="Période du suivi">{(['week', 'month', 'year'] as const).map((value) => <HButton key={value} variant={view === value ? 'primary' : 'ghost'} onClick={() => change({ view: value, date, month: date.slice(0, 7) })}>{({ week: 'Semaine', month: 'Mois', year: 'Année' })[value]}</HButton>)}</div><HButton size="icon" aria-label="Période précédente" onClick={() => move(-1)}><ChevronLeft size={14} /></HButton>{view === 'year' ? <HInput type="number" min={2000} max={2099} aria-label="Année des temps" value={date.slice(0, 4)} onChange={(e) => { if (/^20\d{2}$/.test(e.target.value)) change({ date: e.target.value + '-01-01', month: e.target.value + '-01' }) }} /> : <HInput type={view === 'week' ? 'date' : 'month'} aria-label={view === 'week' ? 'Semaine du' : 'Mois des feuilles'} value={view === 'week' ? date : date.slice(0, 7)} onChange={(e) => { if (e.target.value) change({ date: view === 'week' ? e.target.value : e.target.value + '-01', month: e.target.value.slice(0, 7) }) }} />}<HButton size="icon" aria-label="Période suivante" onClick={() => move(1)}><ChevronRight size={14} /></HButton><HButton onClick={() => change({ date: civilToday(), month: civilToday().slice(0, 7) })}>Aujourd’hui</HButton></div>} />
        <section id="time-main-panel" role="tabpanel" aria-labelledby={`time-area-${area}`}>
          {area === 'own' && !personal ? <HEmptyState icon={Clock3} title="Saisie des heures non activée" description={choices.data.entry_reason} /> : area === 'own' && view === 'week' ? <>
            {sheet.isPending && <HLoadingIndicator label="Chargement de la semaine" />}{sheet.error && <p role="alert" className="field-error">{sheet.error.message}<HButton onClick={() => void sheet.refetch()}>Recharger la semaine</HButton></p>}
            {sheet.data && !choices.data.can_enter && !sheet.data.id ? <HEmptyState icon={Clock3} title="Saisie des heures" description={choices.data.entry_reason} /> : sheet.data && <><HSectionHeading title={`Semaine du ${dateLabel(start)} au ${dateLabel(addDays(start, 6))}`} /><TimeWeek key={`${sheet.data.id}:${sheet.data.revision}:${start}`} sheet={sheet.data} choices={choices.data} onSaved={saved} onReload={() => { void sheet.refetch() }} /></>}
          </> : <TimeOverview area={area} view={view} date={date} history={area === 'own' && !choices.data.tracks_time} />}
        </section>
      </>}
    </>}
  </div>
}

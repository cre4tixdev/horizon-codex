import { useParams, useLocation } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3 } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HButton } from '../../../shared/ui/HButton'
import { useTimeAccess, useTimeChoices } from '../hooks/useTime'
import { timeService } from '../services/TimeService'
import { TimeWeek } from '../components/TimeWeek'
import { dateLabel } from '../schemas/time'
import '../time.css'
export function TimeSheetPage() {
  const { id = '' } = useParams(), location = useLocation(), access = useTimeAccess(), choices = useTimeChoices(access.canRead), client = useQueryClient(), key = ['time', 'record', id]
  const query = useQuery({ queryKey: key, queryFn: () => timeService.record(id), enabled: access.canRead, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false })
  if (!access.canRead) return <HEmptyState icon={Clock3} title="Feuille de temps" description="Accès TimeReport nécessaire." />
  return <div className="contact-directory time-page"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'TimeReport', href: `/time-reporting${typeof location.state?.timeListQuery === 'string' ? '?' + location.state.timeListQuery : ''}` }, { label: query.data ? `Semaine du ${dateLabel(query.data.week_start)}` : 'Feuille' }]} /><HPageHeader title={query.data ? `Temps BE · ${query.data.employee_name}` : 'Feuille de temps'} />{(query.error || choices.error) && <p className="field-error" role="alert">{query.error?.message || choices.error?.message}<HButton onClick={() => { void query.refetch(); void choices.refetch() }}>Réessayer</HButton></p>}{(query.isPending || choices.isPending) && <HLoadingIndicator label="Chargement de la feuille" />}{query.data && choices.data && <TimeWeek key={`${id}:${query.data.revision}`} sheet={query.data} choices={choices.data} onSaved={(r) => { client.setQueryData(key, r) }} onReload={() => { void query.refetch() }} />}</div>
}

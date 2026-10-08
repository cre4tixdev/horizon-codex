import { useSearchParams } from 'react-router'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { BusinessCalendar } from '../components/BusinessCalendar'
export function CalendarPage() {
  const [params] = useSearchParams()
  return <><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Calendrier' }]} /><HPageHeader title="Calendrier" description="Les événements et échéances de vos dossiers accessibles." /><BusinessCalendar search={params.get('q') || ''} archived={params.get('state') === 'archived'} status={params.get('status') || ''} /></>
}

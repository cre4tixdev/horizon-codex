import { useQueryClient } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HButton } from '../../../shared/ui/HButton'
import { useLeaveAccess, useLeaveChoices } from '../hooks/useLeave'
import { LeaveSettings } from '../components/LeaveSettings'
import '../leave.css'

export function LeaveSettingsPage() {
  const access = useLeaveAccess(), choices = useLeaveChoices(access.canRead), client = useQueryClient()
  if (!access.canRead) return <HEmptyState icon={CalendarDays} title="Congés" description="Vous ne disposez pas des droits de paramétrage des congés." />
  if (choices.error) return <p role="alert" className="field-error">{choices.error.message}<HButton onClick={() => void choices.refetch()}>Réessayer</HButton></p>
  if (!choices.data) return <HLoadingIndicator label="Chargement des paramètres Congés" />
  if (!choices.data.can_settings) return <HEmptyState icon={CalendarDays} title="Congés" description="Le paramétrage nécessite l’accréditation Congés · Paramétrer avec un périmètre global." />
  return <LeaveSettings key={choices.data.policy.updated} choices={choices.data} onSaved={() => { void client.invalidateQueries({ queryKey: ['leave'] }) }} />
}

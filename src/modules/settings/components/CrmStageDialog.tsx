import { HDialog } from '../../../shared/ui/HDialog'
import type { Reference } from '../types/references'
import { ReferenceEditor } from './ReferenceEditor'
export function CrmStageDialog({ stage, onClose }: { stage: Reference; onClose: () => void }) {
  return <HDialog open onOpenChange={(open) => { if (!open) onClose() }} title={`Configurer ${stage.label}`} description="Le nom et la couleur sont partagés par les colonnes et les tags du CRM."><ReferenceEditor catalog="crm_stages" record={stage} onClose={onClose} /></HDialog>
}

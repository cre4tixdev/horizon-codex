import { HDialog } from '../../../shared/ui/HDialog'
import type { CatalogName, Reference } from '../types/references'
import { ReferenceEditor } from './ReferenceEditor'
export function CrmStageDialog({ stage, onClose, catalog = 'crm_stages' }: { catalog?: CatalogName; stage: Reference; onClose: () => void }) {
  return <HDialog open onOpenChange={(open) => { if (!open) onClose() }} title={`Configurer ${stage.label}`} description="Le nom et la couleur sont partagés par les colonnes et les tags du CRM."><ReferenceEditor catalog={catalog} record={stage} onClose={onClose} /></HDialog>
}

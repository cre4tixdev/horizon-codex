import { ChevronDown, ChevronRight, Eye, EyeOff, Plus } from 'lucide-react'
import { HButton } from '../ui/HButton'

export function KitControls({ label, expanded, printDetails, onToggle, onAdd, onPrint }: { label: string; expanded: boolean; printDetails: boolean; onToggle: () => void; onAdd?: (() => void) | undefined; onPrint?: (() => void) | undefined }) {
  return <span className="quote-kit-tools">
    <HButton variant="ghost" className="quote-kit-fold" aria-expanded={expanded} aria-label={`${expanded ? 'Replier' : 'Déplier'} le ${label}`} onClick={onToggle}>{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}<span>Kit</span></HButton>
    {onAdd && <HButton size="icon" variant="ghost" className="quote-kit-add" title="Ajouter un composant" aria-label={`Ajouter un composant au ${label}`} onClick={onAdd}><Plus size={13} /></HButton>}
    {onPrint && <HButton size="icon" variant="ghost" className="quote-kit-print" aria-label={`Afficher les composants du ${label} à l’impression`} title={printDetails ? 'Impression : kit avec composants' : 'Impression : kit seul'} aria-pressed={printDetails} onClick={onPrint}>{printDetails ? <Eye size={14} /> : <EyeOff size={14} />}</HButton>}
  </span>
}

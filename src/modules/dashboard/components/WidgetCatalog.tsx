import { useState } from 'react'
import { ChartNoAxesCombined, Layers3, CalendarDays, Check, Plus } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { createWidget, widgetCatalog, type WidgetType } from '../schemas/layouts'
import { WidgetPreview } from './WidgetPreview'
const groups: { label: string; icon: typeof Layers3; types: WidgetType[] }[] = [
  { label: 'Indicateurs', icon: ChartNoAxesCombined, types: ['forecast', 'ordered', 'invoiced', 'margin', 'economic'] },
  { label: 'Suivi métier', icon: Layers3, types: ['business', 'records', 'activity'] },
  { label: 'Organisation', icon: CalendarDays, types: ['planning', 'time', 'leave', 'approvals', 'shortcuts'] },
]
export function WidgetCatalog({ onAdd, onClose, full }: { onAdd: (type: WidgetType) => void; onClose: () => void; full: boolean }) {
  const [selected, setSelected] = useState<WidgetType>('forecast')
  const definition = widgetCatalog[selected], widget = createWidget(selected)
  return <HDialog open onOpenChange={(open) => { if (!open) onClose() }} title="Ajouter un widget" description="Choisissez un widget pour découvrir sa présentation avant de l’ajouter." className="dashboard-widget-picker">
    <div className="dialog-form dashboard-widget-picker-body">
      <nav className="dashboard-widget-catalog" aria-label="Catalogue des widgets">{groups.map(({ label, icon: Icon, types }) => <section key={label}><h3><Icon size={14} />{label}</h3>{types.map((type) => <button type="button" key={type} aria-label={`Aperçu : ${widgetCatalog[type].label}`} aria-pressed={selected === type} onClick={() => setSelected(type)}><span>{widgetCatalog[type].label}</span>{selected === type && <Check size={14} />}</button>)}</section>)}</nav>
      <section className="dashboard-widget-preview-panel" aria-label={`Aperçu : ${definition.label}`}>
        <HSectionHeading title={definition.label} description={definition.description} />
        <div className="dashboard-widget-preview-meta"><span>{widget.width}H × {widget.height}V · Taille initiale modifiable</span><span>Données d’exemple</span></div>
        <WidgetPreview key={selected} widget={widget} />
        <p className="contact-muted">L’aperçu illustre la présentation. Après ajout, choisissez vos sources et vos filtres ; les données affichées respecteront vos droits Horizon.</p>
      </section>
    </div>
    <HDialogFooter><HButton onClick={onClose}>Annuler</HButton><HButton variant="primary" disabled={full} onClick={() => onAdd(selected)}><Plus size={14} />Ajouter ce widget</HButton></HDialogFooter>
  </HDialog>
}

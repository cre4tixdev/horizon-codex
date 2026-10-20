import { useState } from 'react'
import { Plus, Trash2, Copy, LayoutGrid, Database, Layers } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSortableRows, HSortableRow, HRowDragHandle } from '../../../shared/ui/HSortableRows'
import { sources, sourceSchema, sourceStates, dataSpecSchema, type WidgetDataSpec } from '../schemas/widgetData'
import { resizeWidget, widgetCatalog, widgetSchema, type DashboardWidget } from '../schemas/layouts'
import { shortcutCatalog } from '../schemas/shortcuts'
import { CompanyFilter } from './WidgetCompanyFilter'

const periodOptions = [{ value: 'dashboard', label: 'Période du dashboard' }, { value: 'month', label: 'Mois en cours' }, { value: 'quarter', label: 'Trimestre en cours' }, { value: 'year', label: 'Année en cours' }, { value: 'all', label: 'Toutes périodes' }]
export function DataFields({ data, onChange }: { data: WidgetDataSpec; onChange: (data: WidgetDataSpec) => void }) {
  return <div className="dashboard-config-fields">
    <label>Source<HCombobox label="Source de données" value={data.source} required clearable={false} showCodes={false} options={Object.entries(sources).map(([value, label]) => ({ value, label }))} onChange={(source) => onChange({ ...data, source: sourceSchema.parse(source), status: '', scope: source === 'invoices' ? 'accessible' : data.scope })} /></label>
    <label>Présentation<HCombobox label="Présentation des données" value={data.presentation} required clearable={false} showCodes={false} options={[{ value: 'list', label: 'Liste compacte' }, { value: 'table', label: 'Tableau' }, { value: 'count', label: 'Compteur' }]} onChange={(value) => onChange({ ...data, presentation: dataSpecSchema.shape.presentation.parse(value) })} /></label>
    <label>Périmètre<HCombobox label="Périmètre des données" value={data.scope} required clearable={false} showCodes={false} options={[...(data.source === 'invoices' ? [] : [{ value: 'own', label: 'Mes dossiers' }]), { value: 'accessible', label: 'Toutes les données accessibles' }]} onChange={(value) => onChange({ ...data, scope: value === 'own' ? 'own' : 'accessible' })} /></label>
    <label>État<HCombobox label="État des dossiers" value={data.status} showCodes={false} options={[{ value: '', label: 'Tous les états' }, ...Object.entries(sourceStates[data.source]).map(([value, label]) => ({ value, label }))]} onChange={(status) => onChange({ ...data, status })} /></label>
    <label>Période<HCombobox label="Période des données" value={data.period} required clearable={false} showCodes={false} options={periodOptions} onChange={(value) => onChange({ ...data, period: dataSpecSchema.shape.period.parse(value) })} /></label>
    <label>Résultats par page<HInput aria-label="Résultats par page du widget" type="number" min={3} max={20} value={data.limit} onChange={(event) => { const limit = Number(event.target.value); if (Number.isInteger(limit) && limit >= 3 && limit <= 20) onChange({ ...data, limit }) }} /></label>
    <label>Société<CompanyFilter data={data} onChange={onChange} /></label>
    <label>Texte recherché<HInput aria-label="Texte recherché dans le widget" maxLength={200} value={data.search} onChange={(event) => onChange({ ...data, search: event.target.value })} /></label>
    <p className="contact-muted dashboard-config-hint">La période filtre {data.source === 'opportunities' ? 'la date prévue de l’opportunité' : data.source === 'orders' ? 'la date de commande' : data.source === 'invoices' ? 'la date de facture' : 'la date du devis'}. Les droits d’accès restent appliqués par le module.</p>
  </div>
}
export function WidgetSettings({ widget, onChange, onClose }: { widget: DashboardWidget; onChange: (widget: DashboardWidget) => void; onClose: () => void }) {
  const [tab, setTab] = useState('layout'), [pageIndex, setPageIndex] = useState(0)
  const config = widget.config, definition = widgetCatalog[widget.type], page = config.pages[Math.min(pageIndex, config.pages.length - 1)]!
  const configure = (patch: Partial<typeof config>) => onChange({ ...widget, config: { ...config, ...patch } })
  const carousel = widget.type === 'business', dataWidget = widget.type === 'records'
  return <HDialog open onOpenChange={(open) => { if (!open) onClose() }} title="Configurer le widget" description={definition.label} className="dashboard-config-dialog">
    <HRecordTabs label="Configuration du widget" idPrefix="widget-config" value={tab} onChange={setTab} items={[{ value: 'layout', label: 'Présentation', icon: LayoutGrid, panel: 'widget-config-panel' }, ...(dataWidget ? [{ value: 'data', label: 'Données', icon: Database, panel: 'widget-config-panel' }] : []), ...(carousel ? [{ value: 'pages', label: `Pages (${config.pages.length})`, icon: Layers, panel: 'widget-config-panel' }] : [])]} />
    <div className="dialog-form"><section id="widget-config-panel" role="tabpanel" aria-labelledby={`widget-config-${tab}`}>
        {tab === 'layout' && <><HSectionHeading title="Présentation" /><div className="dashboard-config-fields">
          <label className="dashboard-config-full">Titre du widget<HInput aria-label="Titre du widget" value={config.title} maxLength={80} placeholder={definition.label} onChange={(event) => configure({ title: event.target.value })} /></label>
          <label>Largeur (unités horizontales)<HInput aria-label="Largeur du widget" type="number" min={definition.minWidth} max={12} value={widget.width} onChange={(event) => onChange(resizeWidget(widget, Number(event.target.value), widget.height))} /></label>
          <label>Hauteur (unités verticales)<HInput aria-label="Hauteur du widget" type="number" min={definition.minHeight} max={12} value={widget.height} onChange={(event) => onChange(resizeWidget(widget, widget.width, Number(event.target.value)))} /></label>
          <label>Colonne de départ<HInput aria-label="Colonne du widget" type="number" min={1} max={13 - widget.width} value={(widget.x ?? 0) + 1} onChange={(event) => { const x = Number(event.target.value) - 1; if (Number.isInteger(x) && x >= 0 && x <= 12 - widget.width) onChange({ ...widget, x }) }} /></label>
          <label>Ligne de départ<HInput aria-label="Ligne du widget" type="number" min={1} max={601} value={(widget.y ?? 0) + 1} onChange={(event) => { const y = Number(event.target.value) - 1; if (Number.isInteger(y) && y >= 0 && y <= 600) onChange({ ...widget, y }) }} /></label>
          {!['business', 'records', 'shortcuts', 'activity', 'planning', 'approvals'].includes(widget.type) && <label>Période<HCombobox label="Période du widget" value={config.period} required clearable={false} showCodes={false} options={periodOptions.filter((item) => item.value !== 'all' && (widget.type !== 'leave' || !['year'].includes(item.value)))} onChange={(value) => configure({ period: dataSpecSchema.shape.period.parse(value) })} /></label>}
          {['time', 'leave'].includes(widget.type) && <label>Périmètre<HCombobox label="Périmètre du widget" value={config.scope === 'own' && widget.type === 'leave' ? 'team' : config.scope} required clearable={false} showCodes={false} options={widget.type === 'time' ? [{ value: 'own', label: 'Mes temps' }, { value: 'team', label: 'Mon équipe' }] : [{ value: 'team', label: 'Mon équipe' }, { value: 'company', label: 'Entreprise' }]} onChange={(value) => configure({ scope: value === 'company' ? 'company' : value === 'team' ? 'team' : 'own' })} /></label>}
        </div><p className="contact-muted">{widget.width}H × {widget.height}V · Placement prévisualisé dans la grille. Les voisins sont décalés si nécessaire.</p>
        {widget.type === 'shortcuts' && <><HSectionHeading title="Destinations à afficher" /><div className="dashboard-shortcut-choices">{Object.entries(shortcutCatalog).map(([key, entry]) => <label key={key} className="h-choice"><input type="checkbox" checked={config.links.includes(entry.key)} onChange={(event) => configure({ links: event.target.checked ? [...config.links, entry.key] : config.links.filter((link) => link !== key) })} />{entry.label}</label>)}</div></>}
        </>}
        {tab === 'data' && <><HSectionHeading title="Données du widget" /><DataFields data={config.data} onChange={(data) => configure({ data })} /></>}
        {tab === 'pages' && <><HSectionHeading title={`${config.pages.length} page(s)`} actions={<HButton size="small" disabled={config.pages.length >= 12} onClick={() => { configure({ pages: [...config.pages, dataSpecSchema.parse({ title: `Page ${config.pages.length + 1}` })] }); setPageIndex(config.pages.length) }}><Plus size={14} />Ajouter une page</HButton>} />
          <CarouselPageTable pages={config.pages} pageIndex={pageIndex} onSelect={setPageIndex} onChange={(pages, selected) => { configure({ pages }); setPageIndex(selected) }} />
          <HSectionHeading title={`Contenu de la page ${Math.min(pageIndex + 1, config.pages.length)}`} /><label className="dashboard-page-title">Nom de la page<HInput aria-label="Nom de la page" value={page.title} maxLength={80} onChange={(event) => configure({ pages: config.pages.map((item, index) => index === pageIndex ? { ...item, title: event.target.value } : item) })} /></label>
          <DataFields data={page} onChange={(data) => configure({ pages: config.pages.map((item, index) => index === pageIndex ? data : item) })} />
          <HSectionHeading title="Défilement" /><div className="dashboard-config-fields"><label className="h-choice"><input type="checkbox" checked={config.automatic} onChange={(event) => configure({ automatic: event.target.checked })} />Défilement automatique</label><label>Délai entre les pages (secondes)<HInput aria-label="Délai du carrousel" type="number" min={5} max={120} disabled={!config.automatic} value={config.interval} onChange={(event) => { const interval = Number(event.target.value); if (Number.isInteger(interval) && interval >= 5 && interval <= 120) configure({ interval }) }} /></label></div><p className="contact-muted">Pause au survol, pendant une interaction, en édition et lorsque l’onglet est masqué. Chaque page possède sa pagination de résultats.</p>
        </>}
      </section>
      {!widgetSchema.safeParse(widget).success && <p className="field-error" role="alert">Vérifiez les dimensions, les titres et la configuration des données.</p>}
    </div><HDialogFooter><HButton onClick={onClose}>Terminer</HButton></HDialogFooter>
  </HDialog>
}

function CarouselPageTable({ pages, pageIndex, onSelect, onChange }: { pages: WidgetDataSpec[]; pageIndex: number; onSelect: (index: number) => void; onChange: (pages: WidgetDataSpec[], index: number) => void }) {
  return <HSortableRows ids={pages.map((_, index) => String(index))} renderPreview={(index) => pages[index]?.title || `Page ${index + 1}`} onMove={(from, to) => { const next = [...pages], [moved] = next.splice(from, 1); next.splice(to, 0, moved!); onChange(next, to) }}>
    <div className="settings-reference-table"><table className="reference-table dashboard-pages-table"><thead><tr><th>#</th><th>Page</th><th>Source</th><th>Actions</th></tr></thead><tbody>{pages.map((item, index) => <HSortableRow key={index} id={String(index)} index={index}>{(handle) => <><td><HRowDragHandle handleRef={handle} index={index} /></td><td><HButton size="small" variant={pageIndex === index ? 'primary' : 'ghost'} onClick={() => onSelect(index)}>{item.title || `Page ${index + 1}`}</HButton></td><td>{sources[item.source]}</td><td><HButton size="icon" variant="ghost" aria-label={`Dupliquer page ${index + 1}`} disabled={pages.length >= 12} onClick={() => onChange([...pages, { ...item, title: `${item.title} · copie`.slice(0, 80) }], pages.length)}><Copy size={13} /></HButton><HButton size="icon" variant="ghost" aria-label={`Supprimer page ${index + 1}`} disabled={pages.length === 1} onClick={() => onChange(pages.filter((_, i) => i !== index), Math.max(0, index - 1))}><Trash2 size={13} /></HButton></td></>}</HSortableRow>)}</tbody></table></div>
  </HSortableRows>
}

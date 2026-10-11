import { useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { Minus, Plus, ShoppingCart, Users, LayoutGrid, MessageSquare, PanelLeft, Check, Eye, FileText, Mail, Palette, RotateCcw, SlidersHorizontal, Type, Square, Table2, Undo2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HTag } from '../../../shared/ui/HTag'
import { HProgressSteps } from '../../../shared/ui/HProgressSteps'
import { HColorField } from '../../../shared/ui/HColorField'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { uxService } from '../services/UxService'
import { uxDefaults, uxLimits, uxInputSchema, uxStyle, uxQueryKey, type UxInput, type UxSettings } from '../schemas/ux'
const tabs = [
  { value: 'general', label: 'Général', panel: 'ux-general' },
  { value: 'tables', label: 'Tableaux', panel: 'ux-tables' },
  { value: 'fields', label: 'Champs et textes', panel: 'ux-fields' },
  { value: 'buttons', label: 'Boutons', panel: 'ux-buttons' },
  { value: 'navigation', label: 'Navigation', panel: 'ux-navigation' },
] as const
const groups: { tab: string; title: string; icon: typeof Table2; fields: { key: keyof typeof uxLimits; label: string }[] }[] = [
  { tab: 'tables', title: 'Densité des tableaux', icon: Table2, fields: [{ key: 'row_height', label: 'Hauteur des lignes' }, { key: 'table_font', label: 'Texte des tableaux' }] },
  { tab: 'fields', title: 'Champs et textes', icon: Type, fields: [{ key: 'control_height', label: 'Hauteur des champs' }, { key: 'control_font', label: 'Texte des champs' }, { key: 'label_font', label: 'Libellés des champs' }, { key: 'title_font', label: 'Titres des fiches' }] },
  { tab: 'general', title: 'Espacements et cadres', icon: Square, fields: [{ key: 'page_margin', label: 'Marges desktop' }, { key: 'panel_padding_x', label: 'Marge intérieure horizontale' }, { key: 'panel_padding_y', label: 'Marge intérieure verticale' }, { key: 'panel_radius', label: 'Arrondi des cadres' }, { key: 'section_gap', label: 'Entre les sections' }, { key: 'progress_gap', label: 'Autour des frises' }] },
  { tab: 'buttons', title: 'Boutons classiques et accentués', icon: Square, fields: [{ key: 'button_height', label: 'Hauteur des boutons' }, { key: 'button_small_height', label: 'Hauteur des boutons compacts' }, { key: 'button_font', label: 'Texte des boutons' }, { key: 'button_radius', label: 'Arrondi des boutons' }, { key: 'button_padding_x', label: 'Marge horizontale des boutons' }] },
  { tab: 'buttons', title: 'Smart boutons', icon: ShoppingCart, fields: [{ key: 'smart_height', label: 'Hauteur des smart boutons' }, { key: 'smart_font', label: 'Texte des smart boutons' }] },
  { tab: 'navigation', title: 'Sidebar', icon: PanelLeft, fields: [{ key: 'sidebar_link_height', label: 'Hauteur des entrées' }, { key: 'sidebar_submenu_height', label: 'Hauteur des sous-menus' }, { key: 'sidebar_link_gap', label: 'Entre les entrées' }, { key: 'sidebar_group_gap', label: 'Entre les groupes' }, { key: 'sidebar_title_top', label: 'Au-dessus des titres de groupe' }, { key: 'sidebar_title_bottom', label: 'Sous les titres de groupe' }] },
  { tab: 'navigation', title: 'Menu des modules', icon: LayoutGrid, fields: [{ key: 'launcher_tile_size', label: 'Taille des tuiles du menu' }, { key: 'launcher_icon_size', label: 'Taille des icônes du menu' }, { key: 'launcher_gap', label: 'Entre les tuiles du menu' }] },
]
const themeColors = [
  { tab: 'general', label: 'Fond général', light: 'background_light', dark: 'background_dark' },
  { tab: 'general', label: 'Fond du fil d’actualité', light: 'activity_light', dark: 'activity_dark' },
  { tab: 'tables', label: 'En-tête des tableaux', light: 'header_light', dark: 'header_dark' },
  { tab: 'tables', label: 'Lignes impaires', light: 'row_odd_light', dark: 'row_odd_dark' },
  { tab: 'tables', label: 'Lignes paires', light: 'row_even_light', dark: 'row_even_dark' },
  { tab: 'buttons', label: 'Fond des boutons classiques', light: 'button_background_light', dark: 'button_background_dark' },
  { tab: 'buttons', label: 'Texte des boutons classiques', light: 'button_text_light', dark: 'button_text_dark' },
  { tab: 'buttons', label: 'Bordure des boutons classiques', light: 'button_border_light', dark: 'button_border_dark' },
  { tab: 'buttons', label: 'Fond des smart boutons', light: 'smart_background_light', dark: 'smart_background_dark' },
  { tab: 'buttons', label: 'Texte des smart boutons', light: 'smart_text_light', dark: 'smart_text_dark' },
] as const
export function UxSettingsPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const allowed = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const query = useQuery({ queryKey: uxQueryKey, queryFn: uxService.read, enabled: allowed, retry: false })
  if (!allowed) return <HEmptyState icon={SlidersHorizontal} title="Apparence et densité" description="Ces réglages communs sont réservés aux administrateurs habilités." />
  if (!query.data) return query.error ? <p role="alert">{query.error.message} <HButton onClick={() => { void query.refetch() }}>Réessayer</HButton></p> : <HLoadingIndicator label="Chargement des réglages UX" />
  return <Editor initial={query.data} />
}
function Editor({ initial }: { initial: UxSettings }) {
  const [params, setParams] = useSearchParams()
  const tab = tabs.find((item) => item.value === params.get('tab'))?.value ?? 'general'
  const client = useQueryClient(), [baseline, setBaseline] = useState(initial), [values, setValues] = useState(initial.config), [theme, setTheme] = useState<'light' | 'dark'>('light')
  const stepValue = (key: keyof typeof uxLimits, delta: number) => setValues((current) => {
    const { min, max } = uxLimits[key]
    const value = Number.isFinite(current[key]) ? current[key] : uxDefaults[key]
    return { ...current, [key]: Math.min(max, Math.max(min, value + delta)) }
  })
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline.config), changedElsewhere = baseline.updated !== initial.updated
  const save = useMutation({ mutationFn: () => uxService.save(baseline.updated, values), onSuccess: (record) => { setBaseline(record); setValues(record.config); client.setQueryData(uxQueryKey, record) } })
  const validation = uxInputSchema.safeParse(values)
  const valid = validation.success
  const invalidField = !validation.success ? groups.flatMap((group) => group.fields).find((field) => field.key === validation.error.issues[0]?.path[0]) : undefined
  return <section className="ux-settings"><HSectionHeading icon={SlidersHorizontal} title="Apparence et densité" description="Des réglages communs à tous les modules et tous les utilisateurs d’Horizon." /><HRecordPageActions><HButton size="small" title="Annuler mes modifications" aria-label="Annuler mes modifications UX" disabled={!dirty || save.isPending} onClick={() => setValues(baseline.config)}><Undo2 size={14} /></HButton><HSaveButton form="ux-settings" hasChanges={dirty} pending={save.isPending} disabled={!valid}>Enregistrer</HSaveButton></HRecordPageActions>
    <HRecordTabs items={tabs} value={tab} label="Réglages UX" idPrefix="ux-tab" onChange={(value) => { const next = new URLSearchParams(params); next.set('tab', value); setParams(next, { replace: true }) }} />
    {changedElsewhere && <p role="alert" className="ux-conflict">Les réglages ont été modifiés ailleurs. Recharger abandonne vos modifications non enregistrées. <HButton size="small" onClick={() => { setBaseline(initial); setValues(initial.config); save.reset() }}>Recharger</HButton></p>}
    {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
    <div className="ux-editor-layout"><form id="ux-settings" className="ux-controls" onSubmit={(event) => { event.preventDefault(); if (dirty && valid && !save.isPending) save.mutate() }}><fieldset id={`ux-${tab}`} role="tabpanel" aria-labelledby={`ux-tab-${tab}`} disabled={save.isPending} className="ux-controls-fieldset">
      <p className="contact-muted ux-help">L’aperçu suit vos modifications. Enregistrer les applique à Horizon. Toutes les dimensions sont en pixels.</p>
      {groups.filter((group) => group.tab === tab).map(({ title, icon, fields }) => <section className="ux-control-group" key={title}><HSectionHeading title={title} icon={icon} /><div className="ux-fields">{fields.map(({ key, label }) => { const { min, max } = uxLimits[key]; return <div className="ux-field" key={key}><label htmlFor={`ux-value-${key}`}><HFieldLabel>{label}</HFieldLabel></label><div className="ux-number"><HButton size="icon" className="ux-step-button" aria-label={`Diminuer : ${label}`} title="Diminuer de 1 px" disabled={values[key] <= min} onClick={() => stepValue(key, -1)}><Minus size={12} aria-hidden="true" /></HButton><div className="ux-number-value"><HInput id={`ux-value-${key}`} aria-label={label} aria-describedby={`ux-limit-${key}`} title={`${min}–${max} px`} required type="number" min={min} max={max} step={1} value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value === '' ? '' : event.target.valueAsNumber })} /><span aria-hidden="true">px</span></div><HButton size="icon" className="ux-step-button" aria-label={`Augmenter : ${label}`} title="Augmenter de 1 px" disabled={values[key] >= max} onClick={() => stepValue(key, 1)}><Plus size={12} aria-hidden="true" /></HButton></div><input className="ux-range" type="range" aria-label={`Ajuster : ${label}`} min={min} max={max} step={1} value={Number.isFinite(values[key]) ? values[key] : uxDefaults[key]} onChange={(event) => setValues({ ...values, [key]: event.target.valueAsNumber })} /><small className="ux-limit" id={`ux-limit-${key}`}>{min} à {max} px</small></div> })}</div></section>)}
      {themeColors.some((item) => item.tab === tab) && <section className="ux-control-group"><HSectionHeading title={`Couleurs · mode ${theme === 'light' ? 'clair' : 'sombre'}`} icon={Palette} /><p className="contact-muted ux-help">Le choix Clair / Sombre de l’aperçu sélectionne les couleurs à régler.</p><div className="ux-fields">{themeColors.filter((item) => item.tab === tab).map((item) => { const key = item[theme]; return <HColorField key={key} label={`${item.label} · ${theme === 'light' ? 'clair' : 'sombre'}`} value={values[key]} onChange={(value) => setValues({ ...values, [key]: value })} /> })}</div></section>}
      {tab === 'buttons' && <section className="ux-control-group"><HSectionHeading title="Boutons accentués" icon={Palette} /><div className="ux-fields"><HColorField label="Fond accentué" value={values.accent_background} onChange={(value) => setValues({ ...values, accent_background: value })} /><HColorField label="Texte accentué" value={values.accent_text} onChange={(value) => setValues({ ...values, accent_text: value })} /></div></section>}
      <HButton size="small" disabled={save.isPending} onClick={() => setValues(uxDefaults)}><RotateCcw size={14} />Valeurs par défaut Horizon</HButton><p className="contact-muted ux-help">La remise aux valeurs par défaut reste à enregistrer. Les couleurs de marque et des états métier sont conservées.</p></fieldset>
    </form><section className="ux-preview-column"><HSectionHeading title="Aperçu en direct" icon={Eye} actions={<div className="contact-view-switch" role="group" aria-label="Thème de l’aperçu UX"><HButton size="small" variant="ghost" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Clair</HButton><HButton size="small" variant="ghost" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Sombre</HButton></div>} /><Preview values={valid ? values : baseline.config} theme={theme} navigation={tab === 'navigation'} />{!valid && <p className="field-error">{invalidField ? `${invalidField.label} : saisissez un nombre entier de ${uxLimits[invalidField.key].min} à ${uxLimits[invalidField.key].max} px.` : 'Vérifiez les couleurs saisies (#RRGGBB).'}</p>}<p className="contact-muted ux-help">Les contenus multilignes agrandissent leur ligne. Les marges s’adaptent aux petits écrans. L’apparence des PDF reste gérée par leurs modèles.</p></section></div>
  </section>
}
const previewRows = [{ description: 'Mélangeur vidéo', brand: 'SONY', reference: 'XVS-C1', quantity: 1, cost: '1 000,00 €', price: '1 200,00 €' }, { description: 'Câble vidéo', brand: 'BELDEN', reference: '1855A', quantity: 20, cost: '0,80 €', price: '1,08 €' }, { description: 'Installation et mise en service', brand: 'CVS', reference: 'PREST-01', quantity: 1, cost: '150,00 €', price: '180,00 €' }]
const previewColumns: ColumnDef<typeof previewRows[number]>[] = [{ header: 'Description', accessorKey: 'description' }, { header: 'Marque', accessorKey: 'brand' }, { header: 'Référence', accessorKey: 'reference' }, { header: 'Qté', accessorKey: 'quantity' }, { header: 'Coût', accessorKey: 'cost' }, { header: 'PUV', accessorKey: 'price' }]
function Preview({ values, theme, navigation }: { values: UxInput; theme: 'light' | 'dark'; navigation: boolean }) {
  return <div className="ux-preview" data-theme={theme} style={uxStyle(values)}><div className="ux-preview-body contact-record sales-quote-record">
    {navigation && <NavigationPreview />}
    <div className="record-links ux-preview-smart"><HButton><ShoppingCart size={13} />Achats<span className="record-link-count">3</span></HButton><HButton><FileText size={13} />Devis<span className="record-link-count">2</span></HButton></div>
    <div className="contact-page-heading"><h1>Devis 00001-1</h1><HTag tone="violet">Exemple</HTag></div>
    <HProgressSteps label="Frise d’exemple UX" steps={[{ id: 'draft', label: 'Brouillon', icon: FileText, state: 'done' }, { id: 'quote', label: 'Devis', icon: FileText, state: 'current' }, { id: 'sent', label: 'Envoyé', icon: Mail, state: 'pending' }, { id: 'order', label: 'Commande', icon: Check, state: 'pending' }]} />
    <div className="contact-panel"><HSectionHeading title="Informations de la pièce" icon={FileText} /><div className="ux-preview-fields"><label><HFieldLabel>Titre</HFieldLabel><HInput readOnly value="Installation audiovisuelle" /></label><label><HFieldLabel>Fournisseur</HFieldLabel><HCombobox label="Fournisseur d’exemple UX" value="cvs" clearable={false} showCodes={false} options={[{ value: 'cvs', label: 'CVS Engineering' }]} onChange={() => {}} /></label></div></div>
    <div className="ux-preview-table"><HSectionHeading title="Lignes de la pièce" icon={Table2} /><HDataTable data={previewRows} columns={previewColumns} columnBorders columnAlignments={{ Coût: 'right', PUV: 'right', Qté: 'center' }} /></div>
    <div className="contact-panel ux-preview-actions"><span>Cadre, libellés, champs et boutons partagés.</span><div className="ux-preview-buttons"><HButton>Classique</HButton><HButton variant="primary"><Check size={14} />Valider</HButton></div></div>
    <section className="activity-panel ux-preview-activity"><HSectionHeading title="Fil d’actualité" icon={MessageSquare} /><div className="activity-composer"><p className="ux-preview-message">Commande confirmée. Les documents et échanges de l’affaire apparaissent ici.</p></div></section>
  </div></div>
}
function NavigationPreview() {
  return <section className="ux-navigation-preview" aria-label="Aperçu de la navigation">
    <div className="sidebar ux-sidebar-preview"><div className="sidebar-group"><p className="sidebar-group__title">Activité</p><span className="sidebar-link"><Users size={16} />Contacts</span><span className="sidebar-link sidebar-link--active"><ShoppingCart size={16} />Ventes</span><div className="sidebar-submenu"><span className="sidebar-link sidebar-submenu-link">Devis</span></div></div><div className="sidebar-group"><p className="sidebar-group__title">Paramètres</p><span className="sidebar-link"><SlidersHorizontal size={16} />Apparence</span></div></div>
    <div className="ux-launcher-preview"><p>Menu des modules</p><div className="module-launcher-grid">{[{ label: 'Contacts', icon: Users }, { label: 'Ventes', icon: ShoppingCart }].map(({ label, icon: Icon }) => <div className="module-launcher-item" key={label}><button className="module-launcher-link" type="button"><Icon size={38} strokeWidth={1.35} /><span>{label}</span></button></div>)}</div></div>
  </section>
}

import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { ChevronsDown, ChevronsUp, ChevronDown, Minus, Plus, ShoppingCart, Users, LayoutGrid, MessageSquare, PanelLeft, Check, Eye, FileText, Palette, RotateCcw, SlidersHorizontal, Type, Square, Table2, Undo2 } from 'lucide-react'
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
import { uxDefaults, uxLimits, uxStep, uxInputSchema, uxStyle, uxQueryKey, type UxInput, type UxSettings } from '../schemas/ux'
const tabs = [
  { value: 'general', label: 'Général', panel: 'ux-general' },
  { value: 'tables', label: 'Tableaux', panel: 'ux-tables' },
  { value: 'fields', label: 'Champs et textes', panel: 'ux-fields' },
  { value: 'buttons', label: 'Boutons', panel: 'ux-buttons' },
  { value: 'navigation', label: 'Sidebar', panel: 'ux-navigation' },
  { value: 'launcher', label: 'Menu des modules', panel: 'ux-launcher' },
] as const
const groups: { tab: string; title: string; icon: typeof Table2; fields: { key: keyof typeof uxLimits; label: string }[] }[] = [
  { tab: 'tables', title: 'Densité des tableaux', icon: Table2, fields: [{ key: 'row_height', label: 'Hauteur des lignes' }, { key: 'table_font', label: 'Texte des tableaux' }] },
  { tab: 'fields', title: 'Champs et textes', icon: Type, fields: [{ key: 'control_height', label: 'Hauteur des champs' }, { key: 'control_font', label: 'Texte des champs' }, { key: 'label_font', label: 'Libellés des champs' }, { key: 'title_font', label: 'Titres des fiches' }] },
  { tab: 'general', title: 'Espacements et cadres', icon: Square, fields: [{ key: 'page_margin', label: 'Marges desktop' }, { key: 'panel_padding_x', label: 'Marge intérieure horizontale' }, { key: 'panel_padding_y', label: 'Marge intérieure verticale' }, { key: 'panel_radius', label: 'Arrondi des cadres' }, { key: 'section_gap', label: 'Entre les sections' }, { key: 'progress_gap', label: 'Autour des frises' }] },
  { tab: 'buttons', title: 'Boutons classiques et accentués', icon: Square, fields: [{ key: 'button_height', label: 'Hauteur des boutons' }, { key: 'button_small_height', label: 'Hauteur des boutons compacts' }, { key: 'button_font', label: 'Texte des boutons' }, { key: 'button_radius', label: 'Arrondi des boutons' }, { key: 'button_padding_x', label: 'Marge horizontale des boutons' }] },
  { tab: 'buttons', title: 'Smart boutons', icon: ShoppingCart, fields: [{ key: 'smart_height', label: 'Hauteur des smart boutons' }, { key: 'smart_font', label: 'Texte des smart boutons' }] },
  { tab: 'navigation', title: 'Dimensions et typographie', icon: PanelLeft, fields: [{ key: 'sidebar_width', label: 'Largeur de la sidebar' }, { key: 'sidebar_font', label: 'Texte des entrées' }, { key: 'sidebar_submenu_font', label: 'Texte des sous-menus' }, { key: 'sidebar_title_font', label: 'Texte des titres de groupe' }, { key: 'sidebar_icon_size', label: 'Taille des icônes de sidebar' }, { key: 'sidebar_radius', label: 'Arrondi des entrées' }, { key: 'sidebar_padding_x', label: 'Marge intérieure des entrées' }, { key: 'sidebar_submenu_indent', label: 'Retrait des sous-menus' }] },
  { tab: 'navigation', title: 'Hauteurs et espacements', icon: PanelLeft, fields: [{ key: 'sidebar_link_height', label: 'Hauteur des entrées' }, { key: 'sidebar_submenu_height', label: 'Hauteur des sous-menus' }, { key: 'sidebar_link_gap', label: 'Entre les entrées' }, { key: 'sidebar_group_gap', label: 'Entre les groupes' }, { key: 'sidebar_title_top', label: 'Au-dessus des titres de groupe' }, { key: 'sidebar_title_bottom', label: 'Sous les titres de groupe' }] },
  { tab: 'launcher', title: 'Menu des modules', icon: LayoutGrid, fields: [{ key: 'launcher_tile_size', label: 'Taille des tuiles du menu' }, { key: 'launcher_icon_size', label: 'Taille des icônes du menu' }, { key: 'launcher_gap', label: 'Entre les tuiles du menu' }] },
]
const sidebarColors = [
  { key: 'sidebar_background_top', label: 'Fond · haut' },
  { key: 'sidebar_background_middle', label: 'Fond · milieu' },
  { key: 'sidebar_background_bottom', label: 'Fond · bas' },
  { key: 'sidebar_text_color', label: 'Texte des entrées' },
  { key: 'sidebar_icon_color', label: 'Icônes' },
  { key: 'sidebar_title_color', label: 'Titres de groupe' },
  { key: 'sidebar_submenu_color', label: 'Texte des sous-menus' },
  { key: 'sidebar_active_start', label: 'Sélection · début du dégradé' },
  { key: 'sidebar_active_end', label: 'Sélection · fin du dégradé' },
  { key: 'sidebar_active_text', label: 'Texte de la sélection' },
  { key: 'sidebar_hover_color', label: 'Teinte du survol' },
] as const
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())
  const sectionIds = groups.filter((group) => group.tab === tab).map((group) => group.title)
  if (tab === 'navigation') sectionIds.push('Fond et sélection', 'Textes et icônes')
  if (themeColors.some((item) => item.tab === tab)) sectionIds.push('colors')
  if (tab === 'buttons') sectionIds.push('Boutons accentués')
  const allExpanded = sectionIds.every((id) => expandedGroups.has(`${tab}:${id}`))
  const groupState = (id: string) => ({
    expanded: expandedGroups.has(`${tab}:${id}`),
    onExpandedChange: (open: boolean) => setExpandedGroups((current) => {
      const next = new Set(current)
      if (open) next.add(`${tab}:${id}`)
      else next.delete(`${tab}:${id}`)
      return next
    }),
  })
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
      <HButton size="small" onClick={() => setExpandedGroups((current) => {
        const next = new Set(current)
        sectionIds.forEach((id) => { if (allExpanded) next.delete(`${tab}:${id}`); else next.add(`${tab}:${id}`) })
        return next
      })}>{allExpanded ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}{allExpanded ? 'Tout replier' : 'Tout déplier'}</HButton>
      {tab === 'navigation' && <>{[{ title: 'Fond et sélection', text: false }, { title: 'Textes et icônes', text: true }].map((group) => <UxGroup key={group.title} title={group.title} icon={Palette} {...groupState(group.title)}><p className="contact-muted ux-help">Couleurs communes aux modes clair et sombre.</p><div className="ux-fields">{sidebarColors.filter(({ key }) => ['sidebar_text_color', 'sidebar_icon_color', 'sidebar_title_color', 'sidebar_submenu_color'].includes(key) === group.text).map(({ key, label }) => <HColorField key={key} label={`Sidebar · ${label}`} value={values[key]} onChange={(value) => setValues({ ...values, [key]: value })} />)}</div></UxGroup>)}</>}

      {groups.filter((group) => group.tab === tab).map(({ title, icon, fields }) => <UxGroup key={title} title={title} icon={icon} {...groupState(title)}><div className="ux-fields">{fields.map(({ key, label }) => { const { min, max } = uxLimits[key], step = uxStep(key); return <div className="ux-field" key={key}><label htmlFor={`ux-value-${key}`}><HFieldLabel>{label}</HFieldLabel></label><div className="ux-number"><HButton size="icon" className="ux-step-button" aria-label={`Diminuer : ${label}`} title={`Diminuer de ${step.toLocaleString('fr-FR')} px`} disabled={values[key] <= min} onClick={() => stepValue(key, -step)}><Minus size={12} aria-hidden="true" /></HButton><div className="ux-number-value"><HInput id={`ux-value-${key}`} aria-label={label} aria-describedby={`ux-limit-${key}`} title={`${min}–${max} px`} required type="number" min={min} max={max} step={step} value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value === '' ? '' : event.target.valueAsNumber })} /><span aria-hidden="true">px</span></div><HButton size="icon" className="ux-step-button" aria-label={`Augmenter : ${label}`} title={`Augmenter de ${step.toLocaleString('fr-FR')} px`} disabled={values[key] >= max} onClick={() => stepValue(key, step)}><Plus size={12} aria-hidden="true" /></HButton></div><small className="ux-limit" id={`ux-limit-${key}`}>{min} à {max} px{step < 1 && ` · pas de ${step.toLocaleString('fr-FR')}`}</small></div> })}</div></UxGroup>)}
      {themeColors.some((item) => item.tab === tab) && <UxGroup title={`Couleurs · mode ${theme === 'light' ? 'clair' : 'sombre'}`} icon={Palette} {...groupState('colors')}><p className="contact-muted ux-help">Le choix Clair / Sombre de l’aperçu sélectionne les couleurs à régler.</p><div className="ux-fields">{themeColors.filter((item) => item.tab === tab).map((item) => { const key = item[theme]; return <HColorField key={key} label={`${item.label} · ${theme === 'light' ? 'clair' : 'sombre'}`} value={values[key]} onChange={(value) => setValues({ ...values, [key]: value })} /> })}</div></UxGroup>}
      {tab === 'buttons' && <UxGroup title="Boutons accentués" icon={Palette} {...groupState('Boutons accentués')}><div className="ux-fields"><HColorField label="Fond accentué" value={values.accent_background} onChange={(value) => setValues({ ...values, accent_background: value })} /><HColorField label="Texte accentué" value={values.accent_text} onChange={(value) => setValues({ ...values, accent_text: value })} /></div></UxGroup>}
      <HButton size="small" disabled={save.isPending} onClick={() => setValues(uxDefaults)}><RotateCcw size={14} />Valeurs par défaut Horizon</HButton><p className="contact-muted ux-help">La remise aux valeurs par défaut reste à enregistrer. Les couleurs de marque et des états métier sont conservées.</p></fieldset>
    </form><section className="ux-preview-column"><HSectionHeading title="Aperçu en direct" icon={Eye} actions={<div className="contact-view-switch" role="group" aria-label="Thème de l’aperçu UX"><HButton size="small" variant="ghost" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Clair</HButton><HButton size="small" variant="ghost" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Sombre</HButton></div>} /><Preview values={valid ? values : baseline.config} theme={theme} tab={tab} />{!valid && <p className="field-error">{invalidField ? `${invalidField.label} : saisissez une valeur de ${uxLimits[invalidField.key].min} à ${uxLimits[invalidField.key].max} px.` : 'Vérifiez les couleurs saisies (#RRGGBB).'}</p>}<p className="contact-muted ux-help">Les contenus multilignes agrandissent leur ligne. Les marges s’adaptent aux petits écrans. L’apparence des PDF reste gérée par leurs modèles.</p></section></div>
  </section>
}
const previewRows = [{ description: 'Mélangeur vidéo', brand: 'SONY', reference: 'XVS-C1', quantity: 1, cost: '1 000,00 €', price: '1 200,00 €' }, { description: 'Câble vidéo', brand: 'BELDEN', reference: '1855A', quantity: 20, cost: '0,80 €', price: '1,08 €' }, { description: 'Installation et mise en service', brand: 'CVS', reference: 'PREST-01', quantity: 1, cost: '150,00 €', price: '180,00 €' }]
const previewColumns: ColumnDef<typeof previewRows[number]>[] = [{ header: 'Description', accessorKey: 'description' }, { header: 'Marque', accessorKey: 'brand' }, { header: 'Référence', accessorKey: 'reference' }, { header: 'Qté', accessorKey: 'quantity' }, { header: 'Coût', accessorKey: 'cost' }, { header: 'PUV', accessorKey: 'price' }]
function UxGroup({ title, icon: Icon, children, expanded, onExpandedChange }: { title: string; icon: typeof Table2; children: ReactNode; expanded: boolean; onExpandedChange: (open: boolean) => void }) {
  return <details className="ux-control-group ux-disclosure" open={expanded}><summary onClick={(event) => { event.preventDefault(); onExpandedChange(!expanded) }}><Icon size={14} aria-hidden="true" /><span>{title}</span><ChevronDown size={14} aria-hidden="true" /></summary><div className="ux-disclosure-body">{children}</div></details>
}
function Preview({ values, theme, tab }: { values: UxInput; theme: 'light' | 'dark'; tab: typeof tabs[number]['value'] }) {
  return <div className={`ux-preview${tab === 'navigation' || tab === 'launcher' ? ' ux-preview--navigation' : ''}`} data-theme={theme} data-tab={tab} style={uxStyle(values)}><div className="ux-preview-body contact-record">
    {tab === 'navigation' && <SidebarPreview />}
    {tab === 'launcher' && <LauncherPreview />}
    {tab === 'tables' && <><HSectionHeading title="Tableau d’exemple" icon={Table2} /><HDataTable data={previewRows} columns={previewColumns} columnBorders columnAlignments={{ Coût: 'right', PUV: 'right', Qté: 'center' }} /></>}
    {tab === 'fields' && <><div className="contact-page-heading"><h1>Titre d’une fiche</h1></div><div className="contact-panel"><HSectionHeading title="Champs et libellés" icon={Type} /><div className="ux-preview-fields"><label><HFieldLabel>Titre</HFieldLabel><HInput readOnly value="Installation audiovisuelle" /></label><label><HFieldLabel>Fournisseur</HFieldLabel><HCombobox label="Fournisseur d’exemple UX" value="cvs" clearable={false} showCodes={false} options={[{ value: 'cvs', label: 'CVS Engineering' }]} onChange={() => {}} /></label></div></div></>}
    {tab === 'buttons' && <><HSectionHeading title="Actions et boutons" icon={Square} /><div className="ux-preview-buttons"><HButton>Classique</HButton><HButton variant="primary"><Check size={14} />Valider</HButton><HButton size="small">Compact</HButton><HButton size="icon" aria-label="Exemple d’action"><Plus size={14} /></HButton></div><HSectionHeading title="Smart boutons" icon={ShoppingCart} /><div className="record-links ux-preview-smart"><HButton><ShoppingCart size={13} />Achats<span className="record-link-count">3</span></HButton><HButton><FileText size={13} />Devis<span className="record-link-count">2</span></HButton></div></>}
    {tab === 'general' && <><div className="contact-page-heading"><h1>Fiche d’exemple</h1><HTag tone="violet">Aperçu</HTag></div><HProgressSteps label="Frise d’exemple UX" steps={[{ id: 'draft', label: 'Brouillon', icon: FileText, state: 'done' }, { id: 'validated', label: 'Validée', icon: Check, state: 'current' }, { id: 'done', label: 'Terminée', icon: Check, state: 'pending' }]} /><div className="contact-panel"><HSectionHeading title="Une première section" icon={Square} /><p className="contact-muted">Marges, arrondis et espaces entre les sections.</p></div><div className="contact-panel"><HSectionHeading title="Une seconde section" icon={Square} /><p className="contact-muted">Un cadre commun aux fiches Horizon.</p></div><section className="activity-panel ux-preview-activity"><HSectionHeading title="Fil d’actualité" icon={MessageSquare} /><div className="activity-composer"><p className="ux-preview-message">Une note ou un échange lié à la fiche.</p></div></section></>}
  </div></div>
}
function SidebarPreview() {
  const [collapsed, setCollapsed] = useState(false)
  return <section className="ux-navigation-preview" aria-label="Aperçu de la sidebar">
    <div className="ux-sidebar-preview-wrap"><div className="contact-view-switch" role="group" aria-label="Mode de la sidebar d’exemple"><HButton size="small" aria-pressed={!collapsed} onClick={() => setCollapsed(false)}>Dépliée</HButton><HButton size="small" aria-pressed={collapsed} onClick={() => setCollapsed(true)}>Repliée</HButton></div><div className={collapsed ? 'app-shell--collapsed' : undefined}><div className="sidebar ux-sidebar-preview"><div className="sidebar-group"><p className="sidebar-group__title">Activité</p><span className="sidebar-link"><Users size={16} /><span>Contacts</span></span><span className="sidebar-link sidebar-link--active"><ShoppingCart size={16} /><span>Ventes</span></span><div className="sidebar-submenu"><span className="sidebar-link sidebar-submenu-link"><FileText size={16} /><span>Devis</span></span></div></div><div className="sidebar-group"><p className="sidebar-group__title">Paramètres</p><span className="sidebar-link"><SlidersHorizontal size={16} /><span>Apparence</span></span></div></div></div></div>
  </section>
}
function LauncherPreview() {
  return <div className="ux-launcher-preview"><p>Menu des modules</p><div className="module-launcher-grid">{[{ label: 'Contacts', icon: Users }, { label: 'Ventes', icon: ShoppingCart }, { label: 'Stock', icon: LayoutGrid }].map(({ label, icon: Icon }) => <div className="module-launcher-item" key={label}><button className="module-launcher-link" type="button"><Icon size={38} strokeWidth={1.35} /><span>{label}</span></button></div>)}</div></div>
}

import { useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { FileText, Plus, Settings, Check } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { salesService, quoteColumns, type SalesSettings } from '../../sales'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
export function SalesSettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = ['columns', 'defaults', 'terms'].includes(params.get('tab') || '') ? params.get('tab')! : 'columns'
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const editable = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const allowed = editable || session.status === 'authenticated' && hasPermission(session.user, 'sales.read')
  const query = useQuery({ queryKey: ['settings', 'sales'], queryFn: () => salesService.settings(), enabled: allowed, retry: false })
  if (!allowed) return <HEmptyState title="Paramètres Ventes" icon={FileText} description="Vous ne disposez pas des droits de consultation de ces paramètres." />
  return <div className="settings-sales"><HSectionHeading title="Devis" icon={FileText} description="Présentation, validité et conditions générales de vente." />{query.data ? <SalesPresentation key={query.data.updated} record={query.data} editable={editable} tab={tab} onTabChange={(tab) => setParams({ tab }, { replace: true })} /> : query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : <HLoadingIndicator label="Chargement des paramètres Ventes" />}</div>
}
function SalesPresentation({ record, editable, tab, onTabChange }: { record: SalesSettings; editable: boolean; tab: string; onTabChange: (tab: string) => void }) {
  const [terms, setTerms] = useState(record.terms)
  const [editingTerm, setEditingTerm] = useState<SalesSettings['terms'][number]>()
  const [widths, setWidths] = useState(record.column_widths), [days, setDays] = useState(record.validity_days)
  const [tax, setTax] = useState(record.default_tax_rate)
  const client = useQueryClient()
  const save = useMutation({ mutationFn: () => salesService.saveSettings({ ...record, column_widths: widths, validity_days: days, default_tax_rate: tax, terms }), onSuccess: (saved) => client.setQueryData(['settings', 'sales'], saved) })
  const dirty = JSON.stringify(terms) !== JSON.stringify(record.terms) || JSON.stringify(widths) !== JSON.stringify(record.column_widths) || days !== record.validity_days || tax !== record.default_tax_rate
  return <form onSubmit={(event) => { event.preventDefault(); if (editable && dirty) save.mutate() }}><HRecordTabs label="Paramètres Ventes" idPrefix="sales-settings-tab" value={tab} onChange={onTabChange} items={[{ value: 'columns', label: 'Colonnes des devis', panel: 'sales-settings-columns' }, { value: 'defaults', label: 'Valeurs par défaut', panel: 'sales-settings-defaults' }, { value: 'terms', label: 'Conditions de vente', panel: 'sales-settings-terms' }]} />
    <fieldset className="access-fieldset" disabled={!editable || save.isPending}>
      <section className="contact-panel" role="tabpanel" id={`sales-settings-${tab}`} aria-labelledby={`sales-settings-tab-${tab}`}>
        <HSectionHeading
          title={tab === 'columns' ? 'Largeur des colonnes' : tab === 'defaults' ? 'Valeurs par défaut' : 'Conditions générales de vente'}
          description={tab === 'columns' ? 'Réglage commun en pixels. La description occupe la largeur restante et revient à la ligne ; la grille défile horizontalement sur les écrans étroits.' : tab === 'defaults' ? 'Appliquées à la création. Les devis existants conservent leurs valeurs.' : 'Textes proposés dans les devis. Les conditions déjà choisies restent conservées dans chaque devis.'}
          actions={editable && <>
            {tab === 'terms' && <HButton size="small" disabled={terms.length >= 30} onClick={() => setEditingTerm({ id: crypto.randomUUID(), label: '', content: '', active: true })}><Plus size={14} />Ajouter des conditions</HButton>}
            <HSaveButton hasChanges={dirty} pending={save.isPending}>Enregistrer</HSaveButton>
          </>}
        />
        {tab === 'columns' ? <div className="settings-reference-table">
          <table className="reference-table">
            <thead><tr><th>Colonne</th><th>Largeur (px)</th></tr></thead>
            <tbody>{quoteColumns.map(([key, label]) => <tr key={key}><td>{label}</td><td><HInput type="number" min={key === 'actions' ? 64 : key === 'position' ? 52 : 40} max={800} step={1} aria-label={`Largeur ${label}`} value={widths[key] || 40} onChange={(event) => setWidths({ ...widths, [key]: Number(event.target.value) })} /></td></tr>)}</tbody>
          </table>
        </div> : tab === 'defaults' ? <>
          <div className="contact-fields">
            <label className="h-form-field"><HFieldLabel>Validité des nouveaux devis (jours)</HFieldLabel><HInput type="number" min={1} max={365} step={1} value={days} onChange={(event) => setDays(Number(event.target.value))} /></label>
            <label className="h-form-field"><HFieldLabel>TVA par défaut (%)</HFieldLabel><HInput type="number" min={0} max={100} step="any" value={tax} onChange={(event) => setTax(Number(event.target.value))} /></label>
          </div>
          <p className="contact-muted">Les unités se configurent dans <a href="/settings/references?catalog=inventory_units">Référentiels → Unités</a>.</p>
        </> : <div className="settings-reference-table">
          <table className="reference-table">
            <thead><tr><th>Intitulé</th><th>État</th><th className="settings-action-cell"><span className="sr-only">Configurer</span></th></tr></thead>
            <tbody>{terms.map((term) => <tr key={term.id}><td>{term.label}</td><td>{term.active ? 'Actives' : 'Archivées'}</td><td className="settings-action-cell">{editable && <HButton size="icon" variant="ghost" aria-label={`Configurer ${term.label}`} title="Configurer" onClick={() => setEditingTerm({ ...term })}><Settings size={14} /></HButton>}</td></tr>)}
              {!terms.length && <tr><td colSpan={3}>Ajoutez les conditions approuvées par votre entreprise.</td></tr>}
            </tbody>
          </table>
        </div>}
        {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
      </section>
    </fieldset>
    {editingTerm && <HDialog className="sales-terms-dialog" open title="Conditions générales de vente" description="Un modèle de conditions à sélectionner dans vos devis." onOpenChange={(open) => { if (!open) setEditingTerm(undefined) }}>
      <div className="dialog-form sales-terms-form">
        <label className="h-form-field"><HFieldLabel required>Intitulé</HFieldLabel><HInput required maxLength={120} placeholder="Ex. Conditions de vente France" value={editingTerm.label} onChange={(event) => setEditingTerm({ ...editingTerm, label: event.target.value })} /></label>
        <label className="h-form-field"><span className="sales-terms-content-label"><span id="sales-terms-content-caption"><HFieldLabel required>Contenu</HFieldLabel></span><small aria-hidden="true">{new Intl.NumberFormat('fr-FR').format(editingTerm.content.length)} / 20 000</small></span><textarea aria-labelledby="sales-terms-content-caption" className="h-input sales-terms-editor" required rows={12} maxLength={20000} placeholder="Saisissez le texte des conditions générales de vente…" value={editingTerm.content} onChange={(event) => setEditingTerm({ ...editingTerm, content: event.target.value })} /></label>
        <label className="sales-terms-availability"><input type="checkbox" checked={editingTerm.active} onChange={(event) => setEditingTerm({ ...editingTerm, active: event.target.checked })} /><span>Proposer ces conditions dans les devis</span></label>
      </div>
      <HDialogFooter><HButton variant="primary" size="small" disabled={!editingTerm.label.trim() || !editingTerm.content.trim()} onClick={() => { setTerms((current) => current.some((term) => term.id === editingTerm.id) ? current.map((term) => term.id === editingTerm.id ? editingTerm : term) : [...current, editingTerm]); setEditingTerm(undefined) }}><Check size={14} />Appliquer</HButton></HDialogFooter>
    </HDialog>}

  </form>
}

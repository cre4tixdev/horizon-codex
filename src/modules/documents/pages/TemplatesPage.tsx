import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { FileText, Plus, Archive, Trash2 } from 'lucide-react'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HBadge } from '../../../shared/ui/HBadge'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { documentsService } from '../services/DocumentsService'
import { useDocumentsAccess } from '../hooks/useDocumentsAccess'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { DocumentFileSettings } from '../components/DocumentFileSettings'
import { TemplateLifecycleDialog } from '../components/TemplateLifecycleDialog'
import type { TemplateChoice } from '../schemas/templates'
import '../studio.css'
export function TemplatesPage() {
  const [confirmation, setConfirmation] = useState<{ template: TemplateChoice; action: 'archive' | 'delete' } | null>(null)
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'files' ? 'files' : 'templates'
  const access = useDocumentsAccess()
  const navigate = useNavigate()
  const templates = useQuery({ queryKey: ['documents', 'choices'], queryFn: () => documentsService.list(), enabled: access.canManage, retry: false })
  if (!access.canManage) return <HEmptyState icon={FileText} title="Modèles de pièces" description="La gestion des modèles nécessite une accréditation Admin ou Superuser." />
  return <section>{tab === 'templates' && <HRecordPageActions><HButton size="small" asChild><Link to="/settings/documents/new"><Plus size={14} />Nouveau modèle</Link></HButton></HRecordPageActions>}<HSectionHeading title="Modèles de pièces" icon={FileText} description="Composition des devis, en-têtes, tableaux et styles de titres. Une publication crée une version figée." />
    <HRecordTabs label="Paramètres Documents" idPrefix="documents-settings" value={tab} onChange={(tab) => setParams({ tab }, { replace: true })} items={[{ value: 'templates', label: 'Modèles', panel: 'documents-templates' }, { value: 'files', label: 'Noms des PDF', panel: 'documents-files' }]} />
    <div role="tabpanel" id={`documents-${tab}`} aria-labelledby={`documents-settings-${tab}`}>{tab === 'files' ? <DocumentFileSettings /> : templates.error ? <p role="alert" className="field-error">{templates.error.message}</p> : !templates.data ? <HLoadingIndicator label="Chargement des modèles" /> : <HSettingsTable count={templates.data.length} noun="modèle"><table className="reference-table"><thead><tr><th>Modèle</th><th>Pièce</th><th>Version publiée</th><th className="settings-state-cell">État</th><th className="settings-actions-cell">Actions</th></tr></thead><tbody>{templates.data.map((template) => <tr key={template.id} tabIndex={0} className="studio-template-row" onClick={() => navigate(`/settings/documents/${template.id}`)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); navigate(`/settings/documents/${template.id}`) } }}><td><Link to={`/settings/documents/${template.id}`}>{template.name}</Link></td><td>Devis</td><td>{template.version ? `v${template.version}` : '—'}</td><td className="settings-state-cell"><HBadge tone={template.status === 'archived' ? 'neutral' : template.status === 'published' ? 'success' : 'info'}>{template.status === 'archived' ? 'Archivé' : template.status === 'published' ? 'Publié' : 'Brouillon'}</HBadge></td><td className="settings-actions-cell" onClick={(event) => event.stopPropagation()}><div>{template.status !== 'archived' && <HButton size="icon" variant="ghost" title="Archiver le modèle" onClick={() => setConfirmation({ template, action: 'archive' })}><Archive size={14} /></HButton>}{!template.version && <HButton size="icon" variant="ghost" title="Supprimer le modèle" onClick={() => setConfirmation({ template, action: 'delete' })}><Trash2 size={14} /></HButton>}</div></td></tr>)}</tbody></table>{!templates.data.length && <HEmptyState icon={FileText} title="Votre premier modèle" description="Créez un modèle, choisissez un devis réel pour l’aperçu, puis publiez sa première version." />}</HSettingsTable>}
    </div>
    {confirmation && <TemplateLifecycleDialog template={confirmation.template} action={confirmation.action} onClose={() => setConfirmation(null)} />}
  </section>
}

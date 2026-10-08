import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { FileText, Plus } from 'lucide-react'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { documentsService } from '../services/DocumentsService'
import { useDocumentsAccess } from '../hooks/useDocumentsAccess'
import '../studio.css'
export function TemplatesPage() {
  const access = useDocumentsAccess()
  const navigate = useNavigate()
  const templates = useQuery({ queryKey: ['documents', 'choices'], queryFn: () => documentsService.list(), enabled: access.canManage, retry: false })
  if (!access.canManage) return <HEmptyState icon={FileText} title="Modèles de pièces" description="La gestion des modèles nécessite une accréditation Admin ou Superuser." />
  return <section><HRecordPageActions><HButton size="small" asChild><Link to="/settings/documents/new"><Plus size={14} />Nouveau modèle</Link></HButton></HRecordPageActions><HSectionHeading title="Modèles de pièces" icon={FileText} description="Composition des devis, en-têtes, tableaux et styles de titres. Une publication crée une version figée." />
    {templates.error ? <p role="alert" className="field-error">{templates.error.message}</p> : !templates.data ? <HLoadingIndicator label="Chargement des modèles" /> : <div className="settings-reference-table"><table className="reference-table"><thead><tr><th>Modèle</th><th>Pièce</th><th>Version publiée</th><th>État</th></tr></thead><tbody>{templates.data.map((template) => <tr key={template.id} tabIndex={0} className="studio-template-row" onClick={() => navigate(`/settings/documents/${template.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/settings/documents/${template.id}`) } }}><td><Link to={`/settings/documents/${template.id}`}>{template.name}</Link></td><td>Devis</td><td>{template.version ? `v${template.version}` : '—'}</td><td>{template.status === 'archived' ? 'Archivé' : template.status === 'published' ? 'Publié' : 'Brouillon'}</td></tr>)}</tbody></table>{!templates.data.length && <HEmptyState icon={FileText} title="Votre premier modèle" description="Créez un modèle, choisissez un devis réel pour l’aperçu, puis publiez sa première version." />}</div>}
  </section>
}

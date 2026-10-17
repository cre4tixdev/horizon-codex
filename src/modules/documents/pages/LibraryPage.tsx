import '../library.css'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { BriefcaseBusiness, Building2, FileText, Folder, FolderOpen, FolderPlus, LayoutGrid, List, LockKeyhole, Pencil, Plus, RefreshCw, Settings2, Truck } from 'lucide-react'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { LibraryContextPicker } from '../components/LibraryContextPicker'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HButton } from '../../../shared/ui/HButton'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HDialog } from '../../../shared/ui/HDialog'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HTag } from '../../../shared/ui/HTag'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { LibraryFileCard } from '../components/LibraryFileCard'
import { LibraryEditor } from '../components/LibraryEditor'
import { LibraryFolderEditor } from '../components/LibraryFolderEditor'
import { LibraryVersionEditor } from '../components/LibraryVersionEditor'
import { LibraryDocumentPane } from '../components/LibraryDocumentPane'
import { useLibraryAccess, useLibraryChoices, useLibraryContext } from '../hooks/useLibrary'
import { libraryService } from '../services/LibraryService'
import { librarySpaces, libraryThemes, fileKinds, type LibraryFile, type LibraryFolder } from '../schemas/library'
const icons = { affairs: BriefcaseBusiness, customers: Building2, suppliers: Truck, internal: Folder }
export function LibraryPage() {
  const access = useLibraryAccess(), choices = useLibraryChoices(), [params, setParams] = useSearchParams(), route = useParams(), navigate = useNavigate()
  const parsedSpace = params.get('space') || 'affairs', space = parsedSpace in librarySpaces ? parsedSpace as keyof typeof librarySpaces : 'affairs', folder = params.get('folder') || ''
  const uploadSpace = space
  const contextId = params.get('context_id') || '', contextEntity = space === 'affairs' ? 'crm_opportunities' : 'contacts_companies'
  const context = useLibraryContext(contextEntity, space === 'internal' ? '' : contextId)
  const ready = space === 'internal' || Boolean(contextId || folder)
  const search = useDebouncedValue(params.get('q') || '')
  const query = new URLSearchParams(params); query.set('space', space); query.delete('view'); query.delete('document'); if (search) query.set('q', search); else query.delete('q')
  const queryKey = query.toString()
  const [editor, setEditor] = useState<LibraryFile | 'new' | null>(null), [folderEditor, setFolderEditor] = useState<LibraryFolder | 'new' | null>(null), [version, setVersion] = useState<LibraryFile | null>(null)
  const list = useQuery({ queryKey: ['ged', 'list', access.key, queryKey], queryFn: ({ signal }) => libraryService.list(Object.fromEntries(query), signal), enabled: access.canRead && ready, retry: false, staleTime: 60_000, refetchOnWindowFocus: false })
  const selectedId = route.id || params.get('document') || ''
  const record = useQuery({ queryKey: ['ged', 'record', access.key, selectedId], queryFn: () => libraryService.record(selectedId), enabled: access.canRead && Boolean(selectedId), retry: false, staleTime: 60_000 })
  useEffect(() => { if (route.id && record.data) { const next = new URLSearchParams(params); next.set('space', record.data.space); next.set('document', route.id); const linked = record.data.links.find((l) => l.entity === (record.data.space === 'affairs' ? 'crm_opportunities' : 'contacts_companies')); if (linked) next.set('context_id', linked.id); if (record.data.folder) next.set('folder', record.data.folder); navigate(`/documents?${next}`, { replace: true }) } }, [route.id, record.data, params, navigate])
  const set = (key: string, value: string) => setParams((v) => { const next = new URLSearchParams(v); if (value) next.set(key, value); else next.delete(key); if (key !== 'document' && key !== 'page') next.delete('page'); return next })
  const select = (id: string) => set('document', id)
  const sorting = useListTableSorting('-updated', { Document: 'name', 'Type de pièce': 'type_label', Version: 'number', Taille: 'size', 'Modifié le': 'updated', Auteur: 'author' })
  const folders = choices.data?.folders.filter((f) => f.space === space && (f.active || params.get('state') === 'archived')) || []
  const tree = (parent = '', level = 0): ReactNode => level >= 8 ? null : folders.filter((f) => f.parent === parent).map((f) => <div key={f.id}><div className="ged-folder-row" style={{ paddingLeft: level * 12 }}><HButton variant="ghost" size="small" title={f.name} aria-pressed={folder === f.id} onClick={() => setParams((v) => { const next = new URLSearchParams(v); next.set('space', f.space); next.set('folder', f.id); next.delete('page'); next.delete('document'); return next })}><Folder size={14} /><span>{f.name}</span>{f.visibility === 'restricted' && <LockKeyhole size={11} />}</HButton>{access.canWrite && (f.created_by === access.user?.id || access.canManage) && <HButton variant="ghost" size="icon" aria-label={`Modifier le dossier ${f.name}`} onClick={() => setFolderEditor(f)}><Pencil size={12} /></HButton>}</div>{tree(f.id, level + 1)}</div>)
  const currentFolder = folders.find((item) => item.id === folder)
  const render = (rows: LibraryFile[]) => params.get('view') === 'cards' ? <div className="contact-card-grid ged-card-grid">{rows.map((r) => <LibraryFileCard key={r.id} record={r} selected={selectedId === r.id} onSelect={() => select(r.id)} />)}</div> : <HDataTable data={rows} columnBorders listSorting={sorting} columns={[
    { id: 'Document', header: 'Document', accessorKey: 'name', cell: ({ row }) => <div className="ged-file-name"><FileText size={16} /><div><strong>{row.original.name}</strong><small>{[row.original.folder_name, row.original.links[0]?.label].filter(Boolean).join(' · ') || row.original.current.filename}</small></div>{row.original.visibility === 'restricted' && <LockKeyhole size={12} />}</div> },
    { id: 'Type de pièce', header: 'Type de pièce', cell: ({ row }) => row.original.type_label || libraryThemes[row.original.theme || ''] || 'Autres pièces jointes' },
    { id: 'Auteur', header: 'Auteur', accessorKey: 'author' },
    { id: 'Version', header: 'Version', cell: ({ row }) => row.original.origin ? <span title="Conservée dans la fiche d’origine">Pièce liée</span> : <HTag tone="blue">v{row.original.current.number}</HTag> },
    { id: 'Modifié le', header: 'Modifié le', cell: ({ row }) => new Date(row.original.updated).toLocaleDateString('fr-FR') },
  ]} getRowLink={(r) => { const next = new URLSearchParams(params); next.set('document', r.id); return { href: `/documents?${next}`, label: `Afficher ${r.name}` } }} />
  const group = params.get('group') || 'source', grouping = groupResults(list.data?.items || [], (r) => { const label = r.group_label || r.author; return { key: r.group_key || r.author, label: group === 'kind' ? fileKinds[label] || label : group === 'theme' ? libraryThemes[label] || label : label } }).map((g) => ({ ...g, total: list.data?.groups[g.key] || g.total }))
  return <div className="contact-directory ged-page"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Documents' }]} /><HPageHeader title="Documents" description="Documents classés par pièce d’origine : devis, commandes, livraisons et factures." actions={<>{access.canWrite && <><HButton variant="primary" disabled={!choices.data || !ready} onClick={() => setEditor('new')}><Plus size={14} />Ajouter des documents</HButton></>}{access.canSettings && <HButton asChild size="icon" variant="ghost"><Link to="/settings/ged" aria-label="Paramètres de la GED"><Settings2 size={14} /></Link></HButton>}</>} />
    {!access.canRead ? <HEmptyState icon={LockKeyhole} title="Documents" description="Une accréditation Documents / GED est nécessaire. Demandez-la à votre administrateur." /> : <><HRecordTabs label="Espaces documentaires" idPrefix="ged-space" value={space} onChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set('space', value); next.delete('folder'); next.delete('context_id'); next.delete('document'); next.delete('page'); return next })} items={Object.entries(librarySpaces).map(([value, label]) => ({ value, label, icon: icons[value as keyof typeof icons], panel: 'ged-library' }))} />

      {space !== 'internal' && <LibraryContextPicker key={space} space={space} value={contextId} onChange={(id) => setParams((current) => { const next = new URLSearchParams(current); if (id) next.set('context_id', id); else next.delete('context_id'); next.delete('folder'); next.delete('document'); next.delete('page'); return next }, { flushSync: true })} />}
      <div className="ged-layout" id="ged-library" role="tabpanel" aria-labelledby={`ged-space-${space}`}>
        <aside className="contact-panel ged-folders" aria-label="Classement des documents"><HSectionHeading title="Mes dossiers" icon={FolderOpen} description="Classement de vos dépôts" actions={access.canWrite && <HButton size="icon" variant="ghost" title="Nouveau dossier" aria-label="Nouveau dossier" disabled={!choices.data} onClick={() => setFolderEditor('new')}><FolderPlus size={15} /></HButton>} /><div className="ged-folder-content"><HButton variant="ghost" size="small" aria-pressed={!folder} onClick={() => setParams((v) => { const next = new URLSearchParams(v); next.delete('folder'); next.delete('document'); next.delete('page'); return next })}><FolderOpen size={14} />Tous les dossiers</HButton>{tree()}{!folders.length && <p className="contact-muted">Créez un dossier avec le bouton + pour classer vos fichiers.</p>}{choices.error && <p className="field-error" role="alert">{choices.error.message}</p>}</div></aside>
        <section className="contact-panel ged-results" aria-label="Bibliothèque documentaire"><HSectionHeading title="Documents" icon={FileText} description={`${librarySpaces[space]} / ${context.data?.label || currentFolder?.name || "Choisir un dossier"}`} actions={<div className="ged-results-toolbar"><span className="contact-result-count" role="status">{list.data?.totalItems ?? '—'} document(s)</span><div className="contact-view-switch" role="group" aria-label="Présentation des documents">{[{ value: 'list', label: 'Liste', icon: List }, { value: 'cards', label: 'Cartes', icon: LayoutGrid }].map(({ value, label, icon: Icon }) => <HButton key={value} size="small" variant="ghost" aria-pressed={(params.get('view') || 'list') === value} onClick={() => set('view', value)}><Icon size={14} />{label}</HButton>)}</div><HButton variant="ghost" size="icon" aria-label="Actualiser les documents" disabled={!ready || list.isFetching} onClick={() => { if (ready) void list.refetch(); void choices.refetch(); if (selectedId) void record.refetch() }}><RefreshCw size={14} /></HButton></div>} /><div className="ged-results-content">{!ready ? <HEmptyState icon={space === 'affairs' ? BriefcaseBusiness : Building2} title={space === 'affairs' ? 'Choisissez une affaire' : space === 'customers' ? 'Choisissez un client' : 'Choisissez un fournisseur'} description="Ses devis, commandes, livraisons, factures et pièces jointes s’afficheront ici après sélection." /> : list.isPending ? <HLoadingIndicator label="Chargement des documents" /> : list.error ? <HEmptyState icon={FileText} title="Bibliothèque indisponible" description={list.error.message}><HButton onClick={() => void list.refetch()}>Réessayer</HButton></HEmptyState> : list.data && <><HListPagination page={list.data.page} totalPages={list.data.totalPages} busy={list.isFetching} label="Pagination des documents" onPageChange={(page) => set('page', String(page))} />{list.data.items.length ? group === 'none' ? render(list.data.items) : <GroupedResults groups={grouping} icon={FileText} noun="documents" render={render} /> : <HEmptyState icon={FileText} title="Aucun document pour cette sélection" description="Ajoutez vos documents dans cet espace. Vous pourrez les classer par dossier et les rattacher à une affaire ou à une société." />}</>}</div></section>

      </div>
    </>}
    {selectedId && !editor && !version && <HDialog open onOpenChange={(open) => { if (!open) set('document', '') }} title="Aperçu du document" description="Consultez le fichier ; son classement et son historique sont regroupés dans les onglets." className="ged-preview-dialog">
      {record.isPending && selectedId ? <HLoadingIndicator label="Chargement du document sélectionné" /> : record.error ? <HEmptyState icon={LockKeyhole} title="Document indisponible" description={record.error.message} /> : record.data ? <LibraryDocumentPane key={record.data.id} record={record.data} onEdit={() => setEditor(record.data!)} onVersion={() => setVersion(record.data!)} /> : <HEmptyState icon={FileText} title="Aperçu du document" description="Sélectionnez un document pour consulter son contenu et ses informations." />}
    </HDialog>}
    {editor && choices.data && <LibraryEditor record={editor === 'new' ? undefined : editor} choices={choices.data} initialSource={context.data} space={currentFolder?.space || uploadSpace} folder={folder} onClose={() => setEditor(null)} onSaved={(id) => { if (editor !== 'new') select(id) }} />}
    {folderEditor && choices.data && <LibraryFolderEditor record={folderEditor === 'new' ? undefined : folderEditor} choices={choices.data} space={currentFolder?.space || uploadSpace} parent={folder} onClose={() => setFolderEditor(null)} />}
    {version && <LibraryVersionEditor record={version} onClose={() => setVersion(null)} />}
    {choices.error && (editor || folderEditor) && <p role="alert" className="field-error">{choices.error.message}</p>}
  </div>
}

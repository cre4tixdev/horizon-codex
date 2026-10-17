import { withColumnSortOptions, type SearchFilter } from '../../shared/search/filters'
import { fileKinds, libraryThemes, type LibraryCategory } from './schemas/library'
export const libraryFilters = (categories: readonly LibraryCategory[]): SearchFilter[] => [
  { key: 'theme', label: 'Types de pièce', defaultValue: '', multiple: true, options: [{ value: '', label: 'Tous les types de pièce' }, ...Object.entries(libraryThemes).map(([value, label]) => ({ value, label }))] },
  { key: 'category', label: 'Catégories', defaultValue: '', multiple: true, options: [{ value: '', label: 'Toutes les catégories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))] },
  { key: 'kind', label: 'Formats', defaultValue: '', multiple: true, options: [{ value: '', label: 'Tous les formats' }, ...Object.entries(fileKinds).map(([value, label]) => ({ value, label }))] },
  { key: 'state', label: 'Archives', defaultValue: 'active', appearance: 'compact', options: [{ value: 'active', label: 'Non archivés' }, { value: 'archived', label: 'Archivés' }] },
]
export const libraryGrouping: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: 'source', options: [{ value: 'none', label: 'Aucun regroupement' }, { value: 'source', label: 'Pièce d’origine' }, { value: 'theme', label: 'Type de pièce' }, { value: 'category', label: 'Catégorie' }, { value: 'folder', label: 'Dossier' }, { value: 'kind', label: 'Format' }, { value: 'author', label: 'Auteur' }, { value: 'affair', label: 'Affaire' }, { value: 'company', label: 'Société' }] }
export const librarySort = withColumnSortOptions({ key: 'sort', label: 'Trier par', defaultValue: '-updated', options: [{ value: '-updated', label: 'Dernière modification' }, { value: 'name', label: 'Nom du document' }] }, { name: 'Document', updated: 'Modifié le', created: 'Ajouté le', category_name: 'Catégorie', type_label: 'Type de pièce', author: 'Auteur', size: 'Taille', number: 'Version' })

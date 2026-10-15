import { withColumnSortOptions } from '../../shared/search/filters'
import type { SearchFilter } from '../../shared/search/filters'
import type { Category } from './schemas/catalog'
export const catalogFilters = (categories: Category[]): SearchFilter[] => [
  { key: 'category', label: 'Famille', multiple: true, defaultValue: '', options: [{ value: '', label: 'Toutes les familles' }, ...categories.map((item) => ({ value: item.id, label: item.label }))] },
  { key: 'state', label: 'Archives', appearance: 'compact', defaultValue: 'active', options: [{ value: 'active', label: 'Non archivés' }, { value: 'archived', label: 'Archivés' }] },
]
export const catalogSortFilter: SearchFilter = withColumnSortOptions({ key: 'sort', label: 'Trier par', defaultValue: 'name', options: [{ value: 'name', label: 'Nom' }, { value: 'sku', label: 'Référence' }, { value: '-created', label: 'Plus récents' }] }, {"name": "Nom", "sku": "Référence", "manufacturer": "Marque", "category_label": "Famille", "unit_cost": "Coût", "unit_price": "Prix de vente", "physical_quantity": "Qté en stock", "available_quantity": "Qté disponible"})
export const catalogGroupingFilter: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: '', options: [{ value: '', label: 'Aucun regroupement' }, { value: 'category', label: 'Famille' }, { value: 'manufacturer', label: 'Marque' }] }

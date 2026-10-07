import { List, ShieldCheck, Network } from 'lucide-react'
import type { SearchFilter } from '../../shared/search/filters'
import { erpProfiles, profileLabels } from '../../core/auth/schemas/access'
export const userProfileFilter: SearchFilter = { key: 'profile', label: 'Profil ERP', defaultValue: 'all', options: [{ value: 'all', label: 'Tous les profils' }, ...erpProfiles.map((value) => ({ value, label: profileLabels[value] }))] }
export const userGroupingFilter: SearchFilter = { key: 'group', label: 'Regrouper par', defaultValue: 'none', options: [{ value: 'none', label: 'Aucun regroupement', icon: List }, { value: 'profile', label: 'Profil ERP', icon: ShieldCheck }, { value: 'responsibility', label: 'Responsabilité', icon: Network }] }
export const userSortFilter: SearchFilter = { key: 'sort', label: 'Trier les utilisateurs', defaultValue: 'name:asc', options: [{ value: 'name:asc', label: 'Nom : A → Z' }, { value: 'name:desc', label: 'Nom : Z → A' }, { value: 'email:asc', label: 'E-mail : A → Z' }, { value: 'email:desc', label: 'E-mail : Z → A' }] }

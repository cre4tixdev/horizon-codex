import type { TagTone } from '../../shared/schemas/tagTone'
import { operationStates, operationTones, type Operation } from './schemas/operations'
import { PackageCheck, Truck, HardHat, ArrowLeftRight, RotateCcw, Route, Trash2 } from 'lucide-react'

export const operationTiles = [
  { key: 'IN', tone: 'blue', kind: 'IN', label: 'Réceptions', description: 'Faire entrer les produits reçus.', icon: PackageCheck, variant: '' },
  { key: 'OUT', tone: 'violet', kind: 'OUT', label: 'Livraisons client', description: 'Expédier les produits aux clients.', icon: Truck, variant: 'delivery' },
  { key: 'PREP', tone: 'amber', kind: 'PREP', label: 'Préparations chantier', description: 'Sortir le matériel pour une affaire.', icon: HardHat, variant: '' },
  { key: 'INT', tone: 'navy', kind: 'INT', label: 'Transferts internes', description: 'Déplacer le stock entre emplacements.', icon: ArrowLeftRight, variant: '' },
  { key: 'RET', tone: 'green', kind: 'RET', label: 'Retours', description: 'Retour client, chantier ou fournisseur.', icon: RotateCcw, variant: '' },
  { key: 'DS', tone: 'pink', kind: 'OUT', label: 'Livraisons directes', description: 'Du fournisseur au client.', icon: Route, variant: 'dropship' },
  { key: 'SCRAP', tone: 'pink', kind: 'OUT', label: 'Mises au rebut', description: 'Sortir les produits inutilisables.', icon: Trash2, variant: 'scrap' },
] as const

type StateRecord = Pick<Operation, 'status' | 'kind' | 'purchase_order' | 'archived_at'>
export function operationState(record: StateRecord): { label: string; tone: TagTone } {
  if (record.archived_at) return { label: 'Archivée', tone: 'navy' }
  if (record.status === 'draft' && record.kind === 'IN' && record.purchase_order) return { label: 'En attente', tone: 'amber' }
  return { label: operationStates[record.status] || record.status, tone: operationTones[record.status] || 'blue' }
}

import { FileText, Receipt, Truck, Target, ShoppingCart, PackageCheck } from 'lucide-react'
import type { RecordLink } from '../../shared/ui/HRecordLinks'

const planned: (RecordLink & { role: 'customer' | 'supplier' })[] = [
  { role: 'customer', id: 'quotes', label: 'Devis', icon: FileText, description: 'Devis clients en cours · module Ventes à venir' },
  { role: 'customer', id: 'sales-orders', label: 'Commandes', icon: ShoppingCart, description: 'Commandes clients en cours · module Ventes à venir' },
  { role: 'customer', id: 'customer-invoices', label: 'Factures', icon: Receipt, description: 'Factures clients à suivre · module Facturation à venir' },
  { role: 'customer', id: 'deliveries', label: 'Livraisons', icon: Truck, description: 'Bons de livraison à suivre · module Stock à venir' },
  { role: 'customer', id: 'opportunities', label: 'Opportunités', icon: Target, description: 'Opportunités ouvertes · module CRM à venir' },
  { role: 'supplier', id: 'purchase-orders', label: 'Achats', icon: ShoppingCart, description: 'Commandes fournisseurs en cours · module Achats à venir' },
  { role: 'supplier', id: 'receipts', label: 'Réceptions', icon: PackageCheck, description: 'Réceptions fournisseurs à suivre · module Stock à venir' },
  { role: 'supplier', id: 'supplier-invoices', label: 'Fact. fournisseurs', icon: Receipt, description: 'Factures fournisseurs à suivre · module Facturation à venir' },
]

export function companyShortcuts(roles: readonly ('customer' | 'supplier')[]) {
  return planned.filter((item) => roles.includes(item.role))
}

import { FileText, PackageOpen, ShoppingCart, Truck } from 'lucide-react'

export const tableTrackingColumns = [
  { key: 'purchase', label: 'Achats', icon: ShoppingCart },
  { key: 'receipt', label: 'Réceptions', icon: PackageOpen },
  { key: 'delivery', label: 'Livraisons', icon: Truck },
  { key: 'invoiced', label: 'Facturé', icon: FileText },
] as const

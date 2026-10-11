import { FilePenLine, Check, Mail, PackageCheck } from 'lucide-react'
import { HProgressSteps } from '../../../shared/ui/HProgressSteps'
import type { PurchaseKind, Purchase } from '../schemas/purchasing'

export function PurchaseProgress({ kind, status }: { kind: PurchaseKind; status: Purchase['status'] }) {
  const steps = kind === 'requests'
    ? [{ label: 'Brouillon', icon: FilePenLine }, { label: 'Validée', icon: Check }, { label: 'Traitée', icon: PackageCheck }]
    : [{ label: 'Brouillon', icon: FilePenLine }, { label: 'Validée', icon: Check }, { label: 'Envoyée', icon: Mail }, { label: 'Réceptionnée', icon: PackageCheck }]
  const current = status === 'cancelled' ? -1 : status === 'draft' ? 0 : kind === 'requests' ? ['ordered', 'completed'].includes(status) ? 2 : 1 : ['received', 'closed'].includes(status) ? 3 : ['sent', 'acknowledged', 'partially_received'].includes(status) ? 2 : 1
  return <HProgressSteps label={kind === 'requests' ? 'Avancement de la demande d’achat' : 'Avancement de la commande fournisseur'} className="quote-progress" steps={steps.map((step, index) => ({ ...step, id: step.label, state: index === current ? 'current' : index < current ? 'done' : 'pending' }))} />
}

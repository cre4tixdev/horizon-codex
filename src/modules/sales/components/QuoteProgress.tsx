import { FilePenLine, FileText, Mail, ShoppingBag } from 'lucide-react'
import { HProgressSteps } from '../../../shared/ui/HProgressSteps'
import type { Quote } from '../schemas/quotes'
const steps = [{ label: 'Brouillon', icon: FilePenLine }, { label: 'Devis', icon: FileText }, { label: 'Envoyé', icon: Mail }, { label: 'Commande client', icon: ShoppingBag }]
export function QuoteProgress({ status, sent }: { status: Quote['status']; sent: boolean }) {
  const current = { draft: 0, validated: 1, sent: 2, accepted: 3, cancelled: -1, rejected: -1 }[status]
  return <HProgressSteps label="Avancement du devis" className="quote-progress" steps={steps.map((step, index) => ({ ...step, id: step.label, state: index === current ? 'current' : index < current && !(index === 2 && !sent) ? 'done' : 'pending' }))} />
}

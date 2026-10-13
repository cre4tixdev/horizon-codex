import { FilePenLine, Check, Wallet, Ban } from 'lucide-react'
import { HProgressSteps } from '../../../shared/ui/HProgressSteps'
import type { Bill } from '../schemas/billing'
export function BillProgress({ record }: { record?: Bill | undefined }) {
  const current = !record || record.status === 'draft' ? 0 : record.balance <= 0 ? 2 : 1
  return <HProgressSteps label="Avancement de la facture" steps={record?.status === 'cancelled' ? [{ id: 'draft', label: 'Brouillon', icon: FilePenLine, state: 'done' }, { id: 'cancelled', label: 'Annulée', icon: Ban, state: 'current', tone: 'amber', color: '#DC2626' }] : [{ id: 'draft', label: 'Brouillon', icon: FilePenLine }, { id: 'validated', label: 'Validée', icon: Check }, { id: 'settled', label: 'Soldée', icon: Wallet }].map((step, index) => ({ ...step, state: index === current ? 'current' : index < current ? 'done' : 'pending' }))} />
}

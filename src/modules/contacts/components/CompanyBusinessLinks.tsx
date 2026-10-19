import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Receipt, Truck, Target, ShoppingCart, PackageCheck, FolderOpen } from 'lucide-react'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { HRelatedRecordsDialog } from '../../../shared/ui/HRelatedRecordsDialog'
import { contactsService } from '../services/ContactsService'
import type { Company } from '../types/contacts'
const groups = [
  ['opportunities', 'Opportunités', Target], ['tenders', 'Appels d’offres', FolderOpen], ['quotes', 'Devis', FileText], ['sales-orders', 'Commandes', ShoppingCart], ['customer-invoices', 'Factures', Receipt], ['customer-credits', 'Avoirs', Receipt], ['deliveries', 'Livraisons', Truck], ['requests', 'Demandes d’achat', ShoppingCart], ['purchase-orders', 'Achats', ShoppingCart], ['receipts', 'Réceptions', PackageCheck], ['supplier-invoices', 'Fact. fournisseurs', Receipt], ['supplier-credits', 'Avoirs fournisseurs', Receipt], ['stock', 'Autres bons', PackageCheck], ['expenses', 'Notes de frais', Receipt],
] as const
export function CompanyBusinessLinks({ company, person = false, busy = false }: { company: Company; person?: boolean; busy?: boolean }) {
  const [section, setSection] = useState('')
  const query = useQuery({ queryKey: ['contacts', 'business-links', company.id, company.updated], queryFn: () => contactsService.businessLinks(company.id), retry: false })
  const items = groups.filter(([key]) => Boolean(query.data?.[key]?.length)).map(([key, label, icon]) => ({ id: key, label, icon, count: query.data?.[key]?.length, description: `Consulter les ${label.toLowerCase()} de cette société, fiches fusionnées incluses`, onSelect: () => setSection(key) }))
  return <>{query.error && <p role="alert" className="field-error">{query.error.message}</p>}<HBreadcrumbActions placement="related"><HRecordLinks items={items} busy={busy || query.isFetching} label={person ? 'Objets métier de la société associée' : 'Objets métier de la société'} /></HBreadcrumbActions>{section && <HRelatedRecordsDialog title={groups.find(([key]) => key === section)?.[1] || 'Pièces associées'} records={query.data?.[section] || []} onClose={() => setSection('')} />}</>
}

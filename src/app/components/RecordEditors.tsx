import { lazy } from 'react'
import type { ReactNode } from 'react'
import { RecordWorkspace } from '../../shared/records/RecordWorkspace'
import type { RecordAdapter } from '../../shared/records/recordContext'
const ContactPage = lazy(async () => ({ default: (await import('../../modules/contacts/pages/ContactPage')).ContactPage }))
const OpportunityPage = lazy(async () => ({ default: (await import('../../modules/crm/pages/OpportunityPage')).OpportunityPage }))
const QuotePage = lazy(async () => ({ default: (await import('../../modules/sales/pages/QuotePage')).QuotePage }))
const ProductPage = lazy(async () => ({ default: (await import('../../modules/inventory/pages/ProductPage')).ProductPage }))
const recordAdapters: Record<string, RecordAdapter> = {
  product: { path: '/inventory/products', createTitle: 'Nouveau produit', viewTitle: 'Fiche produit', render: () => <ProductPage /> },
  quote: { path: '/sales/quotes', createTitle: 'Nouveau devis', viewTitle: 'Fiche devis', render: () => <QuotePage /> },
  opportunity: { path: '/crm/opportunities', createTitle: 'Nouvelle opportunité', viewTitle: 'Fiche opportunité', render: () => <OpportunityPage /> },
  company: { path: '/contacts/companies', createTitle: 'Créer une société', viewTitle: 'Fiche société', render: () => <ContactPage kind="companies" /> },
  person: { path: '/contacts/people', createTitle: 'Créer un contact', viewTitle: 'Fiche contact', render: () => <ContactPage kind="people" /> },
}

export function RecordEditors({ children }: { children: ReactNode }) { return <RecordWorkspace adapters={recordAdapters}>{children}</RecordWorkspace> }

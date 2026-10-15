import { lazy } from 'react'
import type { ReactNode } from 'react'
import { RecordWorkspace } from '../../shared/records/RecordWorkspace'
import type { RecordAdapter } from '../../shared/records/recordContext'
const ContactPage = lazy(async () => ({ default: (await import('../../modules/contacts/pages/ContactPage')).ContactPage }))
const OpportunityPage = lazy(async () => ({ default: (await import('../../modules/crm/pages/OpportunityPage')).OpportunityPage }))
const QuotePage = lazy(async () => ({ default: (await import('../../modules/sales/pages/QuotePage')).QuotePage }))
const ProductPage = lazy(async () => ({ default: (await import('../../modules/inventory/pages/ProductPage')).ProductPage }))
const PurchasePage = lazy(async () => ({ default: (await import('../../modules/purchasing/pages/PurchasePage')).PurchasePage }))
const OperationPage = lazy(async () => ({ default: (await import('../../modules/inventory/pages/OperationPage')).OperationPage }))
const BillPage = lazy(async () => ({ default: (await import('../../modules/billing/pages/BillPage')).BillPage }))
const recordAdapters: Record<string, RecordAdapter> = {
  'stock-operation': { path: '/inventory/operations', createTitle: 'Nouvelle opération', viewTitle: 'Opération de stock', render: () => <OperationPage /> },
  ...Object.fromEntries(['customer', 'supplier', 'customer_credit', 'supplier_credit'].map((kind) => [`billing-${kind}`, { path: `/billing/${kind}`, createTitle: 'Nouvelle pièce', viewTitle: kind.endsWith('_credit') ? 'Avoir' : 'Facture', render: () => <BillPage /> }])),
  'purchase-request': { path: '/purchasing/requests', createTitle: 'Préparer les achats', viewTitle: 'Demande d’achat', render: () => <PurchasePage /> },
  'purchase-order': { path: '/purchasing/orders', createTitle: 'Nouvelle commande fournisseur', viewTitle: 'Commande fournisseur', render: () => <PurchasePage /> },
  product: { path: '/inventory/products', createTitle: 'Nouveau produit', viewTitle: 'Fiche produit', render: () => <ProductPage /> },
  quote: { path: '/sales/quotes', createTitle: 'Nouveau devis', viewTitle: 'Fiche devis', render: () => <QuotePage /> },
  opportunity: { path: '/crm/opportunities', createTitle: 'Nouvelle opportunité', viewTitle: 'Fiche opportunité', render: () => <OpportunityPage /> },
  company: { path: '/contacts/companies', createTitle: 'Créer une société', viewTitle: 'Fiche société', render: () => <ContactPage kind="companies" /> },
  person: { path: '/contacts/people', createTitle: 'Créer un contact', viewTitle: 'Fiche contact', render: () => <ContactPage kind="people" /> },
}

export function RecordEditors({ children }: { children: ReactNode }) { return <RecordWorkspace adapters={recordAdapters}>{children}</RecordWorkspace> }

import { MergeDialog } from '../../../shared/merge/MergeDialog'
import { ContactAvatar } from './ContactIdentity'
import { contactsService } from '../services/ContactsService'
import type { MergeAdapter, MergeIdentity } from '../../../shared/merge/schema'
import type { Company, ContactKind, Person } from '../types/contacts'
const labels: Record<string, string> = { logo: 'Logo', avatar: 'Photo', name: 'Nom usuel', legal_name: 'Raison sociale', siren: 'SIREN', siret: 'SIRET', vat_number: 'N° TVA', lei: 'LEI', email: 'E-mail', phone: 'Téléphone', mobile: 'Mobile', website: 'Site web', notes: 'Notes', preferred_language: 'Langue', default_currency: 'Devise', payment_term: 'Conditions de paiement', billing_email: 'E-mail de facturation', einvoice_routing_address: 'Adresse électronique', einvoice_platform: 'Plateforme agréée', einvoice_service_code: 'Code service', einvoice_status: 'Facturation électronique', first_name: 'Prénom', last_name: 'Nom', job_title: 'Fonction', company: 'Société' }
export function ContactMergeDialog({ kind, record, initialSource, onClose, onMerged }: { kind: ContactKind; record: Company | Person; initialSource?: MergeIdentity | undefined; onClose: () => void; onMerged: (id: string) => Promise<void> }) {
  const adapter: MergeAdapter = {
    key: `contacts-${kind}`, title: kind === 'companies' ? 'Fusionner les sociétés' : 'Fusionner les contacts', labels,
    countLabels: { people: 'contact(s)', addresses: 'adresse(s)', roles: 'relation(s)', contacts: 'fiche(s) associée(s)', references: 'référence(s) d’import', crm: 'dossier(s) CRM', sales: 'pièce(s) de vente', purchasing: 'pièce(s) d’achat', billing: 'pièce(s) de facturation', inventory: 'référence(s) catalogue / stock', documents: 'lien(s) documentaire(s)', expenses: 'dépense(s)', hr: 'ressource(s)', analysis: 'compte(s) analytique(s)' },
    description: kind === 'companies' ? 'Les pièces et leurs e-mails restent accessibles depuis la société conservée. Les brouillons modifiables sont réaffectés ; les pièces finalisées, PDF et identités historiques sont conservés. Les adresses sont reprises sans modifier les originaux. La fusion est définitive.' : 'Les adresses principales de la fiche conservée sont prioritaires. L’autre fiche sera archivée ; ses anciennes valeurs, fichiers et son fil resteront consultables.',
    search: (search) => contactsService.mergeChoices(kind, search),
    preview: (input) => contactsService.mergePreview({ ...input, kind }), apply: (input) => contactsService.mergeApply({ ...input, kind }),
  }
  return <MergeDialog kind={kind} record={{ id: record.id, collectionId: record.collectionId, label: 'name' in record ? record.name : [record.first_name, record.last_name].filter(Boolean).join(' ') }} initialSource={initialSource} adapter={adapter} onClose={onClose} onMerged={onMerged} renderImage={(identity, filename) => <ContactAvatar kind={kind === 'companies' ? 'company' : 'person'} collectionId={identity.collectionId} id={identity.id} filename={filename} />} />
}

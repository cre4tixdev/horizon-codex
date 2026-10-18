const actions = { create: 'À créer', update: 'À modifier', skip: 'Ignorée', conflict: 'À résoudre', error: 'Erreur' }
const labels = { name: 'Nom de la société', legal_name: 'Raison sociale', email: 'E-mail', phone: 'Téléphone', mobile: 'Mobile', website: 'Site web', first_name: 'Prénom', last_name: 'Nom', job_title: 'Fonction', notes: 'Notes', siren: 'SIREN', siret: 'SIRET', vat_number: 'TVA', customer: 'Client', supplier: 'Fournisseur', company: 'Société', line1: 'Adresse', line2: 'Complément', postal_code: 'Code postal', city: 'Ville', country: 'Pays', address_id: 'Adresse principale', address_updated: 'Date de modification de l’adresse', updated: 'Date de modification', active: 'Archivage', image_hash: 'Image', image_filename: 'Fichier image' }

module.exports = (expected, actual) => {
  if (expected.status !== actual.status) return { reason: 'action', fields: [], message: `l’action prévue passe de « ${actions[expected.status] || 'À vérifier'} » à « ${actions[actual.status] || 'À vérifier'} ».` }
  if (expected.record_id !== actual.record_id) return { reason: 'target', fields: [], message: 'la fiche reconnue a changé.' }
  if (expected.fingerprint === actual.fingerprint) return null
  const fields = Object.keys(labels).filter((key) => JSON.stringify(expected.before[key]) !== JSON.stringify(actual.before[key]))
  return { reason: 'snapshot', fields, message: fields.length ? `la fiche a changé : ${fields.map((key) => labels[key]).join(', ')}.` : 'l’empreinte de vérification a changé ; la préparation doit être revérifiée.' }
}

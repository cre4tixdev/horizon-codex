const labels = {
  name: 'Nom usuel', legal_name: 'Raison sociale', first_name: 'Prénom', last_name: 'Nom', job_title: 'Fonction', email: 'E-mail', phone: 'Téléphone', mobile: 'Mobile', website: 'Site web',
  siren: 'SIREN', siret: 'SIRET', vat_number: 'Numéro de TVA', lei: 'LEI', preferred_language: 'Langue', default_currency: 'Devise', notes: 'Notes internes', active: 'Statut', logo: 'Logo', avatar: 'Photo', company: 'Société',
  billing_email: 'E-mail de facturation', einvoice_platform: 'Plateforme agréée', einvoice_routing_address: 'Adresse de facturation électronique', einvoice_service_code: 'Code service', einvoice_status: 'Préparation facturation',
  line1: 'Adresse', line2: 'Complément', postal_code: 'Code postal', city: 'Ville', country: 'Pays', state_region: 'Région', is_primary: 'Adresse principale', label: 'Libellé', type: 'Usage', account_code: 'Compte',
}
const statusLabels = { todo: 'À faire', in_progress: 'En cours', blocked: 'Bloquée', done: 'Terminée', cancelled: 'Annulée' }
const allowed = (app, user, write = false) => {
  if (!user || user.collection().name !== 'core_users' || !user.getBool('active')) return false
  const role = app.findRecordById('core_roles', user.getString('role'))
  const permissions = JSON.parse(role.getString('permissions') || '[]')
  return role.getBool('active') && permissions.includes('contacts.read') && (!write || permissions.includes('contacts.write'))
}
const source = (app, entity, id, writable = false) => {
  if (!['contacts_companies', 'contacts_people'].includes(entity) || !/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Fiche invalide.')
  let record
  try { record = app.findRecordById(entity, id) } catch { throw new ApiError(404, 'Fiche introuvable.') }
  if (writable && !record.getBool('active')) throw new BadRequestError('Cette fiche est archivée.')
  return record
}
const author = (app, id) => {
  if (!id) return { name: 'Système', initials: 'H' }
  try { const user = app.findRecordById('core_users', id); const name = user.getString('name') || 'Utilisateur Horizon'; return { name, initials: name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() } } catch { return { name: 'Ancien utilisateur', initials: 'U' } }
}
const targetName = (record) => record.collection().name === 'contacts_companies' ? record.getString('name') : [record.getString('first_name'), record.getString('last_name')].filter(Boolean).join(' ')
const notification = (...args) => require(`${__hooks}/lib/notification-service.js`)(...args)
const recipient = (app, id) => { let user; try { user = app.findRecordById('core_users', id) } catch { throw new BadRequestError('Utilisateur mentionné introuvable.') }; if (!allowed(app, user)) throw new BadRequestError('Ce destinataire ne peut pas consulter la fiche.'); return user }
const publish = (app, root, actor, type, body, metadata, operation = '') => {
  const entity = root.collection().name
  let existing
  if (operation && type === 'change') existing = app.findRecordsByFilter('core_activity_events', 'source_entity = {:entity} && source_record_id = {:id} && author = {:actor} && operation_id = {:operation} && type = "change"', '-created', 1, 0, { entity, id: root.id, actor, operation })[0]
  if (existing && Date.now() - new Date(existing.getString('created').replace(' ', 'T')).getTime() < 60000) {
    const previous = JSON.parse(existing.getString('metadata') || '{}')
    existing.set('metadata', { ...previous, changes: [...previous.changes || [], ...metadata.changes || []] })
    app.save(existing)
    return existing
  }
  const record = new Record(app.findCollectionByNameOrId('core_activity_events'))
  for (const [key, value] of Object.entries({ source_module: 'contacts', source_entity: entity, source_record_id: root.id, author: actor, type, body, metadata: { ...metadata, author: author(app, actor) }, operation_id: operation })) record.set(key, value)
  app.save(record)
  return record
}
const display = (app, field, value) => {
  if (field === 'company' && value) { try { return targetName(app.findRecordById('contacts_companies', value)) } catch { return 'Ancienne société' } }
  if (field === 'active') return value ? 'Actif' : 'Archivé'
  if (field === 'type') return ({ registered: 'Siège', billing: 'Facturation', shipping: 'Livraison', other: 'Autre' })[value] || value
  if (field === 'is_primary') return value ? 'Oui' : 'Non'
  if (field === 'einvoice_status') return ({ unknown: 'À vérifier', to_configure: 'À compléter', ready: 'Informations renseignées', not_applicable: 'Non concerné' })[value] || 'Non renseigné'
  return String(value ?? '').slice(0, 500)
}
module.exports = {
  allowed, source, author, recipient, publish, notification, statusLabels,
  track(app, record, before, action, actor, operation) {
    if (!app.findAllCollections().some((collection) => collection.name === 'core_activity_events')) return
    const name = record.collection().name
    if (!['contacts_companies', 'contacts_people', 'contacts_addresses', 'contacts_company_roles', 'accounting_third_party_accounts'].includes(name) || action === 'delete') return
    const root = ['contacts_companies', 'contacts_people'].includes(name) ? record : source(app, 'contacts_companies', record.getString('company'))
    const after = record.publicExport()
    let changes = []
    if (name === 'contacts_company_roles') {
      if (Boolean(before?.active) !== Boolean(after.active)) changes = [{ field: `role_${after.role}`, label: after.role === 'customer' ? 'Relation Client' : 'Relation Fournisseur', before: before?.active ? 'Oui' : 'Non', after: after.active ? 'Oui' : 'Non' }]
    } else {
      const fields = name === 'accounting_third_party_accounts' ? ['account_code', 'active'] : Object.keys(labels).filter((field) => !['contacts_addresses'].includes(name) || field !== 'company')
      changes = fields.filter((field) => Object.hasOwn(after, field) && (before ? JSON.stringify(before[field]) !== JSON.stringify(after[field]) : Boolean(after[field]))).map((field) => {
        const prefix = name === 'contacts_addresses' ? 'Adresse · ' : name === 'accounting_third_party_accounts' ? (after.type === 'customer' ? 'Compte client · ' : 'Compte fournisseur · ') : ''
        return { field, label: prefix + labels[field], before: ['logo', 'avatar'].includes(field) ? before?.[field] ? 'Image présente' : '' : before ? display(app, field, before[field]) : '', after: ['logo', 'avatar'].includes(field) ? after[field] ? 'Image chargée' : 'Image retirée' : display(app, field, after[field]) }
      })
    }
    if (!changes.length) return
    const rootAction = name === root.collection().name ? action : 'update'
    publish(app, root, actor, ['archive', 'restore'].includes(rootAction) ? 'status_change' : 'change', rootAction === 'create' ? 'Fiche créée' : rootAction === 'archive' ? 'Fiche archivée' : rootAction === 'restore' ? 'Fiche réactivée' : 'Fiche mise à jour', { action: rootAction, changes }, operation)
  },
}

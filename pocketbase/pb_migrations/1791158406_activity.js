migrate((app) => {
  const names = ['core_activity_events', 'core_activity_mentions', 'core_tasks']
  if (app.findAllCollections().some((collection) => names.includes(collection.name))) throw new Error('Activity migration refused: a target collection already exists; review its schema.')
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const source = '((source_entity = "contacts_companies" && @collection.contacts_companies.id ?= source_record_id) || (source_entity = "contacts_people" && @collection.contacts_people.id ?= source_record_id))'
  const read = `${auth} && @request.auth.role.permissions ~ '"contacts.read"' && source_module = "contacts" && ${source}`
  const write = `${read} && @request.auth.role.permissions ~ '"contacts.write"'`
  const text = (name, max, required = false) => ({ name, type: 'text', max, required })
  const user = (name, required = false) => ({ name, type: 'relation', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 1, required, cascadeDelete: false })
  const sourceFields = [text('source_module', 80, true), text('source_entity', 80, true), text('source_record_id', 15, true)]
  const created = { type: 'autodate', name: 'created', onCreate: true }
  const events = new Collection({ name: 'core_activity_events', type: 'base', listRule: read, viewRule: read,
    createRule: write, updateRule: null, deleteRule: null,
    fields: [...sourceFields, { name: 'type', type: 'select', maxSelect: 1, required: true, values: ['change', 'status_change', 'note', 'message', 'document', 'task', 'system'] }, user('author'), text('body', 10000), text('operation_id', 64),
      { name: 'metadata', type: 'json', maxSize: 100000 }, { name: 'mentions', type: 'relation', collectionId: app.findCollectionByNameOrId('core_users').id, maxSelect: 10, cascadeDelete: false },
      { name: 'attachments', type: 'file', maxSelect: 5, maxSize: 10485760, protected: true, mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'] }, created],
    indexes: ['CREATE INDEX idx_activity_source_created ON core_activity_events (source_entity, source_record_id, created)', 'CREATE INDEX idx_activity_operation ON core_activity_events (operation_id, author, source_entity, source_record_id)'],
  })
  app.save(events)
  app.save(new Collection({ name: 'core_activity_mentions', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [{ name: 'event', type: 'relation', collectionId: events.id, required: true, maxSelect: 1, cascadeDelete: false }, user('user', true), { name: 'notified_at', type: 'date' }, { name: 'read_at', type: 'date' }],
    indexes: ['CREATE UNIQUE INDEX idx_activity_mention_user ON core_activity_mentions (event, user)'],
  }))
  app.save(new Collection({ name: 'core_tasks', type: 'base', listRule: read, viewRule: read, createRule: null, updateRule: write, deleteRule: null,
    fields: [...sourceFields, text('title', 160, true), text('description', 10000), user('created_by', true), user('assigned_to', true), text('assigned_name', 160), { name: 'due_date', type: 'date' },
      { name: 'priority', type: 'select', maxSelect: 1, values: ['low', 'normal', 'high'], required: true }, { name: 'status', type: 'select', maxSelect: 1, values: ['todo', 'in_progress', 'blocked', 'done', 'cancelled'], required: true },
      { name: 'activity_event', type: 'relation', collectionId: events.id, maxSelect: 1, required: true, cascadeDelete: false }, { name: 'completed_at', type: 'date' }, created,
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }],
    indexes: ['CREATE UNIQUE INDEX idx_task_event ON core_tasks (activity_event)', 'CREATE INDEX idx_task_source ON core_tasks (source_entity, source_record_id, status)'],
  }))
  const notifications = app.findCollectionByNameOrId('core_notifications')
  notifications.fields.add(new RelationField({ name: 'activity_event', collectionId: events.id, maxSelect: 1, cascadeDelete: false }))
  const notificationAccess = `type != "activity" || (${read})`
  notifications.listRule = `(${notifications.listRule}) && (${notificationAccess})`
  notifications.viewRule = `(${notifications.viewRule}) && (${notificationAccess})`
  notifications.updateRule = `(${notifications.updateRule}) && (${notificationAccess}) && @request.body.activity_event:changed = false`
  app.save(notifications)
  // Project existing technical audits into the readable feed, preserving their dates.
  // This frozen mapping deliberately excludes technical/security fields.
  const labels = { name: 'Nom usuel', legal_name: 'Raison sociale', first_name: 'Prénom', last_name: 'Nom', job_title: 'Fonction', email: 'E-mail', phone: 'Téléphone', mobile: 'Mobile', website: 'Site web', siren: 'SIREN', siret: 'SIRET', vat_number: 'Numéro de TVA', lei: 'LEI', notes: 'Notes internes', preferred_language: 'Langue', default_currency: 'Devise', active: 'Statut', logo: 'Logo', avatar: 'Photo', line1: 'Adresse', line2: 'Complément', city: 'Ville', country: 'Pays', postal_code: 'Code postal', state_region: 'Région', account_code: 'Compte', billing_email: 'E-mail de facturation', einvoice_platform: 'Plateforme agréée', einvoice_routing_address: 'Adresse de facturation électronique', einvoice_service_code: 'Code service', einvoice_status: 'Préparation facturation' }
  for (let offset = 0; ; offset += 100) {
    const audits = app.findRecordsByFilter('core_audit', 'module = "contacts" || module = "accounting"', 'created,id', 100, offset)
    if (!audits.length) break
    for (const audit of audits) {
      const entity = audit.getString('entity')
      if (!['contacts_companies', 'contacts_people', 'contacts_addresses', 'contacts_company_roles', 'accounting_third_party_accounts'].includes(entity) || audit.getString('action') === 'delete') continue
      const before = JSON.parse(audit.getString('before') || 'null')
      const after = JSON.parse(audit.getString('after') || 'null')
      if (!after) continue
      const direct = ['contacts_companies', 'contacts_people'].includes(entity)
      const rootEntity = direct ? entity : 'contacts_companies'
      const id = direct ? audit.getString('entity_id') : after.company
      try { app.findRecordById(rootEntity, id) } catch { continue }
      const prefix = entity === 'contacts_addresses' ? 'Adresse · ' : entity === 'accounting_third_party_accounts' ? (after.type === 'customer' ? 'Compte client · ' : 'Compte fournisseur · ') : ''
      const display = (field, value) => ['logo', 'avatar'].includes(field) ? value ? 'Image présente' : '' : field === 'active' ? value ? 'Actif' : 'Archivé' : String(value ?? '').slice(0, 500)
      const changes = entity === 'contacts_company_roles' ? Boolean(before?.active) !== Boolean(after.active) ? [{ field: `role_${after.role}`, label: after.role === 'customer' ? 'Relation Client' : 'Relation Fournisseur', before: before?.active ? 'Oui' : 'Non', after: after.active ? 'Oui' : 'Non' }] : [] : Object.keys(labels).filter((field) => Object.hasOwn(after, field) && (before ? JSON.stringify(before[field]) !== JSON.stringify(after[field]) : Boolean(after[field]))).map((field) => ({ field, label: prefix + labels[field], before: before ? display(field, before[field]) : '', after: display(field, after[field]) }))
      if (!changes.length) continue
      const actor = audit.getString('user')
      let name = 'Système'
      if (actor) { try { name = app.findRecordById('core_users', actor).getString('name') || 'Utilisateur Horizon' } catch { name = 'Ancien utilisateur' } }
      const item = new Record(events)
      const action = audit.getString('action')
      for (const [field, value] of Object.entries({ source_module: 'contacts', source_entity: rootEntity, source_record_id: id, author: actor, type: ['archive', 'restore'].includes(action) ? 'status_change' : 'change', body: action === 'create' && direct ? 'Fiche créée' : action === 'archive' ? 'Fiche archivée' : action === 'restore' ? 'Fiche réactivée' : 'Fiche mise à jour', metadata: { action, audit_id: audit.id, author: { name, initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() }, changes } })) item.set(field, value)
      app.save(item)
      // Autodate protects created during save; this migration preserves the original audit date.
      app.db().newQuery('UPDATE core_activity_events SET created = {:created} WHERE id = {:id}').bind({ created: audit.getString('created'), id: item.id }).execute()
    }
  }
}, () => { throw new Error('Activity rollback refused: preserve history and tasks; use a corrective migration.') })

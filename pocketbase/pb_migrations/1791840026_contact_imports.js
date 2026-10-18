migrate((app) => {
  const names = ['core_import_jobs', 'core_import_rows', 'core_import_profiles', 'core_external_references', 'settings_import_odoo']
  if (app.findAllCollections().some((collection) => names.includes(collection.name))) throw new Error('Import migration requires review of existing collections; no existing data will be replaced.')
  const text = (name, max = 255) => new TextField({ name, max })
  const relation = (name, target) => new RelationField({ name, collectionId: app.findCollectionByNameOrId(target).id, maxSelect: 1, cascadeDelete: false })
  const json = (name) => new JSONField({ name, maxSize: 1000000 })
  const create = (name, fields, indexes) => {
    const collection = new Collection({ name, type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
    for (const field of [...fields, new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })]) collection.fields.add(field)
    collection.indexes = indexes; app.save(collection)
  }
  create('core_import_jobs', [text('type', 30), text('source', 30), text('filename'), text('namespace'), text('creation_key', 80), text('status', 30), text('mode', 30), relation('created_by', 'core_users'), json('mapping'), json('summary'), text('error', 1000), new DateField({ name: 'started_at' }), new DateField({ name: 'completed_at' })], ['CREATE UNIQUE INDEX idx_import_job_key ON core_import_jobs(created_by,creation_key)', 'CREATE INDEX idx_import_owner ON core_import_jobs(created_by,created)'])
  create('core_import_rows', [relation('job', 'core_import_jobs'), new NumberField({ name: 'row_number', onlyInt: true }), text('source_key'), text('status', 30), text('match_type', 80), text('matched_record_id', 15), json('normalized_data'), json('before'), text('fingerprint', 64), text('resolution', 40), text('error', 1000)], ['CREATE UNIQUE INDEX idx_import_row ON core_import_rows(job,row_number)'])
  create('core_import_profiles', [relation('owner', 'core_users'), text('name', 100), text('type', 30), json('headers'), json('mapping'), text('mode', 30)], ['CREATE UNIQUE INDEX idx_import_profile ON core_import_profiles(owner,type,name)'])
  create('core_external_references', [text('provider'), text('entity_type', 80), text('external_id'), text('horizon_record_id', 15), text('external_updated_at', 80), new DateField({ name: 'last_synced_at' })], ['CREATE UNIQUE INDEX idx_external_reference ON core_external_references(provider,entity_type,external_id)', 'CREATE INDEX idx_external_entity_id ON core_external_references(entity_type,external_id)'])
  create('settings_import_odoo', [text('key', 30), text('base_url'), text('database'), new TextField({ name: 'api_key_cipher', max: 6000, hidden: true })], ['CREATE UNIQUE INDEX idx_import_odoo_key ON settings_import_odoo(key)'])
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin"', '', 0, 0)) {
    const role = app.findRecordById('core_roles', user.getString('role')), rights = JSON.parse(role.getString('permissions') || '[]')
    if (!rights.includes('contacts.import')) { role.set('permissions', [...rights, 'contacts.import']); app.save(role) }
  }
}, () => { throw new Error('Conserver la traçabilité des imports ; utiliser une migration corrective.') })

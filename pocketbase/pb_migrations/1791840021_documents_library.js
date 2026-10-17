migrate((app) => {
  const names = ['documents_categories', 'documents_folders', 'documents_files', 'documents_file_versions', 'documents_links']
  if (app.findAllCollections().some((c) => names.includes(c.name))) throw new Error('GED: une collection cible existe déjà. Vérifier le schéma avant migration.')
  const text = (name, max = 255, required = false) => new TextField({ name, max, required })
  const rel = (name, table, maxSelect = 1) => new RelationField({ name, collectionId: app.findCollectionByNameOrId(table).id, maxSelect, cascadeDelete: false })
  const create = (name, fields, indexes = []) => {
    const c = new Collection({ name, type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
    for (const f of [...fields, new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })]) c.fields.add(f)
    c.indexes = indexes; app.save(c); return c
  }
  const space = () => new SelectField({ name: 'space', required: true, values: ['affairs', 'customers', 'suppliers', 'internal'], maxSelect: 1 })
  const acl = () => [new SelectField({ name: 'visibility', required: true, values: ['team', 'restricted'], maxSelect: 1 }), rel('readers', 'core_users', 100), rel('created_by', 'core_users')]
  const categories = create('documents_categories', [text('name', 80, true), new BoolField({ name: 'active' })], ['CREATE UNIQUE INDEX idx_ged_category_name ON documents_categories(name COLLATE NOCASE)'])
  for (const name of ['Commercial', 'Commande', 'Livraison', 'Facturation', 'Plan et technique', 'Recette et PV', 'Contrat', 'Autre']) { const r = new Record(categories); r.set('name', name); r.set('active', true); app.save(r) }
  const folders = create('documents_folders', [text('name', 120, true), space(), ...acl(), new BoolField({ name: 'active' })])
  folders.fields.add(rel('parent', 'documents_folders')); folders.indexes = ['CREATE UNIQUE INDEX idx_ged_folder_name ON documents_folders(space,parent,name COLLATE NOCASE)']; app.save(folders)
  const files = create('documents_files', [text('name', 255, true), space(), rel('folder', 'documents_folders'), rel('category', 'documents_categories'), new JSONField({ name: 'tags', maxSize: 1000 }), text('description', 4000), ...acl(), new BoolField({ name: 'locked' }), new DateField({ name: 'archived_at' })], ['CREATE INDEX idx_ged_folder ON documents_files(folder,archived_at)', 'CREATE INDEX idx_ged_space ON documents_files(space,archived_at)'])
  create('documents_file_versions', [rel('document', 'documents_files'), new NumberField({ name: 'number', min: 1, onlyInt: true, required: true }), new FileField({ name: 'file', protected: true, maxSelect: 1, required: true, maxSize: 10485760, mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/csv', 'application/zip', 'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'] }), text('original_name', 255, true), new NumberField({ name: 'size', min: 0 }), text('note', 1000), rel('created_by', 'core_users')], ['CREATE UNIQUE INDEX idx_ged_version ON documents_file_versions(document,number)'])
  files.fields.add(rel('current_version', 'documents_file_versions')); app.save(files)
  create('documents_links', [rel('document', 'documents_files'), text('source_module', 80, true), text('source_entity', 80, true), text('source_record_id', 15, true), text('label', 500)], ['CREATE UNIQUE INDEX idx_ged_link ON documents_links(document,source_entity,source_record_id)'])
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin" && active = true', '', 0, 0)) {
    const role = app.findRecordById('core_roles', user.getString('role')), rights = JSON.parse(role.getString('permissions') || '[]')
    // Roles may be shared: never grant a non-admin user through its shared role.
    if (app.findRecordsByFilter('core_users', 'role = {:role} && erp_profile != "admin"', '', 1, 0, { role: role.id }).length) continue
    role.set('permissions', [...new Set([...rights, 'documents.read', 'documents.write', 'documents.manage', 'documents.settings'])]); app.save(role)
  }
}, () => { throw new Error('Conserver les fichiers et versions GED. Restaurer une sauvegarde cohérente.') })

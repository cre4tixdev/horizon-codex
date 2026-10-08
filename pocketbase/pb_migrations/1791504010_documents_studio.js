migrate((app) => {
  const dates = [{ name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }]
  const relation = (name, target, required = false) => ({ name, type: 'relation', collectionId: app.findCollectionByNameOrId(target).id, maxSelect: 1, required, cascadeDelete: false })
  app.save(new Collection({ name: 'documents_templates', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [
    { name: 'name', type: 'text', max: 150, required: true }, { name: 'document_type', type: 'select', values: ['quote'], required: true, maxSelect: 1 },
    { name: 'module', type: 'text', max: 30, required: true }, { name: 'language', type: 'text', max: 5, required: true },
    { name: 'status', type: 'select', values: ['draft', 'published', 'archived'], required: true, maxSelect: 1 },
    { name: 'content_json', type: 'json', maxSize: 3000000, required: true }, relation('created_by', 'core_users', true), ...dates,
  ] }))
  app.save(new Collection({ name: 'documents_template_versions', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [
    relation('template', 'documents_templates', true), { name: 'version', type: 'number', onlyInt: true, min: 1, required: true },
    { name: 'content_json', type: 'json', maxSize: 3000000, required: true }, { name: 'name', type: 'text', max: 150, required: true },
    { name: 'published_at', type: 'date', required: true }, relation('published_by', 'core_users', true), ...dates,
  ], indexes: ['CREATE UNIQUE INDEX idx_document_template_version ON documents_template_versions (template, version)'] }))
  const templates = app.findCollectionByNameOrId('documents_templates')
  templates.fields.add(new RelationField(relation('current_version', 'documents_template_versions')))
  app.save(templates)
  // Only administrative profiles already allowed into settings receive this new capability.
  for (const user of app.findRecordsByFilter('core_users', 'erp_profile = "admin" || erp_profile = "superuser"', '', 0, 0)) {
    const role = app.findRecordById('core_roles', user.getString('role'))
    const rights = JSON.parse(role.getString('permissions') || '[]')
    if (rights.includes('settings.references')) { role.set('permissions', [...new Set([...rights, 'documents.template.manage'])]); app.save(role) }
  }
}, () => { throw new Error('Restore a coherent backup to preserve published document versions.') })

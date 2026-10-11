migrate((app) => {
  const read = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const collection = new Collection({ name: 'settings_ux', type: 'base', listRule: read, viewRule: read, createRule: null, updateRule: null, deleteRule: null, fields: [{ name: 'key', type: 'text', required: true }, { name: 'config', type: 'json', required: true, maxSize: 10000 }, { name: 'created', type: 'autodate', onCreate: true }, { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }], indexes: ['CREATE UNIQUE INDEX idx_settings_ux_key ON settings_ux (key)'] })
  app.save(collection)
  const record = new Record(collection)
  record.set('key', 'default')
  record.set('config', { row_height: 32, table_font: 12, control_height: 32, control_font: 12, label_font: 11, title_font: 22, page_margin: 40, panel_padding_x: 14, panel_padding_y: 12, panel_radius: 6, section_gap: 12, progress_gap: 16, header_light: '#DCE5EF', header_dark: '#364860' })
  app.save(record)
}, (app) => { app.delete(app.findCollectionByNameOrId('settings_ux')) })

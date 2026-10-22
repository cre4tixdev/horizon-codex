migrate((app) => {
  const products = app.findCollectionByNameOrId('inventory_products')
  products.fields.getByName('composition_mode').values = ['none', 'kit']
  for (const field of [new SelectField({ name: 'kit_price_mode', maxSelect: 1, values: ['margin', 'fixed'] }), new NumberField({ name: 'kit_sale_price', min: 0, max: 1000000000 }), new BoolField({ name: 'kit_print_details' })]) products.fields.add(field)
  app.save(products)
  const components = new Collection({ name: 'inventory_product_components', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
  for (const field of [new RelationField({ name: 'parent_product', collectionId: products.id, maxSelect: 1, required: true, cascadeDelete: false }), new RelationField({ name: 'component_product', collectionId: products.id, maxSelect: 1, required: true, cascadeDelete: false }), new NumberField({ name: 'quantity', required: true, min: 0.000001, max: 1000000 }), new NumberField({ name: 'position', required: true, onlyInt: true, min: 1, max: 50 })]) components.fields.add(field)
  components.indexes = ['CREATE UNIQUE INDEX idx_kit_component ON inventory_product_components(parent_product, component_product)', 'CREATE UNIQUE INDEX idx_kit_position ON inventory_product_components(parent_product, position)']
  app.save(components)
  const settings = new Collection({ name: 'settings_inventory_kits', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
  for (const field of [new TextField({ name: 'key', required: true, max: 20 }), new TextField({ name: 'prefix', required: true, max: 20 }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })]) settings.fields.add(field)
  settings.indexes = ['CREATE UNIQUE INDEX idx_kit_settings ON settings_inventory_kits(key)']; app.save(settings)
  const defaults = new Record(settings); defaults.set('key', 'default'); defaults.set('prefix', 'KIT-'); app.save(defaults)
  for (const name of ['sales_quote_lines', 'sales_order_lines']) {
    const collection = app.findCollectionByNameOrId(name)
    for (const field of [new TextField({ name: 'kit_key', max: 64 }), new TextField({ name: 'kit_parent', max: 64 }), new NumberField({ name: 'kit_quantity', min: 0, max: 1000000 }), new BoolField({ name: 'kit_print_details' })]) collection.fields.add(field)
    app.save(collection)
  }
}, () => { throw new Error('Conserver les kits et leurs historiques ; utiliser une migration corrective.') })

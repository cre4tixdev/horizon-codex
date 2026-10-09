migrate((app) => {
  const brands = new Collection({ name: 'inventory_brands', type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null, fields: [
    { name: 'name', type: 'text', required: true, max: 160 },
    { name: 'name_key', type: 'text', required: true, max: 160, hidden: true },
    { name: 'active', type: 'bool' },
    { name: 'created', type: 'autodate', onCreate: true },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
  ], indexes: ['CREATE UNIQUE INDEX idx_inventory_brand_name ON inventory_brands (name_key)'] })
  app.save(brands)
  const products = app.findCollectionByNameOrId('inventory_products')
  products.fields.add(new RelationField({ name: 'brand', collectionId: brands.id, maxSelect: 1, cascadeDelete: false }))
  products.fields.add(new BoolField({ name: 'cost_override' }))
  for (const name of ['weight_kg', 'volume_m3']) products.fields.add(new NumberField({ name, min: 0, max: 1000000000 }))
  products.fields.add(new TextField({ name: 'hs_code', max: 10, pattern: '^([0-9]{6}|[0-9]{8}|[0-9]{10})?$' }))
  products.fields.add(new TextField({ name: 'origin_country', max: 2 }))
  app.save(products)
  const existing = new Map()
  for (const product of app.findAllRecords('inventory_products')) {
    const name = product.getString('manufacturer').trim().replace(/\s+/g, ' ')
    if (!name) continue
    const key = name.toLowerCase()
    let brand = existing.get(key)
    if (!brand) { brand = new Record(brands); brand.set('name', name); brand.set('name_key', key); brand.set('active', true); app.save(brand); existing.set(key, brand) }
    product.set('brand', brand.id); product.set('manufacturer', brand.getString('name')); app.save(product)
  }
}, () => { throw new Error('Restore a coherent backup to preserve brand links and product logistics.') })

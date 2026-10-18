migrate((app) => {
  const families = app.findCollectionByNameOrId('inventory_product_categories')
  families.fields.add(new SelectField({ name: 'product_kind', required: true, values: ['equipment', 'consumable', 'service'], maxSelect: 1 }))
  app.save(families)
  for (const family of app.findAllRecords(families)) {
    const kinds = new Set(app.findRecordsByFilter('inventory_products', 'category = {:id}', '', 0, 0, { id: family.id }).map((r) => r.getString('kind')).filter((kind) => ['equipment', 'consumable', 'service'].includes(kind)))
    const kind = { equipment: 'equipment', supplies: 'consumable', services: 'service' }[family.getString('code')] || (kinds.size === 1 ? Array.from(kinds)[0] : 'equipment')
    family.set('product_kind', kind); app.save(family)
  }
}, () => { throw new Error('La classification des familles doit être conservée ; retour automatique refusé.') })

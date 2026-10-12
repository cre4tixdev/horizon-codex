const c = require(`${__hooks}/lib/purchasing-common.js`)
const guard = (app, user, write = false) => { const rights = c.policy.permissions(app, user); if (!c.policy.admin(app, user) && (!rights.includes('accounting.read') || write && (!rights.includes('accounting.assets.manage') || user.getString('erp_profile') === 'viewer'))) throw new ForbiddenError('Accès aux immobilisations refusé.') }
const linked = (app, asset) => app.findRecordsByFilter('accounting_fixed_assets', 'internal_asset = {:id}', '', 1, 0, { id: asset })[0]
const dto = (app, record) => { const asset = c.get(app, 'inventory_internal_assets', record.getString('internal_asset')), product = c.get(app, 'inventory_products', asset.getString('product')); return { ...record.publicExport(), number: asset.getString('number'), name: asset.getString('name'), product_name: product.getString('name'), reference: product.getString('sku'), serial_number: asset.getString('serial') ? c.get(app, 'inventory_serials', asset.getString('serial')).getString('serial_number') : '', asset_status: asset.getString('status') } }
module.exports = {
  registered(app, asset) { return linked(app, asset)?.getString('status') === 'registered' },
  prepare(app, user, asset, cost, date) {
    if (linked(app, asset.id)) return
    const record = new Record(app.findCollectionByNameOrId('accounting_fixed_assets'))
    for (const [key, value] of Object.entries({ internal_asset: asset.id, acquisition_cost: cost, currency: 'EUR', acquisition_date: date, status: 'draft', actor: user.id })) record.set(key, value)
    app.save(record); c.policy.audit(app, 'accounting_fixed_assets', record.id, user.id, null, record.publicExport(), 'prepare')
  },
  cancelDraft(app, user, asset) { const record = linked(app, asset.id); if (record?.getString('status') === 'draft') { const before = record.publicExport(); record.set('status', 'disposed'); app.save(record); c.policy.audit(app, 'accounting_fixed_assets', record.id, user.id, before, record.publicExport(), 'cancel') } },
  list(event) {
    guard(event.app, event.auth); const query = event.requestInfo().query; c.exact(query, ['q', 'status', 'page', 'sort'])
    const params = {}, filters = ['id != ""']; if (query.status) { filters.push('status = {:status}'); params.status = query.status }
    if (query.q) { filters.push('(internal_asset.number ~ {:q} || internal_asset.name ~ {:q} || internal_asset.product.sku ~ {:q} || accounting_reference ~ {:q})'); params.q = String(query.q).slice(0, 200) }
    const filter = filters.join(' && '), page = Math.max(1, Number(query.page) || 1), total = event.app.findRecordsByFilter('accounting_fixed_assets', filter, '', 0, 0, params).length
    return event.json(200, { items: event.app.findRecordsByFilter('accounting_fixed_assets', filter, query.sort === 'name' ? 'internal_asset.name,id' : '-created,id', 30, (page - 1) * 30, params).map((item) => dto(event.app, item)), totalItems: total, totalPages: Math.max(1, Math.ceil(total / 30)), page })
  },
  record(event) { guard(event.app, event.auth); return event.json(200, dto(event.app, c.get(event.app, 'accounting_fixed_assets', event.request.pathValue('id')))) },
  save(event) {
    guard(event.app, event.auth, true); const body = event.requestInfo().body; c.exact(body, ['id', 'updated', 'input', 'action']); c.exact(body.input, ['acquisition_cost', 'in_service_date', 'accounting_reference', 'notes']); let saved
    event.app.runInTransaction((app) => {
      guard(app, event.auth, true); const record = c.get(app, 'accounting_fixed_assets', body.id), before = record.publicExport()
      if (record.getString('updated') !== body.updated) throw new ApiError(409, 'L’immobilisation a changé. Actualisez-la.')
      if (record.getString('status') === 'draft') { record.set('acquisition_cost', c.number(body.input.acquisition_cost)); record.set('in_service_date', c.date(body.input.in_service_date || '')); record.set('accounting_reference', c.text(body.input.accounting_reference || '', 160)); record.set('notes', c.text(body.input.notes || '', 10000)) }
      if (body.action === 'register') { if (record.getString('status') !== 'draft' || !record.getString('in_service_date') || !c.get(app, 'inventory_internal_assets', record.getString('internal_asset')).getBool('active')) throw new BadRequestError('Renseignez la mise en service d’un matériel encore dans le parc.'); record.set('status', 'registered'); record.set('registered_by', event.auth.id); record.set('registered_at', new Date().toISOString()) }
      else if (body.action === 'dispose') { if (record.getString('status') !== 'registered' || !body.input.notes?.trim()) throw new BadRequestError('Renseignez le motif du déclassement.'); record.set('status', 'disposed'); record.set('notes', body.input.notes.trim()) }
      else if (body.action !== 'save' || record.getString('status') !== 'draft') throw new BadRequestError('Une base validée ne peut plus être modifiée.')
      app.save(record); c.policy.audit(app, 'accounting_fixed_assets', record.id, event.auth.id, before, record.publicExport(), body.action); saved = dto(app, record)
    }); return event.json(200, saved)
  },
}

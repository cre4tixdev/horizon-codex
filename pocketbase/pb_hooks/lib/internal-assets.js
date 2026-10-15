const c = require(`${__hooks}/lib/purchasing-common.js`)
const stock = require(`${__hooks}/lib/stock.js`)
const finance = require(`${__hooks}/lib/accounting-assets.js`)
const guard = (app, user, validate = false) => { stock.guard(app, user, validate ? 'validate' : 'read'); if (validate && !c.policy.permissions(app, user).includes('inventory.write')) throw new ForbiddenError('Droits de gestion du parc nécessaires.') }
const assignmentAccess = (app, user, asset) => {
  const hr = c.policy.permissions(app, user).includes('hr.read'), employee = asset.getString('assigned_employee'), team = asset.getString('assigned_team')
  const employeeAllowed = hr && (!employee || c.policy.hrAllowed(app, user, c.get(app, 'hr_employees', employee)))
  const teamAllowed = hr && (!team || user.getString('hr_scope') === 'all' || app.findRecordsByFilter('hr_employees', 'team = {:id}', '', 0, 0, { id: team }).some((record) => c.policy.hrAllowed(app, user, record)))
  return { employeeAllowed, teamAllowed, canAssign: employeeAllowed && teamAllowed }
}
const dto = (app, user, asset) => {
  const product = c.get(app, 'inventory_products', asset.getString('product')), operation = c.get(app, 'inventory_operations', asset.getString('source_operation')), receipt = operation.getString('internal_parent') ? c.get(app, 'inventory_operations', operation.getString('internal_parent')) : null, assignment = assignmentAccess(app, user, asset)
  return { ...asset.publicExport(), product_name: product.getString('name'), brand: product.getString('manufacturer'), reference: product.getString('sku'), serial_number: asset.getString('serial') ? c.get(app, 'inventory_serials', asset.getString('serial')).getString('serial_number') : '', lot_number: asset.getString('lot') ? c.get(app, 'inventory_lots', asset.getString('lot')).getString('lot_number') : '', warehouse_name: c.get(app, 'inventory_warehouses', asset.getString('warehouse')).getString('name'), location_name: asset.getString('location') ? c.get(app, 'inventory_locations', asset.getString('location')).getString('name') : '', source_number: operation.getString('number'), receipt_number: receipt?.getString('number') || '', can_assign: assignment.canAssign, purchase_order: c.policy.permissions(app, user).includes('purchasing.read') ? receipt?.getString('purchase_order') || '' : '', assigned_employee: assignment.employeeAllowed ? asset.getString('assigned_employee') : '', assigned_team: assignment.teamAllowed ? asset.getString('assigned_team') : '', assigned_name: assignment.employeeAllowed && asset.getString('assigned_employee') ? c.get(app, 'hr_employees', asset.getString('assigned_employee')).getString('first_name') + ' ' + c.get(app, 'hr_employees', asset.getString('assigned_employee')).getString('last_name') : '', financial_lock: finance.registered(app, asset.id) }
}
module.exports = {
  fromOperation(app, user, operation) {
    const lines = JSON.parse(operation.getString('lines') || '[]').filter((line) => ['internal', 'asset'].includes(line.purpose))
    if (lines.reduce((sum, line) => sum + line.quantity, 0) > 500 || lines.some((line) => !Number.isInteger(line.quantity) || (line.traces || []).some((trace) => !Number.isInteger(trace.quantity)))) throw new BadRequestError('Le parc suit des exemplaires entiers, limités à 500 par affectation.')
    for (const line of lines) {
      const product = c.get(app, 'inventory_products', line.product), identities = line.traces?.length ? line.traces.flatMap((trace) => Array.from({ length: trace.quantity }, () => trace)) : Array.from({ length: line.quantity }, () => ({ serial: '', lot: '' }))
      for (const trace of identities) {
        const asset = new Record(app.findCollectionByNameOrId('inventory_internal_assets'))
        for (const [key, value] of Object.entries({ number: require(`${__hooks}/lib/stock-purchase-receipts.js`).number(app, operation.getString('warehouse'), 'PARC'), name: product.getString('name'), product: product.id, serial: trace.serial || '', lot: trace.lot || '', source_operation: operation.id, source_line: line.id, warehouse: operation.getString('warehouse'), location: line.from_location, acquired_at: new Date().toISOString(), status: 'stored', active: true })) asset.set(key, value)
        app.save(asset)
        if (trace.serial) { const serial = c.get(app, 'inventory_serials', trace.serial); serial.set('status', 'internal'); serial.set('location', line.from_location); app.save(serial) }
        if (line.purpose === 'asset') {
          const parent = operation.getString('internal_parent') ? c.get(app, 'inventory_operations', operation.getString('internal_parent')) : null
          const values = app.findRecordsByFilter('inventory_valuation_entries', 'operation = {:id} && product = {:product} && quantity < 0', '', 0, 0, { id: operation.id, product: product.id }).filter((entry) => JSON.parse(entry.getString('snapshot') || '{}').line === line.id)
          const cost = parent ? line.unit_cost : Math.abs(values.reduce((sum, entry) => sum + entry.getFloat('movement_value'), 0)) / line.quantity
          finance.prepare(app, user, asset, cost, parent?.getString('document_date') || operation.getString('document_date'))
        }
        c.policy.audit(app, 'inventory_internal_assets', asset.id, user.id, null, asset.publicExport(), 'create')
        require(`${__hooks}/lib/activity.js`).publish(app, asset, user.id, 'change', 'Matériel ajouté au parc interne', { action: 'create' })
      }
    }
  },
  receive(app, user, receipt) {
    const lines = JSON.parse(receipt.getString('lines') || '[]').filter((line) => line.purpose && line.purpose !== 'stock')
    if (!lines.length) return
    if (app.findRecordsByFilter('inventory_operations', 'internal_parent = {:id}', '', 1, 0, { id: receipt.id }).length) throw new ApiError(409, 'Cette réception a déjà été affectée à l’interne.')
    const operation = new Record(app.findCollectionByNameOrId('inventory_operations'))
    for (const [key, value] of Object.entries({ number: require(`${__hooks}/lib/stock-purchase-receipts.js`).number(app, receipt.getString('warehouse'), 'OUT'), kind: 'OUT', status: 'draft', title: 'Affectation interne · ' + receipt.getString('number'), reason: 'Réception pour usage interne · ' + receipt.getString('number'), warehouse: receipt.getString('warehouse'), internal_parent: receipt.id, internal_use: true, actor: user.id, creation_key: 'internal-receipt-' + receipt.id, creation_hash: c.hash({ receipt: receipt.id }), document_date: receipt.getString('document_date'), scope: [], lines: lines.map((line) => ({ ...line, source_line: '', sales_line: '', from_location: line.to_location, to_location: '' })) })) operation.set(key, value)
    app.save(operation); require(`${__hooks}/lib/stock-operations.js`).execute(app, user, operation)
    c.audit(app, user, operation, null, 'Affectation interne après réception')
  },
  list(event) {
    guard(event.app, event.auth); const query = event.requestInfo().query; c.exact(query, ['q', 'status', 'product', 'warehouse', 'page', 'sort']); const params = {}, filters = ['id != ""']
    const states = require(`${__hooks}/lib/stock-list-filters.js`).values(query.status, ['stored', 'assigned', 'repair', 'retired', 'returned'], 'États du parc')
    if (states.length) filters.push('(' + states.map((state, index) => { params['status' + index] = state; return `status = {:status${index}}` }).join(' || ') + ')')
    for (const key of ['product', 'warehouse']) if (query[key]) { filters.push(`${key} = {:${key}}`); params[key] = query[key] }
    if (query.q) { filters.push('(number ~ {:q} || name ~ {:q} || product.sku ~ {:q} || serial.serial_number ~ {:q} || warehouse.name ~ {:q} || location.name ~ {:q} || product.manufacturer ~ {:q})'); params.q = String(query.q).slice(0, 200) }
    const filter = filters.join(' && '), page = Math.max(1, Number(query.page) || 1), total = event.app.findRecordsByFilter('inventory_internal_assets', filter, '', 0, 0, params).length
    const derived = ['brand', 'reference', 'trace', 'status', 'assigned_name', 'warehouse_name', 'location_name'], projected = derived.includes(String(query.sort || '').replace(/^-/, ''))
    const records = event.app.findRecordsByFilter('inventory_internal_assets', filter, require(`${__hooks}/lib/list-sorting.js`).sql(query.sort, ['created', 'name', 'number'], '-created') + ',id', projected ? 10001 : 30, projected ? 0 : (page - 1) * 30, params)
    if (records.length > 10000) throw new BadRequestError('Affinez la recherche du parc interne.')
    let items = records.map((asset) => dto(event.app, event.auth, asset))
    if (projected) { require(`${__hooks}/lib/list-sorting.js`).rows(items, query.sort, derived, 'status', (item, field) => field === 'trace' ? item.serial_number || item.lot_number : field === 'status' ? ({ stored: 'Disponible', assigned: 'Affecté', repair: 'En réparation', retired: 'Retiré du parc', returned: 'Remis en stock' })[item.status] : item[field]); items = items.slice((page - 1) * 30, page * 30) }
    return event.json(200, { items, totalItems: total, totalPages: Math.max(1, Math.ceil(total / 30)), page })
  },
  record(event) { guard(event.app, event.auth); return event.json(200, dto(event.app, event.auth, c.get(event.app, 'inventory_internal_assets', event.request.pathValue('id')))) },
  save(event) {
    guard(event.app, event.auth); if (!c.policy.permissions(event.app, event.auth).includes('inventory.write')) throw new ForbiddenError('Droits de gestion du parc nécessaires.')
    const body = event.requestInfo().body; c.exact(body, ['id', 'updated', 'input', 'action']); let output
    event.app.runInTransaction((app) => {
      guard(app, event.auth); if (!c.policy.permissions(app, event.auth).includes('inventory.write') || event.auth.getString('erp_profile') === 'viewer') throw new ForbiddenError('Droits de gestion du parc nécessaires.');
      const asset = c.get(app, 'inventory_internal_assets', body.id), before = asset.publicExport(); if (asset.getString('updated') !== body.updated) throw new ApiError(409, 'Ce matériel a changé. Actualisez-le.')
      if (!asset.getBool('active')) throw new BadRequestError('Ce matériel est déjà sorti du parc.')
      if (body.action === 'return_stock') {
        stock.guard(app, event.auth, 'validate')
        if (finance.registered(app, asset.id)) throw new BadRequestError('Déclassez l’immobilisation dans Finance avant sa remise en stock.')
        const source = c.get(app, 'inventory_operations', asset.getString('source_operation')), original = JSON.parse(source.getString('lines') || '[]').find((line) => line.id === asset.getString('source_line')), record = new Record(app.findCollectionByNameOrId('inventory_operations'))
        const trace = asset.getString('serial') || asset.getString('lot') ? [{ serial: asset.getString('serial'), lot: asset.getString('lot'), number: '', quantity: 1, expiry_date: '' }] : []
        for (const [key, value] of Object.entries({ number: require(`${__hooks}/lib/stock-purchase-receipts.js`).number(app, asset.getString('warehouse'), 'RET'), kind: 'RET', status: 'draft', title: 'Retour du parc · ' + asset.getString('number'), reason: 'Retour au stock commercial', warehouse: asset.getString('warehouse'), origin: source.id, actor: event.auth.id, creation_key: 'asset-return-' + asset.id, creation_hash: c.hash({ asset: asset.id }), document_date: new Date().toISOString().slice(0, 10), scope: [], lines: [{ ...original, quantity: 1, purpose: 'stock', from_location: '', to_location: asset.getString('location'), origin_line: original.id, traces: trace }] })) record.set(key, value)
        app.save(record); require(`${__hooks}/lib/stock-operations.js`).execute(app, event.auth, record); c.audit(app, event.auth, record, null, 'Retour du parc interne'); asset.set('status', 'returned'); asset.set('active', false); finance.cancelDraft(app, event.auth, asset)
      } else if (body.action === 'save') {
        c.exact(body.input, ['name', 'warehouse', 'location', 'assigned_employee', 'assigned_team', 'status', 'notes'])
        asset.set('name', c.text(body.input.name, 200, true)); asset.set('notes', c.text(body.input.notes || '', 10000))
        if (!['stored', 'assigned', 'repair', 'retired'].includes(body.input.status)) throw new BadRequestError('État du matériel invalide.')
        if (body.input.status === 'retired' && finance.registered(app, asset.id)) throw new BadRequestError('Déclassez l’immobilisation avant le retrait du parc.')
        const place = c.get(app, 'inventory_locations', body.input.location); if (!place.getBool('active') || place.getString('warehouse') !== body.input.warehouse || !c.get(app, 'inventory_warehouses', body.input.warehouse).getBool('active')) throw new BadRequestError('Choisissez un emplacement actif.')
        asset.set('warehouse', body.input.warehouse); asset.set('location', place.id)
        if (assignmentAccess(app, event.auth, asset).canAssign) {
          if (body.input.assigned_employee && !c.policy.hrAllowed(app, event.auth, c.get(app, 'hr_employees', body.input.assigned_employee))) throw new ForbiddenError('Ressource hors de votre périmètre.')
          if (body.input.assigned_team) { const team = c.get(app, 'core_teams', body.input.assigned_team); if (!team.getBool('active')) throw new BadRequestError('Équipe inactive.'); }
          if (body.input.assigned_team && event.auth.getString('hr_scope') !== 'all' && !app.findRecordsByFilter('hr_employees', 'team = {:id}', '', 0, 0, { id: body.input.assigned_team }).some((employee) => c.policy.hrAllowed(app, event.auth, employee))) throw new ForbiddenError('Équipe hors de votre périmètre.');
          asset.set('assigned_employee', body.input.assigned_employee || ''); asset.set('assigned_team', body.input.assigned_team || '')
        }
        if (body.input.status === 'assigned' && !asset.getString('assigned_employee') && !asset.getString('assigned_team')) throw new BadRequestError('Choisissez un collaborateur ou une équipe pour affecter ce matériel.');
        asset.set('status', body.input.status); if (body.input.status === 'retired') { asset.set('active', false); finance.cancelDraft(app, event.auth, asset) }
        if (asset.getString('serial')) { const serial = c.get(app, 'inventory_serials', asset.getString('serial')); serial.set('location', place.id); serial.set('status', body.input.status === 'retired' ? 'scrapped' : 'internal'); app.save(serial) }
      } else throw new BadRequestError('Action invalide.')
      app.save(asset); c.policy.audit(app, 'inventory_internal_assets', asset.id, event.auth.id, before, asset.publicExport(), body.action); require(`${__hooks}/lib/activity.js`).publish(app, asset, event.auth.id, 'change', body.action === 'return_stock' ? 'Matériel remis en stock' : 'Affectation du matériel modifiée', { action: 'update' }); output = dto(app, event.auth, asset)
    }); return event.json(200, output)
  },
}

const c = require(`${__hooks}/lib/messaging-common.js`), activity = require(`${__hooks}/lib/activity.js`)
const cost = (...args) => require(`${__hooks}/lib/catalog-quote-cost.js`)(...args)
const same = (a, b) => Math.round(a * 1e6) === Math.round(b * 1e6)
const previousLine = (rows, raw) => raw.id ? rows.find((row) => row.id === raw.id && row.product === raw.product && (row.product_supplier || '') === (raw.product_supplier || '')) : null
const oldSource = (app, previous, line) => {
  const snapshot = previous?.catalog_snapshot
  if (snapshot?.cost_reference?.source) return snapshot.cost_reference.source
  let supplier = snapshot?.supplier || ''
  if (!supplier && line.product_supplier) supplier = app.findRecordsByFilter('inventory_product_suppliers', 'id = {:id}', '', 1, 0, { id: line.product_supplier })[0]?.getString('supplier') || ''
  if (supplier) {
    const company = app.findRecordsByFilter('contacts_companies', 'id = {:id}', '', 1, 0, { id: supplier })[0]
    return company ? `Tarif fournisseur · ${company.getString('name')}` : 'Fournisseur indisponible'
  }
  return snapshot?.source === 'reference' || !previous && !line.product_supplier ? 'Coût de référence produit' : 'Source non renseignée'
}
module.exports = {
  previousLine,
  capture(app, user, currency, line, raw, previous) {
    const snapshot = previous?.catalog_snapshot || line.catalog_snapshot
    if (raw.cost_refresh) {
      const value = cost(app, user, currency, line)
      if (!value.available || value.token !== raw.cost_refresh || !same(value.unit_cost, line.unit_cost)) throw new ApiError(409, 'Le coût catalogue a changé ou cette ligne a été retouchée. Relancez son actualisation.')
      return { ...snapshot, cost_origin: 'catalog', cost_unit_value: line.unit_cost, cost_refreshed_at: new Date().toISOString(), cost_reference: { token: value.token, source: value.source, product_supplier: value.product_supplier || '' } }
    }
    if (previous) {
      // Preserve old snapshots byte for byte unless the cost itself changes.
      return same(previous.unit_cost, line.unit_cost) ? snapshot : { ...snapshot, cost_origin: 'manual', cost_unit_value: line.unit_cost }
    }
    const value = cost(app, user, currency, line)
    return { ...snapshot, cost_origin: value.available && same(value.unit_cost, line.unit_cost) ? 'catalog' : 'manual', cost_unit_value: line.unit_cost }
  },
  preview(e) {
    if (!activity.allowed(e.app, e.auth, true, 'sales') || !activity.allowed(e.app, e.auth, false, 'crm')) throw new ForbiddenError('Accès en modification au devis nécessaire.')
    if (!require(`${__hooks}/lib/catalog.js`).allowed(e.app, e.auth)) throw new ForbiddenError('Accès au catalogue nécessaire.')
    const b = e.requestInfo().body
    c.exact(b, ['id', 'updated', 'opportunity', 'lines', 'discount', 'discount_mode', 'mode', 'scope', 'selected', 'versions'])
    if (!['price', 'margin'].includes(b.mode)) throw new BadRequestError('Choisissez la règle de prix de vente.')
    if (!/^[a-z0-9]{15}$/.test(b.opportunity || '')) throw new BadRequestError('Choisissez une opportunité avant d’actualiser les coûts.')
    const opp = c.get(e.app, 'crm_opportunities', b.opportunity)
    if (!opp.getBool('active')) throw new BadRequestError('Cette opportunité est archivée.')
    let previous = [], currency = opp.getString('currency')
    if (b.id) {
      const quote = c.get(e.app, 'sales_quotes', b.id)
      if (quote.getString('status') !== 'draft' || quote.getString('archived_at')) throw new BadRequestError('Actualisation réservée aux brouillons actifs.')
      if (quote.getString('updated') !== b.updated) throw new ApiError(409, 'Le devis a changé. Rechargez sa fiche.')
      if (quote.getString('opportunity') !== opp.id) throw new BadRequestError('Rattachement du devis incompatible.')
      currency = quote.getString('currency')
      previous = e.app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id: quote.id }).map((row) => ({ ...row.publicExport(), catalog_snapshot: JSON.parse(row.getString('catalog_snapshot') || 'null') }))
    }
    const pricing = require(`${__hooks}/lib/pricing.js`), before = pricing.quoteLines(b.lines, b.discount || 0, b.discount_mode || 'percent')
    if (b.scope !== undefined && (!Number.isInteger(b.scope) || b.scope < 0 || b.scope >= before.lines.length)) throw new BadRequestError('Ligne invalide.')
    const scopedKit = b.scope === undefined ? '' : before.lines[b.scope].kit_key
    const costCache = new Map()
    const rows = before.lines.flatMap((line, index) => {
      if (!line.product || line.kit_key || line.kind !== 'item' || b.scope !== undefined && b.scope !== index && !(scopedKit && line.kit_parent === scopedKit)) return []
      const key = JSON.stringify([line.product, line.product_supplier, line.unit])
      if (!costCache.has(key)) costCache.set(key, cost(e.app, e.auth, currency, line))
      const value = costCache.get(key), previous = previousLineFor(index)
      const origin = previous?.catalog_snapshot?.cost_origin
      const manual = previous ? origin !== 'catalog' || !same(previous.unit_cost, line.unit_cost) : !value.available || !same(value.unit_cost, line.unit_cost)
      let reason = value.reason || ''
      if (b.mode === 'margin' && (line.unit_cost <= 0 || value.available && value.unit_cost <= 0)) reason = 'Taux de marge non applicable avec un coût nul. Conservez le prix de vente.'
      return [{ index, description: line.description, old_cost: line.unit_cost, old_source: oldSource(e.app, previous, line), new_cost: value.available ? value.unit_cost : null, delta: value.available ? value.unit_cost - line.unit_cost : null, source: value.source || '', token: value.token || '', manual, reason, changed: value.available && !same(value.unit_cost, line.unit_cost), old_price: line.unit_price }]
    })
    function previousLineFor(index) { return previousLine(previous, b.lines[index]) }
    let selected = b.selected === undefined ? rows.filter((row) => row.changed && !row.manual && !row.reason).map((row) => row.index) : b.selected
    if (!Array.isArray(selected) || selected.length > 200 || new Set(selected).size !== selected.length || selected.some((index) => !Number.isInteger(index) || !rows.some((row) => row.index === index))) throw new BadRequestError('Sélection de coûts invalide.')
    if (b.versions !== undefined) {
      if (!b.versions || typeof b.versions !== 'object' || Array.isArray(b.versions) || Object.keys(b.versions).length > 200) throw new BadRequestError('Comparatif invalide.')
      for (const index of selected) if (!rows.find((row) => row.index === index).changed || rows.find((row) => row.index === index).reason || b.versions[index] !== rows.find((row) => row.index === index).token) throw new ApiError(409, 'Les tarifs ont changé depuis le comparatif. Relancez la vérification.')
    }
    selected = selected.filter((index) => rows.some((row) => row.index === index && row.changed && !row.reason))
    const lines = b.lines.map((raw, index) => {
      if (!selected.includes(index)) return raw
      const row = rows.find((row) => row.index === index), original = before.lines[index]
      return { ...raw, unit_cost: row.new_cost, unit_price: original.unit_price, price_source: b.mode === 'price' ? 'manual' : 'margin', margin_percent: original.margin_percent, cost_refresh: row.token }
    })
    for (const [index, raw] of lines.entries()) if (raw.kit_key && lines.some((child, childIndex) => child.kit_parent === raw.kit_key && selected.includes(childIndex))) {
      lines[index] = { ...raw, price_source: b.mode === 'price' ? 'manual' : 'margin', unit_price: before.lines[index].unit_price, margin_percent: before.lines[index].margin_percent }
    }
    const after = pricing.quoteLines(lines, b.discount || 0, b.discount_mode || 'percent')
    for (const index of lines.map((line, index) => selected.includes(index) || line.kit_key ? index : -1).filter((index) => index >= 0)) { lines[index].unit_cost = after.lines[index].unit_cost; lines[index].unit_price = after.lines[index].unit_price; lines[index].margin_percent = after.lines[index].margin_percent }
    const totals = (value) => ({ cost_total: value.cost_total, subtotal: value.subtotal, margin_amount: value.margin_amount, margin_percent: value.margin_percent, options_total: value.options_total })
    return e.json(200, { rows, selected, lines, before: totals(before), after: totals(after), currency })
  },
}

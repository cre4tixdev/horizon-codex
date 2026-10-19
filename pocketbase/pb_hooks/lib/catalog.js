const policy = require(`${__hooks}/lib/access-policy.js`)
const pricing = require(`${__hooks}/lib/catalog-pricing.js`)
const allowed = (app, user, write = false) => { const rights = policy.permissions(app, user); return rights.includes('inventory.read') && (!write || user.getString('erp_profile') !== 'viewer' && rights.includes('inventory.write')) }
const guard = (app, user, write = false) => { if (!allowed(app, user, write)) throw new ForbiddenError('Accès au catalogue produits refusé.') }
const parseJson = (value) => { try { return JSON.parse(value) } catch { throw new BadRequestError('Données de formulaire invalides.') } }
const exact = (input, keys) => { if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some((key) => !keys.includes(key))) throw new BadRequestError('Champs non autorisés.') }
const get = (app, name, id) => { if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Référence invalide.'); try { return app.findRecordById(name, id) } catch { throw new ApiError(404, 'Élément introuvable.') } }
const audit = (app, actor, record, before, action) => policy.audit(app, record.collection().name, record.id, actor.id, before, record.publicExport(), action)
const offers = (app, id) => app.findRecordsByFilter('inventory_product_suppliers', 'product = {:id}', '-is_preferred,created,id', 0, 0, { id })
const valid = (offer) => { const today = new Date().toISOString().slice(0, 10); return offer.getBool('active') && (!offer.getString('valid_from') || offer.getString('valid_from').slice(0, 10) <= today) && (!offer.getString('valid_until') || offer.getString('valid_until').slice(0, 10) >= today) }
const projectOffer = (app, offer) => ({ ...offer.publicExport(), supplier_name: get(app, 'contacts_companies', offer.getString('supplier')).getString('name'), ...pricing.offer({ list_price: offer.getFloat('list_price'), discount: offer.getFloat('discount'), purchase_quantity: offer.getFloat('purchase_quantity') }) })
const productPrice = (app, product, offerId = '') => {
  const family = get(app, 'inventory_product_categories', product.getString('category'))
  const preferred = offerId === 'reference' || !offerId && product.getBool('cost_override') ? null : offerId ? get(app, 'inventory_product_suppliers', offerId) : offers(app, product.id).find((item) => item.getBool('is_preferred') && item.getBool('active'))
  if (preferred && preferred.getString('product') !== product.id) throw new BadRequestError('Cette offre ne correspond pas au produit.')
  const warning = preferred && (!get(app, 'contacts_companies', preferred.getString('supplier')).getBool('active') || !app.findRecordsByFilter('contacts_company_roles', 'company = {:id} && role = "supplier" && active = true', '', 1, 0, { id: preferred.getString('supplier') }).length) ? 'Le fournisseur est archivé.' : preferred && !valid(preferred) ? 'Le tarif fournisseur sélectionné est hors validité.' : preferred && preferred.getString('currency') !== product.getString('sale_currency') ? 'La devise du fournisseur est différente : aucune conversion automatique.' : !family.getBool('active') ? 'La famille tarifaire est archivée.' : ''
  const coefficient = product.getBool('coefficient_override') ? product.getFloat('manual_coefficient') : family.getFloat('coefficient')
  const cost = preferred ? projectOffer(app, preferred).unit_cost : product.getFloat('reference_cost')
  return { unit_cost: cost, unit_price: warning ? null : pricing.sale(cost, coefficient), margin_rate: warning ? null : pricing.marginRate(cost, pricing.sale(cost, coefficient)), coefficient, currency: product.getString('sale_currency'), supplier: preferred?.getString('supplier') || '', product_supplier: preferred?.id || '', warning, source: preferred ? 'supplier' : 'reference' }
}
const publicProduct = (record) => { const value = record.publicExport(); delete value.creation_key; return value }
const dto = (app, record, detail = true) => ({ ...publicProduct(record), category_label: get(app, 'inventory_product_categories', record.getString('category')).getString('label'), unit_code: get(app, 'inventory_units', record.getString('base_unit')).getString('code'), unit_locked: offers(app, record.id).length > 0, pricing: productPrice(app, record), last_purchase: null, ...(detail ? { offers: offers(app, record.id).filter((item) => item.getBool('active')).map((offer) => projectOffer(app, offer)), price_history: app.findRecordsByFilter('inventory_supplier_price_history', 'product_supplier.product = {:id}', '-effective_at,id', 100, 0, { id: record.id }).map((item) => ({ ...item.publicExport(), supplier_name: get(app, 'contacts_companies', JSON.parse(item.getString('snapshot')).supplier).getString('name') })) } : {}) })
const fields = ['sku', 'name', 'description', 'category', 'kind', 'sale_enabled', 'purchase_enabled', 'stock_policy', 'replenishment_policy', 'tracking', 'base_unit', 'brand', 'cost_override', 'coefficient_override', 'manual_coefficient', 'weight_kg', 'volume_m3', 'hs_code', 'origin_country', 'manufacturer', 'manufacturer_ref', 'barcode', 'variant_group', 'reference_cost', 'sale_currency']
const offerFields = ['supplier', 'supplier_sku', 'list_price', 'discount', 'purchase_quantity', 'currency', 'lead_time_days', 'valid_from', 'valid_until', 'is_preferred']
const brandName = (value) => value.trim().replace(/\s+/g, ' ')
const resolveBrand = (app, name, actor) => {
  const normalized = brandName(name), key = normalized.toLowerCase()
  const existing = app.findRecordsByFilter('inventory_brands', 'name_key = {:key}', '', 1, 0, { key })[0]
  if (existing) { if (!existing.getBool('active')) throw new BadRequestError('Cette marque est archivée.'); return existing }
  const record = new Record(app.findCollectionByNameOrId('inventory_brands')); record.set('name', normalized); record.set('name_key', key); record.set('active', true); app.save(record); audit(app, actor, record, null, 'create'); return record
}
const normalizeInput = (app, input, actor, previous) => {
  exact(input, [...fields, 'offers'])
  const value = { brand: '', cost_override: false, coefficient_override: false, manual_coefficient: 1, weight_kg: 0, volume_m3: 0, hs_code: '', origin_country: '', ...input }
  if (input.brand === undefined && typeof input.manufacturer === 'string' && input.manufacturer.trim()) value.brand = resolveBrand(app, input.manufacturer, actor).id
  if (value.brand) value.manufacturer = get(app, 'inventory_brands', value.brand).getString('name')
  if (!['equipment', 'consumable', 'service'].includes(value.kind)) throw new BadRequestError('Classification produit invalide.')
  const family = get(app, 'inventory_product_categories', value.category), kind = family.getString('product_kind')
  if (!['equipment', 'consumable', 'service'].includes(kind)) throw new ApiError(503, 'Installez la migration PocketBase 1791840033 pour la classification des familles.')
  if (!previous || previous.getString('category') !== value.category || previous.getString('kind') !== value.kind) {
    if (previous && previous.getString('category') === value.category && value.kind !== kind) throw new BadRequestError('Réappliquez la famille de produit pour changer sa classification.')
    value.kind = kind
    if (kind === 'service') { value.stock_policy = 'none'; value.tracking = 'none' }
  }
  return value
}
function validateProduct(app, input, previous) {
  exact(input, [...fields, 'offers'])
  for (const [key, max, required] of [['sku', 80, true], ['name', 200, true], ['description', 2000, false], ['manufacturer', 160, false], ['manufacturer_ref', 160, false], ['barcode', 100, false], ['variant_group', 120, false]]) if (typeof input[key] !== 'string' || input[key].length > max || required && !input[key].trim()) throw new BadRequestError('Référence et nom obligatoires ; vérifiez les textes du produit.')
  for (const [key, values] of [['kind', ['equipment', 'consumable', 'service']], ['stock_policy', ['none', 'stocked', 'on_demand']], ['replenishment_policy', ['manual', 'on_demand', 'min_max']], ['tracking', ['none', 'lot', 'serial']]]) if (!values.includes(input[key])) throw new BadRequestError('Politique produit invalide.')
  for (const key of ['sale_enabled', 'purchase_enabled', 'cost_override', 'coefficient_override']) if (typeof input[key] !== 'boolean') throw new BadRequestError('Usage produit invalide.')
  if (typeof input.brand !== 'string' || !input.brand || input.brand && !get(app, 'inventory_brands', input.brand).getBool('active') && previous?.getString('brand') !== input.brand) throw new BadRequestError('Choisissez une marque active.')
  if (!input.brand && input.manufacturer) throw new BadRequestError('Choisissez la marque dans le référentiel.')
  for (const key of ['weight_kg', 'volume_m3']) if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || input[key] < 0 || input[key] > 1000000000) throw new BadRequestError('Poids et volume doivent être positifs ou nuls.')
  if (typeof input.hs_code !== 'string' || !/^([0-9]{6}|[0-9]{8}|[0-9]{10})?$/.test(input.hs_code)) throw new BadRequestError('Le code SH doit contenir 6, 8 ou 10 chiffres.')
  if (typeof input.origin_country !== 'string' || input.origin_country && !app.findRecordsByFilter('settings_countries', 'code = {:code} && active = true', '', 1, 0, { code: input.origin_country }).length && previous?.getString('origin_country') !== input.origin_country) throw new BadRequestError('Choisissez un pays d’origine actif.')
  if (input.kind === 'service' && (input.stock_policy !== 'none' || input.tracking !== 'none')) throw new BadRequestError('Un service ne dispose pas de stock ni de suivi physique.')
  for (const [field, collection] of [['category', 'inventory_product_categories'], ['base_unit', 'inventory_units']]) if (!get(app, collection, input[field]).getBool('active') && (!previous || previous.getString(field) !== input[field])) throw new BadRequestError('Choisissez une famille et une unité actives.')
  if (previous && (previous.getString('kind') !== input.kind || previous.getString('tracking') !== input.tracking || previous.getString('base_unit') !== input.base_unit || previous.getString('stock_policy') !== input.stock_policy) && (app.findRecordsByFilter('inventory_moves', 'product = {:id}', '', 1, 0, { id: previous.id }).length || app.findRecordsByFilter('inventory_reservations', 'product = {:id}', '', 1, 0, { id: previous.id }).length || app.findRecordsByFilter('inventory_serials', 'product = {:id}', '', 1, 0, { id: previous.id }).length)) throw new BadRequestError('La nature, le suivi, le stock et l’unité sont figés après le premier mouvement ou la première réservation pour préserver la traçabilité.');
  if (previous && previous.getString('base_unit') !== input.base_unit && offers(app, previous.id).length) throw new BadRequestError('L’unité de base est figée après la création de tarifs fournisseurs pour préserver leur historique.')
  if (!app.findRecordsByFilter('accounting_currencies', 'code = {:code} && active = true', '', 1, 0, { code: input.sale_currency }).length) throw new BadRequestError('Choisissez une devise active.')
  pricing.sale(0, input.manual_coefficient)
  pricing.sale(input.reference_cost, input.coefficient_override ? input.manual_coefficient : get(app, 'inventory_product_categories', input.category).getFloat('coefficient'))
  if (!Array.isArray(input.offers) || input.offers.length > 30 || input.offers.filter((item) => item.is_preferred === true).length > 1) throw new BadRequestError('Maximum 30 tarifs et un seul fournisseur favori.')
  if (!input.purchase_enabled && input.offers.length) throw new BadRequestError('Activez les achats pour saisir des tarifs fournisseurs.')
  const ids = new Set()
  for (const offer of input.offers) {
    exact(offer, [...offerFields, 'id'])
    if (offer.id) { if (ids.has(offer.id) || !previous || get(app, 'inventory_product_suppliers', offer.id).getString('product') !== previous.id) throw new BadRequestError('Tarif fournisseur invalide.'); ids.add(offer.id) }
    if (typeof offer.is_preferred !== 'boolean' || typeof offer.supplier_sku !== 'string' || offer.supplier_sku.length > 160 || !Number.isInteger(offer.lead_time_days) || offer.lead_time_days < 0 || offer.lead_time_days > 3650) throw new BadRequestError('Informations fournisseur invalides.')
    const supplier = get(app, 'contacts_companies', offer.supplier)
    if (!supplier.getBool('active') || !app.findRecordsByFilter('contacts_company_roles', 'company = {:id} && role = "supplier" && active = true', '', 1, 0, { id: supplier.id }).length) throw new BadRequestError('Choisissez une société Fournisseur active.')
    if (!app.findRecordsByFilter('accounting_currencies', 'code = {:code} && active = true', '', 1, 0, { code: offer.currency }).length) throw new BadRequestError('Devise fournisseur invalide.')
    for (const key of ['valid_from', 'valid_until']) if (typeof offer[key] !== 'string' || offer[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(offer[key]) || !Number.isFinite(Date.parse(offer[key] + 'T00:00:00Z')) || new Date(offer[key] + 'T00:00:00Z').toISOString().slice(0, 10) !== offer[key])) throw new BadRequestError('Dates de tarif invalides.')
    if (offer.valid_from && offer.valid_until && offer.valid_until < offer.valid_from) throw new BadRequestError('La fin du tarif précède son début.')
    pricing.offer(offer)
  }
}
module.exports = {
  barcodePreview(event) {
    guard(event.app, event.auth, true)
    const query = event.requestInfo().query, brand = get(event.app, 'inventory_brands', query.brand)
    if (typeof query.sku !== 'string' || !query.sku.trim() || query.sku.length > 80) throw new BadRequestError('Référence requise pour le code-barres.')
    return event.json(200, { barcode: require(`${__hooks}/lib/catalog-barcode.js`).base(brand.getString('name'), query.sku) })
  },
  allowed, productPrice, get, dto, validateProduct, fields,
  documentContext(app, user, id) {
    guard(app, user)
    const product = get(app, 'inventory_products', id)
    const brand = product.getString('brand') ? get(app, 'inventory_brands', product.getString('brand')).getString('name') : product.getString('manufacturer')
    return { fields: { 'product.name': product.getString('name'), 'product.reference': product.getString('sku'), 'product.brand': brand, 'product.barcode': product.getString('barcode'), 'product.description': product.getString('description'), 'product.unit': get(app, 'inventory_units', product.getString('base_unit')).getString('code') }, lines: [], warnings: [] }
  },
  list(event) {
    const perPage = require(`${__hooks}/lib/list-page-size.js`)(event.requestInfo().query.perPage, 25)
    guard(event.app, event.auth)
    const query = event.requestInfo().query, page = Number(query.page || 1), params = { active: query.state !== 'archived' }, filters = ['active = {:active}']
    if (!Number.isInteger(page) || page < 1 || page > 100000) throw new BadRequestError('Page invalide.')
    for (const [index, word] of String(query.q || '').slice(0, 200).split(/\s+/).filter(Boolean).entries()) { params['q' + index] = word; filters.push(`(name ~ {:q${index}} || sku ~ {:q${index}} || manufacturer ~ {:q${index}} || manufacturer_ref ~ {:q${index}} || barcode ~ {:q${index}} || inventory_products_via_merged_into.sku ?~ {:q${index}} || inventory_products_via_merged_into.barcode ?~ {:q${index}} || description ~ {:q${index}})` ) }
    if (query.sale_enabled !== undefined) { if (!['true', 'false'].includes(query.sale_enabled)) throw new BadRequestError('Critère de vente invalide.'); params.sale = query.sale_enabled === 'true'; filters.push('sale_enabled = {:sale}') }
    if (query.purchase_enabled !== undefined) { if (!['true', 'false'].includes(query.purchase_enabled)) throw new BadRequestError('Critère d’achat invalide.'); params.purchase = query.purchase_enabled === 'true'; filters.push('purchase_enabled = {:purchase}') }
    if (query.kind) { params.kind = query.kind; filters.push('kind = {:kind}') }
    if (query.state && !['active', 'archived'].includes(query.state)) throw new BadRequestError('Archives invalides.')
    const selectedCategories = require(`${__hooks}/lib/stock-list-filters.js`).values(query.category, (id) => /^[a-z0-9]{15}$/.test(id), 'Familles')
    if (selectedCategories.length) filters.push('(' + selectedCategories.map((id, index) => { params['category' + index] = id; return `category = {:category${index}}` }).join(' || ') + ')')
    const filter = filters.join(' && '), sort = require(`${__hooks}/lib/list-sorting.js`).sql(query.sort, ['name', 'sku', 'manufacturer', 'category_label', 'unit_cost', 'unit_price', 'physical_quantity', 'available_quantity', 'created'], 'name')
    const matching = event.app.findRecordsByFilter('inventory_products', filter, (['category_label', 'unit_cost', 'unit_price', 'physical_quantity', 'available_quantity'].includes(sort.replace(/^-/, '')) ? 'name' : sort) + ',id', 10001, 0, params)
    if (matching.length > 10000) throw new BadRequestError('Affinez la recherche du catalogue.')
    const totalItems = matching.length
    const projectedSort = ['category_label', 'unit_cost', 'unit_price', 'physical_quantity', 'available_quantity'].includes(sort.replace(/^-/, ''))
    const records = projectedSort ? matching : matching.slice((page - 1) * perPage, page * perPage)
    const stock = require(`${__hooks}/lib/stock.js`).balancesByProduct(event.app, event.auth, records.filter((record) => record.getString('stock_policy') !== 'none').map((record) => record.id))
    const items = records.map((record) => ({ ...dto(event.app, record, false), physical_quantity: record.getString('stock_policy') === 'none' ? null : stock.get(record.id)?.physical || 0, available_quantity: record.getString('stock_policy') === 'none' ? null : stock.get(record.id)?.available || 0 }))
    if (projectedSort) require(`${__hooks}/lib/list-sorting.js`).rows(items, sort, ['category_label', 'unit_cost', 'unit_price', 'physical_quantity', 'available_quantity'], 'physical_quantity', (item, field) => field === 'unit_cost' || field === 'unit_price' ? item.pricing[field] : item[field])
    const categories = arrayOf(new DynamicModel({ id: '', code: '', label: '', count: 0 }))
    event.app.db().newQuery("SELECT c.id, c.code, c.label, COUNT(p.id) AS count FROM inventory_product_categories c LEFT JOIN inventory_products p ON p.category = c.id AND p.active = {:active} GROUP BY c.id HAVING c.active = true OR COUNT(p.id) > 0 ORDER BY CASE c.code WHEN 'equipment' THEN 0 WHEN 'supplies' THEN 1 WHEN 'services' THEN 2 ELSE 3 END,c.label COLLATE NOCASE,c.id").bind({ active: params.active }).all(categories)
    return event.json(200, { items: projectedSort ? items.slice((page - 1) * perPage, page * perPage) : items, categories, page, totalItems, totalPages: Math.ceil(totalItems / perPage) })
  },
  record(event) { guard(event.app, event.auth); const product = get(event.app, 'inventory_products', event.request.pathValue('id')); return event.json(200, { ...dto(event.app, product), last_purchase: require(`${__hooks}/lib/purchasing.js`).lastPurchase(event.app, event.auth, product.id), purchase_history: require(`${__hooks}/lib/purchasing.js`).productHistory(event.app, event.auth, product.id) }) },
  choices(event) {
    guard(event.app, event.auth)
    return event.json(200, { brands: event.app.findAllRecords('inventory_brands').map((item) => item.publicExport()), countries: event.app.findAllRecords('settings_countries').map((item) => ({ code: item.getString('code'), label: item.getString('label'), active: item.getBool('active') })), categories: event.app.findAllRecords('inventory_product_categories').map((item) => item.publicExport()), units: event.app.findAllRecords('inventory_units').map((item) => item.publicExport()), currencies: event.app.findRecordsByFilter('accounting_currencies', 'active = true', 'code', 0, 0).map((item) => ({ code: item.getString('code'), label: item.getString('label') })), suppliers: policy.permissions(event.app, event.auth).includes('contacts.read') ? event.app.findRecordsByFilter('contacts_company_roles', 'active = true && role = "supplier" && company.active = true', 'company.name', 0, 0).map((role) => { const item = get(event.app, 'contacts_companies', role.getString('company')); return { id: item.id, name: item.getString('name') } }) : [] })
  },
  categories(event) { if (!allowed(event.app, event.auth) && !policy.settings(event.app, event.auth)) throw new ForbiddenError('Accès aux familles refusé.'); return event.json(200, { items: event.app.findAllRecords('inventory_product_categories').map((item) => item.publicExport()) }) },
  createBrand(event) {
    guard(event.app, event.auth, true)
    const body = event.requestInfo().body; exact(body, ['name'])
    if (typeof body.name !== 'string' || !brandName(body.name) || body.name.length > 160) throw new BadRequestError('Nom de marque obligatoire, 160 caractères maximum.')
    let saved; event.app.runInTransaction((app) => { guard(app, event.auth, true); saved = resolveBrand(app, body.name, event.auth).publicExport() }); return event.json(200, saved)
  },
  saveCategory(event) {
    if (!policy.settings(event.app, event.auth)) throw new ForbiddenError('Le paramétrage des familles est réservé aux administrateurs et superusers.')
    const body = event.requestInfo().body; exact(body, ['id', 'updated', 'code', 'label', 'coefficient', 'active', 'product_kind'])
    if (typeof body.code !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(body.code) || typeof body.label !== 'string' || !body.label.trim() || body.label.length > 120 || typeof body.active !== 'boolean') throw new BadRequestError('Famille invalide.')
    if (body.product_kind !== undefined && !['equipment', 'consumable', 'service'].includes(body.product_kind)) throw new BadRequestError('Classification de famille invalide.')
    pricing.sale(0, body.coefficient)
    let saved
    event.app.runInTransaction((app) => { if (!policy.settings(app, event.auth)) throw new ForbiddenError('Accès refusé.'); const record = body.id ? get(app, 'inventory_product_categories', body.id) : new Record(app.findCollectionByNameOrId('inventory_product_categories')); if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'Cette famille a changé. Rechargez-la.'); if (body.id && body.code !== record.getString('code')) throw new BadRequestError('Le code de famille est immuable.'); if (body.id) for (const product of app.findRecordsByFilter('inventory_products', 'category = {:id}', '', 0, 0, { id: record.id })) pricing.sale(productPrice(app, product).unit_cost, product.getBool('coefficient_override') ? product.getFloat('manual_coefficient') : body.coefficient); const before = body.id ? record.publicExport() : null; if (body.product_kind !== undefined) record.set('product_kind', body.product_kind); else if (!body.id) record.set('product_kind', 'equipment'); for (const key of ['code', 'label', 'coefficient', 'active']) record.set(key, key === 'label' ? body[key].trim() : body[key]); app.save(record); audit(app, event.auth, record, before, body.id ? 'update' : 'create'); saved = record.publicExport() })
    return event.json(200, saved)
  },
  save(event) {
    guard(event.app, event.auth, true)
    const body = event.requestInfo().body; exact(body, ['id', 'updated', 'creation_key', 'input', 'remove_image', 'remove_images'])
    if (![undefined, true, false, 'true', 'false'].includes(body.remove_image)) throw new BadRequestError('Action sur la photo invalide.')
    let input = typeof body.input === 'string' ? parseJson(body.input) : body.input
    const uploads = (field) => { if (!event.request.header.get('Content-Type').startsWith('multipart/form-data')) return []; try { return event.findUploadedFiles(field) } catch (error) { if (String(error).endsWith('http: no such file')) return []; throw error } }
    const primary = uploads('primary_image'), images = uploads('images')
    if (primary.length > 1 || images.length > 6) throw new BadRequestError('Une photo principale et six photos de galerie maximum.')
    let result
    event.app.runInTransaction((app) => {
      guard(app, event.auth, true)
      const currentProduct = body.id ? get(app, 'inventory_products', body.id) : null
      input = normalizeInput(app, input, event.auth, currentProduct)
      if (!body.id && !/^[a-zA-Z0-9-]{16,100}$/.test(body.creation_key || '')) throw new BadRequestError('Clé de création invalide.')
      if (!body.id) { const existing = app.findRecordsByFilter('inventory_products', 'creation_key = {:key} && created_by = {:actor}', '', 1, 0, { key: body.creation_key, actor: event.auth.id })[0]; if (existing) { exact(input, [...fields, 'offers']); if (fields.some((key) => (key === 'barcode' ? ![existing.getString('barcode'), existing.getString('barcode_requested')].includes(input.barcode.trim()) : existing.get(key) !== (typeof input[key] === 'string' ? input[key].trim() : input[key])))) throw new ApiError(409, 'Cette création existe déjà avec d’autres valeurs.'); result = dto(app, existing); return } }
      const record = currentProduct || new Record(app.findCollectionByNameOrId('inventory_products'))
      if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'Le produit a changé. Rechargez sa fiche.')
      if (body.id && !record.getBool('active')) throw new BadRequestError('Réactivez le produit avant de le modifier.')
      validateProduct(app, input, body.id ? record : null)
      const before = body.id ? record.publicExport() : null
      for (const key of fields) record.set(key, typeof input[key] === 'string' ? input[key].trim() : input[key])
      const requestedBarcode = input.barcode.trim(), barcodes = require(`${__hooks}/lib/catalog-barcode.js`)
      const barcode = requestedBarcode || (!body.id ? barcodes.base(input.manufacturer, input.sku) : '')
      if (barcode) record.set('barcode', barcodes.allocate(barcode, (candidate) => app.findRecordsByFilter('inventory_products', 'barcode = {:barcode} && id != {:id}', '', 1, 0, { barcode: candidate, id: record.id }).length > 0))
      if (!body.id) record.set('barcode_requested', requestedBarcode)
      record.set('sale_unit', input.base_unit); record.set('composition_mode', 'none')
      if (!body.id) { record.set('active', true); record.set('created_by', event.auth.id); record.set('creation_key', body.creation_key) }
      if (body.remove_image === true || body.remove_image === 'true') record.set('primary_image', '')
      if (primary.length) record.set('primary_image', primary)
      const removed = typeof body.remove_images === 'string' ? parseJson(body.remove_images) : body.remove_images || []
      if (!Array.isArray(removed) || removed.some((name) => typeof name !== 'string' || !record.getStringSlice('images').includes(name))) throw new BadRequestError('Photo de galerie invalide.')
      if (removed.length) record.set('images-', removed)
      if (images.length) record.set('images+', images)
      app.save(record)
      const previous = offers(app, record.id), beforeOffers = new Map(previous.map((offer) => [offer.id, offer.publicExport()]))
      for (const offer of previous) if (offer.getBool('is_preferred')) { offer.set('is_preferred', false); app.save(offer) }
      const seen = new Set()
      for (const inputOffer of input.offers) {
        const offer = inputOffer.id ? get(app, 'inventory_product_suppliers', inputOffer.id) : new Record(app.findCollectionByNameOrId('inventory_product_suppliers'))
        const old = inputOffer.id ? beforeOffers.get(inputOffer.id) : null
        for (const key of offerFields) offer.set(key, ['valid_from', 'valid_until'].includes(key) && inputOffer[key] ? inputOffer[key] + 'T00:00:00.000Z' : inputOffer[key])
        offer.set('product', record.id); offer.set('active', true); offer.set('purchase_price', pricing.offer(inputOffer).purchase_price); app.save(offer); seen.add(offer.id); audit(app, event.auth, offer, old, old ? 'update' : 'create')
        if (!old || ['list_price', 'discount', 'purchase_quantity', 'currency', 'supplier', 'supplier_sku', 'valid_from', 'valid_until'].some((key) => JSON.stringify(old[key]) !== JSON.stringify(offer.publicExport()[key]))) {
          const history = new Record(app.findCollectionByNameOrId('inventory_supplier_price_history')); for (const [key, value] of Object.entries({ product_supplier: offer.id, price: offer.getFloat('purchase_price'), currency: offer.getString('currency'), snapshot: offer.publicExport(), effective_at: new Date().toISOString(), actor: event.auth.id })) history.set(key, value); app.save(history)
        }
      }
      for (const offer of previous) if (!seen.has(offer.id) && offer.getBool('active')) { const beforeOffer = beforeOffers.get(offer.id); offer.set('active', false); offer.set('is_preferred', false); app.save(offer); audit(app, event.auth, offer, beforeOffer, 'archive') }
      result = dto(app, record); audit(app, event.auth, record, before, body.id ? 'update' : 'create'); require(`${__hooks}/lib/activity.js`).publish(app, record, event.auth.id, 'change', before ? 'Produit mis à jour' : 'Produit créé', { action: before ? 'update' : 'create' })
    })
    return event.json(200, { ...result, purchase_history: require(`${__hooks}/lib/purchasing.js`).productHistory(event.app, event.auth, result.id) })
  },
  state(event) { guard(event.app, event.auth, true); const body = event.requestInfo().body; exact(body, ['id', 'updated', 'active']); if (typeof body.active !== 'boolean') throw new BadRequestError('État invalide.'); let saved; event.app.runInTransaction((app) => { guard(app, event.auth, true); const record = get(app, 'inventory_products', body.id); if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Le produit a changé. Rechargez sa fiche.'); const before = record.publicExport(); record.set('active', body.active); app.save(record); audit(app, event.auth, record, before, body.active ? 'restore' : 'archive'); saved = dto(app, record); require(`${__hooks}/lib/activity.js`).publish(app, record, event.auth.id, 'status_change', body.active ? 'Produit réactivé' : 'Produit archivé', { action: body.active ? 'restore' : 'archive' }) }); return event.json(200, saved) },
  quoteLine(event) { guard(event.app, event.auth); if (!policy.permissions(event.app, event.auth).includes('sales.read')) throw new ForbiddenError('Accès aux devis refusé.'); const body = event.requestInfo().body; exact(body, ['product', 'offer', 'currency']); const product = get(event.app, 'inventory_products', body.product); if (!product.getBool('active') || !product.getBool('sale_enabled')) throw new BadRequestError('Ce produit ne peut pas être vendu.'); if (!get(event.app, 'inventory_units', product.getString('base_unit')).getBool('active')) throw new BadRequestError('L’unité du produit est archivée.'); const price = productPrice(event.app, product, body.offer || ''); if (price.warning || body.currency !== price.currency) throw new BadRequestError(price.warning || 'La devise du produit est différente de celle du devis.'); return event.json(200, { product: product.id, product_supplier: price.product_supplier, description: product.getString('description') || product.getString('name'), brand: product.getString('manufacturer'), reference: product.getString('sku'), unit: get(event.app, 'inventory_units', product.getString('base_unit')).getString('code'), unit_cost: price.unit_cost, unit_price: price.unit_price, margin_percent: (price.coefficient - 1) * 100 }) },
}

// Initial suggestion only: Inventory freezes its own standard cost thereafter.
module.exports.valuationCost = (app, id) => {
  const price = productPrice(app, get(app, 'inventory_products', id))
  if (price.currency !== 'EUR' || price.warning) return null
  return price.unit_cost
}

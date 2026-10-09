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
const dto = (app, record, detail = true) => ({ ...publicProduct(record), category_label: get(app, 'inventory_product_categories', record.getString('category')).getString('label'), unit_code: get(app, 'inventory_units', record.getString('base_unit')).getString('code'), unit_locked: offers(app, record.id).length > 0, pricing: productPrice(app, record), ...(detail ? { offers: offers(app, record.id).filter((item) => item.getBool('active')).map((offer) => projectOffer(app, offer)), price_history: app.findRecordsByFilter('inventory_supplier_price_history', 'product_supplier.product = {:id}', '-effective_at,id', 100, 0, { id: record.id }).map((item) => item.publicExport()) } : {}) })
const fields = ['sku', 'name', 'description', 'category', 'kind', 'sale_enabled', 'purchase_enabled', 'stock_policy', 'replenishment_policy', 'tracking', 'base_unit', 'brand', 'cost_override', 'coefficient_override', 'manual_coefficient', 'weight_kg', 'volume_m3', 'hs_code', 'origin_country', 'manufacturer', 'manufacturer_ref', 'barcode', 'variant_group', 'reference_cost', 'sale_currency']
const offerFields = ['supplier', 'supplier_sku', 'list_price', 'discount', 'purchase_quantity', 'currency', 'lead_time_days', 'valid_from', 'valid_until', 'is_preferred']
const brandName = (value) => value.trim().replace(/\s+/g, ' ')
const resolveBrand = (app, name, actor) => {
  const normalized = brandName(name), key = normalized.toLowerCase()
  const existing = app.findRecordsByFilter('inventory_brands', 'name_key = {:key}', '', 1, 0, { key })[0]
  if (existing) { if (!existing.getBool('active')) throw new BadRequestError('Cette marque est archivée.'); return existing }
  const record = new Record(app.findCollectionByNameOrId('inventory_brands')); record.set('name', normalized); record.set('name_key', key); record.set('active', true); app.save(record); audit(app, actor, record, null, 'create'); return record
}
const normalizeInput = (app, input, actor) => {
  exact(input, [...fields, 'offers'])
  const value = { brand: '', cost_override: false, coefficient_override: false, manual_coefficient: 1, weight_kg: 0, volume_m3: 0, hs_code: '', origin_country: '', ...input }
  if (input.brand === undefined && typeof input.manufacturer === 'string' && input.manufacturer.trim()) value.brand = resolveBrand(app, input.manufacturer, actor).id
  if (value.brand) value.manufacturer = get(app, 'inventory_brands', value.brand).getString('name')
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
  allowed, productPrice, get, dto,
  list(event) {
    guard(event.app, event.auth)
    const query = event.requestInfo().query, page = Number(query.page || 1), params = { active: query.state !== 'archived' }, filters = ['active = {:active}']
    if (!Number.isInteger(page) || page < 1 || page > 100000) throw new BadRequestError('Page invalide.')
    for (const [index, word] of String(query.q || '').slice(0, 200).split(/\s+/).filter(Boolean).entries()) { params['q' + index] = word; filters.push(`(name ~ {:q${index}} || sku ~ {:q${index}} || manufacturer ~ {:q${index}} || manufacturer_ref ~ {:q${index}} || barcode ~ {:q${index}})` ) }
    if (query.kind) { params.kind = query.kind; filters.push('kind = {:kind}') }
    if (query.category) { params.category = query.category; filters.push('category = {:category}') }
    const filter = filters.join(' && '), sort = ['name', '-name', 'sku', '-created'].includes(query.sort) ? query.sort : 'name'
    const matching = event.app.findRecordsByFilter('inventory_products', filter, sort + ',id', 10001, 0, params)
    if (matching.length > 10000) throw new BadRequestError('Affinez la recherche du catalogue.')
    const totalItems = matching.length
    return event.json(200, { items: matching.slice((page - 1) * 25, page * 25).map((record) => dto(event.app, record, false)), page, totalItems, totalPages: Math.ceil(totalItems / 25) })
  },
  record(event) { guard(event.app, event.auth); return event.json(200, dto(event.app, get(event.app, 'inventory_products', event.request.pathValue('id')))) },
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
    const body = event.requestInfo().body; exact(body, ['id', 'updated', 'code', 'label', 'coefficient', 'active'])
    if (typeof body.code !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(body.code) || typeof body.label !== 'string' || !body.label.trim() || body.label.length > 120 || typeof body.active !== 'boolean') throw new BadRequestError('Famille invalide.')
    pricing.sale(0, body.coefficient)
    let saved
    event.app.runInTransaction((app) => { if (!policy.settings(app, event.auth)) throw new ForbiddenError('Accès refusé.'); const record = body.id ? get(app, 'inventory_product_categories', body.id) : new Record(app.findCollectionByNameOrId('inventory_product_categories')); if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'Cette famille a changé. Rechargez-la.'); if (body.id && body.code !== record.getString('code')) throw new BadRequestError('Le code de famille est immuable.'); if (body.id) for (const product of app.findRecordsByFilter('inventory_products', 'category = {:id}', '', 0, 0, { id: record.id })) pricing.sale(productPrice(app, product).unit_cost, product.getBool('coefficient_override') ? product.getFloat('manual_coefficient') : body.coefficient); const before = body.id ? record.publicExport() : null; for (const key of ['code', 'label', 'coefficient', 'active']) record.set(key, key === 'label' ? body[key].trim() : body[key]); app.save(record); audit(app, event.auth, record, before, body.id ? 'update' : 'create'); saved = record.publicExport() })
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
      input = normalizeInput(app, input, event.auth)
      if (!body.id && !/^[a-zA-Z0-9-]{16,100}$/.test(body.creation_key || '')) throw new BadRequestError('Clé de création invalide.')
      if (!body.id) { const existing = app.findRecordsByFilter('inventory_products', 'creation_key = {:key} && created_by = {:actor}', '', 1, 0, { key: body.creation_key, actor: event.auth.id })[0]; if (existing) { exact(input, [...fields, 'offers']); if (fields.some((key) => existing.get(key) !== (typeof input[key] === 'string' ? input[key].trim() : input[key]))) throw new ApiError(409, 'Cette création existe déjà avec d’autres valeurs.'); result = dto(app, existing); return } }
      const record = body.id ? get(app, 'inventory_products', body.id) : new Record(app.findCollectionByNameOrId('inventory_products'))
      if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'Le produit a changé. Rechargez sa fiche.')
      if (body.id && !record.getBool('active')) throw new BadRequestError('Réactivez le produit avant de le modifier.')
      validateProduct(app, input, body.id ? record : null)
      const before = body.id ? record.publicExport() : null
      for (const key of fields) record.set(key, typeof input[key] === 'string' ? input[key].trim() : input[key])
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
    return event.json(200, result)
  },
  state(event) { guard(event.app, event.auth, true); const body = event.requestInfo().body; exact(body, ['id', 'updated', 'active']); if (typeof body.active !== 'boolean') throw new BadRequestError('État invalide.'); let saved; event.app.runInTransaction((app) => { guard(app, event.auth, true); const record = get(app, 'inventory_products', body.id); if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Le produit a changé. Rechargez sa fiche.'); const before = record.publicExport(); record.set('active', body.active); app.save(record); audit(app, event.auth, record, before, body.active ? 'restore' : 'archive'); saved = dto(app, record); require(`${__hooks}/lib/activity.js`).publish(app, record, event.auth.id, 'status_change', body.active ? 'Produit réactivé' : 'Produit archivé', { action: body.active ? 'restore' : 'archive' }) }); return event.json(200, saved) },
  quoteLine(event) { guard(event.app, event.auth); if (!policy.permissions(event.app, event.auth).includes('sales.read')) throw new ForbiddenError('Accès aux devis refusé.'); const body = event.requestInfo().body; exact(body, ['product', 'offer', 'currency']); const product = get(event.app, 'inventory_products', body.product); if (!product.getBool('active') || !product.getBool('sale_enabled')) throw new BadRequestError('Ce produit ne peut pas être vendu.'); if (!get(event.app, 'inventory_units', product.getString('base_unit')).getBool('active')) throw new BadRequestError('L’unité du produit est archivée.'); const price = productPrice(event.app, product, body.offer || ''); if (price.warning || body.currency !== price.currency) throw new BadRequestError(price.warning || 'La devise du produit est différente de celle du devis.'); return event.json(200, { product: product.id, product_supplier: price.product_supplier, description: product.getString('description') || product.getString('name'), brand: product.getString('manufacturer'), reference: product.getString('sku'), unit: get(event.app, 'inventory_units', product.getString('base_unit')).getString('code'), unit_cost: price.unit_cost, unit_price: price.unit_price, margin_percent: (price.coefficient - 1) * 100 }) },
}

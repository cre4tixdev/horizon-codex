// This pilot can only read partners from a configured Odoo SaaS instance.
const core = () => require(`${__hooks}/lib/imports.js`)
const config = (app) => app.findRecordsByFilter('settings_import_odoo', 'key = "default"', '', 1, 0)[0]
const secretKey = () => { const key = $os.getenv('HORIZON_IMPORT_ENCRYPTION_KEY'); if (!/^[\x21-\x7e]{32}$/.test(key)) throw new ApiError(503, 'Configurez HORIZON_IMPORT_ENCRYPTION_KEY (32 caractères) sur PocketBase.'); return key }
const call = (record, method, body, model = 'res.partner') => {
  if (!['res.partner', 'res.country'].includes(model) || !['fields_get', 'search_read', 'search_count'].includes(method) || model === 'res.country' && method !== 'search_read') throw new ForbiddenError('Méthode Odoo interdite.')
  const raw = $security.decrypt(record.getString('api_key_cipher'), secretKey()), key = typeof raw === 'string' ? raw : String.fromCharCode(...raw)
  const test = $os.getenv('HORIZON_TEST_MODE') === '1' && /^http:\/\/127\.0\.0\.1:\d+$/.test($os.getenv('HORIZON_ODOO_TEST_ORIGIN')) ? $os.getenv('HORIZON_ODOO_TEST_ORIGIN') : ''
  let response
  try { response = $http.send({ url: `${test || record.getString('base_url')}/json/2/${model}/${method}`, method: 'POST', headers: { Authorization: `bearer ${key}`, 'Content-Type': 'application/json', ...(record.getString('database') ? { 'X-Odoo-Database': record.getString('database') } : {}) }, body: JSON.stringify(body), timeout: 15 }) }
  catch { throw new ApiError(503, 'Odoo ne répond pas. Vérifiez la connexion et réessayez.') }
  if (response.statusCode < 200 || response.statusCode >= 300) { console.error('[imports] Odoo read rejected', response.statusCode); throw new BadRequestError([401, 403].includes(response.statusCode) ? 'Odoo refuse l’accès : vérifiez la clé et ses droits de lecture.' : 'Lecture Odoo refusée. Vérifiez la version, l’accès API et la base configurée.') }
  if (method === 'search_count') {
    try { return response.body.length <= 30 ? JSON.parse(response.body.map((byte) => String.fromCharCode(byte)).join('')) : null }
    catch { throw new BadRequestError('Comptage Odoo invalide.') }
  }
  return response.json
}
module.exports = {
  settings(e) {
    const user = core().guard(e), canConfigure = ['admin', 'superuser'].includes(user.getString('erp_profile')) && require(`${__hooks}/lib/access-policy.js`).permissions(e.app, user).includes('settings.references')
    if (e.request.method === 'POST') {
      if (!canConfigure) throw new ForbiddenError('Configuration réservée à l’administrateur.')
      const b = e.requestInfo().body; core().exact(b, ['base_url', 'database', 'api_key'])
      if (typeof b.base_url !== 'string' || !/^https:\/\/[a-z0-9-]+\.odoo\.com$/.test(b.base_url) || typeof b.database !== 'string' || !/^[a-zA-Z0-9_.-]{0,120}$/.test(b.database) || typeof b.api_key !== 'string' || b.api_key.length > 2000) throw new BadRequestError('URL SaaS Odoo, base ou clé invalide.')
      const record = config(e.app) || new Record(e.app.findCollectionByNameOrId('settings_import_odoo')), version = record.getString('updated')
      if (!b.api_key && (record.getString('base_url') !== b.base_url || record.getString('database') !== b.database || !record.getString('api_key_cipher'))) throw new BadRequestError('Saisissez une clé pour cette connexion.')
      record.set('key', 'default'); record.set('base_url', b.base_url); record.set('database', b.database)
      if (b.api_key) record.set('api_key_cipher', $security.encrypt(b.api_key, secretKey()))
      // Probe only the model metadata before storing a new connection.
      call(record, 'fields_get', { attributes: ['string', 'type'] })
      e.app.runInTransaction((app) => {
        const currentUser = core().guard({ app, auth: e.auth })
        if (!require(`${__hooks}/lib/access-policy.js`).settings(app, currentUser)) throw new ForbiddenError('Configuration réservée à l’administrateur.')
        if ((config(app)?.getString('updated') || '') !== version) throw new ApiError(409, 'La connexion a changé. Rechargez sa configuration.')
        app.save(record)
        require(`${__hooks}/lib/access-policy.js`).audit(app, 'settings_import_odoo', record.id, user.id, null, { base_url: b.base_url, database: b.database }, 'configure')
      })
    }
    const record = config(e.app)
    return e.json(200, { configured: Boolean(record), can_configure: canConfigure, base_url: record?.getString('base_url') || '', database: record?.getString('database') || '' })
  },
  read(e) {
    core().guard(e); const b = e.requestInfo().body; core().exact(b, ['type', 'after_id', 'query', 'since'])
    if (!['companies', 'people'].includes(b.type) || !Number.isInteger(b.after_id) || b.after_id < 0 || typeof b.query !== 'string' || b.query.length > 100 || typeof b.since !== 'string' || b.since && !/^\d{4}-\d{2}-\d{2}$/.test(b.since)) throw new BadRequestError('Sélection Odoo invalide.')
    const record = config(e.app); if (!record) throw new BadRequestError('Configurez d’abord la connexion Odoo.')
    const metadata = call(record, 'fields_get', { attributes: ['string', 'type'] })
    if (!metadata || typeof metadata !== 'object' || !metadata.id || !metadata.name) throw new BadRequestError('Métadonnées Odoo incompatibles.')
    const wanted = ['id', 'name', 'email', 'phone', 'mobile', 'website', 'vat', 'street', 'street2', 'zip', 'city', 'country_id', 'parent_id', 'function', 'customer_rank', 'supplier_rank', 'l10n_fr_siren', 'l10n_fr_siret']
    const imageFields = ['image_256', 'image_128', 'image_512', 'image_1024', 'image_1920'].filter((field) => Object.hasOwn(metadata, field))
    const imageField = imageFields[0] || ''
    if (imageField) wanted.push(imageField)
    const fields = wanted.filter((key) => Object.hasOwn(metadata, key))
    const domain = [['active', '=', true], ['is_company', '=', b.type === 'companies']]
    if (b.type === 'people') domain.push(['type', '=', 'contact'])
    if (b.query) domain.push(['name', 'ilike', b.query])
    if (b.since) domain.push(['write_date', '>=', b.since + ' 00:00:00'])
    const total = call(record, 'search_count', { domain })
    if (!Number.isSafeInteger(total) || total < 0) throw new BadRequestError('Comptage Odoo invalide.')
    const values = call(record, 'search_read', { domain: [...domain, ['id', '>', b.after_id]], fields, order: 'id', limit: 201, context: { bin_size: false } })
    if (!Array.isArray(values)) throw new BadRequestError('Réponse Odoo invalide.')
    const page = values.slice(0, 200)
    const missing = imageField ? page.filter((row) => !row[imageField]).map((row) => row.id) : []
    const alternatives = imageFields.slice(1)
    const fallback = missing.length && alternatives.length ? call(record, 'search_read', { domain: [['id', 'in', missing]], fields: ['id', ...alternatives], limit: missing.length, context: { bin_size: false } }) : []
    if (!Array.isArray(fallback)) throw new BadRequestError('Lecture des images Odoo invalide.')
    const fallbackById = new Map(fallback.map((row) => [row.id, row]))
    const headers = b.type === 'companies' ? ['external_id', 'name', 'email', 'phone', 'website', 'vat_number', 'siren', 'siret', 'line1', 'line2', 'postal_code', 'city', 'country', 'customer', 'supplier'] : ['external_id', 'last_name', 'email', 'phone', 'mobile', 'job_title', 'company_external_id', 'company_name']
    headers.push('image_base64')
    const countryIds = [...new Set(page.filter((r) => Array.isArray(r.country_id)).map((r) => r.country_id[0]))]
    const countries = countryIds.length ? call(record, 'search_read', { domain: [['id', 'in', countryIds]], fields: ['id', 'code'], limit: 200 }, 'res.country') : []
    if (!Array.isArray(countries)) throw new BadRequestError('Codes pays Odoo invalides.')
    const rows = page.map((r) => {
      const country = Array.isArray(r.country_id) ? countries.find((c) => c.id === r.country_id[0])?.code || 'INCONNU' : ''
      const data = b.type === 'companies' ? { external_id: String(r.id), name: r.name, email: r.email, phone: r.phone, website: r.website, vat_number: r.vat, siren: r.l10n_fr_siren, siret: r.l10n_fr_siret, line1: r.street, line2: r.street2, postal_code: r.zip, city: r.city, country, customer: metadata.customer_rank ? r.customer_rank > 0 ? 'oui' : 'non' : '', supplier: metadata.supplier_rank ? r.supplier_rank > 0 ? 'oui' : 'non' : '' } : { external_id: String(r.id), last_name: r.name, email: r.email, phone: r.phone, mobile: r.mobile, job_title: r.function, company_external_id: Array.isArray(r.parent_id) ? String(r.parent_id[0]) : '', company_name: Array.isArray(r.parent_id) ? String(r.parent_id[1] || '') : '' }
      data.image_base64 = imageField ? r[imageField] || alternatives.map((field) => fallbackById.get(r.id)?.[field]).find(Boolean) || '' : ''
      return headers.map((key) => data[key] === false || data[key] === null || data[key] === undefined ? '' : String(data[key]))
    })
    return e.json(200, { headers, rows, total, image_fields: imageFields, namespace: record.getString('base_url') + '|' + record.getString('database'), has_more: values.length > 200, after_id: page.length ? page[page.length - 1].id : b.after_id })
  },
}

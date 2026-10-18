// Contacts owns normalization, matching and writes. Imports never writes private
// Contacts collections without this adapter and their normal validation/audit hooks.
const fields = {
  companies: { image_base64: 200000, external_id: 255, name: 160, legal_name: 200, siren: 9, siret: 14, vat_number: 80, email: 254, phone: 40, website: 500, notes: 10000, customer: 10, supplier: 10, line1: 200, line2: 200, postal_code: 20, city: 100, country: 2 },
  people: { image_base64: 200000, external_id: 255, first_name: 80, last_name: 80, job_title: 120, email: 254, phone: 40, mobile: 40, notes: 10000, company_external_id: 255, company_siren: 9, company_name: 160 },
}
const table = (type) => type === 'companies' ? 'contacts_companies' : 'contacts_people'
const json = (r, key) => JSON.parse(r.getString(key) || '{}')
const all = (app, type, filter, params) => app.findRecordsByFilter(table(type), `(${filter}) && merged_into = ''`, 'id', 101, 0, params)
const label = (r) => r.collection().name === 'contacts_companies' ? r.getString('name') : [r.getString('first_name'), r.getString('last_name')].filter(Boolean).join(' ')
const external = (app, namespace, type, key) => key ? app.findRecordsByFilter('core_external_references', 'provider = {:provider} && entity_type = {:type} && external_id = {:key}', '', 1, 0, { provider: namespace, type: table(type), key })[0] : null
const findCompany = (app, input, namespace) => {
  let matches = []
  if (input.company_external_id) {
    const ref = external(app, namespace, 'companies', input.company_external_id)
    if (ref) matches = all(app, 'companies', 'id = {:id}', { id: ref.getString('horizon_record_id') })
    else if (namespace.startsWith('file:')) {
      const refs = app.findRecordsByFilter('core_external_references', 'provider ~ {:prefix} && entity_type = \'contacts_companies\' && external_id = {:key}', '', 101, 0, { prefix: namespace.split(':').slice(0, 2).join(':') + ':', key: input.company_external_id })
      for (const id of [...new Set(refs.map((r) => r.getString('horizon_record_id')))]) matches.push(...all(app, 'companies', 'id = {:id}', { id }))
    }
  } else if (input.company_siren) matches = all(app, 'companies', 'siren = {:value}', { value: input.company_siren.replace(/\s/g, '') })
  else if (input.company_name) matches = all(app, 'companies', 'name = {:value}', { value: input.company_name })
  if (matches.length !== 1 || !matches[0].getBool('active')) throw new BadRequestError(`Société à vérifier : ${input.company_name || 'sans nom'}${input.company_external_id ? ' (référence ' + input.company_external_id + ')' : ''}. Absente, archivée ou ambiguë : importez la société d’abord ou corrigez son rattachement.`)
  return matches[0]
}
const snapshot = (app, type, record) => {
  if (!record) return {}
  const data = Object.fromEntries(Object.keys(fields[type]).filter((key) => record.collection().fields.getByName(key)).map((key) => [key, record.getString(key)]))
  Object.assign(data, require(`${__hooks}/lib/import-image.js`).current(app, record))
  data.updated = record.getString('updated'); data.active = record.getBool('active')
  if (type === 'companies') {
    for (const role of ['customer', 'supplier']) data[role] = app.findRecordsByFilter('contacts_company_roles', 'company = {:id} && role = {:role} && active = true', '', 1, 0, { id: record.id, role }).length ? 'true' : 'false'
    const addresses = app.findRecordsByFilter('contacts_addresses', 'company = {:id} && type = "registered" && is_primary = true', 'id', 2, 0, { id: record.id })
    if (addresses.length > 1) throw new BadRequestError('Plusieurs adresses principales : corrigez la fiche avant import.')
    if (addresses[0]) { for (const key of ['line1', 'line2', 'postal_code', 'city', 'country']) data[key] = addresses[0].getString(key); data.address_id = addresses[0].id; data.address_updated = addresses[0].getString('updated') }
  } else data.company = record.getString('company')
  return data
}
const normalize = (app, type, input, namespace) => {
  if (!fields[type] || !input || Array.isArray(input) || Object.keys(input).some((key) => !Object.hasOwn(fields[type], key))) throw new BadRequestError('Champs d’import invalides.')
  const data = {}
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== 'string') throw new BadRequestError('Valeur d’import invalide.')
    let text = value.trim()
    if (!text) continue // Blank cells do not erase existing values.
    if (['siren', 'siret', 'company_siren'].includes(key)) text = text.replace(/\s/g, '')
    if (key === 'email') { text = text.toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new BadRequestError('Adresse e-mail invalide.') }
    if (key === 'website' && !/^https?:\/\//i.test(text)) throw new BadRequestError('Le site doit commencer par https:// ou http://.')
    if (['siren', 'company_siren'].includes(key) && !/^\d{9}$/.test(text) || key === 'siret' && !/^\d{14}$/.test(text)) throw new BadRequestError('SIREN/SIRET invalide. Préservez les zéros initiaux dans le fichier.')
    if (['email', 'website'].includes(key)) {
      const collection = app.findCollectionByNameOrId(table(type)), probe = new Record(collection)
      probe.set(key, text)
      // Use the actual field validator, without running save hooks or writing Contacts.
      try { collection.fields.getByName(key).validateValue(null, app, probe) }
      catch { throw new BadRequestError(`Valeur refusée : ${key === 'email' ? 'E-mail' : 'Site web'}. Corrigez le champ concerné.`) }
    }
    if (key === 'country') { text = text.toUpperCase(); const country = app.findRecordsByFilter('settings_countries', 'code = {:code} && active = true', '', 1, 0, { code: text }); if (!country.length) throw new BadRequestError('Pays inconnu : utilisez le code ISO (FR…).') }
    if (['customer', 'supplier'].includes(key)) { const v = text.toLowerCase(); if (!['true', 'false', 'oui', 'non', 'yes', 'no', '1', '0'].includes(v)) throw new BadRequestError('Rôle client/fournisseur : utilisez oui/non.'); text = ['true', 'oui', 'yes', '1'].includes(v) ? 'true' : 'false' }
    if (text.length > fields[type][key]) throw new BadRequestError(`Valeur trop longue : ${key}.`)
    if (key === 'image_base64') { const image = require(`${__hooks}/lib/import-image.js`).decode(text); text = image.value; data.image_hash = image.hash }
    data[key] = text
  }
  if (data.siren && data.siret && !data.siret.startsWith(data.siren)) throw new BadRequestError('Le SIRET ne correspond pas au SIREN.')
  if (type === 'people' && [data.company_external_id, data.company_siren, data.company_name].some(Boolean)) { const company = findCompany(app, data, namespace); data.company = company.id; data.company_label = label(company) }
  return data
}
const validationFields = (error) => {
  const labels = { email: 'E-mail', website: 'Site web', name: 'Nom de la société', first_name: 'Prénom', last_name: 'Nom', phone: 'Téléphone', mobile: 'Mobile', logo: 'Image', avatar: 'Image', notes: 'Notes', preferred_language: 'Langue', default_currency: 'Devise', company: 'Société', country: 'Pays', line1: 'Adresse', city: 'Ville' }
  // PocketBase validation errors reach JS as GoError; expose known field names only.
  const detail = String(error)
  const fields = Object.keys(labels).filter((key) => new RegExp('(?:^|[\\s;])' + key + ':').test(detail))
  return fields.map((key) => labels[key])
}
const validationMessage = (error) => { const fields = validationFields(error); return fields.length ? `Valeur refusée : ${fields.join(', ')}. Corrigez les champs concernés.` : 'Une valeur est refusée par la fiche Contacts. Vérifiez les champs avant de poursuivre.' }
const plan = (app, type, input, namespace, key, mode, resolution = '') => {
  if (resolution === 'skip') return { status: 'skip', data: input, before: {}, fingerprint: '', record_id: '', match: 'Ignoré explicitement', candidates: [] }
  const data = normalize(app, type, input, namespace), ref = external(app, namespace, type, key)
  let matches = [], match = '', record
  if (ref) { matches = all(app, type, 'id = {:id}', { id: ref.getString('horizon_record_id') }); match = 'Identifiant externe'; if (!matches.length) throw new BadRequestError('La référence externe pointe vers une fiche absente.') }
  if (!matches.length && type === 'companies') {
    for (const field of ['siret', 'siren']) if (data[field]) { matches = all(app, type, `${field} = {:value}`, { value: data[field] }); if (matches.length) { match = field.toUpperCase(); break } }
  }
  if (!matches.length && type === 'people' && data.email) { matches = all(app, type, 'email ~ {:value}', { value: data.email }).filter((r) => r.getString('email').toLowerCase() === data.email && r.getString('company') === (data.company || '')); match = 'E-mail et société' }
  if (resolution.startsWith('target:')) {
    const id = resolution.slice(7)
    if (!/^[a-z0-9]{15}$/.test(id) || ref && id !== ref.getString('horizon_record_id')) throw new BadRequestError('Résolution incompatible avec la référence externe.')
    record = app.findRecordById(table(type), id); match = 'Choix manuel'
  } else if (resolution === 'create') { if (ref) throw new BadRequestError('Cet identifiant externe est déjà rattaché.'); match = 'Création explicite' }
  else if (matches.length === 1) record = matches[0]
  if (resolution === 'skip') return { status: 'skip', data, before: {}, fingerprint: '', record_id: '', match: 'Ignoré explicitement', candidates: [] }
  let candidates = matches
  if (!record && resolution !== 'create' && !matches.length && type === 'companies' && data.name) { candidates = all(app, type, 'name = {:value}', { value: data.name }); if (candidates.length) match = 'Nom identique : décision requise' }
  if (!record && resolution !== 'create' && candidates.length) return { status: 'conflict', data, before: {}, record_id: '', fingerprint: '', match: match || 'Correspondance ambiguë', candidates: candidates.slice(0, 10).map((r) => ({ id: r.id, label: label(r) })) }
  if (!record && resolution !== 'create' && !candidates.length && type === 'people' && (data.first_name || data.last_name)) {
    candidates = all(app, type, 'first_name = {:first} && last_name = {:last} && company = {:company}', { first: data.first_name || '', last: data.last_name || '', company: data.company || '' })
    if (candidates.length) return { status: 'conflict', data, before: {}, record_id: '', fingerprint: '', match: 'Nom identique : décision requise', candidates: candidates.slice(0, 10).map((r) => ({ id: r.id, label: label(r) })) }
  }
  if (record && !record.getBool('active')) throw new BadRequestError('La fiche correspondante est archivée ; aucune réactivation automatique.')
  const before = snapshot(app, type, record)
  if (type === 'companies' && (data.siren || before.siren) && (data.siret || before.siret) && !(data.siret || before.siret).startsWith(data.siren || before.siren)) throw new BadRequestError('Le SIRET ne correspond pas au SIREN de la fiche.');
  if (type === 'companies' && !(data.name || before.name)) throw new BadRequestError('Le nom de la société est obligatoire.')
  if (type === 'people' && ![data.first_name, data.last_name, before.first_name, before.last_name].some(Boolean)) throw new BadRequestError('Un prénom ou un nom est obligatoire.')
  if (type === 'companies' && ['line1', 'line2', 'postal_code', 'city', 'country'].some((f) => data[f])) {
    if (!['line1', 'city', 'country'].every((f) => data[f] || before[f])) throw new BadRequestError('L’adresse nécessite voie, ville et pays.')
  }
  const changeKeys = Object.keys(data).filter((key) => !['external_id', 'company_external_id', 'company_siren', 'company_name', 'company_label', 'image_base64'].includes(key))
  const changed = changeKeys.some((key) => String(before[key] ?? '') !== data[key])
  const status = record ? mode === 'create' || !changed ? 'skip' : 'update' : mode === 'update' ? 'skip' : 'create'
  return { status, data, before, record_id: record?.id || '', fingerprint: $security.sha256(JSON.stringify(before)), match: match || (status === 'skip' ? 'Mode sélectionné' : 'Nouvelle fiche'), candidates: [] }
}
module.exports = { fields, table, plan, snapshot, validationMessage, validationFields,
  bind(app, job, row, id) {
    const type = job.getString('type')
    const record = app.findRecordById(table(type), id)
    if (!record.getBool('active')) throw new BadRequestError('La fiche a été archivée depuis la simulation.')
    const ext = external(app, job.getString('namespace'), type, row.getString('source_key')) || new Record(app.findCollectionByNameOrId('core_external_references'))
    if (ext.getString('horizon_record_id') && ext.getString('horizon_record_id') !== id) throw new BadRequestError('La référence externe a changé depuis la simulation.')
    for (const [key, value] of Object.entries({ provider: job.getString('namespace'), entity_type: table(type), external_id: row.getString('source_key'), horizon_record_id: id, last_synced_at: new Date().toISOString() })) ext.set(key, value)
    app.save(ext)
  },
  apply(app, user, job, row) {
    const type = job.getString('type'), staged = json(row, 'normalized_data'), record = row.getString('matched_record_id') ? app.findRecordById(table(type), row.getString('matched_record_id')) : null
    if ($security.sha256(JSON.stringify(snapshot(app, type, record))) !== row.getString('fingerprint')) throw new BadRequestError('Une fiche a changé depuis la simulation. Relancez une vérification avant de poursuivre.')
    const fresh = plan(app, type, staged.input, job.getString('namespace'), row.getString('source_key'), job.getString('mode'), row.getString('resolution'))
    if (fresh.status !== row.getString('status') || fresh.record_id !== row.getString('matched_record_id')) throw new BadRequestError('Les correspondances ont changé. Relancez une vérification.')
    const result = record || new Record(app.findCollectionByNameOrId(table(type))), data = fresh.data
    for (const [key, value] of Object.entries(data)) if (result.collection().fields.getByName(key) && key !== 'external_id') result.set(key, value)
    if (data.image_base64 && data.image_hash !== fresh.before.image_hash) result.set(type === 'companies' ? 'logo' : 'avatar', require(`${__hooks}/lib/import-image.js`).file(data.image_base64))
    if (!record) result.set('active', true)
    result.set('__audit_actor', user.id); result.set('__activity_operation', job.id + '-import'); app.save(result)
    if (type === 'companies') {
      for (const role of ['customer', 'supplier']) if (data[role] !== undefined) {
        const existing = app.findRecordsByFilter('contacts_company_roles', 'company = {:id} && role = {:role}', '', 1, 0, { id: result.id, role })[0]
        const r = existing || new Record(app.findCollectionByNameOrId('contacts_company_roles')); r.set('company', result.id); r.set('role', role); r.set('active', data[role] === 'true'); r.set('__audit_actor', user.id); r.set('__activity_operation', job.id + '-import'); app.save(r)
      }
      if (['line1', 'line2', 'postal_code', 'city', 'country'].some((f) => data[f])) {
        const address = fresh.before.address_id ? app.findRecordById('contacts_addresses', fresh.before.address_id) : new Record(app.findCollectionByNameOrId('contacts_addresses'))
        address.set('company', result.id); address.set('type', 'registered'); address.set('is_primary', true)
        for (const f of ['line1', 'line2', 'postal_code', 'city', 'country']) if (data[f]) address.set(f, data[f])
        address.set('__audit_actor', user.id); address.set('__activity_operation', job.id + '-import'); app.save(address)
      }
    }
    this.bind(app, job, row, result.id); return result.id
  },
}

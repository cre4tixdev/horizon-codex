// Accounting owns these structural accounts; Purchasing only asks for identities.
const c = require(`${__hooks}/lib/purchasing-common.js`)
const purposes = { stock: 'stock', internal_asset: 'asset', internal_consumable: 'consumption', internal_software: 'consumption', internal_service: 'consumption', internal_equipment: 'internal' }
const rows = (app) => app.findRecordsByFilter('accounting_analytic_accounts', 'fixed_key != ""', 'code,id', 0, 0)
const dto = (record) => ({ id: record.id, updated: record.getString('updated'), key: record.getString('fixed_key'), code: record.getString('code'), label: record.getString('label'), purpose: record.getString('fixed_key') === 'time_internal' ? 'time' : purposes[record.getString('fixed_key')] })
const guard = (app, user) => { if (!c.policy.settings(app, user)) throw new ForbiddenError('Droits de paramétrage des référentiels nécessaires.') }
module.exports = {
  choices(app) { return rows(app).filter((record) => record.getBool('active') && record.getString('status') === 'open' && purposes[record.getString('fixed_key')]).map(dto) },
  resolve(app, id) { const record = c.get(app, 'accounting_analytic_accounts', id); if (!record.getBool('active') || record.getString('status') !== 'open' || !purposes[record.getString('fixed_key')]) throw new BadRequestError('Choisissez un compte fixe actif.'); return dto(record) },
  defaultFor(app, purpose) { const key = { asset: 'internal_asset', internal: 'internal_equipment', consumption: 'internal_consumable' }[purpose]; return rows(app).find((record) => record.getString('fixed_key') === key)?.id || '' },
  read(event) { guard(event.app, event.auth); return event.json(200, { items: rows(event.app).map(dto) }) },
  save(event) {
    guard(event.app, event.auth); const body = event.requestInfo().body; c.exact(body, ['items']); if (!Array.isArray(body.items)) throw new BadRequestError('Comptes invalides.'); let output
    event.app.runInTransaction((app) => {
      guard(app, event.auth); const records = rows(app)
      if (body.items.length !== records.length || new Set(body.items.map((item) => item.id)).size !== records.length || new Set(body.items.map((item) => item.code)).size !== records.length) throw new BadRequestError('Renseignez un numéro unique pour chaque compte fixe.')
      const changes = body.items.map((item) => { c.exact(item, ['id', 'updated', 'code', 'label']); const record = records.find((row) => row.id === item.id); if (!record || record.getString('updated') !== item.updated) throw new ApiError(409, 'Les comptes ont changé. Actualisez les paramètres.'); if (typeof item.code !== 'string' || !/^[0-9]{1,12}$/.test(item.code)) throw new BadRequestError('Le numéro doit comporter de 1 à 12 chiffres.'); const label = c.text(item.label, 160, true); if (app.findRecordsByFilter('accounting_analytic_accounts', 'code = {:code} && fixed_key = ""', '', 1, 0, { code: item.code }).length) throw new BadRequestError('Ce numéro est déjà utilisé par une affaire ou une commande.'); return { record, code: item.code, label, before: record.publicExport() } })
      // Temporary codes exist only inside this transaction, allowing code swaps.
      for (const item of changes) app.db().newQuery('UPDATE accounting_analytic_accounts SET code = {:code} WHERE id = {:id}').bind({ code: '__fixed_' + item.record.id, id: item.record.id }).execute()
      for (const item of changes) { item.record.set('code', item.code); item.record.set('label', item.label); app.save(item.record); c.policy.audit(app, 'accounting_analytic_accounts', item.record.id, event.auth.id, item.before, item.record.publicExport(), 'update') }
      output = rows(app).map(dto)
    }); return event.json(200, { items: output })
  },
}

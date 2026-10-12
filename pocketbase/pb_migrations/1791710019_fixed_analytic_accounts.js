migrate((app) => {
  const accounts = app.findCollectionByNameOrId('accounting_analytic_accounts')
  accounts.fields.getByName('company').required = false
  accounts.fields.add(new TextField({ name: 'fixed_key', max: 40 }))
  accounts.indexes.push("CREATE UNIQUE INDEX idx_analytic_fixed_key ON accounting_analytic_accounts(fixed_key) WHERE fixed_key != ''")
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const fixed = `${auth} && fixed_key != "" && (@request.auth.role.permissions ~ '"purchasing.read"' || @request.auth.role.permissions ~ '"accounting.read"' || @request.auth.role.permissions ~ '"settings.references"')`
  accounts.listRule = `((${accounts.listRule}) && fixed_key = "") || (${fixed})`; accounts.viewRule = accounts.listRule
  app.save(accounts)
  for (const [key, label, preferred] of [['stock', 'Stock', 99101], ['internal_asset', 'Immobilisation', 99201], ['internal_consumable', 'Consommable', 99202], ['internal_software', 'Logiciel / Abonnement', 99203], ['internal_service', 'Prestation / Service', 99204], ['internal_equipment', 'Petit équipement non immo', 99205]]) {
    let code = preferred
    while (app.findRecordsByFilter('accounting_analytic_accounts', 'code = {:code}', '', 1, 0, { code: String(code) }).length) code++
    const account = new Record(accounts)
    for (const [field, value] of Object.entries({ code: String(code), label, fixed_key: key, active: true, status: 'open' })) account.set(field, value)
    app.save(account)
  }
}, () => { throw new Error('Les comptes fixes peuvent être référencés par des pièces historiques ; retour automatique refusé.') })

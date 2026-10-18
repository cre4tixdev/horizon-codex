migrate((app) => {
  const accounts = app.findCollectionByNameOrId('accounting_analytic_accounts')
  if (app.findRecordsByFilter(accounts, 'fixed_key = "time_internal"', '', 1).length) return
  let code = 99301
  while (app.findRecordsByFilter(accounts, 'code = {:code}', '', 1, 0, { code: String(code) }).length) code++
  const account = new Record(accounts)
  for (const [key, value] of Object.entries({ code: String(code), label: 'Temps internes', fixed_key: 'time_internal', active: true, status: 'open' })) account.set(key, value)
  app.save(account)
}, () => { throw new Error('Le compte des temps internes peut être référencé : retour automatique refusé.') })

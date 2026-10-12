// Accounting owns analytic accounts. CRM invokes this service in its transaction.
module.exports = {
  order(app, quote) {
    const existing = app.findRecordsByFilter('accounting_analytic_accounts', 'source_quote = {:id}', '', 1, 0, { id: quote.id })[0]
    if (existing) return existing
    const root = app.findRecordById('accounting_analytic_accounts', quote.getString('analytic_account'))
    if (root.getString('parent')) throw new BadRequestError('La commande doit être rattachée à une affaire racine.')
    const account = module.exports.create(app, quote.getString('quote_number'), quote.getString('title'), quote.getString('company'))
    account.set('parent', root.id); account.set('source_quote', quote.id); account.set('opportunity', quote.getString('opportunity')); app.save(account)
    return account
  },
  create(app, code, label, company) {
    const account = new Record(app.findCollectionByNameOrId('accounting_analytic_accounts'))
    for (const [field, value] of Object.entries({ code, label, company, status: 'open', active: true })) account.set(field, value)
    app.save(account)
    return account
  },
  attach(app, account, opportunity) { account.set('opportunity', opportunity); app.save(account) },
  sync(app, id, opportunity) {
    const account = app.findRecordById('accounting_analytic_accounts', id)
    account.set('label', opportunity.getString('title')); account.set('company', opportunity.getString('company'))
    // Archive is not an accounting closure; the account stays available for future pieces.
    app.save(account)
  },
}

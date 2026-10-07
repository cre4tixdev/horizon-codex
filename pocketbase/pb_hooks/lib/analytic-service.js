// Accounting owns analytic accounts. CRM invokes this service in its transaction.
module.exports = {
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

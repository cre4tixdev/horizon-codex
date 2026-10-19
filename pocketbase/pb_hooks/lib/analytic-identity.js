// Minimal identity of the shared affair account; callers enforce their read policy.
module.exports = (app, id) => {
  const account = app.findRecordById('accounting_analytic_accounts', id)
  const company = require(`${__hooks}/lib/company-identity.js`).resolve(app, account.getString('company'))
  return { ...(account.getString('fixed_key') ? { label: account.getString('label') } : {}), code: account.getString('code'), client: company ? app.findRecordById('contacts_companies', company).getString('name') : '' }
}

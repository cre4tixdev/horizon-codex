// Minimal identity of the shared affair account; callers enforce their read policy.
module.exports = (app, id) => {
  const account = app.findRecordById('accounting_analytic_accounts', id)
  const company = account.getString('company')
  return { ...(account.getString('fixed_key') ? { label: account.getString('label') } : {}), code: account.getString('code'), client: company ? app.findRecordById('contacts_companies', company).getString('name') : '' }
}

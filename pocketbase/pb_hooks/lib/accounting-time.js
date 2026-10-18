// Accounting-owned operational account projection. No financial fields are disclosed.
const c = require(`${__hooks}/lib/time-common.js`)
const internalAccount = (app) => {
  const r = c.all(app, 'accounting_analytic_accounts', 'fixed_key = "time_internal" && active = true && status = "open"')[0]
  if (!r) throw new BadRequestError('Le compte analytique Temps internes est indisponible. Vérifiez la migration 1791840031 et les paramètres analytiques.')
  return r
}
module.exports = {
  internal(app) { const r = internalAccount(app); return { id: r.id, label: r.getString('label'), code: r.getString('code') } },
  normalize(app, input) { if (input.context === 'internal') { input.analytic_account = internalAccount(app).id; input.sales_order_line = '' } },
  choices(app, q) { return c.all(app, 'accounting_analytic_accounts', 'active = true && status = "open" && opportunity != "" && fixed_key = "" && (code ~ {:q} || label ~ {:q})', { q: q || '' }, 'code,id', 51).map((r) => ({ id: r.id, label: `${r.getString('code')} · ${r.getString('label')}`, code: r.getString('code'), parent: r.getString('parent'), internal: Boolean(r.getString('fixed_key').startsWith('internal')) })) },
  check(app, id, context) { const r = c.get(app, 'accounting_analytic_accounts', id); if (!r.getBool('active') || r.getString('status') !== 'open' || context === 'internal' && r.getString('fixed_key') !== 'time_internal' || context !== 'internal' && !r.getString('opportunity') || context === 'presales' && r.getString('parent')) throw new BadRequestError('Imputation analytique incompatible ou fermée.'); return r },
  identity(app, id) { const r = c.get(app, 'accounting_analytic_accounts', id); return { label: r.getString('label'), code: r.getString('code') } },
}

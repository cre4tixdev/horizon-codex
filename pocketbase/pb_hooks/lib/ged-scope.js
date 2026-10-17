// SQL candidate selection precedes record hydration and the owners' access checks.
const c = require(`${__hooks}/lib/ged-common.js`)
const roots = ['crm_opportunities', 'crm_tenders', 'sales_quotes', 'purchasing_requests', 'purchasing_orders', 'inventory_operations', 'billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes', 'expenses_reports', 'leave_requests', 'contacts_companies', 'contacts_people']
function scope(e, q) {
  const space = String(q.space || 'internal'), id = String(q.context_id || ''), params = { scope_id: id, scope_user: e.auth.id }, ids = {}
  const rights = c.policy.permissions(e.app, e.auth), allowed = roots.filter((entity) => rights.includes(`${entity.split('_')[0]}.read`))
  const empty = { space, id, params, ids, allowed, active: false, ready: space === 'internal' || Boolean(q.folder) }
  if (!id) return empty
  if (!['affairs', 'customers', 'suppliers'].includes(space) || !/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Sélection documentaire invalide.')
  const entity = space === 'affairs' ? 'crm_opportunities' : 'contacts_companies'
  c.describe(e, entity, id) // Choosing an object never authorizes its children.
  const affair = space === 'affairs', supplier = space === 'suppliers'
  const opportunities = supplier ? "SELECT id FROM crm_opportunities WHERE 0" : `SELECT id FROM crm_opportunities WHERE ${affair ? 'id' : 'company'} = {:scope_id}`
  const accounts = `SELECT id FROM accounting_analytic_accounts WHERE opportunity IN (${opportunities}) OR id IN (SELECT analytic_account FROM crm_opportunities WHERE id IN (${opportunities}))`
  const orders = `SELECT id FROM sales_orders WHERE opportunity IN (${opportunities})`
  ids.crm_opportunities = opportunities
  ids.crm_tenders = `SELECT id FROM crm_tenders WHERE opportunity IN (${opportunities})`
  ids.sales_quotes = `SELECT id FROM sales_quotes WHERE ${supplier ? '0' : `opportunity IN (${opportunities})${affair ? '' : ' OR company = {:scope_id}'}`}`
  for (const [table, line, parent] of [['purchasing_requests', 'request', 'request'], ['purchasing_orders', 'order', 'order']]) {
    const allocations = `SELECT ${line}_line."${parent}" FROM purchasing_${line}_line_allocations a JOIN purchasing_${line}_lines ${line}_line ON ${line}_line.id = a."${line}_line" WHERE a.analytic_account IN (${accounts})`
    ids[table] = `SELECT id FROM ${table} WHERE ${supplier ? table === 'purchasing_orders' ? 'supplier = {:scope_id}' : '0' : `opportunity IN (${opportunities}) OR source_order IN (${orders}) OR id IN (${allocations})`}`
  }
  ids.inventory_operations = `SELECT id FROM inventory_operations WHERE opportunity IN (${opportunities}) OR sales_quote IN (${ids.sales_quotes}) OR purchase_order IN (${ids.purchasing_orders})`
  for (const table of ['billing_invoices', 'billing_supplier_invoices', 'billing_credit_notes', 'billing_supplier_credit_notes']) {
    const isSupplier = table.includes('supplier'), lines = table.replace(/s$/, '') + '_lines', parent = table.replace(/^billing_/, '').replace(/s$/, '')
    // Actual line tables use credit_note_lines / supplier_credit_note_lines.
    const orderSet = isSupplier ? ids.purchasing_orders : orders
    const company = !affair && (supplier === isSupplier) ? 'company = {:scope_id} OR ' : ''
    ids[table] = `SELECT id FROM ${table} d WHERE ${company}EXISTS (SELECT 1 FROM json_each(d.source_orders) o WHERE o.value IN (${orderSet})) OR EXISTS (SELECT 1 FROM json_each(d.source_operations) o WHERE o.value IN (${ids.inventory_operations})) OR id IN (SELECT l.${parent} FROM ${lines} l, json_each(l.analytic_allocations) a WHERE json_extract(a.value, '$.analytic_account') IN (${accounts}))`
  }
  ids.expenses_lines = `SELECT id FROM expenses_lines WHERE ${supplier ? '0' : `opportunity IN (${opportunities}) OR analytic_account IN (${accounts})${affair ? '' : ' OR company = {:scope_id}'}`}`
  ids.expenses_reports = `SELECT report AS id FROM expenses_lines WHERE id IN (${ids.expenses_lines})`
  ids.leave_requests = 'SELECT id FROM leave_requests WHERE 0'
  ids.contacts_companies = `SELECT id FROM contacts_companies WHERE ${affair ? '0' : 'id = {:scope_id}'}`
  ids.contacts_people = `SELECT id FROM contacts_people WHERE ${affair ? '0' : 'company = {:scope_id}'}`
  return { space, id, params, ids, allowed, active: true, ready: true }
}
function internal(e, table) {
  if (table === 'leave_requests') {
    if (e.auth.getString('leave_scope') === 'all') return '1'
    return 'user = {:scope_user}' + (e.auth.getString('leave_scope') === 'reports' ? ' OR (manager = {:scope_user} AND submitted_at != \'\' AND status != \'draft\')' : '')
  }
  if (table === 'expenses_lines') {
    const report = e.auth.getString('expenses_scope') === 'all' ? '1' : 'user = {:scope_user}' + (e.auth.getString('expenses_scope') === 'reports' ? ' OR (validator = {:scope_user} AND submitted_at != \'\' AND status != \'draft\')' : '')
    return `opportunity = '' AND company = '' AND report IN (SELECT id FROM expenses_reports WHERE ${report})`
  }
  return '0'
}
function records(e, table, s, condition = '1', limit = 1001) {
  const result = arrayOf(new DynamicModel({ id: '' }))
  e.app.db().newQuery(`SELECT id FROM ${table} WHERE (${condition}) LIMIT ${limit}`).bind(s.params).all(result)
  if (result.length >= limit) throw new BadRequestError('Trop de documents dans cette sélection. Précisez le contexte ou le dossier.')
  return result.map((r) => e.app.findRecordById(table, r.id))
}
module.exports = {
  scope,
  business(e, table, s, attachments) {
    if (!s.ready || s.space !== 'internal' && !s.active) return []
    let condition
    if (table === 'core_activity_events') {
      const clauses = s.allowed.filter((entity) => s.ids[entity]).map((entity) => `(source_entity = '${entity}' AND source_record_id IN (${s.ids[entity]}))`)
      if (!s.active) return [] // Internal HR binaries have direct owners, no global feed scan.
      condition = clauses.join(' OR ') || '0'
    } else condition = s.active ? s.ids[table] ? `id IN (${s.ids[table]})` : '0' : internal(e, table)
    return records(e, table, s, `(${condition}) AND (${attachments})`)
  },
  manual(e, s, q) {
    if (!s.ready) return []
    const conditions = [q.state === 'archived' ? "archived_at != ''" : "archived_at = ''"]
    if (q.folder) { s.params.scope_folder = String(q.folder); conditions.push('folder = {:scope_folder}') }
    if (s.active) {
      const clauses = s.allowed.filter((entity) => s.ids[entity]).map((entity) => `(source_entity = '${entity}' AND source_record_id IN (${s.ids[entity]}))`)
      conditions.push(`id IN (SELECT document FROM documents_links WHERE ${clauses.join(' OR ') || '0'})`)
    } else if (!q.folder) { s.params.scope_space = s.space; conditions.push("(space = {:scope_space} OR NOT EXISTS (SELECT 1 FROM documents_links WHERE document = documents_files.id))") }
    return records(e, 'documents_files', s, conditions.join(' AND '))
  },
}

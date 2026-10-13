const c = require(`${__hooks}/lib/purchasing-common.js`)
const types = {
  customer: { collection: 'billing_invoices', lines: 'billing_invoice_lines', parent: 'invoice', direction: 'customer', label: 'Facture client', credit: false },
  supplier: { collection: 'billing_supplier_invoices', lines: 'billing_supplier_invoice_lines', parent: 'supplier_invoice', direction: 'supplier', label: 'Facture fournisseur', credit: false },
  customer_credit: { collection: 'billing_credit_notes', lines: 'billing_credit_note_lines', parent: 'credit_note', direction: 'customer', label: 'Avoir client', credit: true },
  supplier_credit: { collection: 'billing_supplier_credit_notes', lines: 'billing_supplier_credit_note_lines', parent: 'supplier_credit_note', direction: 'supplier', label: 'Avoir fournisseur', credit: true },
}
const config = (kind) => { const result = types[kind]; if (!result) throw new BadRequestError('Type de pièce invalide.'); return result }
const guard = (app, user, action = 'read') => { const rights = c.policy.permissions(app, user); if (!rights.includes('billing.read') || action !== 'read' && (user.getString('erp_profile') === 'viewer' || !rights.includes(`billing.${action}`))) throw new ForbiddenError('Accès à la facturation refusé.') }
const json = (record, field, fallback = []) => JSON.parse(record.getString(field) || 'null') ?? fallback
const rows = (app, kind, id) => { const type = config(kind); return app.findRecordsByFilter(type.lines, `${type.parent} = {:id}`, 'position', 0, 0, { id }) }
const revision = (record, updated) => { if (record.getString('updated') !== updated) throw new ApiError(409, 'Cette pièce a changé. Rechargez-la.') }
const today = () => new DateTime().time().in(new Timezone('Europe/Paris')).format('2006-01-02')
const cents = (value) => { const result = Math.round(value * 100); if (!Number.isSafeInteger(result)) throw new BadRequestError('Montant hors limites.'); return result }
const money = (value) => cents(value) / 100
const settings = (app) => app.findAllRecords('settings_billing')[0]
const company = (app, id, direction) => { const record = c.get(app, 'contacts_companies', id); if (!record.getBool('active')) throw new BadRequestError('Le tiers est archivé.'); if (direction === 'supplier') c.supplier(app, id); return record }
const audit = (app, user, record, before, label) => { c.policy.audit(app, record.collection().name, record.id, user.id, before, record.publicExport(), before ? 'update' : 'create'); require(`${__hooks}/lib/activity.js`).publish(app, record, user.id, 'change', label, { action: before ? 'update' : 'create' }) }
const activeDocuments = (app, kind) => app.findRecordsByFilter(config(kind).collection, 'status != "cancelled"', '', 0, 0)
const lineDTO = (record) => ({ id: record.id, key: record.getString('line_key'), position: record.getInt('position'), kind: record.getString('kind'), product: record.getString('product'), description: record.getString('description'), reference: record.getString('reference'), quantity: record.getFloat('quantity'), unit: record.getString('unit'), unit_price: record.getFloat('unit_price'), discount: record.getFloat('discount'), tax_code: record.getString('tax_code'), tax_rate: record.getFloat('tax_rate'), tax_amount: record.getFloat('tax_amount'), line_total: record.getFloat('line_total'), base_total: record.getFloat('base_total'), analytic_allocations: json(record, 'analytic_allocations'), source_type: record.getString('source_type'), source_line: record.getString('source_line'), source_order: record.getString('source_order'), source_operation: record.getString('source_operation'), source_operation_line: record.getString('source_operation_line'), credit_source_line: record.getString('credit_source_line'), deposit_allocations: json(record, 'deposit_allocations') })
module.exports = { ...c, types, config, guard, json, rows, revision, today, cents, money, settings, company, audit, activeDocuments, lineDTO }

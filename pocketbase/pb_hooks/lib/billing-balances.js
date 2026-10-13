const b = require(`${__hooks}/lib/billing-common.js`)
module.exports = {
  context(app) {
    const paid = new Map(), refunded = new Map(), credited = new Map(), credits = new Map(), schedules = new Map(), documents = new Map()
    for (const kind of Object.keys(b.types)) for (const record of app.findAllRecords(b.config(kind).collection)) documents.set(`${kind}/${record.id}`, record)
    for (const row of app.findAllRecords('billing_payment_schedules')) { const key = `${row.getString('document_type')}/${row.getString('document_id')}`; if (!schedules.has(key)) schedules.set(key, []); schedules.get(key).push(row) }
    const payments = app.findRecordsByFilter('billing_payments', 'status = "validated"', '', 0, 0)
    for (const kind of ['customer_credit', 'supplier_credit']) for (const credit of app.findRecordsByFilter(b.config(kind).collection, 'status = "validated"', '', 0, 0)) {
      const parentKind = b.config(kind).direction, source = `${parentKind}/${credit.getString('source_invoice')}`
      credited.set(source, (credited.get(source) || 0) + b.cents(credit.getFloat('total'))); credits.set(`${kind}/${credit.id}`, source)
    }
    for (const payment of payments) for (const allocation of b.json(payment, 'allocations')) {
      const key = `${allocation.kind}/${allocation.id}`, amount = b.cents(allocation.amount)
      paid.set(key, (paid.get(key) || 0) + amount)
      if (credits.has(key)) { const parent = credits.get(key); refunded.set(parent, (refunded.get(parent) || 0) + amount) }
    }
    return { paid, refunded, credited, credits, payments, schedules, documents }
  },
  project(app, kind, record, context) {
    const key = `${kind}/${record.id}`, type = b.config(kind), total = b.cents(record.getFloat('total'))
    if (type.credit) {
      const parentKind = type.direction, invoice = context.documents.get(`${parentKind}/${record.getString('source_invoice')}`)
      const source = `${parentKind}/${invoice.id}`, globalRefund = Math.max(0, (context.paid.get(source) || 0) + (context.credited.get(source) || 0) - b.cents(invoice.getFloat('total')) - (context.refunded.get(source) || 0))
      const paid = context.paid.get(key) || 0, due = record.getString('status') === 'validated' ? Math.min(Math.max(0, total - paid), globalRefund) : 0
      return { paid: paid / 100, credited: 0, balance: due / 100, refund_due: due / 100, payment_status: paid >= total ? 'paid' : due > 0 ? paid ? 'partial' : 'unpaid' : 'applied', schedules: [] }
    }
    const paid = context.paid.get(key) || 0, credited = context.credited.get(key) || 0, balance = Math.max(0, total - paid - credited), refund = Math.max(0, paid + credited - total - (context.refunded.get(key) || 0))
    let remainingPaid = paid + credited
    const schedules = (context.schedules.get(key) || []).sort((a, c) => a.getString('due_date').localeCompare(c.getString('due_date')) || a.getInt('sequence') - c.getInt('sequence')).map((schedule) => { const amount = b.cents(schedule.getFloat('amount')), applied = Math.min(amount, remainingPaid); remainingPaid -= applied; return { id: schedule.id, due_date: schedule.getString('due_date'), amount: amount / 100, paid: applied / 100, balance: (amount - applied) / 100 } })
    return { paid: paid / 100, credited: credited / 100, balance: record.getString('status') === 'validated' ? balance / 100 : 0, refund_due: refund / 100, payment_status: record.getString('status') !== 'validated' ? 'unpaid' : balance === 0 ? 'paid' : paid || credited ? 'partial' : 'unpaid', schedules }
  },
}

const b = require(`${__hooks}/lib/billing-common.js`)
module.exports.plan = (app, user, order, previous, next) => {
  const blocks = [], impacts = [], versions = [], credits = new Map(), rights = b.policy.permissions(app, user), canRead = rights.includes('billing.read'), canWrite = canRead && rights.includes('billing.write') && user.getString('erp_profile') !== 'viewer'
  const creditParents = new Map(b.activeDocuments(app, 'customer_credit').map((record) => [record.id, record]))
  const creditLines = app.findAllRecords('billing_credit_note_lines').filter((line) => creditParents.has(line.getString('credit_note')))
  const deposits = require(`${__hooks}/lib/billing-deposits.js`)(app, 'customer').available
  for (const old of previous) {
    const linked = app.findRecordsByFilter('billing_invoice_lines', 'source_line = {:id}', '-created,id', 0, 0, { id: old.record_id })
    if (!linked.length) continue
    const value = next.find((line) => line.id === old.id), balance = require(`${__hooks}/lib/billing-order-balance.js`).context(app, old.record_id)
    const relatedCredits = creditLines.filter((line) => line.getString('source_line') === old.record_id)
    const pending = relatedCredits.filter((line) => { const credit = creditParents.get(line.getString('credit_note')); return credit.getString('status') === 'draft' && b.get(app, 'billing_invoices', credit.getString('source_invoice')).getString('invoice_kind') !== 'deposit' })
    const pendingQuantity = pending.reduce((sum, line) => sum + line.getFloat('quantity'), 0), pendingAmount = pending.reduce((sum, line) => sum + b.cents(line.getFloat('base_total')), 0)
    const depositAmount = [...deposits].filter(([key]) => key.endsWith('/' + old.record_id)).reduce((sum, [, amount]) => sum + Math.max(0, amount), 0)
    versions.push({ line: old.record_id, balance, depositAmount, credits: relatedCredits.map((line) => ({ line: line.publicExport(), parent: creditParents.get(line.getString('credit_note')).publicExport() })) })
    const requiredCredit = value ? Math.max(0, balance.quantity - pendingQuantity - value.quantity) : 0
    let missing = requiredCredit, creditedAmount = 0
    for (const line of linked) {
      const invoice = b.get(app, 'billing_invoices', line.getString('invoice'))
      versions.push({ line: line.publicExport(), invoice: invoice.publicExport() })
      const identity = !value || ['kind', 'product', 'unit'].some((key) => value[key] !== old[key])
      const price = value && invoice.getString('status') === 'draft' && Math.abs((value.quantity ? value.tax_base / value.quantity : value.unit_price) - (old.quantity ? old.tax_base / old.quantity : old.unit_price)) > 0.000001
      if (identity || price) {
        blocks.push({ message: canRead ? `Ligne ${old.position} : ${price ? 'ajustez ou annulez la facture brouillon' : 'conservez la ligne, son produit et son unité ; utilisez une quantité nulle pour un retrait complet'} ${invoice.getString('number') || 'brouillon'}.` : 'Un engagement Facturation empêche cette modification. Consultez un gestionnaire Facturation.', href: canRead ? `/billing/customer/${invoice.id}` : '', label: canRead ? invoice.getString('number') || 'Facture brouillon' : 'Facturation' })
        continue
      }
      if (!missing || invoice.getString('status') !== 'validated' || invoice.getString('invoice_kind') === 'deposit') continue
      if (!canWrite) { blocks.push({ message: 'Droits de gestion Facturation nécessaires pour préparer l’avoir lié à cette réduction.', href: '', label: 'Facturation' }); break }
      const usedLines = creditLines.filter((credit) => credit.getString('credit_source_line') === line.id), used = usedLines.reduce((sum, credit) => sum + credit.getFloat('quantity'), 0)
      const quantity = Math.min(missing, Math.max(0, line.getFloat('quantity') - used))
      if (!quantity) continue
      if (!credits.has(invoice.id)) credits.set(invoice.id, { invoice: invoice.id, lines: [] })
      credits.get(invoice.id).lines.push({ id: line.id, quantity })
      creditedAmount += Math.abs(quantity - (line.getFloat('quantity') - used)) < 0.000001 ? b.cents(line.getFloat('base_total')) - usedLines.reduce((sum, credit) => sum + b.cents(credit.getFloat('base_total')), 0) : Math.round(b.cents(line.getFloat('base_total')) * quantity / line.getFloat('quantity'))
      missing = Math.max(0, Math.round((missing - quantity) * 1000000) / 1000000)
    }
    if (value && (missing > 0.000001 || b.cents(value.tax_base) < balance.amount - pendingAmount - creditedAmount + depositAmount)) blocks.push({ message: canRead ? `Ligne ${old.position} : une facture brouillon ou un montant déjà facturé nécessite une régularisation complémentaire avant cette réduction.` : 'Une régularisation Facturation est nécessaire avant cette réduction.', href: canRead ? `/billing/customer?source_order=${order.getString('quote')}` : '', label: 'Facturation' })
    if (value && Math.abs(value.quantity - (balance.quantity - pendingQuantity - (requiredCredit - missing))) < 0.000001 && Math.abs(b.cents(value.tax_base) - (balance.amount - pendingAmount - creditedAmount)) > 0 && linked.some((line) => b.get(app, 'billing_invoices', line.getString('invoice')).getString('invoice_kind') !== 'deposit')) blocks.push({ message: 'Le montant révisé ne correspond pas au solde des factures et avoirs. Préparez une régularisation financière dédiée pour cette ligne entièrement facturée.', href: canRead ? `/billing/customer?source_order=${order.getString('quote')}` : '', label: 'Facturation' })
    if (canRead && value && pendingQuantity && value.quantity < balance.quantity) impacts.push({ message: `Ligne ${old.position} : avoirs brouillons existants conservés, sans duplication.`, href: canRead ? `/billing/customer?source_order=${order.getString('quote')}` : '', label: 'Avoirs existants' })
    if (canRead && value && balance.quantity > 0 && !creditedAmount && value.quantity >= balance.quantity && Math.abs(value.tax_base - old.tax_base) > 0.000001) impacts.push({ message: `Ligne ${old.position} : factures conservées ; solde à facturer ${(b.cents(value.tax_base) - balance.amount) / 100} ${order.getString('currency')} HT sur ${Math.max(0, value.quantity - balance.quantity)} unités restantes.`, href: canRead ? `/billing/customer?source_order=${order.getString('quote')}` : '', label: 'Solde à facturer' })
  }
  const prepared = [...credits.values()].map((credit) => {
    const invoice = b.get(app, 'billing_invoices', credit.invoice), original = require(`${__hooks}/lib/billing.js`).inputFrom(app, 'customer', invoice)
    const input = { ...original, title: `Avoir · ${invoice.getString('number')} · révision de commande`, source_invoice: invoice.id, invoice_date: b.today(), due_date: b.today(), deduction_ids: [], schedules: [], notes: 'Retrait de quantité lors de la révision de commande.', lines: credit.lines.map((line) => ({ ...b.lineDTO(b.get(app, 'billing_invoice_lines', line.id)), key: `credit-${line.id}`, credit_source_line: line.id, quantity: line.quantity })) }
    const normalized = require(`${__hooks}/lib/billing-normalize.js`)(app, user, 'customer_credit', input)
    impacts.push({ message: `Préparer un avoir brouillon sur ${invoice.getString('number')} : ${credit.lines.reduce((sum, line) => sum + line.quantity, 0)} unité(s), ${normalized.fields.total} ${invoice.getString('currency')} TTC. Validation séparée, aucun retour de stock automatique.`, href: `/billing/customer/${invoice.id}`, label: invoice.getString('number') })
    return { invoice: invoice.id, input }
  })
  return { blocks, impacts, versions, credits: prepared }
}
module.exports.apply = (app, user, order, plan) => {
  if (!plan.credits.length) return []
  b.guard(app, user, 'write')
  return plan.credits.map((credit) => {
    const record = require(`${__hooks}/lib/billing.js`).store(app, user, 'customer_credit', credit.input, `revision-${order.id}-${order.getInt('revision_number') + 1}-${credit.invoice}`)
    return { message: `Avoir brouillon préparé : ${record.getFloat('total')} ${record.getString('currency')} TTC. À valider séparément.`, href: `/billing/customer_credit/${record.id}`, label: 'Ouvrir l’avoir brouillon' }
  })
}

const b = require(`${__hooks}/lib/billing-common.js`)
const allowedKinds = ['item', 'section', 'subsection', 'subsection3', 'subtitle', 'note', 'spacer']
module.exports = (app, user, kind, input, record) => {
  b.exact(input, ['company', 'invoice_kind', 'deposit_percent', 'supplier_invoice_number', 'customer_order_number', 'title', 'invoice_date', 'due_date', 'service_date', 'currency', 'notes', 'discrepancy_reason', 'payment_term', 'payment_terms', 'source_orders', 'source_operations', 'deduction_ids', 'lines', 'schedules', 'source_invoice', 'template_id'])
  if (input.deposit_percent === undefined) input = require(`${__hooks}/lib/billing-deposit.js`).upgrade(app, kind, input)
  const type = b.config(kind), settings = b.settings(app), company = type.credit ? b.get(app, 'contacts_companies', input.company) : b.company(app, input.company, type.direction)
  if (input.currency !== 'EUR') throw new BadRequestError('Ce premier lot valide les pièces en EUR. Le taux BCE est requis pour une autre devise.')
  const termId = input.payment_term === undefined ? record?.getString('payment_term') || require(`${__hooks}/lib/payment-terms.js`).defaults(app, company, input.invoice_date).payment_term : input.payment_term
  if (termId) { const term = b.get(app, 'settings_payment_terms', termId); if (!term.getBool('active') && record?.getString('payment_term') !== termId && !type.credit) throw new BadRequestError('Cette condition de paiement est inactive.') }
  const invoiceKind = ['standard', 'deposit'].includes(input.invoice_kind) ? input.invoice_kind : 'standard'
  const rights = b.policy.permissions(app, user)
  const sourceInvoice = type.credit ? b.get(app, b.config(type.direction).collection, input.source_invoice) : null
  const depositPercent = sourceInvoice ? sourceInvoice.getFloat('deposit_percent') : invoiceKind === 'deposit' ? b.number(input.deposit_percent || 0, 0, 100) : 0
  if (!sourceInvoice && invoiceKind === 'deposit' && !depositPercent) throw new BadRequestError('Renseignez un pourcentage d’acompte supérieur à 0 et inférieur ou égal à 100.')
  if (sourceInvoice && (sourceInvoice.getString('status') !== 'validated' || sourceInvoice.getString('company') !== company.id)) throw new BadRequestError('Choisissez une facture validée du même tiers.')
  if (sourceInvoice && record && record.getString('source_invoice') !== sourceInvoice.id) throw new BadRequestError('L’origine de l’avoir est conservée.')
  const sourceOrders = new Set(), sourceOperations = new Set(), sourceCache = new Map(), received = new Map(), issues = []
  const coverage = require(`${__hooks}/lib/billing-sources.js`).coverage(app, type.direction, record?.id || '')
  const depositState = require(`${__hooks}/lib/billing-deposits.js`)(app, type.direction, record?.id || ''), newQuantities = new Map(), newOperations = new Map(), keys = new Set()
  const originalLines = sourceInvoice ? new Map(b.rows(app, type.direction, sourceInvoice.id).map((line) => [line.id, line])) : null
  const creditParents = new Map(b.activeDocuments(app, `${type.direction}_credit`).filter((parent) => parent.id !== record?.id).map((parent) => [parent.id, parent])), credited = new Map()
  for (const line of app.findAllRecords(b.config(`${type.direction}_credit`).lines)) if (creditParents.has(line.getString(b.config(`${type.direction}_credit`).parent))) { const id = line.getString('credit_source_line'), current = credited.get(id) || { quantity: 0, base: 0, tax: 0, deposits: new Map() }; current.quantity += line.getFloat('quantity'); current.base += b.cents(line.getFloat('base_total')); current.tax += b.cents(line.getFloat('tax_amount')); for (const item of b.json(line, 'deposit_allocations')) current.deposits.set(item.id, (current.deposits.get(item.id) || 0) + b.cents(item.amount)); credited.set(id, current) }
  const codes = b.json(settings, 'tax_codes'), deductionIds = input.deduction_ids || []
  if (!Array.isArray(deductionIds) || deductionIds.length > 100 || new Set(deductionIds).size !== deductionIds.length || type.credit && deductionIds.length) throw new BadRequestError('Déduction d’acompte invalide.')
  const deductions = deductionIds.map((id) => { const deposit = b.get(app, b.config(type.direction).collection, id); if (deposit.getString('status') !== 'validated' || deposit.getString('invoice_kind') !== 'deposit' || deposit.getString('company') !== company.id || invoiceKind === 'deposit') throw new BadRequestError('Choisissez un acompte validé du même tiers.'); return deposit })
  if (!Array.isArray(input.lines) || input.lines.length > 200) throw new BadRequestError('Maximum 200 lignes.')
  const oldLines = record ? new Map(b.rows(app, kind, record.id).map((line) => [line.getString('line_key'), line])) : new Map()
  const lines = input.lines.map((inputLine, index) => {
    b.exact(inputLine, ['id', 'key', 'position', 'kind', 'product', 'description', 'reference', 'quantity', 'unit', 'unit_price', 'discount', 'tax_code', 'tax_rate', 'tax_amount', 'line_total', 'base_total', 'analytic_allocations', 'source_type', 'source_line', 'source_order', 'source_operation', 'source_operation_line', 'credit_source_line', 'deposit_allocations'])
    const key = b.text(inputLine.key, 100, true); if (keys.has(key)) throw new BadRequestError('Ligne répétée.'); keys.add(key)
    const rowKind = inputLine.kind || 'item'; if (!allowedKinds.includes(rowKind)) throw new BadRequestError('Type de ligne invalide.')
    const old = oldLines.get(key)
    if (old?.getString('source_line') && (old.getString('source_line') !== (inputLine.source_line || '') || old.getString('source_order') !== (inputLine.source_order || '') || old.getString('source_operation') !== (inputLine.source_operation || '') || old.getString('source_operation_line') !== (inputLine.source_operation_line || ''))) throw new BadRequestError('Le lien de source de la ligne est conservé. Retirez la ligne pour libérer sa préparation.')
    const line = { line_key: key, position: index + 1, kind: rowKind, product: '', description: b.text(inputLine.description, 2000, rowKind !== 'spacer'), reference: b.text(inputLine.reference || '', 160), quantity: 0, unit: '', unit_price: 0, discount: 0, tax_code: '', tax_rate: 0, tax_amount: 0, line_total: 0, base_total: 0, analytic_allocations: [], source_type: '', source_line: '', source_order: '', source_operation: '', source_operation_line: '', credit_source_line: '', deposit_allocations: [] }
    if (rowKind !== 'item') { if (type.credit) throw new BadRequestError('Un avoir reprend des lignes chiffrées de sa facture.'); return line }
    line.quantity = b.number(inputLine.quantity, 0.000001, 1000000); line.unit = b.text(inputLine.unit || '', 40)
    line.unit_price = b.number(inputLine.unit_price, 0, 1000000000); line.discount = b.number(inputLine.discount || 0, 0, 100)
    line.base_total = b.money(line.quantity * line.unit_price * (1 - line.discount / 100) * (!type.credit && invoiceKind === 'deposit' && depositPercent ? depositPercent / 100 : 1))
    if (type.credit) {
      const original = originalLines.get(inputLine.credit_source_line); if (!original || original.getString('kind') !== 'item') throw new BadRequestError('La ligne ne correspond pas à la facture d’origine.')
      if (newQuantities.has(original.id)) throw new BadRequestError('Une ligne d’origine ne peut être répétée dans le même avoir.');
      const used = credited.get(original.id) || { quantity: 0, base: 0, tax: 0, deposits: new Map() }, accumulated = newQuantities.get(original.id) || 0, remaining = original.getFloat('quantity') - used.quantity - accumulated
      if (line.quantity > remaining + 0.000001) throw new ApiError(409, 'Cette quantité est déjà créditée ou préparée dans un avoir.')
      newQuantities.set(original.id, accumulated + line.quantity)
      const snapshot = b.lineDTO(original); for (const field of ['product', 'reference', 'unit', 'unit_price', 'discount', 'tax_code', 'tax_rate', 'source_type', 'source_line', 'source_order', 'source_operation', 'source_operation_line', 'analytic_allocations']) line[field] = snapshot[field]
      line.credit_source_line = original.id; if (line.source_order) sourceOrders.add(line.source_order); if (line.source_operation) sourceOperations.add(line.source_operation)
      const last = Math.abs(line.quantity - remaining) < 0.000001 && !accumulated
      line.base_total = (last ? b.cents(original.getFloat('base_total')) - used.base : Math.round(b.cents(original.getFloat('base_total')) * line.quantity / original.getFloat('quantity'))) / 100
      line.deposit_allocations = b.json(original, 'deposit_allocations').map((item) => ({ id: item.id, amount: (last ? b.cents(item.amount) - (used.deposits.get(item.id) || 0) : Math.round(b.cents(item.amount) * line.quantity / original.getFloat('quantity'))) / 100 }))
      if (sourceInvoice.getString('invoice_kind') === 'deposit' && line.base_total > (depositState.available.get(`${sourceInvoice.id}/${line.source_line}`) || 0) / 100 + 0.000001) throw new ApiError(409, 'Cet acompte a déjà été déduit. Corrigez d’abord la facture de solde.')
    } else {
      const tax = codes.find((item) => item.code === inputLine.tax_code); if (!tax) throw new BadRequestError('Choisissez un code TVA configuré.'); line.tax_code = tax.code; line.tax_rate = tax.rate
      if (inputLine.source_line) {
        const id = inputLine.source_order, expectedType = type.direction
        if (!old?.getString('source_line') && !rights.includes(expectedType === 'customer' ? 'sales.read' : 'purchasing.read')) throw new ForbiddenError('Accès au module source nécessaire pour ajouter un nouveau lien.')
        if (inputLine.source_type !== expectedType) throw new BadRequestError('Module source invalide.')
        if (!sourceCache.has(id)) sourceCache.set(id, require(`${__hooks}/lib/billing-sources.js`).source(app, expectedType, id))
        const source = sourceCache.get(id), sourceLine = source.lines.find((item) => item.id === inputLine.source_line && item.kind === 'item')
        if (!sourceLine || source.company !== company.id || source.currency !== input.currency) throw new BadRequestError('Ligne étrangère au tiers ou à la devise.')
        if (line.unit !== sourceLine.unit || Math.abs(line.tax_rate - sourceLine.tax_rate) > 0.000001) throw new BadRequestError('Unité et TVA de la source conservées.')
        line.product = sourceLine.product; line.source_line = sourceLine.id; line.source_order = id; line.source_type = expectedType; line.analytic_allocations = sourceLine.analytic_allocations
        sourceOrders.add(id)
        if (invoiceKind === 'deposit' && depositPercent && Math.abs(line.quantity - sourceLine.quantity) > 0.000001) throw new BadRequestError('Les quantités de base doivent reprendre la commande. Repréparez cet ancien acompte.')
        if (invoiceKind !== 'deposit') {
          const accumulated = (newQuantities.get(sourceLine.id) || 0) + line.quantity; newQuantities.set(sourceLine.id, accumulated)
          if (accumulated + (coverage.get(sourceLine.id) || 0) > sourceLine.quantity + 0.000001) throw new ApiError(409, 'Cette quantité est déjà facturée ou préparée.')
        }
        if (inputLine.source_operation) {
          const operation = b.get(app, 'inventory_operations', inputLine.source_operation)
          if (!old?.getString('source_operation') && !rights.includes('inventory.read')) throw new ForbiddenError('Accès Stock nécessaire pour un nouveau lien.');
          if (operation.getBool('scrap') || operation.getBool('internal_use') || operation.getString('status') !== 'done' || operation.getString(expectedType === 'customer' ? 'sales_quote' : 'purchase_order') !== id || operation.getString('kind') !== (expectedType === 'customer' ? 'OUT' : 'IN')) throw new BadRequestError('Pièce Stock source invalide.')
          const operationLine = b.json(operation, 'lines').find((item) => item.id === inputLine.source_operation_line && (item.sales_line || item.source_line) === sourceLine.id)
          if (!operationLine) throw new BadRequestError('Ligne Stock source invalide.')
          const operationKey = `${operation.id}/${operationLine.id}`; let used = 0
          for (const current of app.findRecordsByFilter(b.config(type.direction).lines, 'source_operation = {:id} && source_operation_line = {:line}', '', 0, 0, { id: operation.id, line: operationLine.id })) { const parent = b.get(app, type.collection, current.getString(type.parent)); if (parent.id !== record?.id && parent.getString('status') !== 'cancelled' && parent.getString('invoice_kind') !== 'deposit') used += current.getFloat('quantity') }
          for (const creditLine of app.findRecordsByFilter(b.config(`${type.direction}_credit`).lines, 'source_operation = {:id} && source_operation_line = {:line}', '', 0, 0, { id: operation.id, line: operationLine.id })) { const parent = b.get(app, b.config(`${type.direction}_credit`).collection, creditLine.getString(b.config(`${type.direction}_credit`).parent)); if (parent.getString('status') === 'validated') used -= creditLine.getFloat('quantity') }
          const current = (newOperations.get(operationKey) || 0) + line.quantity; newOperations.set(operationKey, current)
          if (invoiceKind === 'deposit' || current + used > operationLine.quantity + 0.000001) throw new ApiError(409, 'Cette quantité Stock est déjà facturée ou préparée.')
          line.source_operation = operation.id; line.source_operation_line = operationLine.id; sourceOperations.add(operation.id)
        }
        if (type.direction === 'customer' && Math.abs(line.unit_price * (1 - line.discount / 100) - (invoiceKind === 'deposit' ? sourceLine.unit_price : require(`${__hooks}/lib/billing-order-balance.js`).price(app, source, sourceLine, record?.id || ''))) > 0.000001) throw new BadRequestError('Le prix net de la commande client est conservé ; ajoutez une ligne manuelle pour un complément explicite.')
        if (type.direction === 'supplier') {
          if (!received.has(id)) received.set(id, require(`${__hooks}/lib/billing-sources.js`).quantities(app, type.direction, id))
          if (Math.abs(line.unit_price * (1 - line.discount / 100) - sourceLine.unit_price) > 0.000001) issues.push(`Prix différent de la commande · ${line.description}`)
          if (invoiceKind !== 'deposit' && (newQuantities.get(sourceLine.id) || 0) + (coverage.get(sourceLine.id) || 0) > (received.get(id).get(sourceLine.id) || 0) + 0.000001) issues.push(`Quantité supérieure au reçu · ${line.description}`)
        }
      } else {
        if (invoiceKind === 'deposit') throw new BadRequestError('Un acompte doit être rattaché à une commande.')
        if (inputLine.product) { if (old?.getString('product') !== inputLine.product && !rights.includes('inventory.read')) throw new ForbiddenError('Accès au catalogue nécessaire pour ajouter un produit.'); const product = b.get(app, 'inventory_products', inputLine.product); if (!product.getBool('active')) throw new BadRequestError('Produit archivé.'); line.product = product.id }
        if (!Array.isArray(inputLine.analytic_allocations) || inputLine.analytic_allocations.length > 30) throw new BadRequestError('Ventilation analytique invalide.')
        let total = 0; const accounts = new Set()
        line.analytic_allocations = inputLine.analytic_allocations.map((item) => { b.exact(item, ['analytic_account', 'percentage']); const account = b.get(app, 'accounting_analytic_accounts', item.analytic_account); if (!account.getBool('active') || accounts.has(account.id) || !account.getString('fixed_key') && !rights.includes('crm.read')) throw new BadRequestError('Compte analytique invalide ou répété.'); accounts.add(account.id); const percentage = b.number(item.percentage, 0.000001, 100); total += percentage; return { analytic_account: account.id, percentage } })
        if (Math.abs(total - 100) > 0.000001) throw new BadRequestError('Ventilez chaque ligne manuelle à 100 %.')
      }
      if (invoiceKind === 'deposit') {
        const sourceLine = sourceCache.get(line.source_order).lines.find((item) => item.id === line.source_line), originalBudget = b.cents(sourceLine.quantity * sourceLine.unit_price)
        let used = 0
        for (const row of app.findRecordsByFilter(type.lines, 'source_line = {:id}', '', 0, 0, { id: line.source_line })) { const parent = b.get(app, type.collection, row.getString(type.parent)); if (parent.id !== record?.id && parent.getString('status') !== 'cancelled') used += b.cents(row.getFloat('line_total')) }
        for (const row of app.findRecordsByFilter(b.config(`${type.direction}_credit`).lines, 'source_line = {:id}', '', 0, 0, { id: line.source_line })) { const parent = b.get(app, b.config(`${type.direction}_credit`).collection, row.getString(b.config(`${type.direction}_credit`).parent)); if (parent.getString('status') === 'validated') used -= b.cents(row.getFloat('line_total')) }
        const accumulated = (newQuantities.get(line.source_line) || 0) + b.cents(line.base_total); newQuantities.set(line.source_line, accumulated)
        if (used + accumulated > originalBudget) throw new ApiError(409, 'Cet acompte dépasse le montant restant de la commande.')
      } else {
        for (const deposit of deductions) {
          const key = `${deposit.id}/${line.source_line}`, available = Math.max(0, depositState.available.get(key) || 0)
          if (!available || !line.source_line) continue
          const depositLine = b.rows(app, type.direction, deposit.id).find((row) => row.getString('source_line') === line.source_line)
          if (!depositLine || Math.abs(depositLine.getFloat('tax_rate') - line.tax_rate) > 0.000001) throw new BadRequestError('TVA de l’acompte incompatible.')
          const remaining = b.cents(line.base_total) - line.deposit_allocations.reduce((sum, item) => sum + b.cents(item.amount), 0), amount = Math.min(available, remaining)
          if (amount > 0) { line.deposit_allocations.push({ id: deposit.id, amount: amount / 100 }); depositState.available.set(key, available - amount) }
        }
      }
    }
    line.line_total = b.money(line.base_total - line.deposit_allocations.reduce((sum, item) => sum + item.amount, 0))
    const tax = require(`${__hooks}/lib/tax.js`).quote([{ kind: 'item', line_total: line.line_total, tax_base: line.line_total, is_option: false }], line.tax_rate)
    line.tax_amount = type.credit ? (() => { const original = originalLines.get(line.credit_source_line), used = credited.get(original.id) || { quantity: 0, tax: 0 }, remaining = original.getFloat('quantity') - used.quantity; return (Math.abs(line.quantity - remaining) < 0.000001 ? b.cents(original.getFloat('tax_amount')) - used.tax : Math.min(b.cents(original.getFloat('tax_amount')) - used.tax, Math.round(b.cents(original.getFloat('tax_amount')) * line.quantity / original.getFloat('quantity')))) / 100 })() : tax.tax
    return line
  })
  const subtotal = lines.reduce((sum, line) => sum + b.cents(line.line_total), 0) / 100, tax = lines.reduce((sum, line) => sum + b.cents(line.tax_amount), 0) / 100, total = b.money(subtotal + tax)
  if (!Array.isArray(input.schedules) || input.schedules.length > 30) throw new BadRequestError('Échéancier invalide.')
  const schedules = type.credit ? [] : input.schedules.map((item, index) => { b.exact(item, ['due_date', 'amount']); return { sequence: index + 1, due_date: b.date(item.due_date, true), amount: b.number(item.amount) } })
  if (!type.credit && schedules.length && schedules.reduce((sum, item) => sum + b.cents(item.amount), 0) !== b.cents(total)) throw new BadRequestError('La somme des échéances doit être égale au TTC.')
  const invoiceDate = b.date(input.invoice_date, true), dueDate = b.date(input.due_date, true)
  if (sourceInvoice && invoiceDate < sourceInvoice.getString('invoice_date')) throw new BadRequestError('Un avoir ne peut précéder sa facture d’origine.');
  if (dueDate < invoiceDate || schedules.some((item) => item.due_date < invoiceDate)) throw new BadRequestError('Une échéance ne peut précéder la facture.')
  const supplierNumber = b.text(input.supplier_invoice_number || '', 100)
  const supplierKey = supplierNumber.toUpperCase().replace(/\s+/g, ' ').trim()
  if (type.direction === 'supplier' && supplierKey && app.findRecordsByFilter(type.collection, 'company = {:company} && supplier_reference_key = {:key} && status != "cancelled" && id != {:id}', '', 1, 0, { company: company.id, key: supplierKey, id: record?.id || '' }).length) throw new ApiError(409, 'Ce numéro de facture fournisseur existe déjà pour ce tiers.')
  const sources = sourceInvoice ? (b.json(sourceInvoice, 'document_snapshot', {}).sources || []).filter((source) => (source.entity === 'inventory_operations' ? sourceOperations : sourceOrders).has(source.id)) : [...[...sourceCache].map(([id, source]) => ({ id, ...(type.direction === 'customer' ? { sales_order: source.order } : {}), entity: type.direction === 'customer' ? 'sales_quotes' : 'purchasing_orders', label: source.customer_reference ? `${source.number} · Commande client ${source.customer_reference}` : source.number })), ...[...sourceOperations].map((id) => ({ id, entity: 'inventory_operations', label: b.get(app, 'inventory_operations', id).getString('number') }))]
  return { original_snapshot: sourceInvoice ? b.json(sourceInvoice, 'document_snapshot', null) : null, sources, fields: { company: company.id, direction: type.direction, invoice_kind: sourceInvoice?.getString('invoice_kind') || invoiceKind, deposit_percent: depositPercent, supplier_invoice_number: supplierNumber, supplier_reference_key: supplierKey, title: b.text(input.title, 200, true), template: input.template_id ? b.get(app, 'documents_templates', input.template_id).id : '', invoice_date: invoiceDate, due_date: dueDate, service_date: b.date(input.service_date || ''), currency: 'EUR', exchange_rate: 1, tax_exchange_rate: 1, tax_context: { source: 'configured', currency: 'EUR', codes: [...new Set(lines.filter((line) => line.kind === 'item').map((line) => line.tax_code))] }, notes: b.text(input.notes || '', 10000), discrepancy_reason: b.text(input.discrepancy_reason || '', 2000), customer_order_number: b.text(input.customer_order_number || '', 1000), payment_term: termId, payment_terms: b.text(input.payment_terms === undefined ? require(`${__hooks}/lib/payment-terms.js`).defaults(app, company, input.invoice_date).payment_terms : input.payment_terms, 2000), source_orders: [...sourceOrders], source_operations: [...sourceOperations], deductions: [...new Set(lines.flatMap((line) => line.deposit_allocations.map((item) => item.id)))], ...(sourceInvoice ? { source_invoice: sourceInvoice.id } : {}), subtotal, tax, total, gross_subtotal: lines.reduce((sum, line) => sum + b.cents(line.base_total), 0) / 100, deposit_total: lines.reduce((sum, line) => sum + line.deposit_allocations.reduce((amount, item) => amount + b.cents(item.amount), 0), 0) / 100 }, lines, schedules, issues }
}

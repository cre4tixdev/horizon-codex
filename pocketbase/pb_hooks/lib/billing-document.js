const b = require(`${__hooks}/lib/billing-common.js`)
const defaultLayout = () => {
  const content = $os.readFile(`${__hooks}/assets/default-invoice-layout.json`)
  return JSON.parse(typeof content === 'string' ? content : content.map((byte) => String.fromCharCode(byte)).join(''))
}
module.exports = {
  defaultLayout,
  layout(app, record) {
    if (!record.getString('template')) return defaultLayout()
    const template = b.get(app, 'documents_templates', record.getString('template'))
    if (template.getString('document_type') !== 'invoice' || template.getString('status') === 'archived' || !template.getString('current_version')) throw new BadRequestError('Choisissez un modèle de facture publié.')
    return b.json(b.get(app, 'documents_template_versions', template.getString('current_version')), 'content_json', {})
  },
  context(snapshot, record) {
    const issuer = snapshot.issuer, company = snapshot.company, fields = { ...company, 'company.name': company['company.legal_name'] || company['company.name'] }, stored = { ...snapshot.fields, customer_order_number: (snapshot.fields.customer_order_number || '').replace(/attente commande/gi, 'Attente Commande') }, kind = snapshot.kind, type = b.config(kind)
    fields['quote.currency'] = stored.currency
    fields['invoice.label'] = record.getString('status') === 'draft' ? `${type.label.toUpperCase()} · BROUILLON` : type.label.toUpperCase()
    const formatted = (amount) => `${Number(amount).toFixed(2).replace('.', ',')} €`
    for (const key of ['title', 'invoice_date', 'due_date', 'service_date', 'payment_terms', 'notes', 'customer_order_number']) fields[`invoice.${key}`] = stored[key]
    fields['invoice.number'] = record.getString('number') || 'Brouillon'
    fields['invoice.subtotal'] = formatted(stored.subtotal); fields['invoice.tax'] = formatted(stored.tax); fields['invoice.total'] = formatted(stored.total); fields['invoice.gross_subtotal'] = formatted(stored.gross_subtotal); fields['invoice.deposit_total'] = formatted(stored.deposit_total)
    fields['invoice.reference'] = [snapshot.origin ? `Facture d’origine : ${snapshot.origin.number}${snapshot.origin.supplier_reference ? ` · ${snapshot.origin.supplier_reference}` : ''} du ${snapshot.origin.date.split('-').reverse().join('/')}` : '', stored.customer_order_number ? `Commande client : ${stored.customer_order_number}` : '', stored.supplier_invoice_number ? `Référence fournisseur : ${stored.supplier_invoice_number}` : ''].filter(Boolean).join('\n')
    fields['invoice.supplier_reference'] = stored.supplier_invoice_number || '—'
    fields['invoice.sources'] = snapshot.sources?.length ? snapshot.sources.map((source) => source.label.replace(/attente commande/gi, 'Attente Commande')).join(' · ') : snapshot.lines.filter((line) => line.source_order).map((line) => line.reference || line.description).filter((value, index, all) => all.indexOf(value) === index).join(' · ')
    if (snapshot.deposit_heading) fields['invoice.sources'] = `${snapshot.deposit_heading}\n${fields['invoice.sources']}`
    fields['invoice.issuer'] = [issuer.name, issuer.address, `${issuer.postal_code} ${issuer.city}`, issuer.country, issuer.siret ? `SIRET ${issuer.siret}` : '', issuer.vat_number ? `TVA ${issuer.vat_number}` : '', issuer.email, issuer.phone].filter(Boolean).join('\n')
    fields['invoice.legal_notice'] = [issuer.legal_notice, issuer.discount_notice, issuer.late_payment_notice, issuer.recovery_notice].filter(Boolean).join('\n')
    fields['invoice.bank'] = [issuer.iban ? `IBAN ${issuer.iban}` : '', issuer.bic ? `BIC ${issuer.bic}` : ''].filter(Boolean).join(' · ')
    const taxes = new Map()
    for (const line of snapshot.lines.filter((line) => line.kind === 'item')) { const current = taxes.get(line.tax_code) || { base: 0, tax: 0, rate: line.tax_rate }; current.base += b.cents(line.line_total); current.tax += b.cents(line.tax_amount); taxes.set(line.tax_code, current) }
    fields['invoice.tax_breakdown'] = [...taxes].map(([code, value]) => `TVA ${value.rate} % : base ${formatted(value.base / 100)} · ${formatted(value.tax / 100)}${snapshot.tax_codes?.find((item) => item.code === code)?.mention ? ` · ${snapshot.tax_codes.find((item) => item.code === code).mention}` : ''}`).join('\n')
    const lines = snapshot.deposit_presentation === 2 ? [{ kind: 'subtitle', description: require(`${__hooks}/lib/billing-deposit.js`).label(stored.deposit_percent) }, ...snapshot.lines] : snapshot.lines
    return { fields, lines, warnings: snapshot.warnings || [] }
  },
}

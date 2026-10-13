const active = (app, order) => {
  const ids = order.getStringSlice('customer_order_documents')
  if (ids.length) return ids.map((id) => app.findRecordById('core_activity_events', id))
  const legacy = order.getString('customer_order_event')
  if (!legacy) return []
  const proof = app.findRecordById('core_activity_events', legacy)
  return proof.getStringSlice('attachments').length ? [proof] : []
}
const add = (app, event, quote, file, title = 'Pièce de commande client ajoutée') => {
  const proof = require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, 'document', title, { action: 'customer_order' })
  proof.set('attachments', [file])
  const field = new FileField({ name: 'attachments', maxSelect: 1, maxSize: 10485760, mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'], protected: true })
  try { field.validateValue(event.request.context(), app, proof) } catch { throw new BadRequestError('Choisissez des PDF ou images de 10 Mo maximum par fichier.') }
  app.save(proof); return proof
}
const update = (app, event, quote, order, files, action, target, removals) => {
  if (action === 'append' && !order.collection().fields.getByName('customer_order_documents')) throw new BadRequestError('Appliquez la migration des pièces multiples avant de poursuivre.')
  const records = active(app, order), ids = records.map((record) => record.id)
  let removed = removals
  if (['replace', 'remove'].includes(action)) {
    const id = target || (ids.length === 1 ? ids[0] : '')
    if (!id || !ids.includes(id)) throw new BadRequestError('Choisissez une pièce de cette commande.')
    removed = [id]
  }
  if (removed.some((id) => !ids.includes(id))) throw new BadRequestError('Une pièce ne fait pas partie de cette commande.')
  if (action === 'keep' && files.length && ids.length) throw new BadRequestError('Choisissez explicitement l’ajout ou le remplacement de pièces.')
  if (ids.length - removed.length + files.length > 20) throw new BadRequestError('20 pièces de commande maximum.')
  const next = ids.filter((id) => !removed.includes(id)); let lastEvent = ''
  for (const id of removed) lastEvent = require(`${__hooks}/lib/activity.js`).publish(app, quote, event.auth.id, 'document', action === 'replace' ? 'Pièce de commande client remplacée' : 'Pièce de commande client retirée', { action: 'customer_order', previous_event: id }).id
  for (const file of files) { const proof = add(app, event, quote, file); next.push(proof.id); lastEvent = proof.id }
  if (files.length || removed.length) { order.set('customer_order_documents', next); order.set('customer_order_event', next[0] || lastEvent) }
  return Boolean(files.length || removed.length)
}
module.exports = { active, add, update }

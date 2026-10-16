// Public Messaging contract for Activity. Caller must authorize the event's source
// first. Share only the linked business correspondence (text/files), never Cc/Bcc or tokens.
const linked = (app, event) => {
  const metadata = JSON.parse(event.getString('metadata') || '{}'), entity = event.getString('source_entity')
  const contexts = { sales_quotes: ['sales_quote', 'sales'], purchasing_orders: ['purchase_order', 'purchasing'] }, context = contexts[entity]
  if (!context || event.getString('source_module') !== context[1] || !/^[a-z0-9]{15}$/.test(metadata.email_id || '')) return null
  return app.findRecordsByFilter('messaging_email_messages', 'id = {:id} && status = "sent" && source_context = {:context} && source_id = {:source} && owner = {:author}', '', 1, 0, { id: metadata.email_id, context: context[0], source: event.getString('source_record_id'), author: event.getString('author') })[0] || null
}
const reply = (app, event) => {
  const metadata = JSON.parse(event.getString('metadata') || '{}'), entity = event.getString('source_entity')
  if (!/^[a-z0-9]{15}$/.test(metadata.email_reply_id || '') || event.getString('author') || event.getString('type') !== 'message' || !['sales_quotes', 'purchasing_orders'].includes(entity) || event.getString('source_module') !== (entity === 'sales_quotes' ? 'sales' : 'purchasing')) return null
  return app.findRecordsByFilter('messaging_email_replies', 'id = {:id} && message.status = "sent" && message.source_context = {:context} && message.source_id = {:source}', '', 1, 0, { id: metadata.email_reply_id, context: entity === 'sales_quotes' ? 'sales_quote' : 'purchase_order', source: event.getString('source_record_id') })[0] || null
}
module.exports = {
  reply(app, event) {
    const r = reply(app, event)
    return r ? { direction: 'received', to: [], from: r.getString('sender_address'), name: r.getString('sender_name') || r.getString('sender_address'), subject: r.getString('subject'), received_at: r.getString('received_at'), text: r.getString('body_text'), attachments: Array.from(r.getStringSlice('attachments')), warnings: JSON.parse(r.getString('warnings') || '[]') } : null
  },
  summary(app, event) {
    const r = linked(app, event)
    return r ? { to: JSON.parse(r.getString('to') || '[]'), from: r.getString('from_address'), subject: r.getString('subject'), text: r.getString('text'), attachments: Array.from(r.getStringSlice('attachments')) } : null
  },
  file(event, record, filename) {
    const r = linked(event.app, record) || reply(event.app, record)
    if (!r || !Array.from(r.getStringSlice('attachments')).includes(filename)) throw new ApiError(404, 'Pièce jointe envoyée introuvable.')
    event.response.header().set('Cache-Control', 'no-store')
    event.response.header().set('X-Content-Type-Options', 'nosniff')
    const fs = event.app.newFilesystem()
    try { return fs.serve(event.response, event.request, r.baseFilesPath() + '/' + filename, filename) } finally { fs.close() }
  },
}

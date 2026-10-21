// Private inbox for replies to the current user's Horizon sends. No Graph call.
const c = require(`${__hooks}/lib/messaging-common.js`), activity = require(`${__hooks}/lib/activity.js`)
const contexts = (app, user) => ['sales_quote', 'purchase_order'].filter((context) => activity.allowed(app, user, false, context === 'sales_quote' ? 'sales' : 'purchasing'))
const dto = (app, r, detail = false) => {
  const message = app.findRecordById('messaging_email_messages', r.getString('message'))
  return { id: r.id, message: message.id, sender_address: r.getString('sender_address'), sender_name: r.getString('sender_name'), subject: r.getString('subject'), received_at: r.getString('received_at'), source_context: message.getString('source_context'), source_id: message.getString('source_id'), source_label: message.getString('source_label'), to_address: message.getString('from_address'), ...(detail ? { body_text: r.getString('body_text'), attachments: Array.from(r.getStringSlice('attachments')), warnings: c.json(r, 'warnings') } : {}) }
}
const own = (e) => {
  c.guard(e.app, e.auth)
  const reply = c.get(e.app, 'messaging_email_replies', e.request.pathValue('id')), message = e.app.findRecordById('messaging_email_messages', reply.getString('message'))
  if (message.getString('owner') !== e.auth.id || message.getString('status') !== 'sent' || !contexts(e.app, e.auth).includes(message.getString('source_context'))) throw new ApiError(404, 'Réponse introuvable.')
  return reply
}
module.exports = {
  list(e) {
    c.guard(e.app, e.auth)
    const q = e.request.url.query(), page = Math.max(1, Math.min(10000, Math.trunc(Number(q.get('page'))) || 1)), search = (q.get('q') || '').slice(0, 200), context = q.get('context') || ''
    const permitted = contexts(e.app, e.auth).filter((value) => !context || value === context)
    const raw = q.get('sort') || '-received_at', key = raw.replace(/^-/, ''), fields = { subject: 'subject', sender_address: 'sender_address', received_at: 'received_at', source_label: 'message.source_label' }
    if (!fields[key]) throw new BadRequestError('Tri invalide.')
    if (!permitted.length) return e.json(200, { items: [], totalItems: 0, totalPages: 1, page })
    const params = { owner: e.auth.id, search }, clauses = permitted.map((value) => `message.source_context = "${value}"`).join(' || ')
    const filter = `message.owner = {:owner} && message.status = "sent" && (${clauses})` + (search ? ' && (subject ~ {:search} || sender_address ~ {:search} || sender_name ~ {:search} || message.source_label ~ {:search})' : '')
    // Count uses the same owner, source permissions and search before pagination.
    const sql = `SELECT COUNT(*) AS total FROM messaging_email_replies r JOIN messaging_email_messages m ON m.id = r.message WHERE m.owner = {:owner} AND m.status = 'sent' AND m.source_context IN (${permitted.map((value) => `'${value}'`).join(',')})` + (search ? " AND (r.subject LIKE {:pattern} ESCAPE '\\' OR r.sender_address LIKE {:pattern} ESCAPE '\\' OR r.sender_name LIKE {:pattern} ESCAPE '\\' OR m.source_label LIKE {:pattern} ESCAPE '\\')" : '')
    const count = new DynamicModel({ total: 0 })
    e.app.db().newQuery(sql).bind({ owner: params.owner, pattern: '%' + search.replace(/[\\%_]/g, '\\$&') + '%' }).one(count)
    const rows = e.app.findRecordsByFilter('messaging_email_replies', filter, `${raw.startsWith('-') ? '-' : ''}${fields[key]},id`, 30, (page - 1) * 30, params)
    return e.json(200, { items: rows.map((r) => dto(e.app, r)), totalItems: count.total, totalPages: Math.max(1, Math.ceil(count.total / 30)), page })
  },
  record(e) { return e.json(200, dto(e.app, own(e), true)) },
  file(e) {
    const r = own(e), name = e.request.url.query().get('filename')
    if (!Array.from(r.getStringSlice('attachments')).includes(name)) throw new ApiError(404, 'Pièce jointe introuvable.')
    e.response.header().set('Cache-Control', 'no-store'); e.response.header().set('X-Content-Type-Options', 'nosniff')
    const fs = e.app.newFilesystem()
    try { return fs.serve(e.response, e.request, r.baseFilesPath() + '/' + name, name) } finally { fs.close() }
  },
}

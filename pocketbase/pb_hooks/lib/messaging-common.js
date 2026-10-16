const policy = require(`${__hooks}/lib/access-policy.js`), content = require(`${__hooks}/lib/messaging-content.js`)
const stable = (v) => JSON.stringify(v, (_, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]])) : value)
const json = (r, key, fallback = []) => JSON.parse(r.getString(key) || JSON.stringify(fallback)) ?? fallback
const can = (app, u, action = 'read') => policy.permissions(app, u).includes('messaging.read') && (action === 'read' || u.getString('erp_profile') !== 'viewer') && policy.permissions(app, u).includes(`messaging.${action}`) && (action !== 'settings' || ['admin', 'superuser'].includes(u.getString('erp_profile')))
const guard = (app, u, action = 'read') => { if (!can(app, u, action)) throw new ForbiddenError('Accès à la messagerie refusé.') }
const get = (app, table, id) => { if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Référence invalide.'); return app.findRecordById(table, id) }
const all = (app, table, filter = '', params = {}, sort = 'created,id') => { const records = app.findRecordsByFilter(table, filter, sort, 1001, 0, params); if (records.length > 1000) throw new BadRequestError('Trop de résultats. Affinez la recherche.'); return records }
const exact = (b, keys) => { if (!b || typeof b !== 'object' || Array.isArray(b) || Object.keys(b).some((k) => !keys.includes(k))) throw new BadRequestError('Champs non autorisés.') }
const source = (app, u, context, id) => {
  if (context === 'generic') { if (id) throw new BadRequestError('Référence incompatible.'); return { version: '', label: '', to: [], fields: {} } }
  if (!['sales_quote', 'purchase_order'].includes(context) || !/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Source e-mail invalide.')
  return require(`${__hooks}/lib/${context === 'sales_quote' ? 'sales' : 'purchasing'}-mail.js`).source(app, u, id)
}
const mailbox = (app, u, id) => { const r = get(app, 'messaging_mailboxes', id); if (!r.getBool('active') || !Array.from(r.getStringSlice('allowed_users')).includes(u.id)) throw new ForbiddenError('Cette adresse d’expédition ne vous est pas autorisée.'); return r }
const own = (app, u, id) => { guard(app, u); const r = get(app, 'messaging_email_messages', id); if (r.getString('owner') !== u.id) throw new ForbiddenError('Cet e-mail ne vous appartient pas.'); return r }
const version = (r, updated) => { if (r.getString('updated') !== updated) throw new ApiError(409, 'Cet e-mail a changé. Rechargez-le.') }
const audit = (app, u, r, action) => policy.audit(app, r.collection().name, r.id, u.id, null, { status: r.getString('status'), name: r.getString('name'), source_id: r.getString('source_id') }, action)
const dto = (r) => ({ ...r.publicExport(), to: json(r, 'to'), cc: json(r, 'cc'), bcc: json(r, 'bcc'), body_json: json(r, 'body_json', { type: 'doc', content: [] }), signature_snapshot: json(r, 'signature_snapshot', { type: 'doc', content: [] }) })
const filesSize = (app, r, names) => { const fs = app.newFilesystem(); try { return names.reduce((n, name) => n + fs.attributes(r.baseFilesPath() + '/' + name).size, 0) } finally { fs.close() } }
module.exports = { stable, policy, content, json, can, guard, get, all, exact, source, mailbox, own, version, audit, dto, filesSize }

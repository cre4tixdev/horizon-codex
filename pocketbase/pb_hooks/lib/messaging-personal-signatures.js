const c = require(`${__hooks}/lib/messaging-common.js`)
const table = 'messaging_email_signatures'
const current = (app, auth, action) => { const user = c.get(app, 'core_users', auth.id); c.guard(app, user, action); return user }
module.exports = {
  read(e) {
    const user = current(e.app, e.auth, 'read')
    return e.json(200, { items: c.all(e.app, table, 'user = {:user}', { user: user.id }, 'name,id').map((r) => r.publicExport()), variables: c.content.variables })
  },
  save(e) {
    current(e.app, e.auth, 'write')
    const body = e.requestInfo().body; c.exact(body, ['id', 'updated', 'input'])
    const input = body.input; c.exact(input, ['name', 'body_json', 'active', 'is_default'])
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120 || typeof input.active !== 'boolean' || typeof input.is_default !== 'boolean') throw new BadRequestError('Signature personnelle invalide.')
    c.content.resolve(input.body_json)
    let saved
    e.app.runInTransaction((app) => {
      const user = current(app, e.auth, 'write'), record = body.id ? c.get(app, table, body.id) : new Record(app.findCollectionByNameOrId(table))
      if (body.id && record.getString('user') !== user.id) throw new ForbiddenError('Cette signature ne vous appartient pas.')
      if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'Cette signature a changé. Rechargez-la avant de réessayer.')
      if (input.active && input.is_default) for (const other of c.all(app, table, 'user = {:user} && is_default = true', { user: user.id })) {
        if (other.id === record.id) continue
        other.set('is_default', false); app.save(other)
      }
      record.set('user', user.id)
      for (const key of ['name', 'body_json', 'active', 'is_default']) record.set(key, key === 'name' ? input.name.trim() : input[key])
      app.save(record); c.audit(app, user, record, 'personal_signature_save'); saved = record.publicExport()
    })
    return e.json(200, saved)
  },
}

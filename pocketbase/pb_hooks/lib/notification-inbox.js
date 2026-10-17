const preferences = require(`${__hooks}/lib/notification-preferences.js`)
// Resolve only the actual source; do not expand the polymorphic SQL API rule.
const visible = (event, record, cache = new Map()) => {
  if (record.getString('user') !== event.auth.id) return false
  if (record.getString('type') !== 'activity') return true
  const key = [record.getString('source_module'), record.getString('source_entity'), record.getString('source_record_id')].join(':')
  if (!cache.has(key)) {
    try { require(`${__hooks}/lib/activity-read.js`).authorizeRecord(event, record); cache.set(key, true) }
    catch (error) {
      if (![403, 404].includes(error.status)) throw error
      cache.set(key, false)
    }
  }
  return cache.get(key)
}
const syncMentions = (app, record, user) => {
  if (!record.getString('activity_event')) return
  for (const mention of app.findRecordsByFilter('core_activity_mentions', 'event = {:event} && user = {:user}', '', 0, 0, { event: record.getString('activity_event'), user })) {
    if (!mention.getString('read_at')) { mention.set('read_at', record.getString('read_at')); app.save(mention) }
  }
}
const dismiss = (app, record, user) => {
  const now = new Date().toISOString()
  record.set('dismissed_at', record.getString('dismissed_at') || now)
  record.set('read_at', record.getString('read_at') || now)
  app.save(record); syncMentions(app, record, user)
}
module.exports = {
  inbox(e) {
    const user = preferences.current(e), cache = new Map()
    const records = e.app.findRecordsByFilter('core_notifications', 'user = {:user} && dismissed_at = ""', '-created,-id', 5001, 0, { user: user.id })
    if (records.length > 5000) throw new BadRequestError('Trop de notifications actives. Retirez les anciennes notifications lues.')
    const items = []; let unread = 0
    const context = { app: e.app, auth: user, requestInfo: () => ({ auth: user }) }
    for (const record of records) {
      if (!visible(context, record, cache)) continue
      if (!record.getString('read_at')) unread++
      if (items.length < 30) items.push(Object.fromEntries(['id', 'title', 'body', 'read_at', 'created', 'source_entity', 'source_record_id'].map((key) => [key, key === 'id' ? record.id : record.getString(key)])))
    }
    return e.json(200, { unread, items })
  },
  markRead(e) {
    const user = preferences.current(e), id = e.request.pathValue('id')
    if (!/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Notification invalide.')
    e.app.runInTransaction((app) => {
      const current = preferences.current({ app, auth: e.auth })
      const record = app.findRecordsByFilter('core_notifications', 'id = {:id} && user = {:user}', '', 1, 0, { id, user: user.id })[0]
      if (!record || !visible({ app, auth: current, requestInfo: () => ({ auth: current }) }, record)) throw new ApiError(404, 'Notification introuvable.')
      record.set('read_at', record.getString('read_at') || new Date().toISOString()); app.save(record); syncMentions(app, record, user.id)
    })
    return e.json(200, { read: true })
  },
  dismiss(e) {
    const user = preferences.current(e), id = e.request.pathValue('id')
    if (!/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Notification invalide.')
    e.app.runInTransaction((app) => {
      preferences.current({ app, auth: e.auth })
      const matches = app.findRecordsByFilter('core_notifications', 'id = {:id} && user = {:user}', '', 1, 0, { id, user: user.id }), record = matches[0]
      if (!record || !visible({ app, auth: user, requestInfo: () => ({ auth: user }) }, record)) throw new ApiError(404, 'Notification introuvable.')
      dismiss(app, record, user.id)
    })
    return e.json(200, { dismissed: true })
  },
  dismissRead(e) {
    const user = preferences.current(e)
    let count = 0
    e.app.runInTransaction((app) => {
      preferences.current({ app, auth: e.auth })
      const records = app.findRecordsByFilter('core_notifications', 'user = {:user} && read_at != "" && dismissed_at = ""', '', 5001, 0, { user: user.id })
      if (records.length > 5000) throw new BadRequestError('Retirez les notifications par petits groupes.')
      const cache = new Map()
      for (const record of records) if (visible({ app, auth: user, requestInfo: () => ({ auth: user }) }, record, cache)) { dismiss(app, record, user.id); count++ }
    })
    return e.json(200, { dismissed: count })
  },
}

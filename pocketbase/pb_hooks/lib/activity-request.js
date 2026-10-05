module.exports = {
  users(event) {
    const activity = require(`${__hooks}/lib/activity.js`)
    if (!activity.allowed(event.app, event.auth, true)) throw new ForbiddenError('Accès refusé.')
    const query = String(event.request.url.query().get('q') || '').trim().slice(0, 80)
    const users = event.app.findRecordsByFilter('core_users', 'active = true && role.active = true && role.permissions ~ {:permission} && name ~ {:query}', 'name,id', 15, 0, { permission: '"contacts.read"', query })
    return event.json(200, { items: users.map((user) => ({ id: user.id, name: user.getString('name') || 'Utilisateur Horizon', initials: activity.author(event.app, user.id).initials })) })
  },
  create(event) {
    const activity = require(`${__hooks}/lib/activity.js`)
    if (!activity.allowed(event.app, event.auth, true)) throw new ForbiddenError('Accès refusé.')
    const record = event.record
    const root = activity.source(event.app, record.getString('source_entity'), record.getString('source_record_id'), true)
    if (record.getString('source_module') !== 'contacts' || !['note', 'message', 'document', 'task'].includes(record.getString('type'))) throw new BadRequestError('Type de publication invalide.')
    const body = record.getString('body').trim()
    const attachments = record.getUploadedFiles('attachments')
    if (!body && !attachments.length) throw new BadRequestError('Ajoutez un message ou une pièce jointe.')
    const recipients = [...new Set(record.getStringSlice('mentions'))]
    for (const id of recipients) activity.recipient(event.app, id)
    const input = JSON.parse(record.getString('metadata') || '{}')
    const taskInput = record.getString('type') === 'task' ? input.task : null
    if (taskInput) {
      if (typeof taskInput.title !== 'string' || !taskInput.title.trim() || taskInput.title.length > 160) throw new BadRequestError('Saisissez un titre de tâche.')
      activity.recipient(event.app, taskInput.assigned_to)
      if (!['low', 'normal', 'high'].includes(taskInput.priority)) throw new BadRequestError('Priorité invalide.')
      if (taskInput.due_date && (!/^\d{4}-\d{2}-\d{2}$/.test(taskInput.due_date) || !Number.isFinite(Date.parse(taskInput.due_date)) || new Date(taskInput.due_date).toISOString().slice(0, 10) !== taskInput.due_date)) throw new BadRequestError('Échéance invalide.')
      if (input.origin_event) {
        const origin = event.app.findRecordById('core_activity_events', input.origin_event)
        if (origin.getString('source_entity') !== root.collection().name || origin.getString('source_record_id') !== root.id || !['note', 'message'].includes(origin.getString('type'))) throw new BadRequestError('Note d’origine invalide.')
      }
    } else if (record.getString('type') === 'task') throw new BadRequestError('Informations de tâche manquantes.')
    record.set('body', body)
    record.set('author', event.auth.id)
    record.set('__audit_actor', event.auth.id)
    record.set('operation_id', '')
    record.set('created', new Date().toISOString())
    record.set('metadata', { author: activity.author(event.app, event.auth.id), mentions: recipients.map((id) => ({ id, name: activity.author(event.app, id).name })), origin_event: taskInput ? input.origin_event || '' : '' })
    event.app.runInTransaction((txApp) => {
      event.app = txApp
      require(`${__hooks}/lib/audit.js`)(event, 'create')
      for (const id of recipients) {
        const mention = new Record(txApp.findCollectionByNameOrId('core_activity_mentions'))
        mention.set('event', record.id); mention.set('user', id); mention.set('notified_at', new Date().toISOString())
        txApp.save(mention)
        if (id !== event.auth.id) activity.notification(txApp, id, record, `${activity.author(txApp, event.auth.id).name} vous a mentionné`, body.slice(0, 500))
      }
      if (taskInput) {
        const task = new Record(txApp.findCollectionByNameOrId('core_tasks'))
        for (const [key, value] of Object.entries({ source_module: 'contacts', source_entity: root.collection().name, source_record_id: root.id, title: taskInput.title.trim(), description: body, created_by: event.auth.id, assigned_to: taskInput.assigned_to, assigned_name: activity.author(txApp, taskInput.assigned_to).name, priority: taskInput.priority, status: 'todo', activity_event: record.id, due_date: taskInput.due_date ? `${taskInput.due_date} 00:00:00.000Z` : '' })) task.set(key, value)
        txApp.save(task)
        if (taskInput.assigned_to !== event.auth.id && !recipients.includes(taskInput.assigned_to)) activity.notification(txApp, taskInput.assigned_to, record, 'Une tâche vous a été assignée', taskInput.title.trim())
      }
    })
  },
  task(event) {
    const activity = require(`${__hooks}/lib/activity.js`)
    if (!activity.allowed(event.app, event.auth, true)) throw new ForbiddenError('Accès refusé.')
    const record = event.record
    const before = record.original().publicExport()
    const root = activity.source(event.app, before.source_entity, before.source_record_id, true)
    for (const field of ['source_module', 'source_entity', 'source_record_id', 'created_by', 'activity_event', 'created', 'completed_at', 'title', 'description']) {
      if (JSON.stringify(record.publicExport()[field]) !== JSON.stringify(before[field])) throw new BadRequestError('Ce champ de tâche est immuable.')
    }
    activity.recipient(event.app, record.getString('assigned_to'))
    const changes = ['status', 'assigned_to', 'priority', 'due_date'].filter((field) => JSON.stringify(before[field]) !== JSON.stringify(record.publicExport()[field])).map((field) => ({ field, label: ({ status: 'État', assigned_to: 'Responsable', priority: 'Priorité', due_date: 'Échéance' })[field], before: field === 'status' ? activity.statusLabels[before[field]] : field === 'assigned_to' ? activity.author(event.app, before[field]).name : before[field], after: field === 'status' ? activity.statusLabels[record.getString(field)] : field === 'assigned_to' ? activity.author(event.app, record.getString(field)).name : record.getString(field) }))
    record.set('assigned_name', activity.author(event.app, record.getString('assigned_to')).name)
    record.set('completed_at', record.getString('status') === 'done' ? record.original().getString('completed_at') || new Date().toISOString() : '')
    event.app.runInTransaction((txApp) => {
      event.app = txApp; record.set('__audit_actor', event.auth.id); require(`${__hooks}/lib/audit.js`)(event, 'update')
      if (!changes.length) return
      const item = activity.publish(txApp, root, event.auth.id, 'task', `Tâche mise à jour : ${record.getString('title')}`, { task_id: record.id, changes })
      if (before.assigned_to !== record.getString('assigned_to') && record.getString('assigned_to') !== event.auth.id) activity.notification(txApp, record.getString('assigned_to'), item, 'Une tâche vous a été assignée', record.getString('title'))
    })
  },
}

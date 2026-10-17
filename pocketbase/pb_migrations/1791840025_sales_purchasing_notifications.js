migrate((app) => {
  const notifications = app.findCollectionByNameOrId('core_notifications')
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && user = @request.auth.id && type = "activity"'
  const sales = `source_module = "sales" && source_entity = "sales_quotes" && @request.auth.role.permissions ~ '"sales.read"' && @collection.sales_quotes.id ?= source_record_id`
  const purchasing = `source_module = "purchasing" && @request.auth.role.permissions ~ '"purchasing.read"' && ((source_entity = "purchasing_requests" && @collection.purchasing_requests.id ?= source_record_id) || (source_entity = "purchasing_orders" && @collection.purchasing_orders.id ?= source_record_id))`
  const own = `${auth} && ((${sales}) || (${purchasing}))`
  for (const rule of ['listRule', 'viewRule']) notifications[rule] = `(${notifications[rule]}) || (${own})`
  const immutable = ['user', 'type', 'event_type', 'title', 'body', 'source_module', 'source_entity', 'source_record_id', 'activity_event', 'created', 'dismissed_at'].map((field) => `@request.body.${field}:changed = false`).join(' && ')
  notifications.updateRule = `((${notifications.updateRule}) || (${own})) && ${immutable}`
  app.save(notifications)
}, () => { throw new Error('Conserver les notifications et leurs droits ; utiliser une migration corrective.') })

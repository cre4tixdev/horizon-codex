migrate((app) => {
  const auth = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true && @request.auth.role.permissions ~ \'"expenses.read"\''
  const root = '@collection.expenses_reports:expense.id ?= source_record_id'
  const scope = '(@collection.expenses_reports:expense.user ?= @request.auth.id || @request.auth.expenses_scope = "all" || (@request.auth.expenses_scope = "reports" && @collection.expenses_reports:expense.validator ?= @request.auth.id && @collection.expenses_reports:expense.submitted_at != "" && @collection.expenses_reports:expense.status != "draft"))'
  const read = `${auth} && source_module = "expenses" && source_entity = "expenses_reports" && ${root} && ${scope}`
  const write = `${read} && @request.auth.erp_profile != "viewer" && @collection.expenses_reports:expense.archived_at = "" && ((@collection.expenses_reports:expense.user ?= @request.auth.id && @request.auth.role.permissions ~ '"expenses.write"') || (@collection.expenses_reports:expense.validator ?= @request.auth.id && @request.auth.role.permissions ~ '"expenses.validate"') || (@request.auth.expenses_scope = "all" && (@request.auth.role.permissions ~ '"expenses.write"' || @request.auth.role.permissions ~ '"expenses.validate"')))`
  for (const [name, action] of [['core_activity_events', 'createRule'], ['core_tasks', 'updateRule']]) {
    const c = app.findCollectionByNameOrId(name)
    // Reads continue through the shared source-scoped routes. Only View/File and
    // contribution rules gain this single, explicitly correlated Expenses branch.
    c.viewRule = `(${c.viewRule}) || (${read})`; c[action] = `(${c[action]}) || (${write})`; app.save(c)
  }
  for (const event of app.findRecordsByFilter('core_activity_events', 'source_module = "expenses" && source_entity = "expenses_reports"', '', 0, 0)) {
    const metadata = JSON.parse(event.getString('metadata') || '{}')
    if (!metadata.author) { let name = 'Ancien utilisateur'; try { name = app.findRecordById('core_users', event.getString('author')).getString('name') || 'Utilisateur Horizon' } catch { /* Historical authors may no longer exist. */ }; event.set('metadata', { ...metadata, author: { name, initials: name.split(/\s+/).slice(0, 2).map((v) => v[0]).join('').toUpperCase() } }); app.save(event) }
  }
}, () => { throw new Error('Preserve the expense activity history; restore a coherent backup.') })

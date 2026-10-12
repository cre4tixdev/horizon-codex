migrate((app) => {
  const users = app.findCollectionByNameOrId('core_users'), presence = users.fields.getByName('presence')
  presence.values = ['available', 'away', 'busy', 'offline']; app.save(users)
}, (app) => {
  app.db().newQuery("UPDATE core_users SET presence = 'away' WHERE presence = 'offline'").execute()
  const users = app.findCollectionByNameOrId('core_users'), presence = users.fields.getByName('presence')
  presence.values = ['available', 'away', 'busy']; app.save(users)
})

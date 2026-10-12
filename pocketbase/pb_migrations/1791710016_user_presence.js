migrate((app) => {
  const users = app.findCollectionByNameOrId('core_users')
  if (!users.fields.getByName('presence')) { users.fields.add(new SelectField({ name: 'presence', values: ['available', 'away', 'busy'], maxSelect: 1 })); app.save(users) }
  app.db().newQuery("UPDATE core_users SET presence = 'available' WHERE presence = ''").execute()
}, (app) => {
  const users = app.findCollectionByNameOrId('core_users'); users.fields.removeByName('presence'); app.save(users)
})

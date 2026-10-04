migrate((app) => {
  // Preserve records and all unrelated options on the standard PocketBase collection.
  const collections = app.findAllCollections()
  const users = collections.find((collection) => collection.name === 'users')
  if (!users) return
  const rule = JSON.parse(JSON.stringify(users)).createRule
  if (rule === null) return
  if (rule !== '') {
    throw new Error('Unexpected users.createRule: inspect existing policy before deploying.')
  }
  users.createRule = null
  app.save(users)
}, () => {
  // Do not silently reopen public registration through a rollback.
  throw new Error('Registration stays locked: restoring a public rule requires an explicit reviewed migration.')
})

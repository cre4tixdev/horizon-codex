migrate((app) => {
  // Deletion remains guarded by contacts.pb.js, including administrator API deletes.
  for (const name of ['contacts_companies', 'contacts_people']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.deleteRule = collection.updateRule
    app.save(collection)
  }
}, (app) => {
  for (const name of ['contacts_companies', 'contacts_people']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.deleteRule = null
    app.save(collection)
  }
})

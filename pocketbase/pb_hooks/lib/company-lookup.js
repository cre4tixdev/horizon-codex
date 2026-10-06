// Compatibility endpoint for the installed Contacts schema revision check.
// Company search itself runs directly in the browser against the public API.
module.exports = (event) => {
  const user = event.auth
  if (!user || user.collection().name !== 'core_users' || !user.getBool('active')) throw new ForbiddenError('Accès refusé.')
  const role = event.app.findRecordById('core_roles', user.getString('role'))
  const permissions = JSON.parse(role.getString('permissions') || '[]')
  if (!role.getBool('active') || !permissions.includes('contacts.read')) throw new ForbiddenError('Accès refusé.')
  return event.json(200, { contacts_revision: event.app.findCollectionByNameOrId('contacts_addresses').fields.getByName('email') && event.app.findCollectionByNameOrId('contacts_addresses').fields.getByName('label') ? 5 : event.app.findCollectionByNameOrId('contacts_companies').fields.getByName('lei') && event.app.findAllCollections().some((item) => item.name === 'accounting_third_party_accounts') ? 4 : event.app.findCollectionByNameOrId('contacts_companies').fields.getByName('rcs_number') && event.app.findAllCollections().some((item) => item.name === 'accounting_third_party_accounts') ? 3 : event.app.findCollectionByNameOrId('contacts_companies').fields.getByName('siren') && event.app.findCollectionByNameOrId('contacts_addresses').fields.getByName('is_primary') ? 2 : 1 })
}

// Contacts owns the public client/address projection. Called only after the source document's permission check.
module.exports = (app, company) => {
  const fields = {}, warnings = []
  for (const key of ['name', 'legal_name', 'vat_number', 'email', 'phone', 'siret']) fields[`company.${key}`] = company.getString(key)
  const addresses = app.findRecordsByFilter('contacts_addresses', 'company = {:id} && (type = "billing" || type = "registered") && line1 != ""', '', 0, 0, { id: company.id })
  let address
  for (const type of ['billing', 'registered']) {
    const primary = addresses.filter((item) => item.getString('type') === type && item.getBool('is_primary'))
    if (primary.length > 1) { warnings.push('Plusieurs adresses principales existent pour le client : choisissez une adresse principale unique.'); break }
    if (primary.length === 1) { address = primary[0]; break }
  }
  if (!address && !warnings.length && addresses.length === 1) address = addresses[0]
  if (!address && !warnings.length) warnings.push(addresses.length ? 'Adresse client ambiguë : définissez une adresse postale principale de facturation ou du siège.' : 'Aucune adresse postale de facturation ou du siège pour ce client.')
  for (const key of ['line1', 'line2', 'postal_code', 'city', 'country', 'state_region']) fields[`company.${key}`] = address ? address.getString(key) : ''
  const countries = fields['company.country'] ? app.findRecordsByFilter('settings_countries', 'code = {:code}', '', 2, 0, { code: fields['company.country'] }) : []
  fields['company.country_name'] = countries.length === 1 ? countries[0].getString('label') : fields['company.country']
  fields['company.address'] = [fields['company.line1'], fields['company.line2'], [fields['company.postal_code'], fields['company.city']].filter(Boolean).join(' '), fields['company.state_region'], fields['company.country_name']].filter(Boolean).join('\n')
  return { fields, warnings }
}

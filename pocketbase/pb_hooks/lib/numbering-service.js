// Shared server allocator. Caller must supply its active transaction.
module.exports = (app, entity) => {
  const counter = app.findFirstRecordByFilter('settings_numbering_sequences', 'entity_type = {:entity} && active = true', { entity })
  if (counter.getString('pattern') !== '{sequence}' || counter.getString('reset_rule') !== 'never') throw new BadRequestError('Configuration de numérotation non prise en charge.')
  const value = counter.getInt('next_value')
  if (value < 1 || value >= 999999999999) throw new BadRequestError('Séquence épuisée ou invalide.')
  const code = `${counter.getString('prefix')}${String(value).padStart(counter.getInt('padding'), '0')}${counter.getString('suffix')}`
  counter.set('next_value', value + 1); counter.set('has_issued', true); app.save(counter)
  return code
}

module.exports = (value, fallback = 30) => {
  if (value === undefined || value === null || value === '') return fallback
  const size = Number(value)
  if (!Number.isInteger(size) || size < 1 || size > 100) throw new BadRequestError('Choisissez entre 1 et 100 résultats par page.')
  return size
}

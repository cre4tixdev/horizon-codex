// France métropolitaine, Gregorian calendar. Verified against DINUM open data.
// No network is required to calculate a leave request.
const named = (year) => {
  if (!Number.isInteger(year) || year < 2000 || year > 2200) throw new Error('Année de jours fériés invalide.')
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = (h + l - 7 * m + 114) % 31 + 1
  const easter = Date.UTC(year, month - 1, day)
  const dates = {}
  for (const [day, label] of Object.entries({ '01-01': '1er janvier', '05-01': '1er mai', '05-08': '8 mai', '07-14': '14 juillet', '08-15': 'Assomption', '11-01': 'Toussaint', '11-11': '11 novembre', '12-25': 'Jour de Noël' })) dates[`${year}-${day}`] = label
  for (const [offset, label] of [[1, 'Lundi de Pâques'], [39, 'Ascension'], [50, 'Lundi de Pentecôte']]) {
    const date = new Date(easter + offset * 86400000).toISOString().slice(0, 10)
    dates[date] = dates[date] ? `${dates[date]} / ${label}` : label
  }
  return dates
}
const holidays = (year) => Object.keys(named(year)).sort()
holidays.named = named
module.exports = holidays

const valid = (v) => typeof v === 'string' && /^20\d{2}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v
const addDays = (v, n) => new Date(Date.parse(v) + n * 86400000).toISOString().slice(0, 10)
const monday = (v) => { if (!valid(v)) throw new Error('Date invalide (2000–2099).'); return addDays(v, -((new Date(v).getUTCDay() + 6) % 7)) }
const minutes = (v) => { if (!Number.isInteger(v) || v < 0 || v > 1440) throw new Error('Durée invalide : utilisez des minutes entières entre 0 et 24 h.'); return v }
const checkDays = (lines) => {
  const totals = Array(7).fill(0)
  for (const line of lines) { if (!line || typeof line !== 'object' || !Array.isArray(line.days) || line.days.length !== 7) throw new Error('Sept journées sont nécessaires.'); line.days.forEach((d, i) => { if (!d || typeof d !== 'object') throw new Error('Journée invalide.'); totals[i] += minutes(d.minutes); if (totals[i] > 1440) throw new Error('Le total journalier ne peut dépasser 24 h.') }) }
  return totals
}
module.exports = { valid, addDays, monday, minutes, checkDays }

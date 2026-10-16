// Pure civil-date arithmetic: no timezone/DST or legal-policy assumptions.
const valid = (v) => typeof v === 'string' && /^(20\d{2}|21\d{2}|2200)-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v
const slots = (input, policy) => {
  const { start_date: start, end_date: end, start_half: first, end_half: last } = input
  if (!valid(start) || !valid(end) || !['am', 'pm'].includes(first) || !['am', 'pm'].includes(last) || end < start || end === start && first === 'pm' && last === 'am') throw new Error('Dates ou demi-journées invalides.')
  if ((Date.parse(end) - Date.parse(start)) / 86400000 > 730) throw new Error('La période est limitée à deux ans.')
  const excluded = new Set(policy.holidays)
  if (policy.holiday_calendar === 'metropole') {
    const worked = new Set(policy.working_holidays || [])
    for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year++) for (const day of require(`${__hooks}/lib/leave-holidays.js`)(year)) if (!worked.has(day)) excluded.add(day)
  }
  const result = []
  for (let time = Date.parse(start); time <= Date.parse(end); time += 86400000) {
    const date = new Date(time), day = date.toISOString().slice(0, 10)
    if (!policy.weekdays.includes(date.getUTCDay() || 7) || excluded.has(day)) continue
    for (const half of ['am', 'pm']) if (!(day === start && first === 'pm' && half === 'am' || day === end && last === 'am' && half === 'pm')) result.push(`${day}:${half}`)
  }
  return result
}
const calculate = (input, policy) => {
  const days = slots(input, policy), breakdown = {}
  for (const day of days) breakdown[day.slice(0, 4)] = (breakdown[day.slice(0, 4)] || 0) + 0.5
  if (!days.length) throw new Error('La période ne contient aucune demi-journée travaillée.')
  return { duration: days.length / 2, breakdown }
}
module.exports = { valid, slots, calculate }

// Read projection only: document counts, never a sum of quantities or money.
module.exports = (records, today) => {
  const dates = Array.from({ length: 10 }, (_, index) => new Date(Date.parse(today + 'T12:00:00Z') + (index - 2) * 86400000).toISOString().slice(0, 10))
  const series = Object.fromEntries(['IN', 'OUT', 'PREP', 'INT', 'RET', 'DS', 'SCRAP'].map((key) => [key, { completed: dates.map(() => 0), planned: dates.map(() => 0), undated: 0, overdue: 0 }]))
  for (const record of records) {
    const key = record.scrap ? 'SCRAP' : record.dropship ? 'DS' : record.kind, item = series[key]
    if (!item || record.status === 'cancelled') continue
    if (record.status === 'done') {
      const index = dates.indexOf(record.completed_date)
      if (index >= 0) item.completed[index]++
    } else if (!record.archived) {
      if (!record.planned_date) item.undated++
      else {
        const index = dates.indexOf(record.planned_date)
        if (index >= 0) item.planned[index]++
        if (record.planned_date < today) item.overdue++
      }
    }
  }
  return { today, dates, series }
}

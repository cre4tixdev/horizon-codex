const sum = (values) => values.reduce((cents, value) => cents + Math.round(value * 100), 0) / 100
module.exports = {
  sum,
  period(view, month) {
    if (!['month', 'quarter', 'year'].includes(view) || typeof month !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) return null
    const year = month.slice(0, 4), number = Number(month.slice(5)), first = view === 'year' ? 1 : view === 'quarter' ? Math.floor((number - 1) / 3) * 3 + 1 : number, count = view === 'year' ? 12 : view === 'quarter' ? 3 : 1
    const periods = Array.from({ length: count }, (_, index) => `${year}-${String(first + index).padStart(2, '0')}`)
    return { start: periods[0], end: periods[periods.length - 1], periods }
  },
  cell(month, reports, today, start, end) {
    const statuses = [...new Set(reports.map((report) => report.status))]
    const status = reports.length ? statuses.length === 1 ? statuses[0] : 'mixed' : start && start.slice(0, 7) > month || end && end.slice(0, 7) < month ? 'off' : month > today ? 'future' : 'missing'
    return { month, status, total: sum(reports.filter((report) => report.status !== 'cancelled').map((report) => report.total)), reports }
  },
}

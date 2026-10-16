migrate((app) => {
  const c = app.findCollectionByNameOrId('leave_settings')
  c.fields.add(new SelectField({ name: 'holiday_calendar', values: ['metropole', 'none'], maxSelect: 1, required: true }))
  c.fields.add(new JSONField({ name: 'working_holidays', maxSize: 100000 })); app.save(c)
  for (const r of app.findAllRecords(c)) { r.set('holiday_calendar', 'metropole'); r.set('working_holidays', []); app.save(r) }
  // Never recalculate or rewrite previously submitted requests, balances or allocations.
}, () => { throw new Error('Preserve leave policy snapshots; restore a coherent backup.') })

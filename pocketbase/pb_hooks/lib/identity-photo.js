// Résolution unique : une association est prioritaire, même sans photo.
module.exports = {
  source(app, user) { return user.getString('employee') ? app.findRecordById('hr_employees', user.getString('employee')) : user },
  serve(event, user) {
    const record = this.source(event.app, user)
    const filename = record.getString('avatar')
    event.response.header().set('Cache-Control', 'no-store')
    if (!filename) return event.noContent(204)
    const fs = event.app.newFilesystem()
    try { return fs.serve(event.response, event.request, record.baseFilesPath() + '/' + filename, filename) } finally { fs.close() }
  },
}

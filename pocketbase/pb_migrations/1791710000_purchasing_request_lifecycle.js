// Existing "ordered" requests were based on validated BCs. Treated now requires actual sending.
migrate((app) => {
  for (const request of app.findRecordsByFilter('purchasing_requests', 'status = "validated" || status = "partially_ordered" || status = "ordered"', '', 0, 0)) {
    const lines = app.findRecordsByFilter('purchasing_request_lines', 'request = {:id}', '', 0, 0, { id: request.id })
    const quantities = lines.map((line) => app.findRecordsByFilter('purchasing_order_lines', 'request_line = {:id} && (order.status = "sent" || order.status = "acknowledged" || order.status = "partially_received" || order.status = "received" || order.status = "closed")', '', 0, 0, { id: line.id }).reduce((total, row) => total + row.getFloat('quantity'), 0))
    request.set('status', lines.length && lines.every((line, index) => quantities[index] + 0.000001 >= line.getFloat('quantity')) ? 'ordered' : quantities.some((quantity) => quantity > 0) ? 'partially_ordered' : 'validated')
    app.save(request)
  }
}, () => {
  // Retain genuine sending history on rollback; no previously sent document is rewritten.
})

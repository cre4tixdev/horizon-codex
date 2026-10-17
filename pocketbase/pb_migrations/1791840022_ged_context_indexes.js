migrate((app) => {
  const indexes = {
    documents_links: ['source_entity,source_record_id,document'],
    crm_opportunities: ['company,id'], sales_quotes: ['company,id'], sales_orders: ['opportunity,id'],
    accounting_analytic_accounts: ['opportunity,id'],
    purchasing_orders: ['supplier,id', 'opportunity,id', 'source_order,id'], purchasing_requests: ['opportunity,id', 'source_order,id'],
    purchasing_order_line_allocations: ['analytic_account,order_line'], purchasing_request_line_allocations: ['analytic_account,request_line'],
    inventory_operations: ['opportunity,id', 'sales_quote,id', 'purchase_order,id'],
    billing_invoices: ['company,id'], billing_supplier_invoices: ['company,id'], billing_credit_notes: ['company,id'], billing_supplier_credit_notes: ['company,id'],
    expenses_lines: ['opportunity,id', 'company,id', 'analytic_account,id'],
  }
  for (const [table, definitions] of Object.entries(indexes)) {
    const collection = app.findCollectionByNameOrId(table)
    for (const [n, columns] of definitions.entries()) {
      const name = `idx_ged_context_${table}_${n}`
      if (!Array.from(collection.indexes).some((sql) => sql.includes(name))) collection.indexes.push(`CREATE INDEX ${name} ON ${table} (${columns})`)
    }
    app.save(collection)
  }
}, () => { throw new Error('Keep additive query indexes; restore a coherent backup if required.') })

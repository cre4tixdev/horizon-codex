import { describe, expect, it, vi } from 'vitest'
import { tableColumnCatalog, excludedTableColumns, tableColumnPolicyKey } from './tableColumnPolicies'
import { TableColumnPoliciesService } from './TableColumnPoliciesService'

describe('shared consultation column policies', () => {
  it('uses unique table keys and columns and declares the required identity', () => {
    expect(new Set(tableColumnCatalog.map((item) => item.key)).size).toBe(tableColumnCatalog.length)
    for (const table of tableColumnCatalog) {
      expect(new Set(table.columns.map((item) => item.id)).size).toBe(table.columns.length)
      expect(table.columns[0]?.required).toBe(true)
    }
  })
  it('shares an operations policy across flows and ignores required or obsolete exclusions', () => {
    expect(tableColumnPolicyKey('inventory.operations.IN,OUT')).toBe('inventory.operations')
    expect(tableColumnPolicyKey('inventory.inventories')).toBe('inventory.inventories')
    expect(excludedTableColumns('inventory.operations.OUT', [{ key: 'inventory.operations', revision: 1, excluded: ['number', 'readiness', 'old'] }])).toEqual(['readiness'])
    expect(excludedTableColumns('contacts.people', [{ key: 'contacts.companies', revision: 1, excluded: ['email'] }])).toEqual([])
  })
  it('checks privileges and validates structural columns before writing', async () => {
    const repository = { read: vi.fn().mockResolvedValue({ items: [] }), save: vi.fn().mockResolvedValue({ key: 'contacts.companies', revision: 1, excluded: ['phone'] }) }
    const reader = new TableColumnPoliciesService(repository, (write) => !write)
    await expect(reader.read()).resolves.toEqual({ items: [] })
    await expect(reader.save({ key: 'contacts.companies', revision: 0, excluded: ['phone'] })).rejects.toThrow('non autorisé')
    const admin = new TableColumnPoliciesService(repository, () => true)
    await expect(admin.save({ key: 'contacts.companies', revision: 0, excluded: ['name'] })).rejects.toThrow('obligatoires')
    expect(repository.save).not.toHaveBeenCalled()
    await expect(admin.save({ key: 'contacts.companies', revision: 0, excluded: ['phone'] })).resolves.toMatchObject({ revision: 1 })
  })
})

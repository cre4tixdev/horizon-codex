import { describe, expect, it } from 'vitest'
import { canAccessNavigation } from './navigationAccess'
import type { HorizonUser } from '../core/auth/types/session'
const user = (permissions: string[], extra: Partial<HorizonUser> = {}): HorizonUser => ({ id: 'u', email: 'u@example.invalid', name: 'User', erpProfile: 'user', role: { id: 'r', label: 'User', permissions }, ...extra })
describe('HR sidebar submenus', () => {
  it('keeps personal calendars visible and restricts approval and allocations', () => {
    const employee = user(['leave.read', 'expenses.read'], { leaveScope: 'self', expensesScope: 'self' })
    expect(canAccessNavigation('/leave?area=calendar', employee)).toBe(true)
    expect(canAccessNavigation('/leave?area=review', employee)).toBe(false)
    expect(canAccessNavigation('/leave?area=allocations', employee)).toBe(false)
    expect(canAccessNavigation('/expenses?area=team', employee)).toBe(false)
    expect(canAccessNavigation('/expenses?area=team', { ...employee, expensesScope: 'reports' })).toBe(true)
    expect(canAccessNavigation('/leave?area=review', user(['leave.read', 'leave.validate'], { leaveScope: 'reports' }))).toBe(true)
    expect(canAccessNavigation('/leave?area=allocations', user(['leave.read', 'leave.allocate'], { leaveScope: 'all' }))).toBe(true)
  })
  it('retains existing module children for non-admins without exposing other modules', () => {
    const employee = user(['contacts.read', 'sales.read'])
    expect(canAccessNavigation('/contacts?role=customer&scope=companies&view=list', employee)).toBe(true)
    expect(canAccessNavigation('/sales/quotes?kind=order', employee)).toBe(true)
    expect(canAccessNavigation('/inventory/operations', employee)).toBe(false)
  })
})

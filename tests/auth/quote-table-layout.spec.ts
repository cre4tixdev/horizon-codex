import { test, expect } from '@playwright/test'

test('Devis et commande : colonnes alignées et cadre arrondi après changement de statut', async ({ page, request }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid')
  await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!')
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).toHaveURL('/')
  const token = await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '')
  const api = async (path: string, data?: object) => {
    const response = await request.fetch(`http://127.0.0.1:18090/api/${path}`, { method: data ? 'POST' : 'GET', headers: { Authorization: token }, ...(data ? { data } : {}) })
    expect(response.status(), await response.text()).toBe(200)
    return response.json()
  }
  const company = await api('collections/contacts_companies/records', { name: 'Client alignement', active: true })
  const session = await api('collections/core_users/auth-refresh', {}), stages = await api('collections/crm_stages/records')
  const opportunity = await api('horizon/crm/save', { creation_key: crypto.randomUUID(), input: { title: 'Affaire alignement', company: company.id, contact: '', owner: session.record.id, stage: stages.items[0].id, type: 'direct', estimated_value: 1000, estimated_cost: 0, currency: 'EUR', probability: 0, expected_date: '', description: '', status: 'open' } })
  let quote = await api('horizon/sales/quotes/save', { creation_key: crypto.randomUUID(), input: { opportunity: opportunity.id, title: 'Colonnes du devis', quote_date: '2026-10-15', valid_until: '2026-11-15', lines: [{ description: 'Produit 1', quantity: 1, unit: 'u', unit_price: 10, unit_cost: 5 }, { description: 'Produit 2', quantity: 2, unit: 'u', unit_price: 20, unit_cost: 8 }] } })
  const table = page.locator('.quote-edit-table')
  async function geometry() {
    return table.evaluate((element) => {
      const headers = [...element.querySelectorAll('thead th')], cells = [...element.querySelectorAll('tbody tr:first-child > td')]
      return headers.map((header, index) => {
        const cell = cells[index]!, handle = header.querySelector('.quote-column-resizer')!, headStyle = getComputedStyle(header), bodyStyle = getComputedStyle(cell), handleStyle = getComputedStyle(handle)
        return { label: header.getAttribute('aria-label'), headRight: header.getBoundingClientRect().right, bodyRight: cell.getBoundingClientRect().right, headBorder: headStyle.borderRightWidth, bodyBorder: bodyStyle.borderRightWidth, handleBorder: handleStyle.borderRightWidth }
      })
    })
  }
  async function aligned() {
    if ((await page.viewportSize())!.width >= 1000) await expect.poll(() => table.evaluate((element) => element.getBoundingClientRect().width - element.closest('[data-table-viewport]')!.clientWidth)).toBeLessThan(0.5)
    const columns = await geometry()
    for (const column of columns) {
      expect(Math.abs(column.headRight - column.bodyRight), column.label || '').toBeLessThan(0.1)
      expect(column.headBorder, column.label || '').toBe(column.bodyBorder)
      expect(column.handleBorder, column.label || '').toBe('0px')
    }
  }
  await page.goto(`/sales/quotes/${quote.id}`)
  await expect(table.locator('tbody tr')).toHaveCount(2)
  await table.screenshot({ path: '/private/tmp/horizon-quote-columns-20261015.png' })
  await aligned()
  const widthBefore = (await table.locator('thead th').first().boundingBox())!.width
  await table.getByRole('button', { name: 'Redimensionner #', exact: true }).press('ArrowRight')
  await expect.poll(async () => (await table.locator('thead th').first().boundingBox())!.width).toBeGreaterThan(widthBefore)
  await aligned()
  quote = await api('horizon/sales/quotes/finalize', { id: quote.id, updated: quote.updated })
  await api('horizon/sales/quotes/confirm', { id: quote.id, updated: quote.updated, customer_order_number: 'CLIENT-ALIGNEMENT', reservations: [] })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Lignes de la commande (2)', exact: true })).toBeVisible()
  await expect(table.getByRole('columnheader', { name: 'Achats', exact: true })).toBeVisible()
  await aligned()
  await expect(table).toHaveCSS('border-radius', '6px')
  await expect(table).toHaveCSS('border-collapse', 'separate')
  await table.screenshot({ path: '/private/tmp/horizon-order-columns-20261015.png' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await aligned()
  await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click()
  await table.screenshot({ path: '/private/tmp/horizon-order-columns-dark-20261015.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await aligned()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({ path: '/private/tmp/horizon-order-columns-mobile-20261015.png', fullPage: true })
})

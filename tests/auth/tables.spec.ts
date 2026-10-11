import { expect, test, type Page } from '@playwright/test'

async function expectPageHeader(page: Page, selector: string) {
  const table = page.locator(selector)
  await expect(table).toHaveAttribute('data-scroll-mode', 'page')
  await table.evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + 160))
  const bottom = await page.locator('.page-breadcrumb-row').evaluate((element) => element.getBoundingClientRect().bottom)
  await expect.poll(async () => (await table.locator('th').first().boundingBox())!.y).toBeCloseTo(bottom, 0)
}

test('En-têtes communs : listes, paramètres et défilement horizontal sur petit écran', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 })
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid')
  await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!')
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).toHaveURL('/')
  const token = await page.evaluate(() => sessionStorage.getItem('horizon.auth.token')!)
  for (let index = 0; index < 30; index++) {
    const response = await page.request.post('http://127.0.0.1:18090/api/collections/contacts_companies/records', {
      headers: { Authorization: token }, data: { name: `En-tête fixe ${index}`, active: true },
    })
    expect(response.ok()).toBeTruthy()
  }
  await page.goto('/contacts?view=list&q=En-tête fixe')
  await expect(page.locator('.h-data-table tbody tr')).toHaveCount(25)
  expect((await page.locator('.h-data-table tbody tr').first().boundingBox())!.height).toBe(32)
  await expect(page.locator('.h-data-table th').first()).toHaveCSS('background-color', 'rgb(220, 229, 239)')
  await expectPageHeader(page, '.data-table-scroll')
  await page.screenshot({ path: '/private/tmp/horizon-tables-sticky.png' })
  await page.setViewportSize({ width: 500, height: 600 })
  const viewport = page.locator('.data-table-scroll')
  await expect(viewport).toHaveAttribute('data-scroll-mode', 'contained')
  await viewport.evaluate((element) => { element.scrollTop = 200; element.scrollLeft = 50 })
  expect(await viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(100)
  const top = await viewport.evaluate((element) => element.getBoundingClientRect().top)
  await expect.poll(async () => (await viewport.locator('th').first().boundingBox())!.y).toBeCloseTo(top + 1, 0)
  await page.setViewportSize({ width: 1440, height: 600 })
  await page.goto('/settings/references')
  await expect(page.locator('.reference-table tbody tr').first()).toBeVisible()
  expect((await page.locator('.reference-table tbody tr').first().boundingBox())!.height).toBe(32)
  await expectPageHeader(page, '.settings-reference-table')
  await expect(page.locator('.reference-table th').first()).toHaveCSS('background-color', 'rgb(220, 229, 239)')
  await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click()
  await expect(page.locator('.reference-table th').first()).toHaveCSS('background-color', 'rgb(54, 72, 96)')
  await page.getByRole('button', { name: 'Passer en mode clair', exact: true }).click()
  await page.setViewportSize({ width: 1440, height: 400 })
  await page.goto('/settings/users')
  await page.getByRole('button', { name: 'Nouvel utilisateur', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const matrix = dialog.locator('.access-grants-table')
  await expect(matrix).toHaveAttribute('data-scroll-mode', 'page')
  await dialog.locator('.access-editor').evaluate((element) => {
    const table = element.querySelector('table')!
    element.scrollTop += table.getBoundingClientRect().top - element.getBoundingClientRect().top + 80
  })
  const bodyTop = await dialog.locator('.access-editor').evaluate((element) => element.getBoundingClientRect().top + parseFloat(getComputedStyle(element).paddingTop))
  await expect.poll(async () => (await matrix.locator('th').first().boundingBox())!.y).toBeCloseTo(bodyTop, 0)
})

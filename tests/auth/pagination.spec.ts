import { expect, test, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid')
  await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!')
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).toHaveURL('/')
}

const paths = ['/crm', '/crm?area=ao', '/contacts', '/contacts/people', '/sales/quotes', '/purchasing/requests', '/purchasing/orders', '/inventory', '/inventory/stock', '/inventory/operations?view=list', '/inventory/inventories', '/inventory/assets', '/accounting/assets', '/analysis']

test('les listes reprennent la pagination CRM dans le fil d’Ariane, en clair, sombre et mobile', async ({ page }) => {
  test.setTimeout(90000)
  await login(page)
  for (const mode of ['light', 'dark', 'mobile'] as const) {
    await page.setViewportSize(mode === 'mobile' ? { width: 390, height: 844 } : { width: 1600, height: 1000 })
    if (mode === 'dark') await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click()
    if (mode === 'mobile') await page.getByRole('button', { name: 'Passer en mode clair', exact: true }).click()
    let reference: unknown
    for (const path of paths) {
      await page.goto(path)
      const pagination = page.locator('.page-breadcrumb-actions .record-navigator')
      await expect(pagination).toHaveCount(1)
      await expect(pagination).toHaveAttribute('aria-busy', 'false')
      await expect(pagination.locator('.record-navigator-count')).toHaveText('Page 1 / 1')
      await expect(pagination.getByRole('button', { name: 'Page précédente', exact: true })).toBeDisabled()
      await expect(pagination.getByRole('button', { name: 'Page suivante', exact: true })).toBeDisabled()
      const styles = await pagination.evaluate((element) => {
        const count = getComputedStyle(element.querySelector('span')!)
        const button = getComputedStyle(element.querySelector('button')!)
        return { fontSize: count.fontSize, color: count.color, fontVariantNumeric: count.fontVariantNumeric, marginRight: count.marginRight, buttonWidth: button.width, buttonHeight: button.height, iconWidth: element.querySelector('svg')!.getAttribute('width') }
      })
      if (path === '/crm') reference = styles
      else expect(styles, `${mode} ${path}`).toEqual(reference)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true)
    }
    await page.screenshot({ path: `/private/tmp/horizon-pagination-${mode}.png`, animations: 'disabled' })
  }
})

test('les chevrons conservent les critères URL et sont bloqués pendant le chargement', async ({ page }) => {
  await login(page)
  let release: (() => void) | undefined
  await page.route('**/api/horizon/purchasing/requests?*', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    const currentPage = Number(new URL(route.request().url()).searchParams.get('page')) || 1
    if (currentPage === 2) await new Promise<void>((resolve) => { release = resolve })
    await route.fulfill({ response, json: { ...body, page: currentPage, totalPages: 2, totalItems: 31 } })
  })
  await page.goto('/purchasing/requests?q=Pagination&status=draft&group=supplier&sort=number')
  const pagination = page.locator('.page-breadcrumb-actions .record-navigator')
  await expect(pagination.locator('span')).toHaveText('Page 1 / 2')
  await pagination.getByRole('button', { name: 'Page suivante', exact: true }).click()
  await expect(pagination).toHaveAttribute('aria-busy', 'true')
  await expect(pagination.getByRole('button', { name: 'Page précédente', exact: true })).toBeDisabled()
  await expect(pagination.getByRole('button', { name: 'Page suivante', exact: true })).toBeDisabled()
  await expect.poll(() => Boolean(release)).toBe(true)
  release!()
  await expect(pagination.locator('span')).toHaveText('Page 2 / 2')
  await expect(pagination).toHaveAttribute('aria-busy', 'false')
  const params = new URL(page.url()).searchParams
  expect(Object.fromEntries(params)).toEqual({ q: 'Pagination', status: 'draft', group: 'supplier', sort: 'number', page: '2' })
  await expect(pagination.getByRole('button', { name: 'Page suivante', exact: true })).toBeDisabled()
  await pagination.getByRole('button', { name: 'Page précédente', exact: true }).click()
  await expect(pagination.locator('span')).toHaveText('Page 1 / 2')
})

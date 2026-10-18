import { test, expect } from '@playwright/test'

test('Filtres par cartes : les synthèses et résultats restent visibles pendant la requête', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid')
  await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!')
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
  const cases = [
    { path: '/expenses', label: 'Synthèse des notes de frais', endpoint: '/api/horizon/expenses/reports', index: 0 },
    { path: '/leave?area=review&year=2026', label: 'Demandes du périmètre manager', endpoint: '/api/horizon/leave/requests', index: 2 },
    { path: '/billing/customer', label: 'Synthèse des factures', endpoint: '/api/horizon/billing/documents', index: 0 },
    { path: '/billing/supplier', label: 'Synthèse des factures', endpoint: '/api/horizon/billing/documents', index: 0 },
    { path: '/purchasing/requests', label: 'Synthèse des demandes d’achat', endpoint: '/api/horizon/purchasing/requests', index: 0 },
    { path: '/purchasing/orders', label: 'Synthèse des commandes fournisseurs', endpoint: '/api/horizon/purchasing/orders', index: 0 },
    { path: '/inventory', label: 'Catégories de produits', endpoint: '/api/horizon/inventory/products', index: 0 },
    { path: '/inventory/stock', label: 'Synthèse du stock', endpoint: '/api/horizon/inventory/stock', index: 1 },
    { path: '/sales/quotes?kind=quote', label: 'Synthèse des ventes', endpoint: '/api/horizon/sales/quotes', index: 0 },
    { path: '/contacts?view=list', label: 'Synthèse du répertoire', endpoint: '/api/collections/contacts_companies/records', index: 0 },
  ]
  for (const item of cases) {
    await test.step(item.path, async () => {
      await page.goto(item.path)
      const summary = page.getByRole('region', { name: item.label, exact: true })
      await expect(summary.locator('strong').first()).not.toHaveText('—')
      await expect(page.locator('.contact-directory')).toHaveAttribute('aria-busy', 'false')
      const counts = await summary.locator('strong').allTextContents()
      const nodes = await summary.locator('a').elementHandles()
      const table = (await page.locator('.contact-directory .h-data-table').elementHandles())[0]
      await summary.evaluate((element) => {
        new MutationObserver(() => {
          if ([...element.querySelectorAll('strong')].some((node) => node.textContent === '—')) element.setAttribute('data-flashed', 'true')
        }).observe(element, { childList: true, characterData: true, subtree: true })
      })
      let release = () => {}
      const gate = new Promise<void>((resolve) => { release = resolve })
      let held = false
      const matcher = (url: URL) => url.pathname === item.endpoint
      await page.route(matcher, async (route) => {
        if (!held) { held = true; await gate }
        await route.continue()
      })
      const request = page.waitForRequest((r) => new URL(r.url()).pathname === item.endpoint)
      try {
        await summary.getByRole('link').nth(item.index).click()
        await request
        await expect(page.locator('.contact-directory')).toHaveAttribute('aria-busy', 'true')
        await expect(summary.locator('strong')).toHaveText(counts)
        expect(await Promise.all(nodes.map((node) => node.evaluate((element) => element.isConnected)))).toEqual(nodes.map(() => true))
        if (table) expect(await table.evaluate((element) => element.isConnected)).toBe(true)
        await expect(page.locator('.contact-directory .h-loading')).toHaveCount(0)
        await expect(summary).not.toHaveAttribute('data-flashed', 'true')
        if (item.path === '/expenses') await page.screenshot({ path: '/private/tmp/horizon-expenses-stable-cards.png', fullPage: true, animations: 'disabled' })
      } finally { release() }
      await expect(page.locator('.contact-directory')).toHaveAttribute('aria-busy', 'false')
      await page.unroute(matcher)
      if (item.path === '/expenses') {
        let releaseScope = () => {}
        const scopeGate = new Promise<void>((resolve) => { releaseScope = resolve })
        await page.route(matcher, async (route) => { await scopeGate; await route.continue() })
        const scopeRequest = page.waitForRequest((r) => new URL(r.url()).pathname === item.endpoint && new URL(r.url()).searchParams.get('area') === 'review')
        try {
          await page.getByRole('tab', { name: 'À valider', exact: true }).click()
          await scopeRequest
          await expect(summary.locator('strong').first()).toHaveText('—')
          await expect(page.getByRole('status', { name: 'Chargement des notes de frais', exact: true })).toBeVisible()
        } finally { releaseScope() }
        await expect(page.locator('.contact-directory')).toHaveAttribute('aria-busy', 'false')
        await page.unroute(matcher)
      }
    })
  }
})

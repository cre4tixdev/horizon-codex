import { expect, test, type Page } from '@playwright/test'
const password = 'Local-Horizon-test-only-2026!'
async function login(page: Page, email = 'erp-admin@local.invalid') {
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill(email); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
}
test('Affichage personnel : compteurs, couleurs, navigation, persistance et isolation navigateur', async ({ page, request, browser }) => {
  test.setTimeout(90_000)
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1600, height: 1000 }); await login(page)
  const headers = { Authorization: await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '') }
  const companyResponse = await request.post('http://127.0.0.1:18090/api/collections/contacts_companies/records', { headers, data: { name: 'Compteurs personnels UX', active: true } }); expect(companyResponse.ok()).toBe(true); const company = await companyResponse.json()
  const session = await (await request.post('http://127.0.0.1:18090/api/collections/core_users/auth-refresh', { headers })).json()
  const stages = await (await request.get('http://127.0.0.1:18090/api/collections/crm_stages/records', { headers })).json()
  const opportunity = await request.post('http://127.0.0.1:18090/api/horizon/crm/save', { headers, data: { creation_key: crypto.randomUUID(), input: { title: 'Affaire Compteurs UX', company: company.id, contact: '', owner: session.record.id, stage: stages.items[0].id, type: 'direct', estimated_value: 1000, estimated_cost: 0, currency: 'EUR', probability: 0, expected_date: '', description: '', status: 'open', market_types: [] } } }); expect(opportunity.ok()).toBe(true)
  await page.goto(`/contacts/companies/${company.id}`); await expect(page.getByRole('heading', { name: company.name, exact: true })).toBeVisible()
  const smart = page.getByRole('navigation', { name: 'Objets métier de la société', exact: true })
  await expect(smart.locator('.h-counter')).toHaveText('1'); await expect(smart.locator('.h-counter')).toHaveAttribute('data-highlight', 'true')
  await smart.getByRole('button', { name: 'Opportunités 1', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Opportunités', exact: true })).toBeVisible(); await page.keyboard.press('Escape')
  await page.goto('/contacts'); const cards = page.getByRole('region', { name: 'Synthèse du répertoire', exact: true }); await expect(cards.locator('.h-counter').first()).toBeVisible()
  const preferences = async () => { await page.goto('/account?tab=preferences'); await expect(page.getByRole('heading', { name: 'Affichage et confort', exact: true })).toBeVisible(); await expect(page.getByRole('tab', { name: 'Préférences', exact: true })).toHaveAttribute('aria-selected', 'true') }
  const display = page.locator('.account-preferences')
  await preferences(); const show = page.getByRole('checkbox', { name: 'Afficher les compteurs', exact: true }), highlight = page.getByRole('checkbox', { name: 'Colorer les compteurs non nuls des smart boutons', exact: true })
  await expect(show).toBeChecked(); await expect(highlight).toBeChecked(); await expect(show).toHaveCSS('accent-color', 'rgb(245, 47, 150)'); await expect(highlight).toHaveCSS('accent-color', 'rgb(245, 47, 150)'); await show.uncheck(); await display.getByRole('button', { name: 'Annuler', exact: true }).click(); await expect(show).toBeChecked()
  await show.uncheck(); await expect(highlight).toBeDisabled(); await display.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(display.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled()
  await page.reload(); await expect(show).not.toBeChecked()
  await page.goto('/contacts'); await expect(cards.getByRole('link').first()).toBeVisible(); await expect(cards.locator('.h-counter')).toHaveCount(0)
  await page.goto(`/contacts/companies/${company.id}`); await expect(smart.getByRole('button', { name: 'Opportunités', exact: true })).toBeVisible(); await expect(smart.locator('.h-counter')).toHaveCount(0); await smart.getByRole('button', { name: 'Opportunités', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Opportunités', exact: true })).toBeVisible(); await page.keyboard.press('Escape')
  await page.goto('/'); await expect(page.locator('.kpi__value').first()).toBeVisible()
  const second = await browser.newContext(); try {
    const otherPage = await second.newPage(); await login(otherPage); await otherPage.goto('/account?tab=preferences'); await expect(otherPage.getByRole('checkbox', { name: 'Afficher les compteurs', exact: true })).not.toBeChecked()
  } finally { await second.close() }
  const otherUser = await browser.newContext(); try {
    const otherPage = await otherUser.newPage(); await login(otherPage, 'reader@local.invalid'); await otherPage.goto('/account?tab=preferences'); await expect(otherPage.getByRole('checkbox', { name: 'Afficher les compteurs', exact: true })).toBeChecked()
  } finally { await otherUser.close() }
  await preferences(); await show.check(); await highlight.uncheck(); await display.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(display.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled()
  await page.goto(`/contacts/companies/${company.id}`); await expect(smart.locator('.h-counter')).toHaveText('1'); await expect(smart.locator('.h-counter')).toHaveAttribute('data-highlight', 'false')
  await preferences(); await highlight.check(); await display.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(display.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled()
  await page.screenshot({ path: '/private/tmp/horizon-display-light.png', fullPage: true }); await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); await page.screenshot({ path: '/private/tmp/horizon-display-dark.png', fullPage: true }); await page.setViewportSize({ width: 390, height: 844 }); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: '/private/tmp/horizon-display-mobile.png', fullPage: true })
  await page.goto(`/contacts/companies/${company.id}`); await expect(smart.locator('.h-counter')).toHaveAttribute('data-highlight', 'true')
  await page.setViewportSize({ width: 1600, height: 1000 }); await page.goto('/contacts'); await expect(cards.locator('.h-counter').first()).toBeVisible()
  await expect.poll(() => cards.locator('.h-counter').allTextContents()).not.toContain('—')
  const cardColors = async () => {
    await expect(cards.locator('.h-counter').first()).toBeVisible()
    await expect.poll(() => cards.locator('.h-counter').allTextContents()).not.toContain('—')
    await expect(cards.locator('.h-counter[data-highlight]')).toHaveCount(0)
    return cards.locator('.h-counter').evaluateAll((elements) => elements.map((element) => getComputedStyle(element).color))
  }
  const darkColors = await cardColors()
  await page.screenshot({ path: '/private/tmp/horizon-counters-dark.png', fullPage: true })
  await preferences(); await highlight.uncheck(); await display.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(display.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled()
  await page.goto('/contacts'); expect(await cardColors()).toEqual(darkColors)
  await page.getByRole('button', { name: 'Passer en mode clair', exact: true }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const lightColors = await cardColors()
  await preferences(); await highlight.check(); await display.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(display.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled()
  await page.goto('/contacts'); expect(await cardColors()).toEqual(lightColors)
  await page.screenshot({ path: '/private/tmp/horizon-counters-light.png', fullPage: true })
  expect(errors).toEqual([])
})

import { expect, test } from '@playwright/test'
const api = 'http://127.0.0.1:18090/api', password = 'Local-Horizon-test-only-2026!'
test('Notifications : retrait persistant, préférences personnelles et recherche réglable', async ({ page, request }) => {
  const loginApi = async (email: string) => { const r = await request.post(`${api}/collections/core_users/auth-with-password`, { data: { identity: email, password } }); expect(r.ok()).toBe(true); return r.json() }
  const admin = await loginApi('erp-admin@local.invalid'), writer = await loginApi('writer@local.invalid')
  const companyResponse = await request.post(`${api}/collections/contacts_companies/records`, { headers: { Authorization: admin.token }, data: { name: 'Notifications UX', active: true } }); expect(companyResponse.ok()).toBe(true)
  const company = await companyResponse.json()
  const publish = async (body: string) => { const r = await request.post(`${api}/collections/core_activity_events/records`, { headers: { Authorization: writer.token }, data: { source_module: 'contacts', source_entity: 'contacts_companies', source_record_id: company.id, type: 'note', body, mentions: [admin.record.id] } }); expect(r.ok()).toBe(true); return r.json() }
  await publish('Mention à retirer'); await publish('Mention à lire')
  await page.setViewportSize({ width: 1600, height: 1000 }); await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  expect((await request.get(`${api}/horizon/notifications/inbox`, { headers: { Authorization: admin.token } })).ok()).toBe(true)
  const bell = page.getByRole('button', { name: /^Notifications/ }); await bell.click()
  const inbox = page.getByRole('dialog', { name: 'Notifications', exact: true })
  const first = inbox.getByRole('listitem').filter({ hasText: 'Mention à retirer' })
  await expect(first).toBeVisible(); await first.getByRole('button', { name: /^Retirer :/ }).click(); await expect(first).toHaveCount(0)
  const second = inbox.getByRole('listitem').filter({ hasText: 'Mention à lire' }); await second.getByRole('button', { name: /^Marquer comme lue/ }).click()
  await expect(inbox.getByRole('button', { name: 'Retirer les notifications lues', exact: true })).toBeVisible()
  await page.screenshot({ path: '/private/tmp/horizon-notifications-inbox.png' })
  await inbox.getByRole('button', { name: 'Retirer les notifications lues', exact: true }).click(); await expect(inbox.getByText('Vous êtes à jour', { exact: true })).toBeVisible()
  await inbox.getByRole('link', { name: 'Préférences de notifications', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Préférences', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('checkbox', { name: 'Mentions', exact: true }).uncheck(); await page.getByRole('checkbox', { name: 'Congés à valider', exact: true }).uncheck()
  await page.locator('.notification-preferences').getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(page.getByText('Préférences enregistrées.', { exact: true })).toBeVisible()
  await page.reload(); await expect(page.getByRole('checkbox', { name: 'Mentions', exact: true })).not.toBeChecked(); await expect(page.getByRole('checkbox', { name: 'Réponses aux e-mails', exact: true })).toBeChecked()
  await publish('Mention sans alerte'); await bell.click(); await expect(inbox.getByText('Vous êtes à jour', { exact: true })).toBeVisible(); await page.keyboard.press('Escape')
  await page.screenshot({ path: '/private/tmp/horizon-notifications-preferences-light.png' })
  // Profile drafts survive switching to notification preferences and back.
  await page.getByRole('tab', { name: 'Profil et sécurité', exact: true }).click(); const name = page.getByLabel('Nom affiché', { exact: true }), previousName = await name.inputValue(); await name.fill('Brouillon conservé')
  await page.getByRole('tab', { name: 'Préférences', exact: true }).click(); await page.getByRole('tab', { name: 'Profil et sécurité', exact: true }).click(); await expect(page.getByRole('tab', { name: 'Profil et sécurité', exact: true })).toHaveAttribute('aria-selected', 'true'); await expect(name).toHaveValue('Brouillon conservé'); await page.getByRole('button', { name: 'Annuler', exact: true }).click(); await expect(name).toHaveValue(previousName)
  await page.goto('/settings/ux?tab=search'); await page.locator('summary').filter({ hasText: 'Recherche en barre supérieure' }).click()
  const width = page.getByRole('spinbutton', { name: 'Largeur maximale de la recherche', exact: true }); await expect(width).toHaveValue('840'); await width.fill('600'); await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect.poll(() => page.locator('.app-workspace > .topbar > .workspace-search').evaluate((e) => Math.round(e.getBoundingClientRect().width))).toBe(600)
  await page.screenshot({ path: '/private/tmp/horizon-search-width-setting.png' })
  await page.goto('/account?tab=notifications'); await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click(); await page.screenshot({ path: '/private/tmp/horizon-notifications-preferences-dark.png' })
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: '/private/tmp/horizon-notifications-preferences-mobile.png' }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})


test('Notifications : une erreur serveur sort du chargement et permet de réessayer', async ({ page }) => {
  await page.route('**/api/horizon/notifications/inbox', (route) => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  await page.getByRole('button', { name: /^Notifications/ }).click()
  const inbox = page.getByRole('dialog', { name: 'Notifications', exact: true })
  await expect(inbox.getByRole('alert')).toHaveText('Les notifications sont indisponibles. Réessayez.')
  await expect(inbox.getByText('Consultation des notifications…')).toHaveCount(0)
  await page.unroute('**/api/horizon/notifications/inbox'); await inbox.getByRole('button', { name: 'Réessayer', exact: true }).click()
  await expect(inbox.getByRole('alert')).toHaveCount(0); await expect(inbox.getByText('Consultation des notifications…')).toHaveCount(0)
})


test('Notifications : une requête bloquée expire et quitte le chargement', async ({ page }) => {
  await page.route('**/api/horizon/notifications/inbox', () => {})
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  await page.getByRole('button', { name: /^Notifications/ }).click()
  const inbox = page.getByRole('dialog', { name: 'Notifications', exact: true })
  await expect(inbox.getByRole('alert')).toHaveText('Les notifications sont indisponibles. Réessayez.', { timeout: 20_000 })
  await expect(inbox.getByText('Consultation des notifications…')).toHaveCount(0)
  await expect(inbox.getByRole('button', { name: 'Réessayer', exact: true })).toBeVisible()
})

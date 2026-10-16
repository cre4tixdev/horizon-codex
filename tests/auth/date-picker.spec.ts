import { test, expect, type Page, type Locator } from '@playwright/test'
test.use({ actionTimeout: 10_000 })
const password = 'Local-Horizon-test-only-2026!'
async function login(page: Page) { await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).toHaveURL('/') }
async function openDate(input: Locator, page: Page, month = false) { await input.locator('..').locator('.h-date-input-trigger').click(); const calendar = page.getByRole('dialog', { name: month ? 'Sélectionner un mois' : 'Sélectionner une date', exact: true }); await expect(calendar).toBeVisible(); return calendar }
test('Dates partagées : sélection contrôlée, clavier, année bissextile et mobile', async ({ page, request }) => {
  await page.setViewportSize({ width: 1600, height: 1000 }); await login(page); await page.goto('/hr?view=list'); await page.getByRole('button', { name: 'Nouvel employé', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Nouvel employé', exact: true }), date = editor.getByLabel('Date de début', { exact: true })
  await editor.getByLabel('Prénom', { exact: true }).fill('Julie'); await editor.getByLabel('Nom', { exact: true }).fill('Calendrier')
  await date.fill('2026-10-15'); let calendar = await openDate(date, page)
  await expect(calendar.getByRole('gridcell', { name: 'jeudi 15 octobre 2026', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.screenshot({ path: '/private/tmp/horizon-date-picker-light.png', fullPage: true })
  await calendar.getByRole('gridcell', { name: 'mardi 20 octobre 2026', exact: true }).click(); await expect(calendar).toHaveCount(0); await expect(date).toHaveValue('2026-10-20'); await expect(date).toBeFocused()
  await date.press('Alt+ArrowDown'); calendar = page.getByRole('dialog', { name: 'Sélectionner une date', exact: true }); await expect(calendar.getByRole('gridcell', { name: 'mardi 20 octobre 2026', exact: true })).toBeFocused(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await expect(date).toHaveValue('2026-10-21')
  await date.fill('2026-10-01'); await date.press('Alt+ArrowDown'); calendar = page.getByRole('dialog', { name: 'Sélectionner une date', exact: true }); await expect(calendar.getByRole('gridcell', { name: 'jeudi 1 octobre 2026', exact: true })).toBeFocused(); await page.keyboard.press('ArrowLeft'); await expect(calendar.getByRole('gridcell', { name: 'mercredi 30 septembre 2026', exact: true })).toBeFocused(); await page.keyboard.press('Enter'); await expect(date).toHaveValue('2026-09-30'); await date.fill('2026-10-21')
  calendar = await openDate(date, page); await calendar.getByLabel('Année du calendrier', { exact: true }).fill('2028'); await calendar.getByLabel('Année du calendrier', { exact: true }).press('Enter')
  await calendar.locator('[data-calendar-focus=true]').focus(); for (let i = 0; i < 8; i++) await page.keyboard.press('PageUp')
  await expect(calendar.getByRole('grid', { name: 'février 2028', exact: true })).toBeVisible(); await calendar.getByRole('gridcell', { name: 'mardi 29 février 2028', exact: true }).click(); await expect(date).toHaveValue('2028-02-29')
  calendar = await openDate(date, page); await page.keyboard.press('Escape'); await expect(calendar).toHaveCount(0); await expect(date).toHaveValue('2028-02-29')
  calendar = await openDate(date, page); await calendar.getByRole('button', { name: 'Effacer', exact: true }).click(); await expect(date).toHaveValue('')
  await date.fill('2026-10-21'); await page.setViewportSize({ width: 390, height: 844 }); calendar = await openDate(date, page); const box = await calendar.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(390); expect(box!.y + box!.height).toBeLessThanOrEqual(844); await page.screenshot({ path: '/private/tmp/horizon-date-picker-mobile.png', fullPage: true }); await page.keyboard.press('Escape'); await page.setViewportSize({ width: 1600, height: 1000 })
  await editor.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(editor).toHaveCount(0)
  const token = await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || ''), response = await request.get('http://127.0.0.1:18090/api/horizon/hr/directory', { headers: { Authorization: token } }); expect(response.status()).toBe(200); const data = await response.json(); expect(data.employees.find((e: { last_name: string }) => e.last_name === 'Calendrier').start_date.slice(0, 10)).toBe('2026-10-21')
})
test('Dates partagées : formulaires RHF, mois et valeur ISO persistée', async ({ page, request }) => {
  await login(page); const token = await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '')
  const api = async (path: string, data?: object) => { const r = await request.fetch('http://127.0.0.1:18090/api/' + path, { method: data ? 'POST' : 'GET', headers: { Authorization: token }, ...(data ? { data } : {}) }); expect(r.status(), await r.text()).toBe(200); return r.json() }
  const employee = await api('horizon/hr/employees/save', { input: { first_name: 'Test', last_name: 'Dates RHF', professional_email: '', professional_phone: '', job_title: '', employment_type: 'employee', team: '', manager: '', is_manager: false, is_direction: false, external_company: '', start_date: '', end_date: '', status: 'active' } })
  const directory = await api('horizon/access/users'), user = directory.users.find((u: { email: string }) => u.email === 'erp-admin@local.invalid')
  await api('horizon/access/users/save', { id: user.id, updated: user.updated, input: { name: user.name, email: user.email, active: true, employee: employee.id, erp_profile: 'admin', grants: user.grants, password: '' } })
  await page.goto('/leave'); await page.getByRole('button', { name: 'Nouvelle demande', exact: true }).click(); let editor = page.getByRole('dialog', { name: 'Nouvelle demande de congé', exact: true }), date = editor.getByLabel('Date de début', { exact: true })
  const end = editor.getByLabel('Date de fin', { exact: true }); await expect(end).toHaveValue('')
  await date.fill('2026-11-09'); let calendar = await openDate(end, page)
  await expect(calendar.getByRole('grid', { name: 'novembre 2026', exact: true })).toBeVisible(); await expect(end).toHaveValue('')
  await calendar.getByRole('gridcell', { name: 'vendredi 13 novembre 2026', exact: true }).click(); await expect(editor.getByRole('status')).toContainText('4 j')
  await date.fill('2026-11-10'); calendar = await openDate(end, page); await expect(calendar.getByRole('gridcell', { name: 'vendredi 13 novembre 2026', exact: true })).toHaveAttribute('aria-selected', 'true'); await page.keyboard.press('Escape'); await expect(end).toHaveValue('2026-11-13')
  await date.fill('2026-10-19'); await end.fill('2026-10-23'); calendar = await openDate(date, page)
  await calendar.getByRole('gridcell', { name: 'mardi 20 octobre 2026', exact: true }).click(); await expect(date).toHaveValue('2026-10-20'); await expect(editor.getByRole('status')).toContainText('4 j')
  await editor.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(editor).toHaveCount(0); await expect(page).toHaveURL(/\/leave\/[a-z0-9]{15}$/); await page.reload(); await expect(page.getByLabel('Début', { exact: true })).toHaveValue('20/10/2026 · Matin')
  await page.goto('/expenses'); await page.getByRole('button', { name: 'Nouvelle note', exact: true }).click(); editor = page.getByRole('dialog', { name: 'Nouvelle note de frais', exact: true }); date = editor.getByLabel('Mois', { exact: true }); calendar = await openDate(date, page, true)
  await calendar.getByLabel('Année du calendrier', { exact: true }).fill('2026'); await calendar.getByLabel('Année du calendrier', { exact: true }).press('Enter'); await calendar.getByRole('button', { name: 'novembre 2026', exact: true }).click(); await expect(date).toHaveValue('2026-11'); await editor.getByRole('button', { name: 'Créer la note', exact: true }).click(); await expect(editor).toHaveCount(0)
  date = page.getByLabel('Mois de la note', { exact: true }); calendar = await openDate(date, page, true); await calendar.getByRole('button', { name: 'décembre 2026', exact: true }).click(); await expect(date).toHaveValue('2026-12'); await page.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.reload(); await expect(date).toHaveValue('2026-12')
})
test('Dates partagées : date-heure, fuseau et thème sombre', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 }); await login(page); await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click(); await page.goto('/calendar'); await page.getByRole('button', { name: 'Ajouter un événement', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Nouvel événement', exact: true }); await editor.getByLabel('Toute la journée', { exact: true }).uncheck(); const date = editor.getByLabel('Début', { exact: true }); await date.fill('2026-10-19T09:00'); let calendar = await openDate(date, page)
  await calendar.getByRole('gridcell', { name: 'mardi 20 octobre 2026', exact: true }).click(); await calendar.getByLabel('Heure du rendez-vous', { exact: true }).fill('14:30'); await page.screenshot({ path: '/private/tmp/horizon-date-picker-dark.png', fullPage: true }); await calendar.getByRole('button', { name: 'Appliquer', exact: true }).click(); await expect(date).toHaveValue('2026-10-20T14:30')
  // Escape discards the temporary calendar/time selection.
  calendar = await openDate(date, page); await calendar.getByRole('gridcell', { name: 'mercredi 21 octobre 2026', exact: true }).click(); await page.keyboard.press('Escape'); await expect(date).toHaveValue('2026-10-20T14:30')
  await editor.getByLabel('Titre', { exact: true }).fill('Date Horizon'); const saved = page.waitForResponse((r) => r.url().endsWith('/api/horizon/calendar/manual/save') && r.request().method() === 'POST'); await editor.getByRole('button', { name: 'Enregistrer', exact: true }).click(); const response = await saved; expect(response.status()).toBe(200); const record = await response.json(); expect(record.start.replace(' ', 'T')).toContain('2026-10-20T12:30:00'); await expect(editor).toHaveCount(0)
})
test('Dates partagées : présence sur les pages ventes, achats, facturation et stock', async ({ page }) => {
  await login(page)
  const paths = ['/sales/quotes/new', '/purchasing/requests/new', '/purchasing/orders/new', '/billing/customer/new', '/billing/supplier/new', '/inventory/operations/new?kind=IN', '/inventory/operations/new?kind=OUT']
  for (const path of paths) {
    await page.goto(path)
    const input = page.locator('.h-date-input > input[type=date]').first()
    await expect(input, path).toBeVisible(); await expect(input, path).toBeEnabled()
    const calendar = await openDate(input, page)
    await expect(calendar.getByRole('columnheader', { name: 'Lun', exact: true })).toBeVisible()
    expect(await calendar.evaluate((e) => getComputedStyle(e).boxShadow)).toBe('none')
    await page.keyboard.press('Escape'); await expect(input).toBeFocused()
  }
})

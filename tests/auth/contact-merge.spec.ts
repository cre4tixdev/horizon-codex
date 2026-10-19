import { expect, test } from '@playwright/test'
const password = 'Local-Horizon-test-only-2026!'
test('Fusion sociétés : comparaison, choix, confirmation, historique et responsive', async ({ page, request }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  const headers = { Authorization: await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '') }
  const create = async (collection: string, data: Record<string, unknown>) => { const response = await request.post(`http://127.0.0.1:18090/api/collections/${collection}/records`, { headers, data }); expect(response.ok()).toBe(true); return response.json() }
  const source = await create('contacts_companies', { name: 'Fusion UX Métropole', legal_name: 'Métropole UX', active: true, phone: '0102030405' })
  const target = await create('contacts_companies', { name: 'Fusion UX M6', legal_name: 'Métropole UX', active: true })
  await create('contacts_people', { first_name: 'Alice Fusion', company: source.id, active: true })
  const session = await (await request.post('http://127.0.0.1:18090/api/collections/core_users/auth-refresh', { headers })).json()
  const stages = await (await request.get('http://127.0.0.1:18090/api/collections/crm_stages/records', { headers })).json()
  const opportunity = await (await request.post('http://127.0.0.1:18090/api/horizon/crm/save', { headers, data: { creation_key: crypto.randomUUID(), input: { title: 'Affaire Fusion UX', company: source.id, contact: '', owner: session.record.id, stage: stages.items[0].id, type: 'direct', estimated_value: 1000, estimated_cost: 0, currency: 'EUR', probability: 0, expected_date: '', description: '', status: 'open', market_types: [] } } })).json()
  await page.goto(`/contacts/companies/${target.id}`)
  await page.getByRole('button', { name: 'Actions de la fiche', exact: true }).click(); await page.getByRole('menuitem', { name: 'Fusionner avec…', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Fusionner les sociétés', exact: true })
  await dialog.getByRole('combobox', { name: 'Fiche à fusionner', exact: true }).click(); await page.getByRole('combobox', { name: 'Rechercher : Fiche à fusionner', exact: true }).fill('Fusion UX Métropole'); await page.getByRole('option', { name: 'Fusion UX Métropole · Métropole UX', exact: true }).click()
  await dialog.getByRole('button', { name: 'Comparer les fiches', exact: true }).click(); await expect(dialog.getByRole('heading', { name: 'Informations à conserver', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Fusionner', exact: true })).toBeDisabled()
  await dialog.getByRole('radio', { name: 'Nom usuel · Autre fiche', exact: true }).check(); await page.screenshot({ path: '/private/tmp/horizon-contact-merge-light.png', fullPage: true })
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click(); await page.getByRole('button', { name: 'Actions de la fiche', exact: true }).click(); await page.getByRole('menuitem', { name: 'Fusionner avec…', exact: true }).click()
  await dialog.getByRole('combobox', { name: 'Fiche à fusionner', exact: true }).click(); await page.getByRole('option', { name: 'Fusion UX Métropole · Métropole UX', exact: true }).click(); await dialog.getByRole('button', { name: 'Comparer les fiches', exact: true }).click()
  await page.screenshot({ path: '/private/tmp/horizon-contact-merge-dark.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 }); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: '/private/tmp/horizon-contact-merge-mobile.png', fullPage: true })
  await dialog.getByRole('checkbox', { name: 'Je confirme la fusion vers Fusion UX M6.', exact: true }).check(); await dialog.getByRole('button', { name: 'Fusionner', exact: true }).click(); await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Fiches fusionnées · historique conservé', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Opportunités 1', exact: true }).click()
  const links = page.getByRole('dialog', { name: 'Opportunités', exact: true }); await expect(links.getByRole('cell').filter({ hasText: 'Affaire Fusion UX' })).toBeVisible()
  const positions = await links.locator('thead, tbody').evaluateAll((elements) => elements.map((e) => ({ top: e.getBoundingClientRect().top, bottom: e.getBoundingClientRect().bottom }))); expect(positions[1]!.top).toBeGreaterThanOrEqual(positions[0]!.bottom - 1)
  await expect(links.getByRole('link').first()).toHaveAttribute('href', `/crm/opportunities/${opportunity.id}`)
  await page.screenshot({ path: '/private/tmp/horizon-company-merged-links.png', fullPage: true }); await page.keyboard.press('Escape')
  await page.goto(`/contacts/companies/${source.id}`); await expect(page).toHaveURL(new RegExp(`/contacts/companies/${target.id}$`))
  await page.getByRole('link', { name: 'Fusion UX Métropole', exact: true }).click(); await expect(page.getByRole('link', { name: 'Ouvrir la fiche conservée', exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Actions de la fiche', exact: true })).toHaveCount(0)
  const people = await request.get(`http://127.0.0.1:18090/api/collections/contacts_people/records?filter=company="${target.id}"`, { headers }); expect((await people.json()).items.some((person: { first_name: string }) => person.first_name === 'Alice Fusion')).toBe(true)
})

test('Fusion personnes : sens inversé et valeurs conservées', async ({ page, request }) => {
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  const headers = { Authorization: await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '') }
  const create = async (first_name: string, email: string) => { const response = await request.post('http://127.0.0.1:18090/api/collections/contacts_people/records', { headers, data: { first_name, last_name: 'Fusion personnes UX', email, active: true } }); expect(response.ok()).toBe(true); return response.json() }
  const a = await create('Alice', 'alice-fusion@example.invalid'); const b = await create('Alicia', '')
  await page.goto(`/contacts/people/${a.id}`); await page.getByRole('button', { name: 'Actions de la fiche', exact: true }).click(); await page.getByRole('menuitem', { name: 'Fusionner avec…', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Fusionner les contacts', exact: true })
  await dialog.getByRole('combobox', { name: 'Fiche à fusionner', exact: true }).click(); await page.getByRole('combobox', { name: 'Rechercher : Fiche à fusionner', exact: true }).fill('Alicia'); await page.getByRole('option', { name: 'Alicia Fusion personnes UX', exact: true }).click()
  await dialog.getByRole('button', { name: 'Inverser', exact: true }).click(); await dialog.getByRole('button', { name: 'Comparer les fiches', exact: true }).click(); await expect(dialog.getByRole('columnheader', { name: 'Fiche conservée · Alicia Fusion personnes UX', exact: true })).toBeVisible()
  await dialog.getByRole('radio', { name: 'Prénom · Autre fiche', exact: true }).check(); await dialog.getByRole('checkbox', { name: 'Je confirme la fusion vers Alicia Fusion personnes UX.', exact: true }).check(); await dialog.getByRole('button', { name: 'Fusionner', exact: true }).click(); await expect(page).toHaveURL(new RegExp(`/contacts/people/${b.id}$`)); await expect(page.getByRole('heading', { name: 'Alice Fusion personnes UX', exact: true })).toBeVisible()
})

test('Fusion : action absente sans habilitation', async ({ page, request }) => {
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('writer@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  const headers = { Authorization: await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '') }
  const response = await request.post('http://127.0.0.1:18090/api/collections/contacts_companies/records', { headers, data: { name: 'Writer merge UX', active: true } }); expect(response.ok()).toBe(true); const company = await response.json()
  await page.goto(`/contacts/companies/${company.id}`); await page.getByRole('button', { name: 'Actions de la fiche', exact: true }).click(); await expect(page.getByRole('menuitem', { name: 'Fusionner avec…', exact: true })).toHaveCount(0)
})

test('Fusion sociétés : conflit juridique explicite et lisible', async ({ page, request }) => {
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill(password); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  const headers = { Authorization: await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '') }
  const companies = []
  for (const [name, siren] of [['Conflit Fusion Source', '123456789'], ['Conflit Fusion Cible', '987654321']]) {
    const response = await request.post('http://127.0.0.1:18090/api/collections/contacts_companies/records', { headers, data: { name, siren, active: true } }); expect(response.ok()).toBe(true); companies.push(await response.json())
  }
  await page.goto(`/contacts/companies/${companies[1].id}`); await expect(page.getByRole('heading', { name: 'Conflit Fusion Cible', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Actions de la fiche', exact: true }).click(); await page.getByRole('menuitem', { name: 'Fusionner avec…', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Fusionner les sociétés', exact: true })
  await dialog.getByRole('combobox', { name: 'Fiche à fusionner', exact: true }).click(); await page.getByRole('combobox', { name: 'Rechercher : Fiche à fusionner', exact: true }).fill('Conflit Fusion Source'); await page.getByRole('option', { name: /^Conflit Fusion Source/ }).click(); await dialog.getByRole('button', { name: 'Comparer les fiches', exact: true }).click()
  const alert = dialog.getByRole('alert'); await expect(alert).toHaveText('SIREN incompatible : fiche à fusionner « Conflit Fusion Source » : 123456789 ; fiche conservée « Conflit Fusion Cible » : 987654321. Vérifiez et corrigez les fiches avant fusion.')
  await expect(dialog.getByRole('button', { name: 'Fusionner', exact: true })).toBeDisabled()
  await alert.scrollIntoViewIfNeeded(); await expect(alert).toBeInViewport(); await page.screenshot({ path: '/private/tmp/horizon-merge-conflict-light.png', fullPage: true }); await page.setViewportSize({ width: 390, height: 844 }); await alert.scrollIntoViewIfNeeded(); await expect(alert).toBeInViewport(); await expect.poll(() => alert.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true); await page.screenshot({ path: '/private/tmp/horizon-merge-conflict-mobile.png', fullPage: true })
})

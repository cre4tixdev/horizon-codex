import { test, expect } from '@playwright/test'

test('Ventes : types, états multiples, archives et critères conservés', async ({ page, request }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!'); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).toHaveURL('/')
  const token = await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '')
  const api = async (path: string, data?: object) => { const response = await request.fetch(`http://127.0.0.1:18090/api/${path}`, { method: data ? 'POST' : 'GET', headers: { Authorization: token }, ...(data ? { data } : {}) }); expect(response.status(), await response.text()).toBe(200); return response.json() }
  await page.goto('/contacts/companies/new'); await page.getByLabel('Nom usuel', { exact: true }).fill('Client filtres Ventes'); await page.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(page).toHaveURL(/contacts\/companies\/(?!new)/)
  const company = new URL(page.url()).pathname.split('/').at(-1)!, stages = await api('collections/crm_stages/records'), session = await api('collections/core_users/auth-refresh', {})
  const opportunity = await api('horizon/crm/save', { creation_key: crypto.randomUUID(), input: { title: 'Affaire filtres', company, contact: '', owner: session.record.id, stage: stages.items[0].id, type: 'direct', estimated_value: 1000, estimated_cost: 0, currency: 'EUR', probability: 0, expected_date: '', description: '', status: 'open', market_types: [] } })
  const create = async (title: string, status: 'draft' | 'validated' | 'accepted', archived = false) => {
    let record = await api('horizon/sales/quotes/save', { creation_key: crypto.randomUUID(), input: { opportunity: opportunity.id, title: `Filtres ${title}`, quote_date: '2026-10-13', valid_until: '', notes: '', lines: [{ description: 'Prestation', quantity: 1, unit: 'h', unit_price: 100 }] } })
    if (status !== 'draft') record = await api('horizon/sales/quotes/finalize', { id: record.id, updated: record.updated })
    if (status === 'accepted') record = await api('horizon/sales/quotes/confirm', { id: record.id, updated: record.updated, customer_order_number: 'PO-FILTRES' })
    if (archived) record = await api('horizon/sales/quotes/manage', { id: record.id, updated: record.updated, action: 'archive' })
    return record
  }
  await create('Brouillon', 'draft'); await create('Finalisé', 'validated'); await create('Commande', 'accepted'); await create('Devis archivé', 'draft', true); await create('Commande archivée', 'accepted', true)
  const rows = page.locator('.contact-directory tbody tr'), panel = page.getByRole('dialog', { name: 'Filtres de recherche', exact: true })
  const open = async () => { await page.getByRole('button', { name: /^Filtres de recherche/ }).click(); await expect(panel).toBeVisible() }
  const select = async (role: 'checkbox' | 'radio', name: string, checked = true) => { const input = panel.getByRole(role, { name, exact: true }); if (await input.isChecked() !== checked) await input.locator('..').click(); await expect(input).toBeChecked({ checked }) }
  await page.goto('/sales/quotes?kind=quote&q=Filtres&page=2'); await open(); await select('checkbox', 'Brouillons'); await select('checkbox', 'Finalisés')
  await expect.poll(() => new URL(page.url()).searchParams.get('status')).toBe('draft,validated'); expect(new URL(page.url()).searchParams.has('page')).toBe(false); await expect(rows).toHaveCount(2)
  await select('radio', 'Archivés'); await expect(rows).toHaveCount(1); await expect(rows).toContainText('Devis archivé'); await page.screenshot({ path: '/private/tmp/horizon-sales-filters-light.png' }); await panel.getByRole('button', { name: 'Terminé', exact: true }).click()
  await page.getByRole('button', { name: 'Retirer le filtre État des devis : Brouillons', exact: true }).click(); await expect.poll(() => new URL(page.url()).searchParams.get('status')).toBe('validated'); await expect(rows).toHaveCount(0)
  await page.getByRole('button', { name: 'Retirer le filtre Archives : Archivés', exact: true }).click(); await expect(rows).toHaveCount(1); expect(new URL(page.url()).searchParams.get('q')).toBe('Filtres')
  await open(); await select('checkbox', 'Commandes clients'); await expect(panel.getByText('État des commandes', { exact: true })).toBeVisible(); await select('checkbox', 'Confirmées'); await select('checkbox', 'Terminées'); await expect(rows).toHaveCount(2)
  await select('checkbox', 'Devis', false); await expect(panel.getByText('État des devis', { exact: true })).toHaveCount(0); expect(new URL(page.url()).searchParams.has('status')).toBe(false); await expect(rows).toHaveCount(1); await expect(rows).toContainText('PO-FILTRES')
  await select('checkbox', 'Numéro renseigné'); await expect(rows).toHaveCount(1)
  await select('radio', 'État'); await expect(page.getByRole('region', { name: 'Confirmée : 1 commandes clients', exact: true })).toBeVisible()
  await select('radio', 'N° commande client'); await expect(page.getByRole('region', { name: 'PO-FILTRES : 1 commandes clients', exact: true })).toBeVisible()
  await select('checkbox', 'Numéro renseigné', false); await select('checkbox', 'Attente Commande'); await expect(rows).toHaveCount(0)
  await select('checkbox', 'Numéro renseigné'); await expect(rows).toHaveCount(1)
  await select('radio', 'Archivés'); await expect(rows).toHaveCount(1); await expect(rows).toContainText('Commande archivée'); await panel.getByRole('button', { name: 'Réinitialiser', exact: true }).click(); await expect(rows).toHaveCount(3); expect(new URL(page.url()).searchParams.get('q')).toBe('Filtres')
  await select('radio', 'Société'); await panel.getByRole('button', { name: 'Terminé', exact: true }).click(); const listUrl = page.url(); await page.reload(); await expect(rows).toHaveCount(3)
  await page.getByRole('link', { name: /^Ouvrir le devis/ }).first().click(); await page.locator('.page-breadcrumb-row').getByRole('link', { name: 'Devis', exact: true }).click(); await expect(page).toHaveURL(listUrl)
  await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click(); await open(); await page.screenshot({ path: '/private/tmp/horizon-sales-filters-dark.png' }); await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: '/private/tmp/horizon-sales-filters-mobile.png' }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await panel.getByRole('button', { name: 'Terminé', exact: true }).click(); await page.setViewportSize({ width: 1600, height: 1000 }); await page.goto('/crm?view=list'); await open(); await expect(panel.getByRole('radio', { name: 'Directes', exact: true })).toBeVisible(); await expect(panel.getByRole('checkbox')).toHaveCount(0); await select('radio', 'Directes'); await select('radio', 'Gagnées'); await select('radio', 'Archivées'); await expect.poll(() => new URL(page.url()).searchParams.get('type')).toBe('direct'); expect(new URL(page.url()).searchParams.get('status')).toBe('won'); expect(new URL(page.url()).searchParams.get('state')).toBe('archived')
})

import { expect, test } from '@playwright/test'

test('Ajout produit : textes contenus et en-tête fixe en clair, sombre et mobile', async ({ page, request }) => {
  test.setTimeout(60000)
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
  const choices = await api('horizon/inventory/choices')
  const brand = await api('horizon/inventory/brands/create', { name: 'Marque au nom très long pour vérifier les limites de la colonne' })
  const supplier = await api('collections/contacts_companies/records', { name: 'Fournisseur au nom très long pour vérifier les limites de la colonne', active: true })
  await api('collections/contacts_company_roles/records', { company: supplier.id, role: 'supplier', active: true })
  for (let index = 0; index < 18; index++) {
    await api('horizon/inventory/products/save', { creation_key: crypto.randomUUID(), input: {
      sku: `PICKER-OVERFLOW-${index}-REFERENCE-PRODUIT-TRES-LONGUE`, name: `Serveur NAS rackable 12 baies - 8 Go de RAM DDR4 ECC - AMD Ryzen V1780B ${index} ${'Description longue '.repeat(5)}`, description: 'Description complémentaire très longue avec caractéristiques techniques détaillées '.repeat(4), category: choices.categories[0].id, kind: 'equipment', base_unit: choices.units.find((item: { code: string }) => item.code === 'u').id, brand: brand.id,
      sale_enabled: true, purchase_enabled: true, stock_policy: 'stocked', replenishment_policy: 'manual', tracking: 'none', manufacturer_ref: '', barcode: '', variant_group: '', reference_cost: 457.50, sale_currency: 'EUR', offers: [{ supplier: supplier.id, supplier_sku: 'REFERENCE-FOURNISSEUR', list_price: 457.50, discount: 0, purchase_quantity: 1, currency: 'EUR', lead_time_days: 0, valid_from: '', valid_until: '', is_preferred: true }],
    } })
  }
  await page.goto('/inventory/operations/new?kind=IN')
  await page.getByRole('button', { name: 'Choisir le produit ligne 1', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Ajouter un produit', exact: true })
  await dialog.getByRole('searchbox', { name: 'Rechercher un produit', exact: true }).fill('PICKER-OVERFLOW')
  await expect(dialog.locator('tbody tr')).toHaveCount(18)
  const viewport = dialog.locator('[data-table-viewport]')
  const header = dialog.getByRole('columnheader', { name: /^Description/ })
  const verify = async () => {
    await viewport.evaluate((element) => { element.scrollTop = 0 })
    for (const selector of ['.quote-product-brand .quote-product-text', 'td:nth-child(2) .quote-product-text', '.quote-product-description strong', '.quote-product-description span', 'td:nth-child(4) .quote-product-text']) {
      const text = dialog.locator(selector).first()
      await expect(text).toHaveCSS('text-overflow', 'ellipsis')
      expect(await text.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
      expect(await text.evaluate((element) => element.getBoundingClientRect().right <= element.closest('td')!.getBoundingClientRect().right)).toBe(true)
      await expect(text).toHaveAttribute('title', /.+/)
    }
    const before = (await header.boundingBox())!.y
    await viewport.evaluate((element) => { element.scrollTop = 180 })
    await expect.poll(async () => Math.abs((await header.boundingBox())!.y - before)).toBeLessThan(2)
    expect(await viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(100)
    await expect(header).toBeVisible()
  }
  await verify()
  await dialog.screenshot({ path: '/private/tmp/horizon-product-picker-ellipsis-light.png', animations: 'disabled' })
  await dialog.getByRole('button', { name: 'Fermer', exact: true }).click()
  await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click()
  await page.getByRole('button', { name: 'Choisir le produit ligne 1', exact: true }).click()
  await dialog.getByRole('searchbox', { name: 'Rechercher un produit', exact: true }).fill('PICKER-OVERFLOW')
  await expect(dialog.locator('tbody tr')).toHaveCount(18)
  await verify()
  await dialog.screenshot({ path: '/private/tmp/horizon-product-picker-ellipsis-dark.png', animations: 'disabled' })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await verify()
  await dialog.screenshot({ path: '/private/tmp/horizon-product-picker-ellipsis-mobile.png', animations: 'disabled' })
  await viewport.evaluate((element) => { element.scrollTop = 0; element.scrollLeft = element.scrollWidth })
  await dialog.getByRole('button', { name: /^Ajouter Serveur NAS rackable/ }).first().click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByLabel('Quantité ligne 1', { exact: true })).toHaveValue('1')
})

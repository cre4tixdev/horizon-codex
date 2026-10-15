import { writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'

test('Tri des colonnes : URL, pagination, filtres et listes principales', async ({ page, request }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid')
  await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!')
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await expect(page).toHaveURL('/')
  const token = await page.evaluate(() => sessionStorage.getItem('horizon.auth.token') || '')
  const api = async (path: string, data?: object) => {
    const response = await request.fetch(`http://127.0.0.1:18090/api/${path}`, { method: data ? 'POST' : 'GET', headers: { Authorization: token }, ...(data ? { data } : {}) })
    expect(response.status(), await response.text()).toBe(200); return response.json()
  }
  const employee = await api('horizon/hr/employees/save', { input: { first_name: 'Tri', last_name: 'Employé', professional_email: '', professional_phone: '', job_title: 'Test', employment_type: 'employee', team: '', manager: '', is_manager: false, is_direction: false, external_company: '', start_date: '', end_date: '', status: 'active' } })
  const session = await api('collections/core_users/auth-refresh', {})
  await api('horizon/access/users/save', { id: session.record.id, updated: session.record.updated, input: { name: session.record.name, email: session.record.email, active: true, erp_profile: 'admin', employee: employee.id, grants: {}, password: '' } })
  await api('horizon/expenses/reports', { month: '2026-10', notes: '', validator: '', creation_key: crypto.randomUUID() })
  const company = await api('collections/contacts_companies/records', { name: 'Tri société', active: true })
  const logo = await request.patch(`http://127.0.0.1:18090/api/collections/contacts_companies/records/${company.id}`, { headers: { Authorization: token }, multipart: { logo: { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') } } })
  expect(logo.status(), await logo.text()).toBe(200)
  await api('collections/contacts_people/records', { company: company.id, first_name: 'Alice', last_name: 'Tri', job_title: 'Achats', active: true })
  const stages = await api('collections/crm_stages/records')
  await api('horizon/crm/save', { creation_key: crypto.randomUUID(), input: { title: 'Tri opportunité', company: company.id, contact: '', owner: session.record.id, stage: stages.items[0].id, type: 'direct', estimated_value: 100, estimated_cost: 0, currency: 'EUR', probability: 0, expected_date: '', description: '', status: 'open', market_types: [] } })
  const tenderStages = await api('collections/crm_tender_statuses/records')
  await api('horizon/crm/tenders/save', { creation_key: crypto.randomUUID(), input: { title: 'Tri AO', company: company.id, contact: '', owner: session.record.id, type: 'tender', stage: '', market_types: [], estimated_value: 100, estimated_cost: 0, currency: 'EUR', probability: 0, expected_date: '', description: '', status: 'open' }, tender: { reference: 'TRI-AO', consultation_url: '', status: tenderStages.items.find((item: { code: string }) => item.code === 'todo').id, publication_date: '', submission_deadline: '', timezone: 'Europe/Paris', expected_result_date: '', visit_required: false, tags: [] } })
  const choices = await api('horizon/inventory/choices')
  for (let index = 0; index < 27; index++) await api('horizon/inventory/products/save', { creation_key: crypto.randomUUID(), input: {
    sku: `SORT-${String(index).padStart(2, '0')}`, name: `Tri produit ${String(26-index).padStart(2,'0')}`, description: '', category: choices.categories[0].id, base_unit: choices.units[0].id, kind: 'equipment', sale_enabled: true, purchase_enabled: true, stock_policy: 'stocked', replenishment_policy: 'manual', tracking: 'none', manufacturer: 'Tri', manufacturer_ref: '', barcode: '', variant_group: '', reference_cost: index, sale_currency: 'EUR', offers: [],
  } })
  await page.goto('/inventory?q=SORT&page=2')
  await expect(page.locator('.h-data-table tbody tr')).toHaveCount(2)
  const cost = page.getByRole('columnheader', { name: /^Coût \/ u\./ })
  await cost.getByRole('button').click()
  await expect(page).toHaveURL(/sort=unit_cost/)
  expect(new URL(page.url()).searchParams.get('page')).toBeNull()
  await expect(cost).toHaveAttribute('aria-sort', 'ascending')
  await expect(page.locator('.h-data-table tbody tr').first()).toContainText('SORT-00')
  await cost.getByRole('button').click()
  await expect(cost).toHaveAttribute('aria-sort', 'descending')
  await expect(page.locator('.h-data-table tbody tr').first()).toContainText('SORT-26')
  await page.reload(); await expect(cost).toHaveAttribute('aria-sort', 'descending')
  await page.getByRole('button', { name: /Filtres de recherche/ }).click()
  const filters = page.getByRole('dialog', { name: 'Filtres de recherche', exact: true })
  await expect(filters.getByRole('combobox', { name: 'Trier par', exact: true })).toContainText('Coût : décroissant')
  await filters.getByRole('button', { name: 'Terminé', exact: true }).click()
  await page.screenshot({ path: '/private/tmp/horizon-complete-sort-products.png' })
  for (const [path, label, field, encoding] of [
    ['/contacts?view=list', 'Relations', 'roles', 'colon'],
    ['/contacts/people?view=list', 'Fonction', 'job_title', 'colon'],
    ['/crm?view=list', 'Société', 'company', 'prefix'],
    ['/crm?area=ao&view=list', 'Visites', 'visits', 'prefix'],
    ['/sales', 'Société', 'company_name', 'prefix'],
    ['/purchasing/orders', 'Fournisseur', 'supplier_name', 'prefix'],
    ['/purchasing/requests', 'État', 'status', 'prefix'],
    ['/billing/customer', 'État', 'status', 'prefix'],
    ['/billing/supplier', 'Solde', 'balance', 'prefix'],
    ['/billing/payments', 'Direction', 'direction', 'prefix'],
    ['/expenses', 'Manager', 'validator', 'prefix'],
    ['/hr?view=list', 'Responsable', 'manager', 'colon'],
    ['/hr?tab=teams', 'Membres visibles', 'members', 'colon'],
    ['/settings/users', 'Profil ERP', 'profile', 'colon'],
    ['/inventory/operations?view=list', 'Vers', 'to_name', 'prefix'],
    ['/inventory/operations?view=list&kind=IN', 'De', 'from_name', 'prefix'],
    ['/inventory/stock', 'Disponible', 'available', 'prefix'],
    ['/inventory/assets', 'Affectation', 'assigned_name', 'prefix'],
  ]) {
    await page.goto(path!)
    const header = page.getByRole('columnheader').filter({ has: page.getByRole('button', { name: label!, exact: true }) })
    await expect(header.getByRole('button', { name: label!, exact: true })).toBeVisible()
    for (const table of await page.locator('.h-data-table').all()) {
      await expect(table).toHaveCSS('border-top-width', '1px')
      await expect(table).toHaveCSS('border-radius', '6px')
      await expect(table.locator('..')).toHaveCSS('border-top-width', '0px')
      const inset = await table.evaluate((element) => element.querySelector('th')!.getBoundingClientRect().x - element.getBoundingClientRect().x)
      expect(inset).toBeCloseTo(1, 1)
    }

    for (const cell of await page.getByRole('columnheader').all()) {
      if ((await cell.innerText()).trim() === 'Actions') { await expect(cell.locator('.h-table-sort-button')).toHaveCount(0); continue }
      const button = cell.locator('.h-table-sort-button')
      await expect(button).toHaveCount(1)
      const cellBox = await cell.boundingBox(), iconBox = await button.locator('svg').last().boundingBox()
      expect(cellBox!.x + cellBox!.width - iconBox!.x - iconBox!.width).toBeLessThanOrEqual(16)
    }
    const descending = await header.getAttribute('aria-sort') === 'ascending'
    await header.getByRole('button', { name: label!, exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe(encoding === 'colon' ? `${field}:${descending ? 'desc' : 'asc'}` : `${descending ? '-' : ''}${field}`)
    await expect(header).toHaveAttribute('aria-sort', descending ? 'descending' : 'ascending')
    if (path!.startsWith('/contacts')) {
      const name = path!.startsWith('/contacts/people') ? 'people' : 'company'
      await expect(page.locator('.h-data-table')).toHaveCSS('border-collapse', 'separate')
      if (name === 'people') {
        const corner = await page.locator('.h-data-table').evaluate((table) => {
          const cell = table.querySelector('th')!, viewport = table.parentElement!
          const box = table.getBoundingClientRect(), head = cell.getBoundingClientRect()
          return { frame: getComputedStyle(table).borderTopWidth, outer: getComputedStyle(viewport).borderTopWidth, insetX: head.x - box.x, insetY: head.y - box.y }
        })
        expect(corner).toEqual({ frame: '1px', outer: '0px', insetX: 1, insetY: 1 })
        const magnify = await page.context().newCDPSession(page)
        const box = (await page.locator('.h-data-table').boundingBox())!
        const capture = await magnify.send('Page.captureScreenshot', { format: 'png', clip: { x: box.x - 2, y: box.y - 2, width: 64, height: 52, scale: 4 } })
        await writeFile('/private/tmp/horizon-contact-corner-4x.png', Buffer.from(capture.data, 'base64'))
        await magnify.detach()
      }
      if (name === 'people') await expect(page.locator('.contact-company-badge')).toHaveCSS('border-color', 'rgb(255, 255, 255)')
      await page.screenshot({ path: `/private/tmp/horizon-contact-${name}-table-light.png`, fullPage: true })
      await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click()
      if (name === 'people') await expect(page.locator('.contact-company-badge')).toHaveCSS('border-color', 'rgb(255, 255, 255)')
      await page.screenshot({ path: `/private/tmp/horizon-contact-${name}-table-dark.png`, fullPage: true })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.screenshot({ path: `/private/tmp/horizon-contact-${name}-table-mobile.png`, fullPage: true })
      await page.setViewportSize({ width: 1600, height: 1000 })
      await page.getByRole('button', { name: 'Passer en mode clair', exact: true }).click()
    }
  }

  await page.goto('/settings/facturation')
  await page.getByRole('tab', { name: 'TVA', exact: true }).click()
  const reference = page.locator('.reference-table').first()
  await expect(reference).toBeVisible()
  await expect(reference).toHaveCSS('border-top-width', '1px')
  await expect(reference).toHaveCSS('border-radius', '6px')
  await expect(reference).toHaveCSS('border-collapse', 'separate')
  await expect(reference.locator('..')).toHaveCSS('border-top-width', '0px')
  await page.screenshot({ path: '/private/tmp/horizon-tables-settings-frame.png', fullPage: true })
  await page.goto('/inventory?q=SORT&sort=-unit_cost')
  await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('columnheader', { name: /^Qté disponible/ }).scrollIntoViewIfNeeded()
  await page.getByRole('columnheader', { name: /^Qté disponible/ }).getByRole('button').click()
  await expect(page).toHaveURL(/sort=available_quantity/)
  await expect(page.getByRole('columnheader', { name: /^Qté disponible/ })).toHaveAttribute('aria-sort', 'ascending')
  await page.getByRole('columnheader', { name: /^Qté disponible/ }).scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: '/private/tmp/horizon-complete-sort-mobile-dark.png', fullPage: true })
})

"""Catalogue: permissions, supplier history, packaging, family pricing and quote snapshots."""
import unittest
import json
import base64
import shutil
import subprocess
from pathlib import Path
from check_auth import LocalPocketBase, ROOT
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import check_sales

class CatalogTests(unittest.TestCase):
    def setUp(self):
        check_sales.SalesTests.setUp(self)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['inventory.read', 'inventory.write', 'sales.read', 'sales.write', 'crm.read', 'crm.write', 'contacts.read']}, self.pb.admin_token)
        self.categories = self.pb.request('GET', 'horizon/inventory/categories', token=self.token)[1]['items']
        self.units = self.pb.request('GET', 'collections/inventory_units/records', token=self.token)[1]['items']
        self.supplier = self.pb.create('contacts_companies', {'name': 'Fournisseur principal', 'active': True})
        self.pb.create('contacts_company_roles', {'company': self.supplier['id'], 'role': 'supplier', 'active': True})
        self.offer = {'supplier': self.supplier['id'], 'supplier_sku': 'REEL1000', 'currency': 'EUR', 'list_price': 1000, 'discount': 20, 'purchase_quantity': 1000, 'lead_time_days': 7, 'is_preferred': True, 'valid_from': '', 'valid_until': ''}
        self.product = {'sku': 'CABLE001', 'name': 'Câble vidéo', 'description': 'Câble au mètre', 'category': next(item['id'] for item in self.categories if item['code'] == 'supplies'), 'base_unit': next(item['id'] for item in self.units if item['code'] == 'm'), 'kind': 'consumable', 'sale_enabled': True, 'purchase_enabled': True, 'stock_policy': 'stocked', 'replenishment_policy': 'manual', 'tracking': 'none', 'manufacturer': 'BELDEN', 'manufacturer_ref': '1855A', 'barcode': '', 'variant_group': '', 'reference_cost': 0, 'sale_currency': 'EUR', 'offers': [self.offer]}

    def create_product(self, key='catalog-creation-key-00001', **changes):
        return self.pb.request('POST', 'horizon/inventory/products/save', {'creation_key': key, 'input': {**self.product, **changes}}, self.token)

    quote_save = check_sales.SalesTests.quote_save

    def test_quote_search_description_words_and_sale_filter(self):
        status, sale = self.create_product(description='Connecteur vidéo coaxial 12G')
        self.assertEqual(status, 200, sale)
        status, internal = self.create_product(key='internal-only-product-key', sku='INTERNAL-12G', sale_enabled=False, description='Connecteur vidéo coaxial 12G')
        self.assertEqual(status, 200, internal)
        status, results = self.pb.request('GET', 'horizon/inventory/products?q=BELDEN%20coaxial&sale_enabled=true', token=self.token)
        self.assertEqual(status, 200, results)
        self.assertEqual([item['id'] for item in results['items']], [sale['id']])
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/products?q=coaxial', token=self.token)[1]['totalItems'], 2)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/products?sale_enabled=bad', token=self.token)[0], 400)

    def test_catalog_prices_history_search_and_snapshots(self):
        status, product = self.create_product()
        self.assertEqual(status, 200, product)
        self.assertNotIn('creation_key', product)
        self.assertEqual(product['pricing']['unit_cost'], .8)
        self.assertEqual(product['pricing']['unit_price'], 1.08)
        self.assertAlmostEqual(product['pricing']['margin_rate'], 25.925926)
        self.assertEqual(product['offers'][0]['purchase_price'], 800)
        status, reference = self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'offer': 'reference', 'currency': 'EUR'}, self.token)
        self.assertEqual(status, 200, reference)
        self.assertEqual(reference['reference'], 'CABLE001')
        self.assertEqual(reference['product_supplier'], '')
        self.assertEqual(reference['unit_cost'], 0)
        self.assertEqual(len(product['price_history']), 1)
        self.assertIsNone(product['last_purchase'])
        self.assertEqual(self.create_product()[1]['id'], product['id'])
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/products?q=video', token=self.token)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/products?q=BELDEN', token=self.token)[1]['items'][0]['id'], product['id'])
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/choices', token=self.token)[1]['suppliers'][0]['id'], self.supplier['id'])
        status, line = self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'offer': '', 'currency': 'EUR'}, self.token)
        self.assertEqual(status, 200, line)
        status, quote = self.quote_save(lines=[{**line, 'quantity': 500}])
        self.assertEqual(status, 200, quote)
        self.assertEqual(quote['subtotal'], 540)
        self.assertEqual(quote['cost_total'], 400)
        self.assertEqual(quote['lines'][0]['product'], product['id'])
        snapshot = quote['lines'][0]['catalog_snapshot']
        offers = [{**self.offer, 'id': product['offers'][0]['id'], 'list_price': 1200}]
        status, changed = self.pb.request('POST', 'horizon/inventory/products/save', {'id': product['id'], 'updated': product['updated'], 'input': {**self.product, 'offers': offers}}, self.token)
        self.assertEqual(status, 200, changed)
        self.assertEqual(len(changed['price_history']), 2)
        status, quote = self.pb.request('POST', 'horizon/sales/quotes/save', {'id': quote['id'], 'updated': quote['updated'], 'input': {**self.quote, 'lines': [{**line, 'quantity': 500}]}}, self.token)
        self.assertEqual(status, 200, quote)
        self.assertEqual(quote['subtotal'], 540)
        self.assertEqual(quote['lines'][0]['catalog_snapshot'], snapshot)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/products/save', {'id': product['id'], 'updated': product['updated'], 'input': self.product}, self.token)[0], 409)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/products/save', {'id': changed['id'], 'updated': changed['updated'], 'input': {**self.product, 'offers': []}}, self.token)[0], 200)
        history = self.pb.request('GET', 'horizon/inventory/products/' + product['id'], token=self.token)[1]
        self.assertEqual(len(history['price_history']), 2)
        self.assertEqual(history['offers'], [])

    def test_product_quote_history_analytics_options_and_permissions(self):
        product = self.create_product()[1]
        line = self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'offer': '', 'currency': 'EUR'}, self.token)[1]
        status, quote = self.quote_save(lines=[{**line, 'quantity': 5}, {**line, 'quantity': 2}, {**line, 'quantity': 3, 'is_option': True}])
        self.assertEqual(status, 200, quote)
        path = 'horizon/inventory/products/' + product['id'] + '/quotes'
        status, history = self.pb.request('GET', path, token=self.token)
        self.assertEqual(status, 200, history)
        self.assertEqual(history['totalItems'], 1)
        item = history['items'][0]
        self.assertEqual(item['quote_number'], quote['quote_number'])
        self.assertEqual(item['analytic_code'], self.opp['opportunity_number'])
        self.assertEqual(item['opportunity'], self.opp['id'])
        self.assertEqual(item['quantity'], 7)
        self.assertEqual(item['option_quantity'], 3)
        self.assertEqual(item['subtotal'], 7.56)
        status, cancelled = self.pb.request('POST', 'horizon/sales/quotes/cancel', {'id': quote['id'], 'updated': quote['updated'], 'reason': 'Historique conservé'}, self.token)
        self.assertEqual(status, 200, cancelled)
        retained = self.pb.request('GET', path, token=self.token)[1]
        self.assertEqual(retained['totalItems'], 1)
        self.assertEqual(retained['items'][0]['status'], 'cancelled')
        self.assertEqual(self.pb.request('GET', path + '?page=0', token=self.token)[0], 400)
        self.assertEqual(self.pb.request('GET', path, token=self.contacts_token)[0], 403)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['inventory.read', 'sales.read']}, self.pb.admin_token)
        status, hidden = self.pb.request('GET', path, token=self.token)
        self.assertEqual(status, 200, hidden)
        self.assertEqual(hidden['items'][0]['analytic_code'], '')
        self.assertEqual(hidden['items'][0]['opportunity'], '')
        self.assertEqual(hidden['items'][0]['company_name'], '')
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['inventory.read']}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', path, token=self.token)[0], 403)

    def test_brand_required_on_save(self):
        status, result = self.create_product(brand='', manufacturer='')
        self.assertEqual(status, 400, result)

    def test_brands_manual_cost_and_logistics(self):
        status, brand = self.pb.request('POST', 'horizon/inventory/brands/create', {'name': '  Neutrik  '}, self.token)
        self.assertEqual(status, 200, brand)
        self.assertNotIn('name_key', brand)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/brands/create', {'name': 'NEUTRIK'}, self.token)[1]['id'], brand['id'])
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/brands/create', {'name': 'Hidden'}, self.contacts_token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/brands/create', {'name': ''}, self.token)[0], 400)
        status, product = self.create_product(brand=brand['id'], cost_override=True, reference_cost=1.5, weight_kg=12.5, volume_m3=.08, hs_code='854442', origin_country='FR')
        self.assertEqual(status, 200, product)
        self.assertEqual(product['manufacturer'], 'Neutrik')
        self.assertEqual(product['weight_kg'], 12.5)
        self.assertEqual(product['origin_country'], 'FR')
        self.assertEqual(product['pricing']['unit_cost'], 1.5)
        self.assertEqual(product['pricing']['unit_price'], 2.025)
        self.assertEqual(product['pricing']['source'], 'reference')
        status, line = self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'currency': 'EUR'}, self.token)
        self.assertEqual(status, 200, line)
        self.assertEqual(line['unit_cost'], 1.5)
        self.assertEqual(line['brand'], 'Neutrik')
        self.assertEqual(product['offers'][0]['purchase_price'], 800)
        self.assertEqual(len(product['price_history']), 1)
        status, explicit = self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'offer': product['offers'][0]['id'], 'currency': 'EUR'}, self.token)
        self.assertEqual(status, 200, explicit)
        self.assertEqual(explicit['unit_cost'], .8)
        self.assertEqual(self.create_product(key='invalid-product-logistics1', sku='BADLOG1', weight_kg=-1)[0], 400)
        self.assertEqual(self.create_product(key='invalid-product-logistics2', sku='BADLOG2', hs_code='abc123')[0], 400)
        self.assertEqual(self.create_product(key='invalid-product-logistics3', sku='BADLOG3', origin_country='ZZ')[0], 400)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'viewer'}, self.pb.admin_token)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/brands/create', {'name': 'Forbidden'}, self.token)[0], 403)

    def test_manual_coefficient_and_automatic_restore(self):
        status, product = self.create_product(coefficient_override=True, manual_coefficient=1.5)
        self.assertEqual(status, 200, product)
        self.assertEqual(product['pricing']['coefficient'], 1.5)
        self.assertEqual(product['pricing']['unit_price'], 1.2)
        status, line = self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'currency': 'EUR'}, self.token)
        self.assertEqual(status, 200, line)
        self.assertEqual(line['unit_price'], 1.2)
        status, quote = self.quote_save(lines=[{**line, 'quantity': 500}])
        self.assertEqual(status, 200, quote)
        self.assertEqual(quote['lines'][0]['catalog_snapshot']['coefficient'], 1.5)
        saved_offers = [{**self.offer, 'id': product['offers'][0]['id']}]
        status, restored = self.pb.request('POST', 'horizon/inventory/products/save', {'id': product['id'], 'updated': product['updated'], 'input': {**self.product, 'coefficient_override': False, 'manual_coefficient': 1.5, 'offers': saved_offers}}, self.token)
        self.assertEqual(status, 200, restored)
        self.assertEqual(restored['pricing']['coefficient'], 1.35)
        self.assertEqual(restored['pricing']['unit_price'], 1.08)
        self.assertEqual(len(restored['price_history']), 1)
        self.assertEqual(self.create_product(key='bad-coefficient-product1', sku='BADCOEF1', coefficient_override=True, manual_coefficient=0)[0], 400)
        historical = self.pb.request('GET', 'horizon/sales/quotes/' + quote['id'], token=self.token)[1]
        self.assertEqual(historical['lines'][0]['catalog_snapshot']['coefficient'], 1.5)

    def test_permissions_validation_and_archive(self):
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/products', token=self.contacts_token)[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/categories', token=self.reader_token)[0], 403)
        self.assertEqual(self.create_product(offers=[self.offer, self.offer])[0], 400)
        self.assertEqual(self.create_product(offers=[{**self.offer, 'purchase_quantity': 0}])[0], 400)
        self.assertEqual(self.create_product(kind='service')[0], 400)
        self.assertEqual(self.create_product(offers=[{**self.offer, 'supplier': self.company['id']}])[0], 400)
        status, product = self.create_product()
        self.assertEqual(status, 200, product)
        self.assertEqual(self.pb.request('PATCH', 'collections/inventory_products/records/' + product['id'], {'reference_cost': 99}, self.token)[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/quote-line', token=self.token)[0], 404)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'currency': 'USD'}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/categories/save', {**self.categories[0], 'coefficient': 2}, self.token)[0], 403)
        status, archived = self.pb.request('POST', 'horizon/inventory/products/state', {'id': product['id'], 'updated': product['updated'], 'active': False}, self.token)
        self.assertEqual(status, 200, archived)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/products?state=archived', token=self.token)[1]['totalItems'], 1)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'currency': 'EUR'}, self.token)[0], 400)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'viewer'}, self.pb.admin_token)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/products/state', {'id': product['id'], 'updated': archived['updated'], 'active': True}, self.token)[0], 403)

    def test_fractional_unit_costs_and_price_validity(self):
        status, product = self.create_product(offers=[{**self.offer, 'list_price': 4, 'discount': 0, 'purchase_quantity': 1000}])
        self.assertEqual(status, 200, product)
        status, line = self.pb.request('POST', 'horizon/inventory/quote-line', {'product': product['id'], 'currency': 'EUR'}, self.token)
        self.assertEqual(status, 200, line)
        self.assertEqual(line['unit_cost'], .004)
        self.assertEqual(line['unit_price'], .0054)
        status, quote = self.quote_save(lines=[{**line, 'quantity': 500}])
        self.assertEqual(status, 200, quote)
        self.assertEqual(quote['subtotal'], 2.7)
        self.assertEqual(quote['cost_total'], 2)
        status, expired = self.create_product(key='expired-catalog-product-1', sku='EXPIRED001', offers=[{**self.offer, 'valid_until': '2020-01-01'}])
        self.assertEqual(status, 200, expired)
        self.assertIsNone(expired['pricing']['unit_price'])
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/quote-line', {'product': expired['id'], 'currency': 'EUR'}, self.token)[0], 400)


    def test_favorites_family_settings_and_product_feed(self):
        _, product = self.create_product(offers=[self.offer, {**self.offer, 'supplier_sku': 'ALTERNATIVE', 'list_price': 500, 'is_preferred': False}])
        saved_offers = [{**self.offer, 'id': product['offers'][0]['id'], 'is_preferred': False}, {**self.offer, 'supplier_sku': 'ALTERNATIVE', 'list_price': 500, 'id': product['offers'][1]['id'], 'is_preferred': True}]
        status, saved = self.pb.request('POST', 'horizon/inventory/products/save', {'id': product['id'], 'updated': product['updated'], 'input': {**self.product, 'offers': saved_offers}}, self.token)
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['pricing']['unit_cost'], .4)
        self.assertEqual(len(saved['price_history']), 2)
        source = {'source_module': 'inventory', 'source_entity': 'inventory_products', 'source_record_id': product['id']}
        status, note = self.pb.request('POST', 'collections/core_activity_events/records', {**source, 'type': 'note', 'body': 'Documentation produit', 'mentions': [], 'metadata': {}}, self.token)
        self.assertEqual(status, 200, note)
        self.assertEqual(self.pb.request('GET', 'collections/core_activity_events/records/' + note['id'], token=self.contacts_token)[0], 404)
        self.assertEqual(self.pb.request('POST', 'collections/core_activity_events/records', {**source, 'type': 'note', 'body': 'Forbidden'}, self.contacts_token)[0], 400)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'admin'}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['inventory.read', 'inventory.write', 'settings.references', 'sales.read', 'sales.write', 'crm.read', 'crm.write']}, self.pb.admin_token)
        family = next(item for item in self.categories if item['id'] == self.product['category'])
        body = {key: family[key] for key in ['id', 'updated', 'code', 'label', 'active']}
        status, changed = self.pb.request('POST', 'horizon/inventory/categories/save', {**body, 'coefficient': 1.5}, self.token)
        self.assertEqual(status, 200, changed)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/products/' + product['id'], token=self.token)[1]['pricing']['unit_price'], .6)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/categories/save', {**body, 'coefficient': 2}, self.token)[0], 409)

    def test_photo_access_is_protected(self):
        boundary = 'horizon-catalog-photo-boundary'
        data = { 'creation_key': 'catalog-photo-creation-001', 'input': json.dumps(self.product) }
        parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode() for key, value in data.items()]
        png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlVgAAAAASUVORK5CYII=')
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="primary_image"; filename="image.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + png + b'\r\n')
        parts.append(f'--{boundary}--\r\n'.encode())
        request = Request(self.pb.url + '/api/horizon/inventory/products/save', data=b''.join(parts), headers={'Authorization': self.token, 'Content-Type': f'multipart/form-data; boundary={boundary}'}, method='POST')
        with urlopen(request) as response: product = json.loads(response.read())
        path = f'{self.pb.url}/api/files/{product["collectionId"]}/{product["id"]}/{product["primary_image"]}'
        token = self.pb.request('POST', 'files/token', token=self.token)[1]['token']
        with urlopen(path + '?token=' + token) as response: self.assertEqual(response.read(), png)
        forbidden_token = self.pb.request('POST', 'files/token', token=self.contacts_token)[1]['token']
        for suffix in ['', '?token=' + forbidden_token]:
            with self.assertRaises(HTTPError) as error: urlopen(path + suffix)
            self.assertIn(error.exception.code, [403, 404])


class CatalogMigrationTests(unittest.TestCase):
    def test_upgrade_backfills_brands_without_changing_supplier_prices(self):
        pb = LocalPocketBase(); self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'before_brands'; previous.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791504013': shutil.copy(path, previous)
        original = pb.args[:]
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        role = pb.create('core_roles', {'name': 'brand_upgrade_admin', 'label': 'Catalogue', 'active': True, 'permissions': ['inventory.read', 'inventory.write']})
        user = pb.create_user('brands-upgrade@local.invalid', role['id'], 'admin')
        category = pb.request('GET', 'collections/inventory_product_categories/records', token=pb.admin_token)[1]['items'][0]
        unit = pb.request('GET', 'collections/inventory_units/records', token=pb.admin_token)[1]['items'][0]
        products = []
        for index, name in enumerate(['Neutrik', '  NEUTRIK  ']):
            products.append(pb.create('inventory_products', {'sku': 'MIGRATE' + str(index), 'name': 'Connecteur', 'category': category['id'], 'base_unit': unit['id'], 'sale_unit': unit['id'], 'kind': 'equipment', 'composition_mode': 'none', 'stock_policy': 'stocked', 'replenishment_policy': 'manual', 'tracking': 'none', 'manufacturer': name, 'reference_cost': 3, 'sale_currency': 'EUR', 'sale_enabled': True, 'purchase_enabled': True, 'active': True, 'created_by': user['id'], 'creation_key': 'migration-brands-key' + str(index)}))
        supplier = pb.create('contacts_companies', {'name': 'Fournisseur migration', 'active': True})
        pb.create('contacts_company_roles', {'company': supplier['id'], 'role': 'supplier', 'active': True})
        offer = pb.create('inventory_product_suppliers', {'product': products[0]['id'], 'supplier': supplier['id'], 'list_price': 10, 'purchase_price': 10, 'purchase_quantity': 1, 'currency': 'EUR', 'is_preferred': True, 'active': True})
        pb.process.terminate(); pb.process.wait(timeout=10)
        result = subprocess.run(original + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        pb.args = original; pb.launch_and_authenticate(original)
        token = pb.login('brands-upgrade@local.invalid')[1]['token']
        values = [pb.request('GET', 'horizon/inventory/products/' + item['id'], token=token)[1] for item in products]
        self.assertEqual(values[0]['brand'], values[1]['brand'])
        self.assertEqual(values[0]['manufacturer'], 'Neutrik')
        self.assertFalse(values[0]['cost_override'])
        self.assertEqual(values[0]['pricing']['unit_cost'], 10)
        self.assertEqual(pb.request('GET', 'collections/inventory_product_suppliers/records/' + offer['id'], token=pb.admin_token)[1]['purchase_price'], 10)

    def test_upgrade_grants_admin_without_expanding_a_shared_business_role(self):
        pb = LocalPocketBase(); self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'before_catalog'; previous.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791504012': shutil.copy(path, previous)
        original = pb.args[:]
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        role = pb.create('core_roles', {'name': 'historical_shared_catalog', 'label': 'Rôle partagé', 'active': True, 'permissions': ['contacts.read', 'settings.references']})
        admin = pb.create_user('catalog-admin@local.invalid', role['id'], 'admin')
        reader = pb.create_user('catalog-business@local.invalid', role['id'], 'user')
        pb.process.terminate(); pb.process.wait(timeout=10)
        result = subprocess.run(original + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        pb.args = original; pb.launch_and_authenticate(original)
        current_admin = pb.request('GET', 'collections/core_users/records/' + admin['id'], token=pb.admin_token)[1]
        current_reader = pb.request('GET', 'collections/core_users/records/' + reader['id'], token=pb.admin_token)[1]
        self.assertNotEqual(current_admin['role'], role['id'])
        self.assertEqual(current_reader['role'], role['id'])
        self.assertEqual(pb.request('GET', 'horizon/inventory/products', token=pb.login('catalog-admin@local.invalid')[1]['token'])[0], 200)
        self.assertEqual(pb.request('GET', 'horizon/inventory/products', token=pb.login('catalog-business@local.invalid')[1]['token'])[0], 403)

if __name__ == '__main__': unittest.main(verbosity=2)

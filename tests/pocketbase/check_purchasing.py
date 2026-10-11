"""Purchasing and stock: transactional quantities, source ownership and analytic allocations."""
import unittest
import copy
import uuid
import subprocess
import sqlite3
from concurrent.futures import ThreadPoolExecutor
import check_catalog

class PurchasingTests(unittest.TestCase):
    def setUp(self):
        check_catalog.CatalogTests.setUp(self)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['inventory.read', 'inventory.write', 'inventory.stock.reserve', 'inventory.stock.adjust', 'purchasing.read', 'purchasing.write', 'purchasing.request.validate', 'purchasing.order.validate', 'sales.read', 'sales.write', 'sales.quote.validate', 'sales.order.confirm', 'crm.read', 'crm.write', 'contacts.read']}, self.pb.admin_token)
        status, self.item = check_catalog.CatalogTests.create_product(self)
        self.assertEqual(status, 200, self.item)
        status, choices = self.pb.request('GET', 'horizon/inventory/stock/choices', token=self.token)
        self.assertEqual(status, 200, choices)
        self.location = choices['locations'][0]['id']
        self.input = dict(title='Besoin câble', opportunity=self.opp['id'], source_order='', supplier='', document_date='2026-10-10', needed_date='2026-10-17', currency='EUR', exchange_rate=1, tax_rate=20, notes='', lines=[dict(product=self.item['id'], description='Câble vidéo', reference='CABLE001', brand='BELDEN', quantity=6, unit='m', unit_price=0.8, discount=0, supplier=self.supplier['id'], source_line='', request_line='', allocations=[])])

    def tearDown(self):
        self.pb.close()

    def save_request(self, input=None, **body):
        return self.pb.request('POST', 'horizon/purchasing/requests/save', dict(input=input or self.input, creation_key=str(uuid.uuid4()), **body), self.token)

    def transition(self, kind, doc, action='validate'):
        return self.pb.request('POST', f'horizon/purchasing/{kind}/transition', dict(id=doc['id'], updated=doc['updated'], action=action), self.token)

    def order(self, request):
        return self.pb.request('GET', 'horizon/purchasing/orders?request=' + request['id'], token=self.token)

    def adjust(self, quantity=4, expected=0, key=None):
        return self.pb.request('POST', 'horizon/inventory/stock/adjust', dict(product=self.item['id'], location=self.location, physical=quantity, expected=expected, reason='Inventaire initial', operation_key=key or str(uuid.uuid4())), self.token)

    def make_quote(self):
        status, quote = check_catalog.CatalogTests.quote_save(self, lines=[dict(product=self.item['id'], description='Câble', quantity=10, unit='m', unit_price=1.08, unit_cost=0.8), dict(description='Option', quantity=1, unit='u', unit_price=100, is_option=True)])
        self.assertEqual(status, 200, quote)
        status, quote = self.pb.request('POST', 'horizon/sales/quotes/finalize', dict(id=quote['id'], updated=quote['updated']), self.token)
        self.assertEqual(status, 200, quote)
        return quote

    def test_list_summaries_ignore_status_and_page_but_keep_context(self):
        status, draft = self.save_request()
        self.assertEqual(status, 200, draft)
        status, validated = self.save_request()
        self.assertEqual(status, 200, validated)
        status, validated = self.transition('requests', validated)
        self.assertEqual(status, 200, validated)
        context = 'q=Besoin&opportunity=' + self.opp['id']
        for status_filter in ['draft', 'validated', 'ordered']:
            status, result = self.pb.request('GET', 'horizon/purchasing/requests?' + context + '&status=' + status_filter + '&page=2', token=self.token)
            self.assertEqual(status, 200, result)
            self.assertEqual(result['summary'], {'draft': 1, 'validated': 1})
            self.assertEqual(result['items'], [])
        status, result = self.pb.request('GET', 'horizon/purchasing/orders?request=' + validated['id'] + '&status=sent', token=self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(result['summary'], {'draft': 1})
        self.assertEqual(result['totalItems'], 0)
        status, result = self.pb.request('GET', 'horizon/purchasing/requests?q=introuvable', token=self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(result['summary'], {})

    def test_purchase_summary_includes_records_beyond_first_page(self):
        for _ in range(31):
            status, result = self.save_request()
            self.assertEqual(status, 200, result)
        for page, expected_rows in [(1, 30), (2, 1)]:
            status, result = self.pb.request('GET', f'horizon/purchasing/requests?status=draft&page={page}', token=self.token)
            self.assertEqual(status, 200, result)
            self.assertEqual(result['summary'], {'draft': 31})
            self.assertEqual(result['totalItems'], 31)
            self.assertEqual(len(result['items']), expected_rows)

    def test_stock_summary_and_availability_filters(self):
        self.assertEqual(self.adjust(4.123456)[0], 200)
        quote = self.make_quote()
        status, confirmed = self.pb.request('POST', 'horizon/sales/quotes/confirm', dict(id=quote['id'], updated=quote['updated'], customer_order_number='', reservations=[dict(source_line=quote['lines'][0]['id'], location=self.location, quantity=2)]), self.token)
        self.assertEqual(status, 200, confirmed)
        context = 'product=' + self.item['id'] + '&location=' + self.location
        for availability in ['', 'physical', 'reserved', 'available']:
            status, result = self.pb.request('GET', 'horizon/inventory/stock?' + context + '&availability=' + availability, token=self.token)
            self.assertEqual(status, 200, result)
            self.assertEqual(result['summary'], dict(all=1, physical=1, reserved=1, available=1))
            self.assertEqual(result['totalItems'], 1)
            self.assertAlmostEqual(result['items'][0]['available'], 2.123456)
        status, result = self.pb.request('GET', 'horizon/inventory/stock?' + context + '&availability=physical&page=2', token=self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(result['summary']['physical'], 1)
        self.assertEqual(result['items'], [])
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/stock?availability=bad', token=self.token)[0], 400)
        status, catalogue = self.pb.request('GET', 'horizon/inventory/products?q=CABLE001', token=self.token)
        self.assertEqual(status, 200, catalogue)
        self.assertEqual(catalogue['items'][0]['id'], self.item['id'])
        self.assertAlmostEqual(catalogue['items'][0]['available_quantity'], 2.123456)
        status, service = check_catalog.CatalogTests.create_product(self, key='catalog-service-card', sku='SERVICE-CARD', stock_policy='none', kind='service')
        self.assertEqual(status, 200, service)
        status, catalogue = self.pb.request('GET', 'horizon/inventory/products?q=SERVICE-CARD', token=self.token)
        self.assertEqual(status, 200, catalogue)
        self.assertIsNone(catalogue['items'][0]['available_quantity'])


    def test_manual_requests_grouping_snapshot_and_filters(self):
        status, choices = self.pb.request('GET', 'horizon/purchasing/choices', token=self.token)
        self.assertEqual(status, 200, choices)
        self.assertIn(self.supplier['id'], [item['id'] for item in choices['suppliers']])
        status, req = self.save_request()
        self.assertEqual(status, 200, req)
        self.assertTrue(req['number'].startswith('DA-'))
        self.assertEqual(req['lines'][0]['allocations'][0]['code'], self.opp['opportunity_number'])
        status, req = self.transition('requests', req)
        self.assertEqual(status, 200, req)
        status, result = self.order(req)
        self.assertEqual(status, 200, result)
        order = result['items'][0]
        self.assertEqual(order['status'], 'draft')
        self.assertAlmostEqual(order['subtotal'], 4.8)
        self.assertAlmostEqual(order['total'], 5.76)
        status, retry = self.order(req)
        self.assertEqual(status, 200, retry)
        self.assertEqual(retry['items'][0]['id'], order['id'])
        self.assertEqual(self.transition('requests', req)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/purchasing/generate-orders', dict(creation_key=str(uuid.uuid4()), lines=[dict(id=req['lines'][0]['id'], quantity=6, supplier=self.supplier['id'])]), self.token)[0], 409)
        status, order = self.transition('orders', order)
        self.assertEqual(status, 200, order)
        self.assertEqual(order['document_snapshot']['lines'][0]['unit_price'], 0.8)
        for kind in ['requests', 'orders']:
            for query in ['product=' + self.item['id'], 'supplier=' + self.supplier['id'], 'opportunity=' + self.opp['id']]:
                status, page = self.pb.request('GET', 'horizon/purchasing/' + kind + '?' + query, token=self.token)
                self.assertEqual(status, 200, page)
                self.assertEqual(page['totalItems'], 1, page)
        self.assertEqual(self.transition('requests', req, 'cancel')[0], 400)  # active validated BC must be cancelled first
        status, req = self.pb.request('GET', 'horizon/purchasing/requests/' + req['id'], token=self.token)
        self.assertEqual(req['status'], 'validated')
        self.assertEqual(self.transition('requests', req, 'cancel')[0], 400)
        self.assertEqual(self.transition('orders', order, 'cancel')[0], 200)

    def test_order_manual_lines_and_request_reopen(self):
        status, req = self.save_request()
        self.assertEqual(status, 200, req)
        status, req = self.transition('requests', req)
        self.assertEqual(status, 200, req)
        status, page = self.order(req)
        self.assertEqual(status, 200, page)
        order = page['items'][0]
        fields = ['title', 'opportunity', 'source_order', 'supplier', 'owner', 'delivery_warehouse', 'document_date', 'needed_date', 'currency', 'exchange_rate', 'tax_rate', 'notes']
        line_fields = ['product', 'description', 'reference', 'brand', 'quantity', 'unit', 'unit_price', 'discount', 'supplier', 'source_line', 'request_line']
        source = {key: order['lines'][0].get(key, '') for key in line_fields}
        source['allocations'] = [dict(opportunity=self.opp['id'], quantity=6)]
        manual = dict(self.input['lines'][0], description='Complément direct', quantity=2, request_line='', allocations=[dict(opportunity=self.opp['id'], quantity=2)])
        input = {key: order.get(key, '') for key in fields}
        input['document_date'] = input['document_date'][:10]
        input['needed_date'] = input['needed_date'][:10]
        input['lines'] = [source, manual]
        def save(input, doc=None):
            doc = doc or order
            return self.pb.request('POST', 'horizon/purchasing/orders/save', dict(id=doc['id'], updated=doc['updated'], input=input), self.token)
        invalid = copy.deepcopy(input)
        invalid['lines'][1]['allocations'] = []
        status, incomplete = save(invalid)
        self.assertEqual(status, 200, incomplete)
        self.assertEqual(self.transition('orders', incomplete)[0], 400)
        order = incomplete
        invalid = copy.deepcopy(input)
        invalid['lines'][0]['quantity'] = 7
        invalid['lines'][0]['allocations'][0]['quantity'] = 7
        status, rejected = save(invalid)
        self.assertEqual(status, 409, rejected)
        status, order = save(input)
        self.assertEqual(status, 200, order)
        self.assertEqual(len(order['lines']), 2)
        self.assertEqual(order['lines'][1]['request_line'], '')
        self.assertAlmostEqual(order['subtotal'], 6.4)
        status, order = self.transition('orders', order)
        self.assertEqual(status, 200, order)
        self.assertEqual(len(order['document_snapshot']['lines']), 2)
        self.assertEqual(save(input, order)[0], 400)
        status, order = self.transition('orders', order, 'reopen')
        self.assertEqual(status, 200, order)
        status, req = self.pb.request('POST', 'horizon/purchasing/requests/transition', dict(id=req['id'], updated=req['updated'], action='reopen', discard_preparations=True), self.token)
        self.assertEqual(status, 200, req)
        status, order = self.pb.request('GET', 'horizon/purchasing/orders/' + order['id'], token=self.token)
        self.assertEqual(status, 200, order)
        self.assertEqual(order['status'], 'draft')
        self.assertEqual(len(order['lines']), 1)
        self.assertEqual(order['lines'][0]['description'], 'Complément direct')
        self.assertAlmostEqual(order['subtotal'], 1.6)
        self.assertEqual(self.transition('orders', order)[0], 200)

    def test_incomplete_draft_lines_are_preserved_and_block_validation(self):
        blank = dict(product='', description='', reference='', brand='', quantity=1, unit='u', unit_price=0, discount=0, supplier='', source_line='', request_line='', allocations=[])
        for kind in ['requests', 'orders']:
            input = dict(self.input, opportunity='', supplier=self.supplier['id'] if kind == 'orders' else '', lines=[blank])
            status, draft = self.pb.request('POST', f'horizon/purchasing/{kind}/save', dict(input=input, creation_key=str(uuid.uuid4())), self.token)
            self.assertEqual(status, 200, draft)
            status, loaded = self.pb.request('GET', f'horizon/purchasing/{kind}/' + draft['id'], token=self.token)
            self.assertEqual(status, 200, loaded)
            self.assertEqual(len(loaded['lines']), 1)
            self.assertEqual(loaded['lines'][0]['description'], '')
            self.assertEqual(self.transition(kind, loaded)[0], 400)
            input['lines'] = [dict(blank, description='Prestation', supplier=self.supplier['id'])]
            status, draft = self.pb.request('POST', f'horizon/purchasing/{kind}/save', dict(input=input, id=draft['id'], updated=draft['updated']), self.token)
            self.assertEqual(status, 200, draft)
            self.assertEqual(self.transition(kind, draft)[0], 400)
            input['lines'][0]['allocations'] = [dict(opportunity=self.opp['id'], quantity=1)]
            status, draft = self.pb.request('POST', f'horizon/purchasing/{kind}/save', dict(input=input, id=draft['id'], updated=draft['updated']), self.token)
            self.assertEqual(status, 200, draft)
            status, validated = self.transition(kind, draft)
            self.assertEqual(status, 200, validated)
            self.assertNotEqual(validated['status'], 'draft')

    def test_manual_request_quote_source_and_defaults(self):
        status, quote = check_catalog.CatalogTests.quote_save(self, lines=[])
        self.assertEqual(status, 200, quote)
        status, req = self.save_request(dict(self.input, source_quote=quote['id']))
        self.assertEqual(status, 200, req)
        self.assertEqual(req['source_quote'], quote['id'])
        self.assertEqual(req['source_quote_number'], quote['quote_number'])
        self.assertEqual(req['source_order'], '')
        self.assertFalse(self.pb.request('GET', 'horizon/sales/quotes/' + quote['id'], token=self.token)[1]['can_delete'])
        self.assertEqual(self.pb.request('DELETE', 'collections/sales_quotes/records/' + quote['id'], token=self.pb.admin_token)[0], 400)
        wrong = dict(self.input, source_quote=quote['id'], opportunity='')
        self.assertEqual(self.save_request(wrong)[0], 400)
        status, choices = self.pb.request('GET', 'horizon/purchasing/choices', token=self.token)
        self.assertEqual(status, 200, choices)
        self.assertEqual(choices['default_owner'], self.user['id'])
        affair = next(item for item in choices['opportunities'] if item['id'] == self.opp['id'])
        self.assertEqual(affair['allocation_label'], f"{self.opp['opportunity_number']} · {self.company['name']} · {self.opp['title']}")
        self.assertEqual(next(item for item in choices['warehouses'] if item['id'] == choices['default_warehouse'])['code'], 'MEU')
        # Defaults also apply on the server for direct orders, without trusting the UI.
        status, order = self.pb.request('POST', 'horizon/purchasing/orders/save', dict(creation_key=str(uuid.uuid4()), input=dict(self.input, supplier=self.supplier['id'])), self.token)
        self.assertEqual(status, 200, order)
        self.assertEqual(order['owner'], self.user['id'])
        self.assertEqual(order['delivery_warehouse'], choices['default_warehouse'])
        permissions = ['purchasing.read', 'purchasing.write', 'crm.read', 'inventory.read']
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], dict(permissions=permissions), self.pb.admin_token)
        self.assertEqual(self.save_request(dict(self.input, source_quote=quote['id']))[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/requests/' + req['id'], token=self.token)[1]['source_quote'], '')

    def test_order_identity_snapshot_and_delivery_guards(self):
        self.pb.request('PATCH', 'collections/contacts_companies/records/' + self.supplier['id'], {'vat_number': 'FR34543675674'}, self.pb.admin_token)
        _, req = self.save_request()
        _, req = self.transition('requests', req)
        _, result = self.order(req)
        order = result['items'][0]
        self.assertEqual(order['owner'], self.user['id'])
        self.assertTrue(order['delivery_warehouse'])
        self.assertEqual(order['supplier_vat_number'], 'FR34543675674')
        self.assertEqual(order['source_requests_count'], 1)
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/requests?order=' + order['id'], token=self.token)[1]['totalItems'], 1)
        warehouse = order['delivery_warehouse']
        self.pb.request('PATCH', 'collections/inventory_warehouses/records/' + warehouse, {'active': False}, self.pb.admin_token)
        self.assertEqual(self.transition('orders', order)[0], 400)
        self.pb.request('PATCH', 'collections/inventory_warehouses/records/' + warehouse, {'active': True}, self.pb.admin_token)
        status, order = self.transition('orders', order)
        self.assertEqual(status, 200, order)
        buyer_name, warehouse_name = order['owner_name'], order['delivery_warehouse_name']
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'name': 'Acheteur renommé'}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/inventory_warehouses/records/' + warehouse, {'name': 'Entrepôt renommé'}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/contacts_companies/records/' + self.supplier['id'], {'vat_number': 'FR99999999999'}, self.pb.admin_token)
        _, historical = self.pb.request('GET', 'horizon/purchasing/orders/' + order['id'], token=self.token)
        self.assertEqual(historical['owner_name'], buyer_name)
        self.assertEqual(historical['delivery_warehouse_name'], warehouse_name)
        self.assertEqual(historical['supplier_vat_number'], 'FR34543675674')
        self.assertEqual(self.pb.request('PATCH', 'collections/purchasing_orders/records/' + order['id'], {'owner': ''}, self.pb.admin_token)[0], 400)
        status, reopened = self.transition('orders', historical, 'reopen')
        self.assertEqual(status, 200, reopened)
        self.assertEqual(reopened['owner_name'], 'Acheteur renommé')
        self.assertEqual(reopened['delivery_warehouse_name'], 'Entrepôt renommé')
        self.assertEqual(reopened['supplier_vat_number'], 'FR99999999999')

    def test_stock_optional_confirmation_and_overbooking(self):
        key = str(uuid.uuid4())
        status, stock = self.adjust(key=key)
        self.assertEqual(status, 200, stock)
        self.assertEqual(stock['available'], 4)
        self.assertEqual(self.adjust(key=key)[0], 200)
        quote = self.make_quote()
        body = dict(id=quote['id'], updated=quote['updated'], customer_order_number='', reservations=[dict(source_line=quote['lines'][0]['id'], location=self.location, quantity=5)])
        self.assertEqual(self.pb.request('POST', 'horizon/sales/quotes/confirm', body, self.token)[0], 409)
        self.assertEqual(self.pb.request('GET', 'collections/sales_orders/records', token=self.pb.admin_token)[1]['totalItems'], 0)
        body['reservations'][0]['quantity'] = 4
        status, quote = self.pb.request('POST', 'horizon/sales/quotes/confirm', body, self.token)
        self.assertEqual(status, 200, quote)
        status, needs = self.pb.request('GET', 'horizon/purchasing/needs/' + quote['id'], token=self.token)
        self.assertEqual(status, 200, needs)
        self.assertEqual(len(needs['lines']), 1)
        self.assertEqual(needs['lines'][0]['quantity'], 6)
        status, req = self.save_request(dict(self.input, source_order=needs['source_order'], lines=needs['lines']))
        self.assertEqual(status, 400, req)  # presentation fields cannot be submitted
        clean = {key: value for key, value in needs['lines'][0].items() if key not in ['sold_quantity', 'reserved', 'prepared', 'price_currency']}
        status, req = self.save_request(dict(self.input, source_order=needs['source_order'], lines=[clean]))
        self.assertEqual(status, 200, req)
        status, stock = self.pb.request('GET', 'horizon/inventory/stock?product=' + self.item['id'], token=self.token)
        self.assertEqual(status, 200, stock)
        self.assertEqual(stock['items'][0]['physical'], 4)
        self.assertEqual(stock['items'][0]['available'], 0)
        self.assertEqual(self.adjust(3, 4)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/sales/quotes/reopen', dict(id=quote['id'], updated=quote['updated'], target='validated'), self.token)[0], 400)
        self.assertEqual(self.transition('requests', req, 'cancel')[0], 200)
        status, quote = self.pb.request('POST', 'horizon/sales/quotes/reopen', dict(id=quote['id'], updated=quote['updated'], target='validated'), self.token)
        self.assertEqual(status, 200, quote)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/stock?product=' + self.item['id'], token=self.token)[1]['items'][0]['available'], 4)

    def test_document_snapshot_and_precise_request_filter(self):
        _, req = self.save_request()
        _, req = self.transition('requests', req)
        _, result = self.order(req)
        order = result['items'][0]
        _, order = self.transition('orders', order)
        body = dict(purchase_order_id=order['id'], format='html')
        status, preview = self.pb.request('POST', 'horizon/documents/preview', body, self.token)
        self.assertEqual(status, 200, preview)
        self.assertIn('Fournisseur principal', preview['html'])
        self.assertIn('Câble vidéo', preview['html'])
        self.assertIn(order['number'], preview['filename'])
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/orders?request_line=' + req['lines'][0]['id'], token=self.token)[1]['totalItems'], 1)
        self.pb.request('PATCH', 'collections/contacts_companies/records/' + self.supplier['id'], {'name': 'Nom fournisseur modifié'}, self.pb.admin_token)
        _, second = self.pb.request('POST', 'horizon/documents/preview', body, self.token)
        self.assertIn('Fournisseur principal', second['html'])
        self.assertNotIn('Nom fournisseur modifié', second['html'])
        allocation = self.pb.request('GET', 'collections/purchasing_order_line_allocations/records', token=self.pb.admin_token)[1]['items'][0]
        self.assertEqual(self.pb.request('PATCH', 'collections/purchasing_order_line_allocations/records/' + allocation['id'], {'quantity': 1}, self.pb.admin_token)[0], 400)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/products/' + self.item['id'], token=self.token)[1]['last_purchase']['unit_cost'], 0.8)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/stock?product=' + self.item['id'], token=self.token)[1]['items'][0]['incoming'], 6)

    def test_concurrent_stock_reservations_and_order_creation(self):
        self.assertEqual(self.adjust()[0], 200)
        one = self.make_quote()
        status, two = check_catalog.CatalogTests.quote_save(self, key=str(uuid.uuid4()), lines=[dict(product=self.item['id'], description='Câble', quantity=10, unit='m', unit_price=1.08, unit_cost=0.8)])
        self.assertEqual(status, 200, two)
        _, two = self.pb.request('POST', 'horizon/sales/quotes/finalize', dict(id=two['id'], updated=two['updated']), self.token)
        def confirm(quote):
            return self.pb.request('POST', 'horizon/sales/quotes/confirm', dict(id=quote['id'], updated=quote['updated'], customer_order_number='', reservations=[dict(source_line=quote['lines'][0]['id'], location=self.location, quantity=4)]), self.token)
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(confirm, [one, two]))
        self.assertEqual(sorted(item[0] for item in results), [200, 409], results)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/stock?product=' + self.item['id'], token=self.token)[1]['items'][0]['reserved'], 4)
        _, req = self.save_request()
        with ThreadPoolExecutor(max_workers=2) as pool:
            orders = list(pool.map(lambda _: self.transition('requests', req), range(2)))
        self.assertEqual(sorted(item[0] for item in orders), [200, 409], orders)

    def test_validation_preparation_reopen_and_cancel_all(self):
        _, req = self.save_request()
        original = req
        status, req = self.transition('requests', req)
        self.assertEqual(status, 200, req)
        self.assertEqual(req['preparation_count'], 1)
        self.assertTrue(req['can_reopen'])
        self.assertEqual(self.transition('requests', req, 'reopen')[0], 400)
        _, orders = self.order(req)
        old_order = orders['items'][0]
        status, reopened = self.pb.request('POST', 'horizon/purchasing/requests/transition', dict(id=req['id'], updated=req['updated'], action='reopen', discard_preparations=True), self.token)
        self.assertEqual(status, 200, reopened)
        self.assertEqual(reopened['status'], 'draft')
        self.assertEqual(reopened['preparation_count'], 0)
        _, cancelled = self.pb.request('GET', 'horizon/purchasing/orders/' + old_order['id'], token=self.token)
        self.assertEqual(cancelled['status'], 'cancelled')
        self.assertEqual(cancelled['document_snapshot']['lines'][0]['quantity'], 6)
        status, reopened = self.save_request(id=reopened['id'], updated=reopened['updated'])
        self.assertEqual(status, 200, reopened)
        _, req = self.transition('requests', reopened)
        _, orders = self.order(req)
        active = [order for order in orders['items'] if order['status'] != 'cancelled']
        self.assertEqual(len(active), 1)
        _, order = self.transition('orders', active[0])
        _, req = self.pb.request('GET', 'horizon/purchasing/requests/' + req['id'], token=self.token)
        self.assertFalse(req['can_reopen'])
        self.assertEqual(self.pb.request('POST', 'horizon/purchasing/requests/transition', dict(id=req['id'], updated=req['updated'], action='reopen', discard_preparations=True), self.token)[0], 400)
        _, order = self.transition('orders', order, 'reopen')
        self.assertEqual(order['status'], 'draft')
        _, order = self.transition('orders', order)
        _, req = self.pb.request('GET', 'horizon/purchasing/requests/' + req['id'], token=self.token)
        status, req = self.transition('requests', req, 'cancel_all')
        self.assertEqual(status, 200, req)
        self.assertEqual(req['status'], 'cancelled')
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/orders/' + order['id'], token=self.token)[1]['status'], 'cancelled')
        self.assertEqual(self.transition('requests', original)[0], 409)

    def test_preparation_validation_atomic_and_sent_guard(self):
        invalid = dict(self.input, lines=[dict(self.input['lines'][0], supplier='')])
        _, req = self.save_request(invalid)
        self.assertEqual(self.transition('requests', req)[0], 400)
        self.assertEqual(self.order(req)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/requests/' + req['id'], token=self.token)[1]['status'], 'draft')
        _, req = self.save_request()
        _, req = self.transition('requests', req)
        _, result = self.order(req)
        _, order = self.transition('orders', result['items'][0])
        # Simulate a future actual Messaging send, not a user-facing send action.
        status, sent = self.pb.request('PATCH', 'collections/purchasing_orders/records/' + order['id'], dict(status='sent', sent_at='2026-10-11 09:00:00.000Z'), self.pb.admin_token)
        self.assertEqual(status, 200, sent)
        _, order = self.pb.request('GET', 'horizon/purchasing/orders/' + order['id'], token=self.token)
        _, req = self.pb.request('GET', 'horizon/purchasing/requests/' + req['id'], token=self.token)
        self.assertFalse(order['can_reopen'])
        self.assertFalse(req['can_reopen'])
        self.assertEqual(req['status'], 'ordered')
        self.assertEqual(self.transition('orders', order, 'reopen')[0], 400)
        self.assertEqual(self.transition('requests', req, 'cancel_all')[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/purchasing/requests/transition', dict(id=req['id'], updated=req['updated'], action='reopen', discard_preparations=True), self.token)[0], 400)

    def test_shared_preparation_preserves_other_requests(self):
        _, first = self.save_request()
        _, first = self.transition('requests', first)
        _, second = self.save_request()
        _, second = self.transition('requests', second)
        first_order = self.order(first)[1]['items'][0]
        second_order = self.order(second)[1]['items'][0]
        second_line = second_order['lines'][0]
        status, moved = self.pb.request('PATCH', 'collections/purchasing_order_lines/records/' + second_line['id'], dict(order=first_order['id']), self.pb.admin_token)
        self.assertEqual(status, 200, moved)
        # A historical multi-request BC is preserved, only the withdrawn DA lines are removed.
        status, first = self.pb.request('POST', 'horizon/purchasing/requests/transition', dict(id=first['id'], updated=first['updated'], action='reopen', discard_preparations=True), self.token)
        self.assertEqual(status, 200, first)
        _, preserved = self.pb.request('GET', 'horizon/purchasing/orders/' + first_order['id'], token=self.token)
        self.assertEqual(preserved['status'], 'draft')
        self.assertEqual(len(preserved['lines']), 1)
        self.assertEqual(preserved['lines'][0]['request_line'], second['lines'][0]['id'])
        self.assertAlmostEqual(preserved['total'], 5.76)
        self.assertEqual(self.order(second)[1]['totalItems'], 2)

    def test_quote_source_migration_backfills_confirmed_requests(self):
        quote = self.make_quote()
        status, quote = self.pb.request('POST', 'horizon/sales/quotes/confirm', dict(id=quote['id'], updated=quote['updated'], customer_order_number=''), self.token)
        self.assertEqual(status, 200, quote)
        status, needs = self.pb.request('GET', 'horizon/purchasing/needs/' + quote['id'], token=self.token)
        self.assertEqual(status, 200, needs)
        clean = {key: value for key, value in needs['lines'][0].items() if key not in ['sold_quantity', 'reserved', 'prepared', 'price_currency']}
        clean['supplier'] = self.supplier['id']
        status, req = self.save_request(dict(self.input, source_order=needs['source_order'], lines=[clean]))
        self.assertEqual(status, 200, req)
        status, req = self.transition('requests', req)
        self.assertEqual(status, 200, req)
        before = req['lines']
        status, collection = self.pb.request('GET', 'collections/purchasing_requests', token=self.pb.admin_token)
        self.assertEqual(status, 200, collection)
        status, result = self.pb.request('PATCH', 'collections/purchasing_requests', dict(fields=[field for field in collection['fields'] if field['name'] != 'source_quote']), self.pb.admin_token)
        self.assertEqual(status, 200, result)
        self.pb.process.terminate(); self.pb.process.wait(timeout=10)
        # Recreate only the historical fixture being tested. Newer irreversible stock migrations remain intact.
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791710004_purchase_request_quote.js',))
        up = subprocess.run(self.pb.args + ['migrate', 'up'], env=self.pb.environment, capture_output=True, text=True)
        self.assertEqual(up.returncode, 0, up.stdout + up.stderr)
        self.pb.launch_and_authenticate(self.pb.args)
        status, migrated = self.pb.request('GET', 'horizon/purchasing/requests/' + req['id'], token=self.token)
        self.assertEqual(status, 200, migrated)
        self.assertEqual(migrated['source_quote'], quote['id'])
        self.assertEqual(migrated['source_quote_number'], quote['quote_number'])
        self.assertEqual(migrated['status'], 'validated')
        self.assertEqual(migrated['lines'], before)

    def test_lifecycle_migration_preserves_actual_sending(self):
        _, first = self.save_request()
        _, first = self.transition('requests', first)
        _, second = self.save_request()
        _, second = self.transition('requests', second)
        order = self.order(second)[1]['items'][0]
        _, order = self.transition('orders', order)
        self.assertEqual(self.pb.request('PATCH', 'collections/purchasing_orders/records/' + order['id'], dict(status='sent', sent_at='2026-10-11 09:00:00.000Z'), self.pb.admin_token)[0], 200)
        self.assertEqual(self.pb.request('PATCH', 'collections/purchasing_requests/records/' + first['id'], dict(status='ordered'), self.pb.admin_token)[0], 200)
        self.pb.process.terminate(); self.pb.process.wait(timeout=10)
        # Recreate only the historical fixture being tested. Newer irreversible stock migrations remain intact.
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791710000_purchasing_request_lifecycle.js',))
        up = subprocess.run(self.pb.args + ['migrate', 'up'], env=self.pb.environment, capture_output=True, text=True)
        self.assertEqual(up.returncode, 0, up.stdout + up.stderr)
        self.pb.launch_and_authenticate(self.pb.args)
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/requests/' + first['id'], token=self.token)[1]['status'], 'validated')
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/requests/' + second['id'], token=self.token)[1]['status'], 'ordered')

    def test_permissions_and_raw_collections(self):
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/requests', token=self.contacts_token)[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/stock', token=self.contacts_token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'collections/inventory_moves/records', {}, self.token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'collections/purchasing_orders/records', {}, self.token)[0], 403)
        bad = dict(self.input, document_date='2026-99-99')
        self.assertEqual(self.save_request(bad)[0], 400)

if __name__ == '__main__':
    unittest.main()

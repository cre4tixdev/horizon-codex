"""Stock operations: physical ledger, partial sources, transit and count locks."""
import copy
import shutil
import sqlite3
import subprocess
from pathlib import Path
from check_auth import LocalPocketBase, ROOT
import uuid
import unittest
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor
import check_purchasing

class StockOperationsTests(unittest.TestCase):
    def setUp(self):
        check_purchasing.PurchasingTests.setUp(self)
        status, role = self.pb.request('GET', 'collections/core_roles/records/' + self.user['role'], token=self.pb.admin_token)
        self.assertEqual(status, 200)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': role['permissions'] + ['inventory.stock.validate']}, self.pb.admin_token)
        status, self.choices = self.pb.request('GET', 'horizon/inventory/operations/choices', token=self.token)
        self.assertEqual(status, 200, self.choices)
        self.warehouse = next(item['warehouse'] for item in self.choices['locations'] if item['id'] == self.location)
        self.sevres = next(item['id'] for item in self.choices['warehouses'] if item['code'] == 'SEV')
        self.to = next(item['id'] for item in self.choices['locations'] if item['warehouse'] == self.sevres)
    def tearDown(self):
        self.pb.close()
    def build_input(self, kind='IN', quantity=10):
        return dict(kind=kind, warehouse=self.warehouse, destination_warehouse=self.warehouse, title='Test stock', opportunity='', purchase_order='', sales_quote='', origin='', destination='', reason='Justificatif test', notes='', document_date='2026-10-12', planned_date='', inventory_mode='cycle', dropship=False, scrap=False, scope=[], lines=[dict(id='line-1', product=self.item['id'], quantity=quantity, from_location=self.location, to_location=self.location, source_line='', counted=None)])
    def save(self, input, key=None, record=None):
        body = dict(input=input, creation_key=key or str(uuid.uuid4()))
        if record: body.update(id=record['id'], updated=record['updated'])
        return self.pb.request('POST', 'horizon/inventory/operations/save', body, self.token)
    def action(self, record, action='validate'):
        return self.pb.request('POST', 'horizon/inventory/operations/transition', dict(id=record['id'], updated=record['updated'], action=action), self.token)
    def balance(self, location=None):
        status, result = self.pb.request('GET', f'horizon/inventory/stock?product={self.item["id"]}&location={location or self.location}', token=self.token)
        self.assertEqual(status, 200, result)
        return result['items'][0]
    def stock(self, quantity=10):
        status, record = self.save(self.build_input(quantity=quantity)); self.assertEqual(status, 200, record)
        status, record = self.action(record); self.assertEqual(status, 200, record)
        return record
    def test_draft_idempotency_number_and_append_only(self):
        key = str(uuid.uuid4()); input = self.build_input()
        status, draft = self.save(input, key); self.assertEqual(status, 200, draft)
        self.assertRegex(draft['number'], r'^MEU/IN/\d{5}$')
        self.assertEqual(self.balance()['physical'], 0)
        self.assertEqual(self.save(input, key)[1]['id'], draft['id'])
        changed = copy.deepcopy(input); changed['lines'][0]['quantity'] = 12
        self.assertEqual(self.save(changed, key)[0], 409)
        status, done = self.action(draft); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance()['physical'], 10)
        self.assertEqual(self.action(draft)[0], 409)
        self.assertEqual(self.save(input, record=done)[0], 400)
        self.assertEqual(self.action(done, 'cancel')[0], 400)
    def test_prep_affair_scrap_and_return(self):
        self.stock()
        input = self.build_input('PREP', 4)
        status, draft = self.save(input); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 400)
        input['opportunity'] = self.opp['id']
        status, draft = self.save(input, record=draft); self.assertEqual(status, 200, draft)
        status, prep = self.action(draft); self.assertEqual(status, 200, prep)
        self.assertEqual(self.balance()['physical'], 6)
        ret = self.build_input('RET', 2); ret['origin'] = prep['id']
        status, draft = self.save(ret); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 200)
        self.assertEqual(self.balance()['physical'], 8)
        ret['lines'][0]['quantity'] = 3
        status, draft = self.save(ret); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 400)
        scrap = self.build_input('OUT', 3); scrap['scrap'] = True
        status, draft = self.save(scrap); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 200)
        self.assertEqual(self.balance()['physical'], 5)
    def test_transfer_transit_and_no_double_receipt(self):
        self.stock()
        input = self.build_input('INT', 4); input['destination_warehouse'] = self.sevres; input['lines'][0]['to_location'] = self.to
        status, draft = self.save(input); self.assertEqual(status, 200, draft)
        status, transit = self.action(draft); self.assertEqual(status, 200, transit)
        self.assertEqual(transit['status'], 'transit')
        self.assertEqual(self.balance()['physical'], 6); self.assertEqual(self.balance(self.to)['physical'], 0)
        status, done = self.action(transit, 'receive'); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance(self.to)['physical'], 4)
        self.assertNotEqual(self.action(done, 'receive')[0], 200)
    def test_inventory_lock_count_and_unlock(self):
        self.stock()
        input = self.build_input('INV'); input['lines'] = []; input['scope'] = [self.location]; input['planned_date'] = '2026-10-20'
        status, draft = self.save(input); self.assertEqual(status, 200, draft)
        status, count = self.action(draft, 'start'); self.assertEqual(status, 200, count)
        self.assertTrue(count['lock_movements']); self.assertEqual(count['lines'][0]['expected'], 10)
        status, blocked = self.save(self.build_input('OUT', 1)); self.assertEqual(status, 200, blocked)
        self.assertEqual(self.action(blocked)[0], 409)
        self.assertEqual(check_purchasing.PurchasingTests.adjust(self, 12, 10)[0], 409)
        counted = copy.deepcopy(input); counted['lines'] = count['lines']; counted['lines'][0]['counted'] = 8
        status, count = self.save(counted, record=count); self.assertEqual(status, 200, count)
        status, done = self.action(count); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance()['physical'], 8)
        self.assertEqual(self.action(blocked)[0], 200)
        self.assertEqual(self.balance()['physical'], 7)
    def test_reservation_protection(self):
        self.stock(4)
        quote = check_purchasing.PurchasingTests.make_quote(self)
        status, confirmed = self.pb.request('POST', 'horizon/sales/quotes/confirm', dict(id=quote['id'], updated=quote['updated'], customer_order_number='', reservations=[dict(source_line=quote['lines'][0]['id'], location=self.location, quantity=3)]), self.token)
        self.assertEqual(status, 200, confirmed)
        status, draft = self.save(self.build_input('OUT', 2)); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 409)
        status, result = self.pb.request('GET', 'horizon/inventory/operations/source?kind=OUT&sales_quote=' + quote['id'], token=self.token)
        self.assertEqual(status, 200, result)
        input = self.build_input('OUT'); input['sales_quote'] = quote['id']; input['lines'][0].update(result['lines'][0]); input['lines'][0]['quantity'] = 3
        status, draft = self.save(input); self.assertEqual(status, 200, draft)
        status, done = self.action(draft); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance()['physical'], 1); self.assertEqual(self.balance()['reserved'], 0)
    def purchase(self):
        input = copy.deepcopy(self.input)
        input['lines'][0]['allocations'] = input['lines'][0]['allocations'] or [dict(opportunity=self.opp['id'], quantity=6)]
        status, request = check_purchasing.PurchasingTests.save_request(self, input); self.assertEqual(status, 200, request)
        status, request = check_purchasing.PurchasingTests.transition(self, 'requests', request); self.assertEqual(status, 200, request)
        status, page = check_purchasing.PurchasingTests.order(self, request); self.assertEqual(status, 200, page)
        status, order = check_purchasing.PurchasingTests.transition(self, 'orders', page['items'][0]); self.assertEqual(status, 200, order)
        return order
    def pending_receipts(self, order):
        status, data = self.pb.request('GET', 'horizon/inventory/operations?kind=IN&status=draft&purchase_order=' + order['id'], token=self.token)
        self.assertEqual(status, 200, data)
        return data['items']
    def test_partial_receipt_and_remainder(self):
        order = self.purchase()
        pending = self.pending_receipts(order)
        self.assertEqual(len(pending), 1)
        draft = pending[0]
        self.assertEqual(draft['lines'][0]['quantity'], 6)
        self.assertEqual(draft['lines'][0]['to_location'], self.location)
        self.assertEqual(self.balance()['physical'], 0)
        input = self.build_input(); input['purchase_order'] = order['id']; input['warehouse'] = order['delivery_warehouse']; input['lines'][0].update(draft['lines'][0]); input['lines'][0]['quantity'] = 2
        status, draft = self.save(input, record=draft); self.assertEqual(status, 200, draft)
        status, done = self.action(draft); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance()['physical'], 2)
        status, purchase = self.pb.request('GET', 'horizon/purchasing/orders/' + order['id'], token=self.token); self.assertEqual(status, 200, purchase); self.assertEqual(purchase['status'], 'partially_received')
        pending = self.pending_receipts(order)
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]['lines'][0]['quantity'], 4)
        self.assertNotEqual(pending[0]['id'], draft['id'])
        self.assertEqual(check_purchasing.PurchasingTests.transition(self, 'orders', purchase, 'reopen')[0], 400)
        input['lines'][0]['quantity'] = 5
        status, too_many = self.save(input); self.assertEqual(status, 200, too_many); self.assertEqual(self.action(too_many)[0], 409)
        self.assertEqual(self.action(pending[0])[0], 200)
        self.assertEqual(self.balance()['physical'], 6)
        self.assertEqual(self.pending_receipts(order), [])
        self.assertEqual(self.action(pending[0])[0], 409)
    def test_supplier_receipt_identity_affairs_warehouse_and_required_lines(self):
        order = self.purchase(); draft = self.pending_receipts(order)[0]
        self.assertEqual(draft['purchase_number'], order['number'])
        self.assertEqual(draft['supplier_name'], self.supplier['name'])
        self.assertIn(self.opp['opportunity_number'], draft['line_details'][0]['affairs']); self.assertIn(self.company['name'], draft['line_details'][0]['affairs']); self.assertIn('[ 6m ]', draft['line_details'][0]['affairs'])
        input = self.build_input(); input['purchase_order'] = order['id']; input['lines'][0].update(draft['lines'][0])
        changed = copy.deepcopy(input); changed['purchase_order'] = ''
        self.assertEqual(self.save(changed, record=draft)[0], 400)
        changed = copy.deepcopy(input); changed['lines'][0]['quantity'] = 0
        status, empty = self.save(changed, record=draft); self.assertEqual(status, 200, empty)
        self.assertEqual(self.action(empty)[0], 400)
        input['warehouse'] = self.sevres; input['destination_warehouse'] = self.sevres
        input['lines'][0]['from_location'] = ''; input['lines'][0]['to_location'] = ''
        status, relocated = self.save(input, record=empty); self.assertEqual(status, 200, relocated)
        self.assertRegex(relocated['number'], r'^SEV/IN/\d{5}$')
        self.assertNotEqual(relocated['number'], draft['number'])
        self.assertEqual(self.action(relocated)[0], 400)
        input['lines'][0]['to_location'] = self.to
        status, relocated = self.save(input, record=relocated); self.assertEqual(status, 200, relocated)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['inventory.read', 'inventory.write', 'inventory.stock.validate']}, self.pb.admin_token)
        status, safe = self.pb.request('GET', 'horizon/inventory/operations/' + relocated['id'], token=self.token)
        self.assertEqual(status, 200, safe); self.assertFalse(safe['can_inspect_purchase']); self.assertIsNone(safe['lines'][0]['unit_cost']); self.assertEqual(safe['lines'][0]['allocations'], [])
        self.assertEqual(safe['supplier_name'], self.supplier['name']); self.assertTrue(safe['line_details'][0]['affairs'])
        # Warehouse-only operators can receive without access to financial source documents.
        input['lines'][0]['unit_cost'] = None; input['lines'][0]['allocations'] = []
        status, safe = self.save(input, record=safe); self.assertEqual(status, 200, safe)
        status, done = self.action(safe); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance(self.to)['physical'], 6)
        status, preview = self.pb.request('POST', 'horizon/documents/preview', dict(stock_operation_id=done['id'], format='html'), self.token)
        self.assertEqual(status, 200, preview)
        for text in [self.supplier['name'], order['number'], self.opp['opportunity_number'], 'Destination', 'Affaires']:
            self.assertIn(text, preview['html'])
        self.assertNotIn('PU HT', preview['html']); self.assertNotIn('Total HT', preview['html'])
        self.pb.request('PATCH', 'collections/inventory_locations/records/' + self.to, dict(name='Emplacement renommé'), self.pb.admin_token)
        second = self.pb.request('POST', 'horizon/documents/preview', dict(stock_operation_id=done['id'], format='html'), self.token)
        self.assertEqual(second[0], 200, second); self.assertEqual(preview['html'], second[1]['html'])

    def test_receipt_multiple_affair_tags_and_snapshot_client(self):
        company = self.pb.create('contacts_companies', {'name': 'TF1', 'active': True})
        status, other = self.pb.request('POST', 'horizon/crm/save', {'creation_key': str(uuid.uuid4()), 'input': {'title': 'Seconde affaire', 'company': company['id'], 'contact': '', 'owner': self.user['id'], 'stage': self.stages[0]['id'], 'estimated_value': 0, 'estimated_cost': 0, 'currency': 'EUR', 'probability': 30, 'expected_date': '', 'description': '', 'status': 'open'}}, self.token)
        self.assertEqual(status, 200, other)
        self.input['lines'][0]['allocations'] = [{'opportunity': self.opp['id'], 'quantity': 1}, {'opportunity': other['id'], 'quantity': 5}]
        order = self.purchase(); draft = self.pending_receipts(order)[0]
        self.assertEqual({item['code'] for item in draft['affair_tags']}, {self.opp['opportunity_number'], other['opportunity_number']})
        tags = draft['line_details'][0]['affair_tags']
        self.assertIn({'code': other['opportunity_number'], 'client': 'TF1', 'quantity': 5, 'unit': 'm'}, tags)
        self.assertIn(other['opportunity_number'] + ' - TF1 [ 5m ]', draft['line_details'][0]['affairs'])
        status, done = self.action(draft); self.assertEqual(status, 200, done)
        self.pb.request('PATCH', 'collections/contacts_companies/records/' + company['id'], {'name': 'Client renommé'}, self.pb.admin_token)
        status, stored = self.pb.request('GET', 'horizon/inventory/operations/' + done['id'], token=self.token)
        self.assertEqual(status, 200, stored); self.assertIn('TF1', [item['client'] for item in stored['affair_tags']])

    def test_pending_receipt_reopen_revalidate_and_cancel(self):
        order = self.purchase()
        first = self.pending_receipts(order)[0]
        status, draft = check_purchasing.PurchasingTests.transition(self, 'orders', order, 'reopen'); self.assertEqual(status, 200, draft)
        self.assertEqual(self.pending_receipts(order), [])
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/operations/' + first['id'], token=self.token)[1]['status'], 'cancelled')
        status, validated = check_purchasing.PurchasingTests.transition(self, 'orders', draft); self.assertEqual(status, 200, validated)
        second = self.pending_receipts(validated)[0]
        self.assertNotEqual(second['id'], first['id'])
        self.assertEqual(second['lines'][0]['quantity'], 6)
        self.assertEqual(check_purchasing.PurchasingTests.transition(self, 'orders', validated)[0], 400)
        self.assertEqual(len(self.pending_receipts(validated)), 1)
        self.assertEqual(check_purchasing.PurchasingTests.transition(self, 'orders', validated, 'cancel')[0], 200)
        self.assertEqual(self.pending_receipts(validated), [])
        self.assertEqual(self.balance()['physical'], 0)
    def sourced_purchase(self):
        quote = check_purchasing.PurchasingTests.make_quote(self)
        status, confirmed = self.pb.request('POST', 'horizon/sales/quotes/confirm', dict(id=quote['id'], updated=quote['updated'], customer_order_number='', reservations=[]), self.token)
        self.assertEqual(status, 200, confirmed)
        status, needs = self.pb.request('GET', 'horizon/purchasing/needs/' + quote['id'], token=self.token); self.assertEqual(status, 200, needs)
        line = {key: value for key, value in needs['lines'][0].items() if key not in ['sold_quantity', 'reserved', 'prepared', 'price_currency']}
        status, request = check_purchasing.PurchasingTests.save_request(self, dict(self.input, source_order=needs['source_order'], lines=[line])); self.assertEqual(status, 200, request)
        status, request = check_purchasing.PurchasingTests.transition(self, 'requests', request); self.assertEqual(status, 200, request)
        status, page = check_purchasing.PurchasingTests.order(self, request); self.assertEqual(status, 200, page)
        status, order = check_purchasing.PurchasingTests.transition(self, 'orders', page['items'][0]); self.assertEqual(status, 200, order)
        return quote, order
    def test_dropship_realization_without_local_stock(self):
        quote, order = self.sourced_purchase()
        status, source = self.pb.request('GET', f'horizon/inventory/operations/source?kind=OUT&purchase_order={order["id"]}&sales_quote={quote["id"]}&dropship=true', token=self.token); self.assertEqual(status, 200, source)
        input = self.build_input('OUT'); input.update(dropship=True, purchase_order=order['id'], sales_quote=quote['id']); input['lines'][0].update(source['lines'][0]); input['lines'][0]['quantity'] = 10
        status, draft = self.save(input); self.assertEqual(status, 200, draft)
        self.assertEqual(self.balance()['physical'], 0)
        status, done = self.action(draft); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance()['physical'], 0)
        status, tracking = self.pb.request('GET', 'horizon/purchasing/tracking/' + quote['id'], token=self.token); self.assertEqual(status, 200, tracking)
        self.assertEqual(tracking[quote['lines'][0]['id']]['delivered'], 10)
        self.assertEqual(tracking[quote['lines'][0]['id']]['received'], 10)
        self.assertEqual(self.save(input)[0], 400)
    def test_received_goods_can_be_reserved_without_duplicate_needs(self):
        quote, order = self.sourced_purchase()
        status, source = self.pb.request('GET', 'horizon/inventory/operations/source?kind=IN&purchase_order=' + order['id'], token=self.token); self.assertEqual(status, 200, source)
        input = self.build_input('IN'); input['purchase_order'] = order['id']; input['lines'][0].update(source['lines'][0])
        status, draft = self.save(input); self.assertEqual(status, 200, draft); self.assertEqual(self.action(draft)[0], 200)
        status, choices = self.pb.request('GET', 'horizon/inventory/stock/reservations/' + quote['id'], token=self.token); self.assertEqual(status, 200, choices)
        self.assertEqual(choices['lines'][0]['capacity'], 10)
        status, result = self.pb.request('POST', 'horizon/inventory/stock/reservations', dict(quote=quote['id'], revision=choices['revision'], selections=[dict(source_line=quote['lines'][0]['id'], location=self.location, quantity=10)]), self.token); self.assertEqual(status, 200, result)
        status, needs = self.pb.request('GET', 'horizon/purchasing/needs/' + quote['id'], token=self.token); self.assertEqual(status, 200, needs); self.assertEqual(needs['lines'][0]['quantity'], 0)
        status, tracking = self.pb.request('GET', 'horizon/purchasing/tracking/' + quote['id'], token=self.token); self.assertEqual(status, 200, tracking); self.assertEqual(tracking[quote['lines'][0]['id']]['needed'], 10)
    def test_supplier_return_and_atomic_sequence(self):
        receipt = self.stock(5)
        ret = self.build_input('RET', 2); ret['origin'] = receipt['id']
        status, draft = self.save(ret); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 200); self.assertEqual(self.balance()['physical'], 3)
        ret['lines'][0]['quantity'] = 4
        status, draft = self.save(ret); self.assertEqual(status, 200, draft); self.assertEqual(self.action(draft)[0], 400)
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _: self.save(self.build_input('IN', 1)), range(4)))
        self.assertTrue(all(status == 200 for status, _ in results), results)
        numbers = sorted(int(item['number'].split('/')[-1]) for _, item in results)
        self.assertEqual(numbers, list(range(2, 6)))
    def test_return_preserves_and_limits_each_origin_line(self):
        input = self.build_input('IN', 5)
        second = copy.deepcopy(input['lines'][0]); second.update(id='line-2', quantity=3); input['lines'].append(second)
        status, receipt = self.save(input); self.assertEqual(status, 200, receipt)
        status, receipt = self.action(receipt); self.assertEqual(status, 200, receipt)
        status, source = self.pb.request('GET', 'horizon/inventory/operations/source?kind=RET&origin=' + receipt['id'], token=self.token); self.assertEqual(status, 200, source)
        ret = self.build_input('RET', 2); ret['origin'] = receipt['id']; ret['lines'][0].update(source['lines'][1]); ret['lines'][0]['quantity'] = 2
        status, draft = self.save(ret); self.assertEqual(status, 200, draft)
        status, done = self.action(draft); self.assertEqual(status, 200, done); self.assertEqual(done['lines'][0]['origin_line'], 'line-2')
        self.assertEqual(self.balance()['physical'], 6)
        ret['lines'][0]['quantity'] = 2
        status, draft = self.save(ret); self.assertEqual(status, 200, draft); self.assertEqual(self.action(draft)[0], 400)

    def test_inventory_without_lock_detects_concurrent_stock_and_calendar_permissions(self):
        self.stock()
        # Configure the trusted fixture through the migration-owned singleton.
        status, settings = self.pb.request('GET', 'collections/settings_stock/records', token=self.pb.admin_token); self.assertEqual(status, 200, settings)
        self.pb.request('PATCH', 'collections/settings_stock/records/' + settings['items'][0]['id'], dict(lock_inventory=False), self.pb.admin_token)
        input = self.build_input('INV'); input.update(lines=[], scope=[self.location], planned_date='2026-10-31')
        status, draft = self.save(input); self.assertEqual(status, 200, draft)
        status, counting = self.action(draft, 'start'); self.assertEqual(status, 200, counting); self.assertFalse(counting['lock_movements'])
        status, out = self.save(self.build_input('OUT', 1)); self.assertEqual(status, 200, out); self.assertEqual(self.action(out)[0], 200)
        input['lines'] = counting['lines']; input['lines'][0]['counted'] = 9
        status, counting = self.save(input, record=counting); self.assertEqual(status, 200, counting); self.assertEqual(self.action(counting)[0], 409)
        calendar = 'horizon/calendar/events?from=2026-10-01T00:00:00.000Z&to=2026-11-01T00:00:00.000Z'
        status, result = self.pb.request('GET', calendar, token=self.token); self.assertEqual(status, 200, result); self.assertIn(draft['id'], [item['source_record_id'] for item in result['items']])
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['crm.read']}, self.pb.admin_token)
        status, result = self.pb.request('GET', calendar, token=self.token); self.assertEqual(status, 200, result); self.assertNotIn(draft['id'], [item['source_record_id'] for item in result['items']])
    def test_snapshot_preview_preserves_realized_product_identity(self):
        receipt = self.stock()
        status, first = self.pb.request('POST', 'horizon/documents/preview', dict(stock_operation_id=receipt['id'], format='html'), self.token); self.assertEqual(status, 200, first)
        self.pb.request('PATCH', 'collections/inventory_products/records/' + self.item['id'], dict(name='Nom modifié après réception'), self.pb.admin_token)
        status, second = self.pb.request('POST', 'horizon/documents/preview', dict(stock_operation_id=receipt['id'], format='html'), self.token); self.assertEqual(status, 200, second)
        self.assertEqual(first['html'], second['html'])

    def test_operation_tiles_split_scrap_from_deliveries(self):
        status, normal = self.save(self.build_input('OUT', 1)); self.assertEqual(status, 200, normal)
        scrap = self.build_input('OUT', 1); scrap['scrap'] = True
        status, discarded = self.save(scrap); self.assertEqual(status, 200, discarded)
        for variant, expected in [('delivery', normal['id']), ('scrap', discarded['id'])]:
            status, result = self.pb.request('GET', 'horizon/inventory/operations?kind=OUT&variant=' + variant, token=self.token); self.assertEqual(status, 200, result)
            self.assertEqual([item['id'] for item in result['items']], [expected]); self.assertEqual(result['summary']['OUT'], 1); self.assertEqual(result['summary']['SCRAP'], 1)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/operations?variant=unknown', token=self.token)[0], 400)

    def test_dashboard_open_filter_and_planned_order(self):
        self.stock()
        pending = []
        for date in ['', '2026-11-04', '2026-10-20']:
            input = self.build_input('IN', 1); input['planned_date'] = date
            status, record = self.save(input); self.assertEqual(status, 200, record)
            pending.append(record)
        status, cancelled = self.save(self.build_input('IN', 1)); self.assertEqual(status, 200, cancelled)
        self.assertEqual(self.action(cancelled, 'cancel')[0], 200)
        status, page = self.pb.request('GET', 'horizon/inventory/operations?kind=IN&status=open&sort=planned_date', token=self.token)
        self.assertEqual(status, 200, page)
        self.assertEqual(page['totalItems'], 3)
        self.assertEqual(page['summary']['IN'], 3)
        self.assertEqual([item['id'] for item in page['items']], [pending[2]['id'], pending[1]['id'], pending[0]['id']])
        transfer = self.build_input('INT', 2); transfer['destination_warehouse'] = self.sevres; transfer['lines'][0]['to_location'] = self.to
        status, draft = self.save(transfer); self.assertEqual(status, 200, draft)
        status, transit = self.action(draft); self.assertEqual(status, 200, transit)
        status, page = self.pb.request('GET', 'horizon/inventory/operations?kind=INT&status=open', token=self.token)
        self.assertEqual(status, 200, page); self.assertEqual(page['items'][0]['status'], 'transit')
        self.assertEqual(self.action(transit, 'receive')[0], 200)
        status, page = self.pb.request('GET', 'horizon/inventory/operations?kind=INT&status=open', token=self.token)
        self.assertEqual(status, 200, page); self.assertEqual(page['totalItems'], 0)

    def test_forecast_counts_all_pages_and_uses_real_validation_day(self):
        from datetime import datetime, timedelta
        from zoneinfo import ZoneInfo
        today = datetime.now(ZoneInfo('Europe/Paris')).date()
        tomorrow = (today + timedelta(days=1)).isoformat()
        for _ in range(31):
            input = self.build_input('IN', 1); input['planned_date'] = tomorrow
            status, record = self.save(input); self.assertEqual(status, 200, record)
        status, undated = self.save(self.build_input('IN', 1)); self.assertEqual(status, 200, undated)
        self.stock(2)
        status, page = self.pb.request('GET', 'horizon/inventory/operations?timeline=true&kind=IN&status=open', token=self.token)
        self.assertEqual(status, 200, page)
        self.assertEqual(len(page['items']), 30); self.assertEqual(page['totalItems'], 32)
        self.assertEqual(page['forecast']['today'], today.isoformat())
        self.assertEqual(len(page['forecast']['dates']), 10)
        series = page['forecast']['series']['IN']
        self.assertEqual(series['planned'][3], 31); self.assertEqual(series['undated'], 1)
        self.assertEqual(series['completed'][2], 1)
        # Conversion uses Europe/Paris rather than the NAS timezone, including DST.
        completed = self.pb.request('GET', 'horizon/inventory/operations?kind=IN&status=done', token=self.token)[1]['items'][0]
        status, _ = self.pb.request('PATCH', 'collections/inventory_operations/records/' + completed['id'], {'validated_at': (today - timedelta(days=1)).isoformat() + ' 22:30:00.000Z'}, self.pb.admin_token)
        self.assertEqual(status, 200)
        status, page = self.pb.request('GET', 'horizon/inventory/operations?timeline=true', token=self.token)
        self.assertEqual(status, 200, page)
        expected_day = datetime.fromisoformat((today - timedelta(days=1)).isoformat() + 'T22:30:00+00:00').astimezone(ZoneInfo('Europe/Paris')).date()
        index = page['forecast']['dates'].index(expected_day.isoformat())
        self.assertEqual(page['forecast']['series']['IN']['completed'][index], 1)

    def test_permissions_and_warehouse_parameters(self):
        receipt = self.stock()
        self.assertEqual({item['code'] for item in self.choices['warehouses']}, {'MEU', 'SEV'})
        status, settings = self.pb.request('GET', 'horizon/inventory/settings', token=self.pb.admin_token)
        self.assertEqual(status, 403) # Horizon routes require a core_users session, never a superuser.
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['inventory.read']}, self.pb.admin_token)
        status, source = self.pb.request('GET', 'horizon/inventory/operations/source?kind=RET&origin=' + receipt['id'], token=self.token); self.assertEqual(status, 200, source); self.assertIsNone(source['lines'][0]['unit_cost']); self.assertEqual(source['lines'][0]['allocations'], [])
        self.assertEqual(self.save(self.build_input())[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/operations', token=self.token)[0], 200)

class WarehouseCodeMigrationTests(unittest.TestCase):
    def test_upgrade_populates_empty_receipt_without_renumbering(self):
        def before_receipts():
            pb = LocalPocketBase()
            previous = Path(pb.temp.name) / 'before_receipts'; previous.mkdir()
            for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
                if path.name < '1791710009': shutil.copy(path, previous)
            pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
            return pb
        fixture = StockOperationsTests('test_partial_receipt_and_remainder')
        with patch('check_crm.LocalPocketBase', side_effect=before_receipts): fixture.setUp()
        pb = fixture.pb; self.addCleanup(pb.close)
        order = fixture.purchase(); receipt = fixture.pending_receipts(order)[0]
        status, _ = pb.request('PATCH', 'collections/inventory_operations/records/' + receipt['id'], {'lines': []}, pb.admin_token)
        self.assertEqual(status, 200)
        pb.process.terminate(); pb.process.wait(timeout=10)
        # Simulate a historical pre-identity order in this disposable database.
        with sqlite3.connect(pb.data / 'data.db') as connection:
            connection.execute('UPDATE purchasing_orders SET delivery_warehouse = ? WHERE id = ?', ('', order['id']))
        current = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}']
        result = subprocess.run(current + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        pb.args = current; pb.launch_and_authenticate(current)
        pending = fixture.pending_receipts(order)
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]['id'], receipt['id'])
        self.assertEqual(pending[0]['number'], receipt['number'])
        self.assertEqual(pending[0]['lines'][0]['quantity'], 6)
        self.assertEqual(fixture.balance()['physical'], 0)

    def test_upgrade_preserves_warehouses_locations_and_counters(self):
        pb = LocalPocketBase(); self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'before_warehouse_code'; previous.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791710008': shutil.copy(path, previous)
        original = pb.args[:]
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        warehouses = pb.request('GET', 'collections/inventory_warehouses/records', token=pb.admin_token)[1]['items']
        meudon = next(item for item in warehouses if item['code'] == 'CVS')
        status, _ = pb.request('PATCH', 'collections/inventory_warehouses/records/' + meudon['id'], {'counters': {'IN': 23, 'OUT': 17}}, pb.admin_token)
        self.assertEqual(status, 200)
        locations = pb.request('GET', 'collections/inventory_locations/records', token=pb.admin_token)[1]['items']
        pb.process.terminate(); pb.process.wait(timeout=10)
        result = subprocess.run(original + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        pb.args = original; pb.launch_and_authenticate(original)
        upgraded = pb.request('GET', 'collections/inventory_warehouses/records', token=pb.admin_token)[1]['items']
        self.assertEqual({item['id']: item['code'] for item in upgraded}, {item['id']: item['trigram'] for item in warehouses})
        self.assertEqual(next(item for item in upgraded if item['id'] == meudon['id'])['counters'], {'IN': 23, 'OUT': 17})
        self.assertTrue(all('trigram' not in item for item in upgraded))
        self.assertEqual([(item['id'], item['warehouse']) for item in pb.request('GET', 'collections/inventory_locations/records', token=pb.admin_token)[1]['items']], [(item['id'], item['warehouse']) for item in locations])

if __name__ == '__main__':
    unittest.main()

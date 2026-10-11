"""Stock valuation: transactional costs, methods, opening and immutable snapshots."""
import copy
import unittest
import check_stock_operations

class StockValuationTests(check_stock_operations.StockOperationsTests):
    # Only run valuation cases in this class; operation regression has its own suite.
    def valuation(self):
        status, data = self.pb.request('GET', 'horizon/inventory/valuation?product=' + self.item['id'], token=self.token)
        self.assertEqual(status, 200, data)
        return data
    def as_admin(self):
        rights = self.pb.request('GET', 'collections/core_roles/records/' + self.user['role'], token=self.pb.admin_token)[1]['permissions']
        role = self.pb.create('core_roles', dict(name='valuation_admin', label='Valorisation', active=True, permissions=rights + ['settings.references', 'settings.users']))
        self.user = self.pb.create_user('valuation-admin@local.invalid', role['id'], profile='admin')
        self.token = self.pb.login('valuation-admin@local.invalid')[1]['token']
    def cost(self, value, opening=False, updated=None):
        data = self.valuation()['items'][0]
        return self.pb.request('POST', 'horizon/inventory/valuation/cost', dict(product=self.item['id'], updated=data['updated'] if updated is None else updated, standard_cost=value, opening=opening, reason='Coût approuvé'), self.token)
    def method(self, name):
        data = self.valuation()
        return self.pb.request('POST', 'horizon/inventory/valuation/method', dict(method=name, updated=data['settings_updated'], reason='Changement approuvé'), self.token)
    def history(self):
        status, data = self.pb.request('GET', 'horizon/inventory/valuation/history?product=' + self.item['id'], token=self.token)
        self.assertEqual(status, 200, data)
        return data['items']
    def test_valuation_standard_revision_transfer_and_permissions(self):
        self.assertEqual(self.cost(2)[0], 403)
        self.as_admin(); self.assertEqual(self.cost(2)[0], 200)
        receipt = self.stock(10)
        self.assertEqual(self.valuation()['items'][0]['value'], 20)
        self.assertEqual(self.balance()['valuation'], 20)
        # Supplier changes cannot reprice the stock or its historical receipt.
        self.pb.request('PATCH', 'collections/inventory_products/records/' + self.item['id'], {'reference_cost': 99}, self.pb.admin_token)
        input = self.build_input('INT', 4); input['destination_warehouse'] = self.sevres; input['lines'][0]['to_location'] = self.to
        status, draft = self.save(input); self.assertEqual(status, 200, draft)
        status, transfer = self.action(draft); self.assertEqual(status, 200, transfer)
        data = self.valuation(); self.assertEqual(data['value'], 20); self.assertEqual(data['transit_value'], 8)
        self.assertEqual(self.method('fifo')[0], 400)
        old_history = copy.deepcopy(self.history())
        old_revision = data['items'][0]['updated']
        self.assertEqual(self.cost(3)[0], 200)
        self.assertEqual(self.cost(4, updated=old_revision)[0], 409)
        self.assertEqual(self.valuation()['value'], 30); self.assertEqual(self.valuation()['transit_value'], 12)
        status, done = self.action(transfer, 'receive'); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance(self.to)['valuation'], 12)
        for old in old_history:
            self.assertIn(old, self.history())
        entry = self.history()[0]
        self.assertEqual(self.pb.request('PATCH', 'collections/inventory_valuation_entries/records/' + entry['id'], {'value_delta': 999}, self.token)[0], 403)
        self.assertNotEqual(self.pb.request('PATCH', 'collections/inventory_valuation_entries/records/' + entry['id'], {'value_delta': 999}, self.pb.admin_token)[0], 200)
        self.assertNotEqual(self.action(receipt)[0], 200)
    def test_valuation_method_cump_fifo_and_frozen_history(self):
        self.as_admin(); self.assertEqual(self.cost(10)[0], 200)
        self.stock(10)
        self.assertEqual(self.method('cump')[0], 200)
        input = self.build_input('IN', 10); input['lines'][0]['unit_cost'] = 20
        status, draft = self.save(input); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 200)
        self.assertEqual(self.valuation()['value'], 300)
        status, draft = self.save(self.build_input('OUT', 4)); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 200); self.assertEqual(self.valuation()['value'], 240)
        frozen = copy.deepcopy(self.history())
        self.assertEqual(self.method('fifo')[0], 200)
        input = self.build_input('IN', 5); input['lines'][0]['unit_cost'] = 30
        status, draft = self.save(input); self.assertEqual(status, 200, draft); self.assertEqual(self.action(draft)[0], 200)
        status, draft = self.save(self.build_input('OUT', 18)); self.assertEqual(status, 200, draft); self.assertEqual(self.action(draft)[0], 200)
        self.assertEqual(self.valuation()['value'], 90)
        for old in frozen: self.assertIn(old, self.history())
        self.assertEqual(self.method('standard')[0], 200); self.assertEqual(self.valuation()['value'], 30)
    def test_valuation_legacy_opening_explicit_and_idempotent(self):
        self.pb.create('inventory_moves', dict(product=self.item['id'], location=self.location, quantity=10, unit='m', kind='adjustment', reason='Ancien stock', operation_key='legacy-stock-00000001', actor=self.user['id']))
        self.assertTrue(self.valuation()['items'][0]['opening_required'])
        status, draft = self.save(self.build_input('IN', 2)); self.assertEqual(status, 200, draft)
        self.assertEqual(self.action(draft)[0], 400)
        self.as_admin(); self.assertEqual(self.cost(2)[0], 400)
        self.assertEqual(self.cost(2, opening=True)[0], 200)
        self.assertEqual(self.valuation()['value'], 20)
        self.assertEqual(self.action(draft)[0], 200)
        self.assertEqual(self.valuation()['value'], 24)
        self.assertEqual(self.action(draft)[0], 409)
    def test_valuation_purchase_variance_and_adjustment(self):
        self.as_admin(); self.assertEqual(self.cost(2)[0], 200)
        purchase = self.purchase()
        status, source = self.pb.request('GET', 'horizon/inventory/operations/source?kind=IN&purchase_order=' + purchase['id'], token=self.token)
        self.assertEqual(status, 200, source)
        input = self.build_input('IN', 6); input['purchase_order'] = purchase['id']; input['lines'][0].update(source['lines'][0]); input['lines'][0]['quantity'] = 6
        status, draft = self.save(input); self.assertEqual(status, 200, draft); self.assertEqual(self.action(draft)[0], 200)
        self.assertEqual(self.valuation()['value'], 12)
        history = self.history(); real = next(item for item in history if item['actual_known'])
        self.assertAlmostEqual(real['actual_value'], 4.8); self.assertAlmostEqual(real['variance'], -7.2)
        self.assertEqual(check_stock_operations.check_purchasing.PurchasingTests.adjust(self, 8, 6)[0], 200)
        self.assertEqual(self.valuation()['value'], 16)

    def test_valuation_fifo_return_restores_original_cost_layers(self):
        self.as_admin(); self.assertEqual(self.cost(10)[0], 200); self.assertEqual(self.method('fifo')[0], 200)
        for cost in [10, 20]:
            input = self.build_input('IN', 10); input['lines'][0]['unit_cost'] = cost
            status, draft = self.save(input); self.assertEqual(status, 200, draft); self.assertEqual(self.action(draft)[0], 200)
        status, draft = self.save(self.build_input('OUT', 12)); self.assertEqual(status, 200, draft)
        status, out = self.action(draft); self.assertEqual(status, 200, out)
        self.assertEqual(self.valuation()['value'], 160)
        for quantity, expected in [(4, 200), (8, 300)]:
            input = self.build_input('RET', quantity); input['origin'] = out['id']
            status, draft = self.save(input); self.assertEqual(status, 200, draft); self.assertEqual(self.action(draft)[0], 200)
            self.assertEqual(self.valuation()['value'], expected)

    def test_valuation_legacy_transit_opening_and_receipt(self):
        self.as_admin()
        line = self.build_input('INT', 4)['lines'][0]
        line.update(description='Ancien transfert', brand='BELDEN', reference='CABLE001', unit='m', sales_line='', origin_line='', unit_cost=0, allocations=[], expected=0, to_location=self.to)
        operation = self.pb.create('inventory_operations', dict(number='MEU/INT/00001', kind='INT', status='transit', warehouse=self.warehouse, destination_warehouse=self.sevres, lines=[line], scope=[], actor=self.user['id'], creation_key='legacy-transit-00000001'))
        for quantity, key in [(10, 'legacy-stock-00000002'), (-4, 'legacy-transit-out-00000001')]:
            self.pb.create('inventory_moves', dict(product=self.item['id'], location=self.location, quantity=quantity, unit='m', kind='INT', reason='Historique', operation_key=key, actor=self.user['id'], operation=operation['id'] if quantity < 0 else ''))
        self.assertTrue(self.valuation()['items'][0]['opening_required'])
        self.assertEqual(self.cost(2, opening=True)[0], 200)
        self.assertEqual(self.valuation()['value'], 20); self.assertEqual(self.valuation()['transit_value'], 8)
        self.assertEqual(self.method('fifo')[0], 400)
        status, done = self.action(operation, 'receive'); self.assertEqual(status, 200, done)
        self.assertEqual(self.valuation()['value'], 20); self.assertEqual(self.valuation()['transit_value'], 0)
        self.assertEqual(self.balance(self.to)['valuation'], 8)

if __name__ == '__main__':
    suite = unittest.TestSuite(StockValuationTests(name) for name in unittest.defaultTestLoader.getTestCaseNames(StockValuationTests) if name.startswith('test_valuation_'))
    result = unittest.TextTestRunner().run(suite)
    raise SystemExit(not result.wasSuccessful())

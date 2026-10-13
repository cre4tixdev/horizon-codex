"""Traceability and internal procurement on disposable PocketBase databases."""
import unittest
import check_stock_operations

class TraceabilityTests(check_stock_operations.StockOperationsTests):
    def tracked(self, kind='serial'):
        status, product = self.pb.request('POST', 'horizon/inventory/products/save', {'id': self.item['id'], 'updated': self.item['updated'], 'input': {**self.product, 'tracking': kind}}, self.token)
        self.assertEqual(status, 200, product); self.item = product
    def receive(self, traces, quantity):
        body = self.build_input(quantity=quantity); body['lines'][0]['traces'] = traces
        status, record = self.save(body); self.assertEqual(status, 200, record)
        status, record = self.action(record); self.assertEqual(status, 200, record)
        return record
    def test_serial_partial_delivery_keeps_identities_and_backorder(self):
        self.tracked()
        receipt = self.receive([dict(number='BL-SERIAL-1', quantity=1), dict(number='BL-SERIAL-2', quantity=1)], 2)
        quote = self.customer_order()
        status, draft = self.prepare_delivery(quote); self.assertEqual(status, 200, draft)
        self.assertEqual(draft['readiness']['ready'], 2)
        quantities = [dict(id=draft['lines'][0]['id'], quantity=2, traces=receipt['lines'][0]['traces'])]
        status, done = self.pb.request('POST', 'horizon/inventory/operations/transition', dict(id=draft['id'], updated=draft['updated'], action='validate', quantities=quantities), self.token)
        self.assertEqual(status, 200, done)
        self.assertEqual(len(done['lines'][0]['traces']), 2)
        self.assertEqual(done['lines'][0]['planned_quantity'], 4)
        self.assertEqual(self.balance()['physical'], 0)
        status, page = self.pb.request('GET', 'horizon/inventory/operations?kind=OUT&status=draft&sales_quote=' + quote['id'], token=self.token)
        self.assertEqual(status, 200, page); self.assertEqual(page['totalItems'], 1)
        self.assertEqual(page['items'][0]['lines'][0]['quantity'], 2)
        self.assertEqual(page['items'][0]['lines'][0]['traces'], [])

    def test_delivery_readiness_and_validation_exclude_quarantined_lots(self):
        self.tracked('lot'); receipt = self.receive([dict(number='BL-LOT', quantity=4)], 4)
        quote = self.customer_order(); status, draft = self.prepare_delivery(quote)
        self.assertEqual(status, 200, draft); self.assertEqual(draft['readiness']['ready'], 4)
        lot = self.pb.request('GET', 'collections/inventory_lots/records/' + receipt['lines'][0]['traces'][0]['lot'], token=self.pb.admin_token)[1]
        status, _ = self.pb.request('POST', 'horizon/inventory/traces/lot', dict(id=lot['id'], updated=lot['updated'], status='quarantine', expiry_date=''), self.token)
        self.assertEqual(status, 200)
        status, ready = self.pb.request('GET', 'horizon/inventory/operations/readiness/' + draft['id'], token=self.token)
        self.assertEqual(status, 200, ready); self.assertEqual(ready['ready'], 0)
        quantities = [dict(id=draft['lines'][0]['id'], quantity=4, traces=receipt['lines'][0]['traces'])]
        status, _ = self.pb.request('POST', 'horizon/inventory/operations/transition', dict(id=draft['id'], updated=draft['updated'], action='validate', quantities=quantities), self.token)
        self.assertIn(status, [400, 409]); self.assertEqual(self.balance()['physical'], 4)

    def test_serial_receipt_delivery_duplicate_and_return(self):
        self.tracked()
        received = self.receive([dict(number='SER-001', quantity=1), dict(number='SER-002', quantity=1)], 2)
        self.assertEqual(self.balance()['physical'], 2)
        traces = received['lines'][0]['traces']; self.assertTrue(traces[0]['serial'])
        status, preview = self.pb.request('POST', 'horizon/documents/preview', dict(stock_operation_id=received['id'], format='html'), self.token); self.assertEqual(status, 200, preview); self.assertIn('SER-001', preview['html']); self.assertIn('Lots / Séries', preview['html'])
        body = self.build_input(quantity=1); body['lines'][0]['traces'] = [dict(number='SER-001', quantity=1)]
        _, duplicate = self.save(body); self.assertEqual(self.action(duplicate)[0], 400)
        self.assertEqual(self.balance()['physical'], 2)
        body = self.build_input('OUT', 1); body['lines'][0]['traces'] = [traces[0]]
        status, outbound = self.save(body); self.assertEqual(status, 200, outbound)
        status, outbound = self.action(outbound); self.assertEqual(status, 200, outbound)
        self.assertEqual(self.balance()['physical'], 1)
        body = self.build_input('RET', 1); body['origin'] = outbound['id']; body['lines'][0]['origin_line'] = outbound['lines'][0]['id']; body['lines'][0]['traces'] = [traces[0]]
        status, returned = self.save(body); self.assertEqual(status, 200, returned)
        status, returned = self.action(returned); self.assertEqual(status, 200, returned)
        self.assertEqual(self.balance()['physical'], 2)
        self.assertEqual(self.pb.request('GET', 'collections/inventory_serials/records', token=self.pb.admin_token)[1]['totalItems'], 2)
    def test_lot_split_transit_and_count(self):
        self.tracked('lot'); received = self.receive([dict(number='LOT-A', quantity=10)], 10)
        trace = received['lines'][0]['traces'][0]
        body = self.build_input('INT', 4); body['destination_warehouse'] = self.sevres; body['lines'][0].update(to_location=self.to, traces=[dict(trace, quantity=4)])
        status, transfer = self.save(body); self.assertEqual(status, 200, transfer)
        status, transfer = self.action(transfer); self.assertEqual(status, 200, transfer)
        self.assertEqual(transfer['status'], 'transit')
        status, transfer = self.action(transfer, 'receive'); self.assertEqual(status, 200, transfer)
        self.assertEqual(self.balance()['physical'], 6); self.assertEqual(self.balance(self.to)['physical'], 4)
        body = self.build_input('INV'); body['scope'] = [self.location]; body['lines'] = []
        _, count = self.save(body); status, count = self.action(count, 'start'); self.assertEqual(status, 200, count)
        self.assertEqual(len(count['lines']), 1); self.assertEqual(count['lines'][0]['expected'], 6)
        edited = {key: count[key] for key in self.build_input()}; edited['lines'][0]['counted'] = 5
        status, count = self.save(edited, record=count); self.assertEqual(status, 200, count)
        status, count = self.action(count); self.assertEqual(status, 200, count)
        self.assertEqual(self.balance()['physical'], 5)
    def test_internal_and_fixed_asset_receipt(self):
        self.tracked()
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['inventory.read', 'inventory.write', 'inventory.stock.validate', 'inventory.stock.reserve', 'inventory.stock.adjust', 'purchasing.read', 'purchasing.write', 'purchasing.order.validate', 'crm.read', 'contacts.read', 'accounting.read', 'accounting.assets.manage']}, self.pb.admin_token)
        line = {**self.input['lines'][0], 'quantity': 2, 'purpose': 'asset', 'allocations': []}
        body = {**self.input, 'opportunity': '', 'supplier': self.supplier['id'], 'delivery_warehouse': self.warehouse, 'lines': [line]}
        status, order = self.pb.request('POST', 'horizon/purchasing/orders/save', {'input': body, 'creation_key': 'internal-order-test-00001'}, self.token); self.assertEqual(status, 200, order)
        status, order = check_stock_operations.check_purchasing.PurchasingTests.transition(self, 'orders', order); self.assertEqual(status, 200, order)
        receipt = self.pb.request('GET', 'horizon/inventory/operations?purchase_order=' + order['id'] + '&kind=IN', token=self.token)[1]['items'][0]
        edited = {key: receipt[key] for key in self.build_input()}; edited['lines'][0].update(to_location=self.location, traces=[dict(number='ASSET-001', quantity=1), dict(number='ASSET-002', quantity=1)])
        status, receipt = self.save(edited, record=receipt); self.assertEqual(status, 200, receipt)
        status, receipt = self.action(receipt); self.assertEqual(status, 200, receipt)
        self.assertEqual(self.balance()['physical'], 0)
        assets = self.pb.request('GET', 'horizon/inventory/assets', token=self.token)[1]; self.assertEqual(assets['totalItems'], 2)
        financial = self.pb.request('GET', 'horizon/accounting/assets', token=self.token)[1]; self.assertEqual(financial['totalItems'], 2)
        fixed = financial['items'][0]; self.assertEqual(fixed['status'], 'draft'); self.assertEqual(fixed['acquisition_cost'], .8)
        values = dict(acquisition_cost=.8, in_service_date='2026-10-12', accounting_reference='SAGE-001', notes='Qualification test')
        status, fixed = self.pb.request('POST', 'horizon/accounting/assets/save', dict(id=fixed['id'], updated=fixed['updated'], action='register', input=values), self.token); self.assertEqual(status, 200, fixed)
        asset = self.pb.request('GET', 'horizon/inventory/assets/' + fixed['internal_asset'], token=self.token)[1]
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/assets/save', dict(id=asset['id'], updated=asset['updated'], action='return_stock'), self.token)[0], 400)
        other = next(item for item in assets['items'] if item['id'] != asset['id'])
        status, returned = self.pb.request('POST', 'horizon/inventory/assets/save', dict(id=other['id'], updated=other['updated'], action='return_stock'), self.token); self.assertEqual(status, 200, returned)
        self.assertEqual(self.balance()['physical'], 1)
        self.assertEqual(returned['status'], 'returned')
        self.assertEqual(self.pb.request('POST', 'horizon/accounting/assets/save', dict(id=fixed['id'], updated=fixed['updated'], action='save', input={**values, 'acquisition_cost': 999}), self.token)[0], 400)
        status, disposed = self.pb.request('POST', 'horizon/accounting/assets/save', dict(id=fixed['id'], updated=fixed['updated'], action='dispose', input={**values, 'acquisition_cost': 999, 'notes': 'Déclassement comptable préalable'}), self.token); self.assertEqual(status, 200, disposed); self.assertEqual(disposed['acquisition_cost'], .8)
        status, asset = self.pb.request('POST', 'horizon/inventory/assets/save', dict(id=asset['id'], updated=asset['updated'], action='return_stock'), self.token); self.assertEqual(status, 200, asset); self.assertEqual(self.balance()['physical'], 2)


    def test_serial_reservation_identity_and_history(self):
        self.tracked(); received = self.receive([dict(number='RES-A', quantity=1), dict(number='RES-B', quantity=1)], 2)
        traces = received['lines'][0]['traces']; quote = check_stock_operations.check_purchasing.PurchasingTests.make_quote(self)
        payload = dict(id=quote['id'], updated=quote['updated'], customer_order_number='', awaiting_customer_order=True, reservations=[dict(source_line=quote['lines'][0]['id'], location=self.location, quantity=1, serial=traces[0]['serial'], lot='')])
        status, quote = self.pb.request('POST', 'horizon/sales/quotes/confirm', payload, self.token); self.assertEqual(status, 200, quote)
        body = self.build_input('OUT', 1); body['lines'][0]['traces'] = [traces[0]]
        _, wrong = self.save(body); self.assertEqual(self.action(wrong)[0], 409)
        status, source = self.pb.request('GET', 'horizon/inventory/operations/source?kind=OUT&sales_quote=' + quote['id'], token=self.token); self.assertEqual(status, 200, source)
        body['sales_quote'] = quote['id']; body['lines'][0].update(source['lines'][0], quantity=1, traces=[traces[0]])
        status, draft = self.save(body); self.assertEqual(status, 200, draft)
        status, done = self.action(draft); self.assertEqual(status, 200, done)
        self.assertEqual(self.balance()['reserved'], 0)
        status, history = self.pb.request('GET', 'horizon/inventory/traces/history?product=' + self.item['id'] + '&serial=' + traces[0]['serial'], token=self.token); self.assertEqual(status, 200, history); self.assertEqual(history['totalItems'], 2)
        status, choices = self.pb.request('GET', 'horizon/inventory/traces?product=' + self.item['id'], token=self.token); self.assertEqual(status, 200, choices); self.assertEqual(sum(row['physical'] for row in choices['items']), 1)
        body = self.build_input('INV'); body.update(scope=[self.location], lines=[]); _, count = self.save(body); status, count = self.action(count, 'start'); self.assertEqual(status, 200, count); self.assertEqual(len(count['lines']), 1)
        values = {key: count[key] for key in self.build_input()}; values['lines'][0]['counted'] = 0
        _, count = self.save(values, record=count); status, count = self.action(count); self.assertEqual(status, 200, count); self.assertEqual(self.balance()['physical'], 0)
        body = self.build_input('INV'); body.update(scope=[self.location], lines=[]); _, found = self.save(body); status, found = self.action(found, 'start'); self.assertEqual(status, 200, found); self.assertEqual(len(found['lines']), 1); self.assertEqual(found['lines'][0]['expected'], 0)
        values = {key: found[key] for key in body}; values['lines'][0]['counted'] = 1; _, found = self.save(values, record=found); status, found = self.action(found); self.assertEqual(status, 200, found); self.assertEqual(self.balance()['physical'], 1)
    def test_internal_request_mixed_receipt_and_access(self):
        body = {**self.input, 'opportunity': '', 'lines': [{**self.input['lines'][0], 'quantity': 2, 'purpose': 'internal'}, {**self.input['lines'][0], 'quantity': 3, 'purpose': 'consumption'}]}
        status, req = check_stock_operations.check_purchasing.PurchasingTests.save_request(self, body); self.assertEqual(status, 200, req)
        status, req = check_stock_operations.check_purchasing.PurchasingTests.transition(self, 'requests', req); self.assertEqual(status, 200, req)
        orders = check_stock_operations.check_purchasing.PurchasingTests.order(self, req)[1]['items']; self.assertEqual(len(orders), 1)
        order = orders[0]; self.assertEqual([line['purpose'] for line in order['lines']], ['internal', 'consumption'])
        status, order = check_stock_operations.check_purchasing.PurchasingTests.transition(self, 'orders', order); self.assertEqual(status, 200, order)
        receipt = self.pb.request('GET', 'horizon/inventory/operations?purchase_order=' + order['id'] + '&kind=IN', token=self.token)[1]['items'][0]
        status, receipt = self.action(receipt); self.assertEqual(status, 200, receipt); self.assertEqual(self.balance()['physical'], 0)
        status, assets = self.pb.request('GET', 'horizon/inventory/assets', token=self.token); self.assertEqual(status, 200, assets); self.assertEqual(assets['totalItems'], 2)
        self.assertNotIn('acquisition_cost', assets['items'][0]); self.assertEqual(self.pb.request('GET', 'horizon/accounting/assets', token=self.token)[0], 403)
        self.assertEqual(self.pb.request('GET', 'collections/inventory_internal_assets/records', token=self.token)[0], 403)
        internal = self.pb.request('GET', 'horizon/inventory/operations?kind=OUT&variant=internal', token=self.token)[1]['items'][0]
        values = self.build_input('RET', 1); values['origin'] = internal['id']; values['lines'][0]['origin_line'] = internal['lines'][0]['id']
        self.assertEqual(self.save(values)[0], 400)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/operations?kind=OUT&variant=delivery', token=self.token)[1]['totalItems'], 0)
    def test_tracking_lock_and_lot_quarantine(self):
        self.stock()
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/products/save', {'id': self.item['id'], 'updated': self.item['updated'], 'input': {**self.product, 'tracking': 'serial'}}, self.token)[0], 400)
        self.assertEqual(self.pb.request('GET', 'collections/inventory_serials/records', token=self.token)[0], 403)

    def test_lot_quarantine_count_and_version(self):
        self.tracked('lot'); receipt = self.receive([dict(number='LOT-QUAR', quantity=10)], 10)
        status, result = self.pb.request('GET', 'horizon/inventory/traces?product=' + self.item['id'], token=self.token); self.assertEqual(status, 200, result); trace = result['items'][0]
        body = dict(id=trace['lot'], updated=trace['updated'], status='quarantine', expiry_date='2027-10-12')
        status, lot = self.pb.request('POST', 'horizon/inventory/traces/lot', body, self.token); self.assertEqual(status, 200, lot)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/traces/lot', body, self.token)[0], 409)
        values = self.build_input('OUT', 1); values['lines'][0]['traces'] = [dict(receipt['lines'][0]['traces'][0], quantity=1)]
        _, out = self.save(values); self.assertEqual(self.action(out)[0], 400)
        values = self.build_input('INV'); values.update(scope=[self.location], lines=[]); _, count = self.save(values); _, count = self.action(count, 'start'); values = {key: count[key] for key in values}; values['lines'][0]['counted'] = 8
        _, count = self.save(values, record=count); status, count = self.action(count); self.assertEqual(status, 200, count); self.assertEqual(self.balance()['physical'], 8)
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/traces/lot', dict(body, updated=lot['updated'], status='closed'), self.token)[0], 400)
        status, lot = self.pb.request('POST', 'horizon/inventory/traces/lot', dict(body, updated=lot['updated'], status='active'), self.token); self.assertEqual(status, 200, lot)

    def test_asset_assignment_respects_hr_scope(self):
        self.stock(1); values = self.build_input('OUT', 1); values['lines'][0]['purpose'] = 'internal'; _, out = self.save(values); status, out = self.action(out); self.assertEqual(status, 200, out)
        asset = self.pb.request('GET', 'horizon/inventory/assets', token=self.token)[1]['items'][0]
        team = self.pb.create('core_teams', dict(code='BE-ASSET', name='BE', active=True))
        person = self.pb.create('hr_employees', dict(first_name='Alice', last_name='Asset', employment_type='employee', status='active', team=team['id']))
        own = self.pb.create('hr_employees', dict(first_name='Bob', last_name='Scope', employment_type='employee', status='active'))
        _, role = self.pb.request('GET', 'collections/core_roles/records/' + self.user['role'], token=self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], dict(permissions=role['permissions'] + ['hr.read']), self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], dict(hr_scope='all'), self.pb.admin_token)
        fields = {key: asset[key] for key in ['name', 'warehouse', 'location', 'assigned_employee', 'assigned_team', 'status', 'notes']}; fields.update(assigned_employee=person['id'], assigned_team=team['id'], status='assigned')
        status, asset = self.pb.request('POST', 'horizon/inventory/assets/save', dict(id=asset['id'], updated=asset['updated'], action='save', input=fields), self.token); self.assertEqual(status, 200, asset); self.assertEqual(asset['assigned_name'], 'Alice Asset')
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], dict(hr_scope='self', employee=own['id']), self.pb.admin_token)
        status, limited = self.pb.request('GET', 'horizon/inventory/assets/' + asset['id'], token=self.token); self.assertEqual(status, 200, limited); self.assertEqual(limited['assigned_employee'], ''); self.assertEqual(limited['assigned_name'], ''); self.assertFalse(limited['can_assign'])
        fields.update(assigned_employee='', assigned_team='', notes='Information opérationnelle sans modifier une affectation masquée')
        status, limited = self.pb.request('POST', 'horizon/inventory/assets/save', dict(id=asset['id'], updated=asset['updated'], action='save', input=fields), self.token); self.assertEqual(status, 200, limited)
        stored = self.pb.request('GET', 'collections/inventory_internal_assets/records/' + asset['id'], token=self.pb.admin_token)[1]; self.assertEqual(stored['assigned_employee'], person['id'])

    def test_fractional_lots_cannot_create_partial_internal_assets(self):
        self.tracked('lot'); values = self.build_input('IN', 1); values['lines'][0].update(purpose='internal', traces=[dict(number='PART-A', quantity=.5), dict(number='PART-B', quantity=.5)])
        status, receipt = self.save(values); self.assertEqual(status, 200, receipt); self.assertEqual(self.action(receipt)[0], 400); self.assertEqual(self.balance()['physical'], 0)
        self.assertEqual(self.pb.request('GET', 'collections/inventory_lots/records', token=self.pb.admin_token)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/assets', token=self.token)[1]['totalItems'], 0)
        values['lines'][0]['traces'] = [dict(number='PART-A', quantity=1)]
        status, receipt = self.save(values, record=receipt); self.assertEqual(status, 200, receipt); status, receipt = self.action(receipt); self.assertEqual(status, 200, receipt); self.assertEqual(self.balance()['physical'], 0)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/assets', token=self.token)[1]['totalItems'], 1)
    def test_traced_dropship(self):
        self.tracked(); quote, order = self.sourced_purchase()
        status, source = self.pb.request('GET', f'horizon/inventory/operations/source?kind=OUT&purchase_order={order["id"]}&sales_quote={quote["id"]}&dropship=true', token=self.token); self.assertEqual(status, 200, source)
        values = self.build_input('OUT', 2); values.update(dropship=True, purchase_order=order['id'], sales_quote=quote['id']); values['lines'][0].update(source['lines'][0], quantity=2, traces=[dict(number='DIRECT-1', quantity=1), dict(number='DIRECT-2', quantity=1)])
        _, draft = self.save(values); status, done = self.action(draft); self.assertEqual(status, 200, done); self.assertEqual(self.balance()['physical'], 0)
        status, choices = self.pb.request('GET', 'horizon/inventory/traces?product=' + self.item['id'], token=self.token); self.assertEqual(status, 200, choices); self.assertEqual({row['status'] for row in choices['items']}, {'delivered'}); self.assertEqual(len(choices['items']), 2)
        trace = choices['items'][0]; status, history = self.pb.request('GET', 'horizon/inventory/traces/history?product=' + self.item['id'] + '&serial=' + trace['serial'], token=self.token); self.assertEqual(status, 200, history); self.assertEqual(history['items'][0]['location'], 'Livraison directe')
        self.assertEqual(self.pb.request('POST', 'horizon/inventory/stock/adjust', dict(product=self.item['id'], location=self.location, physical=10, expected=0, reason='Bypass', operation_key='test-trace-bypass-0001'), self.token)[0], 400)

if __name__ == '__main__': unittest.main(verbosity=2)

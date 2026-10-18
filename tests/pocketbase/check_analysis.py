"""Analytic root/children, immutable sources, aggregate permissions and stock costs."""
import copy
import json
import sqlite3
import subprocess
import unittest
import uuid
import check_stock_operations
import check_purchasing
import check_catalog

class AnalysisTests(unittest.TestCase):
    def setUp(self):
        check_stock_operations.StockOperationsTests.setUp(self)
        self.rights = self.pb.request('GET', 'collections/core_roles/records/' + self.user['role'], token=self.pb.admin_token)[1]['permissions']
        self.grant(['read', 'financial'])
    def grant(self, actions, scope='all'):
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': self.rights + ['analysis.' + action for action in actions]}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'access_grants': {'analysis': {'actions': actions, 'scope': scope}}}, self.pb.admin_token)
    def command(self, price=1.08):
        status, quote = check_catalog.CatalogTests.quote_save(self, key=str(uuid.uuid4()), lines=[dict(product=self.item['id'], description='Câble', quantity=10, unit='m', unit_price=price, unit_cost=0.8)])
        self.assertEqual(status, 200, quote)
        status, quote = self.pb.request('POST', 'horizon/sales/quotes/finalize', dict(id=quote['id'], updated=quote['updated']), self.token)
        self.assertEqual(status, 200, quote)
        status, quote = self.pb.request('POST', 'horizon/sales/quotes/confirm', dict(id=quote['id'], updated=quote['updated'], customer_order_number='', awaiting_customer_order=True), self.token)
        self.assertEqual(status, 200, quote)
        return quote
    def report(self, quote=None, token=None):
        status, data = self.pb.request('GET', 'horizon/analysis/report?' + ('quote=' + quote['id'] if quote else 'opportunity=' + self.opp['id']), token=token or self.token)
        self.assertEqual(status, 200, data)
        return data
    def test_hierarchy_consolidation_and_reconfirmation(self):
        self.pb.request('PATCH', 'collections/crm_opportunities/records/' + self.opp['id'], {'estimated_value': 1000}, self.pb.admin_token)
        first, second = self.command(), self.command(2)
        data = self.report()
        self.assertEqual([row['code'] for row in data['accounts']], [self.opp['opportunity_number'], first['quote_number'], second['quote_number']])
        self.assertEqual(data['totals']['financial']['estimated_revenue'], 1000)
        self.assertEqual(data['totals']['financial']['revenue'], 30.8)
        self.assertEqual(data['totals']['financial']['planned_cost'], 16)
        child = self.report(first)['accounts'][0]['id']
        self.assertEqual(self.report(first)['totals']['financial']['revenue'], 10.8)
        original = self.pb.request('GET', 'collections/sales_orders/records/' + first['order']['id'], token=self.pb.admin_token)[1]
        self.assertEqual(original['analytic_account'], self.opp['analytic_account'])
        self.assertEqual(original['analytic_child'], child)
        status, reopened = self.pb.request('POST', 'horizon/sales/quotes/reopen', dict(id=first['id'], updated=first['updated'], target='validated'), self.token)
        self.assertEqual(status, 200, reopened)
        status, again = self.pb.request('POST', 'horizon/sales/quotes/confirm', dict(id=first['id'], updated=reopened['updated'], awaiting_customer_order=True), self.token)
        self.assertEqual(status, 200, again)
        self.assertEqual(self.report(first)['accounts'][0]['id'], child)
        self.assertEqual(self.report()['totals']['financial']['revenue'], 30.8)
        self.assertEqual(self.pb.request('PATCH', 'collections/accounting_analytic_accounts/records/' + child, {'code': 'changed'}, self.token)[0], 403)
    def test_scopes_and_financial_projection(self):
        quote = self.command()
        self.grant(['read'])
        data = self.report()
        self.assertNotIn('financial', data['totals'])
        self.assertTrue(all('financial' not in row for row in data['accounts']))
        self.assertNotIn('unit_cost', json.dumps(data))
        self.assertFalse(data['capabilities']['labor_costs'])
        dashboard = self.pb.request('GET', 'horizon/dashboard/metrics?from=2026-10-01&to=2026-10-31', token=self.token)[1]
        self.assertTrue(all(dashboard[key] is None for key in ['forecast', 'ordered', 'margin', 'committed']))
        self.grant(['read', 'financial'], 'own')
        # The seeded affair belongs to this user; another owner immediately removes access.
        self.assertEqual(self.report()['totals']['financial']['revenue'], 10.8)
        role = self.pb.create('core_roles', dict(name='another_owner', label='Owner', active=True, permissions=['crm.read']))
        other = self.pb.create_user('another-owner@local.invalid', role['id'])
        self.pb.request('PATCH', 'collections/crm_opportunities/records/' + self.opp['id'], {'owner': other['id']}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', 'horizon/analysis/report?quote=' + quote['id'], token=self.token)[0], 403)
        status, listing = self.pb.request('GET', 'horizon/analysis/affairs?q=studio', token=self.token)
        self.assertEqual(status, 200, listing)
        self.assertEqual(listing['items'], [])
        self.assertEqual(listing['totalItems'], 0)
        dashboard = self.pb.request('GET', 'horizon/dashboard/metrics?from=2026-10-01&to=2026-10-31', token=self.token)[1]
        self.assertEqual(dashboard['ordered']['values'], [])
        self.grant(['read', 'financial'], 'all')
        self.assertEqual(self.report()['totals']['financial']['revenue'], 10.8)
        status, listing = self.pb.request('GET', 'horizon/analysis/affairs', token=self.token)
        self.assertEqual(status, 200, listing)
        self.assertEqual(listing['totalItems'], 1)
        self.assertEqual(listing['items'][0]['totals']['financial']['revenue'], 10.8)
        self.grant([])
        self.assertEqual(self.pb.request('GET', 'horizon/analysis/report?opportunity=' + self.opp['id'], token=self.token)[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/analysis/report?opportunity=' + self.opp['id'])[0], 401)
    def test_purchase_child_and_common_costs_are_not_double_counted(self):
        quote = self.command()
        input = copy.deepcopy(self.input)
        input.update(source_order='', supplier=self.supplier['id'], owner=self.user['id'], delivery_warehouse=self.warehouse)
        input['lines'][0]['allocations'] = [{'opportunity': self.opp['id'], 'order': quote['order']['id'], 'quantity': 3}, {'opportunity': self.opp['id'], 'quantity': 3}]
        status, order = self.pb.request('POST', 'horizon/purchasing/orders/save', dict(input=input, creation_key=str(uuid.uuid4())), self.token)
        self.assertEqual(status, 200, order)
        self.assertEqual(self.report()['totals']['financial']['purchases_committed'], 0)
        status, order = check_purchasing.PurchasingTests.transition(self, 'orders', order)
        self.assertEqual(status, 200, order)
        data = self.report()
        self.assertEqual(data['totals']['financial']['purchases_committed'], 4.8)
        self.assertEqual(data['accounts'][0]['financial']['purchases_committed'], 2.4)
        self.assertEqual(self.report(quote)['totals']['financial']['purchases_committed'], 2.4)
        self.assertEqual(data['totals']['financial']['stock_consumed'], 0)
        owner_role = self.pb.create('core_roles', dict(name='purchase_other_owner', label='Owner', active=True, permissions=['crm.read']))
        owner = self.pb.create_user('purchase-other-owner@local.invalid', owner_role['id'])
        status, other = self.pb.request('POST', 'horizon/crm/save', {'creation_key': str(uuid.uuid4()), 'input': dict(title='Autre affaire', company=self.opp['company'], contact='', owner=owner['id'], stage=self.opp['stage'], type='direct', estimated_value=0, estimated_cost=0, currency='EUR', probability=0, expected_date='', description='', status='open', market_types=[])}, self.token)
        self.assertEqual(status, 200, other)
        shared = copy.deepcopy(input)
        shared['lines'][0]['allocations'] = [{'opportunity': self.opp['id'], 'quantity': 3}, {'opportunity': other['id'], 'quantity': 3}]
        status, shared_order = self.pb.request('POST', 'horizon/purchasing/orders/save', dict(input=shared, creation_key=str(uuid.uuid4())), self.token)
        self.assertEqual(status, 200, shared_order)
        self.assertEqual(check_purchasing.PurchasingTests.transition(self, 'orders', shared_order)[0], 200)
        self.grant(['read', 'financial'], 'own')
        metrics = self.pb.request('GET', 'horizon/dashboard/metrics?from=2026-10-01&to=2026-10-31', token=self.token)[1]
        self.assertEqual(metrics['committed']['values'][0]['amount'], 7.2)
        self.assertEqual(self.report()['totals']['financial']['purchases_committed'], 7.2)
        invalid = copy.deepcopy(input); invalid['lines'][0]['allocations'][0]['opportunity'] = ''
        self.assertEqual(self.pb.request('POST', 'horizon/purchasing/orders/save', dict(input=invalid, creation_key=str(uuid.uuid4())), self.token)[0], 400)
    def test_stock_consumption_preserves_valuation_and_command_identity(self):
        quote = self.command()
        check_stock_operations.StockOperationsTests.stock(self, 10)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': self.rights + ['settings.references', 'analysis.read', 'analysis.financial']}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'admin'}, self.pb.admin_token)
        valuation = self.pb.request('GET', 'horizon/inventory/valuation?product=' + self.item['id'], token=self.token)[1]
        status, result = self.pb.request('POST', 'horizon/inventory/valuation/method', dict(method='cump', updated=valuation['settings_updated'], reason='CUMP test analyse'), self.token)
        self.assertEqual(status, 200, result)
        receipt = check_stock_operations.StockOperationsTests.build_input(self, 'IN', 10)
        receipt['lines'][0]['unit_cost'] = 1.2
        status, draft = check_stock_operations.StockOperationsTests.save(self, receipt)
        self.assertEqual(status, 200, draft)
        self.assertEqual(check_stock_operations.StockOperationsTests.action(self, draft)[0], 200)
        input = check_stock_operations.StockOperationsTests.build_input(self, 'OUT', 5)
        input['sales_quote'] = quote['id']
        status, source = self.pb.request('GET', 'horizon/inventory/operations/source?kind=OUT&sales_quote=' + quote['id'], token=self.token)
        self.assertEqual(status, 200, source)
        input['lines'][0].update(source_line=source['lines'][0]['source_line'])
        status, draft = check_stock_operations.StockOperationsTests.save(self, input)
        self.assertEqual(status, 200, draft)
        status, operation = check_stock_operations.StockOperationsTests.action(self, draft)
        self.assertEqual(status, 200, operation)
        data = self.report(quote)
        self.assertEqual(data['totals']['financial']['stock_consumed'], 5)
        self.assertEqual(self.report()['accounts'][0]['financial']['stock_consumed'], 0)
        moves = self.pb.request('GET', 'collections/inventory_moves/records?filter=operation%3D%22' + operation['id'] + '%22', token=self.pb.admin_token)[1]['items']
        self.assertTrue(all(move['analytic_account'] == data['accounts'][0]['id'] for move in moves))
        self.assertEqual(data['totals']['financial']['planned_cost'], 8)
    def test_analysis_grants_are_independent_readonly_and_scoped(self):
        role = self.pb.create('core_roles', dict(name='analysis_admin', label='Admin', active=True, permissions=[]))
        admin = self.pb.create_user('analysis-admin@local.invalid', role['id'], profile='admin')
        token = self.pb.login('analysis-admin@local.invalid')[1]['token']
        input = dict(name='Analyste', email='analyst@local.invalid', active=True, erp_profile='viewer', employee='', password='Local-Analysis-Test-2026!', grants={'analysis': {'actions': ['read', 'financial'], 'scope': 'own'}})
        status, user = self.pb.request('POST', 'horizon/access/users/save', {'input': input}, token)
        self.assertEqual(status, 200, user)
        self.assertEqual(user['grants']['analysis']['scope'], 'own')
        analyst = self.pb.login(input['email'], input['password'])[1]['token']
        self.assertEqual(self.pb.request('GET', 'horizon/analysis/report?opportunity=' + self.opp['id'], token=analyst)[0], 403)
        input.update(email='invalid-analyst@local.invalid', grants={'analysis': {'actions': ['read', 'labor_costs'], 'scope': 'all'}})
        self.assertEqual(self.pb.request('POST', 'horizon/access/users/save', {'input': input}, token)[0], 400)
        input.update(email='invalid-scope@local.invalid', grants={'analysis': {'actions': ['read'], 'scope': 'team'}})
        self.assertEqual(self.pb.request('POST', 'horizon/access/users/save', {'input': input}, token)[0], 400)
        modules = self.pb.request('GET', 'horizon/access/users', token=token)[1]['modules']
        self.assertEqual(next(item for item in modules if item['key'] == 'analysis')['scopes'], ['own', 'all'])

    def test_be_production_hours_root_children_and_validation(self):
        first, second = self.command(), self.command(2)
        initial = self.report()
        self.assertTrue(initial['coverage']['time'])
        self.assertFalse(initial['coverage']['planning'])
        accounts = {row['code']: row['id'] for row in initial['accounts']}
        root = self.opp['analytic_account']
        child = accounts[first['quote_number']]
        account_collection = self.pb.request('GET', 'collections/accounting_analytic_accounts', token=self.pb.admin_token)[1]['id']
        for name, amount in [('planning_assignments', 'planned_minutes')]:
            status, collection = self.pb.request('POST', 'collections', dict(name=name, type='base', listRule=None, viewRule=None, createRule=None, updateRule=None, deleteRule=None, fields=[dict(name='analytic_account', type='relation', collectionId=account_collection, maxSelect=1), dict(name='work_type', type='text'), dict(name=amount, type='number'), dict(name='status', type='text')]), self.pb.admin_token)
            self.assertEqual(status, 200, collection)
        for account, work, minutes, status in [(root, 'be', 120, 'validated'), (child, 'be', 60, 'validated'), (child, 'production', 90, 'validated'), (root, 'production', 45, 'draft'), (root, 'be', 600, 'cancelled')]:
            # Trusted disposable DB fixture for the read-only projection, including legacy statuses.
            # Public/native mutations of TimeReport remain forbidden and tested separately.
            with sqlite3.connect(self.pb.data / 'data.db') as db:
                db.execute('INSERT INTO time_entries(id,sheet_line,date,analytic_account,work_type,duration_minutes,status) VALUES (?,?,?,?,?,?,?)', (uuid.uuid4().hex[:15], uuid.uuid4().hex[:15], '2026-10-19', account, work, minutes, status))
        self.pb.create('planning_assignments', dict(analytic_account=root, work_type='be', planned_minutes=240))
        self.pb.create('planning_assignments', dict(analytic_account=child, work_type='production', planned_minutes=180))
        data = self.report()
        self.assertTrue(data['coverage']['time']); self.assertTrue(data['coverage']['planning'])
        self.assertEqual(data['totals']['hours']['be'], dict(planned_minutes=240, actual_minutes=180, pending_minutes=0))
        self.assertEqual(data['totals']['hours']['production'], dict(planned_minutes=180, actual_minutes=90, pending_minutes=45))
        self.assertEqual(data['accounts'][0]['hours']['be']['actual_minutes'], 120)
        self.assertEqual(self.report(first)['totals']['hours']['be']['actual_minutes'], 60)
        self.assertEqual(self.report(second)['totals']['hours']['be']['actual_minutes'], 0)
        self.assertIsNone(data['totals']['financial']['actual_labor_cost']);self.assertFalse(data['coverage']['labor_costs'])
        with sqlite3.connect(self.pb.data / 'data.db') as db:
            for id,minutes in db.execute('SELECT id,duration_minutes FROM time_entries WHERE status="validated"').fetchall():
                db.execute('UPDATE time_entries SET cost_snapshot=? WHERE id=?',(json.dumps(dict(status='supplied',currency='EUR',amount=minutes/60*20)),id))
        costs=self.report();self.assertEqual(costs['totals']['financial']['actual_labor_cost'],90);self.assertTrue(costs['coverage']['labor_costs']);self.assertEqual(self.report(first)['totals']['financial']['actual_labor_cost'],50)
        with sqlite3.connect(self.pb.data / 'data.db') as db:
            db.execute('UPDATE time_entries SET cost_snapshot=? WHERE analytic_account=? AND status="validated"',(json.dumps(dict(status='supplied',currency='USD',amount=20)),root))
        self.assertIsNone(self.report()['totals']['financial']['actual_labor_cost'])
        self.grant(['read'])
        operational = self.report()
        self.assertEqual(operational['totals']['hours']['be']['actual_minutes'], 180)
        self.assertNotIn('financial', operational['totals'])
        self.assertNotIn('employee', json.dumps(operational))

    def test_upgrade_links_orders_without_rewriting_snapshots(self):
        quote = self.command()
        order = self.pb.request('GET', 'collections/sales_orders/records/' + quote['order']['id'], token=self.pb.admin_token)[1]
        self.pb.process.terminate(); self.pb.process.wait(timeout=5)
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            connection.execute("UPDATE sales_orders SET analytic_child = ''")
            connection.execute("DELETE FROM accounting_analytic_accounts WHERE source_quote != ''")
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791710014_analytic_order_accounts.js',))
        # The migration is also idempotent when its additive fields already exist.
        subprocess.run(self.pb.args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        self.pb.launch_and_authenticate(self.pb.args)
        saved = self.pb.request('GET', 'collections/sales_orders/records/' + order['id'], token=self.pb.admin_token)[1]
        self.assertEqual(saved['quote_snapshot'], order['quote_snapshot'])
        self.assertEqual(saved['subtotal'], order['subtotal'])
        self.assertEqual(saved['analytic_account'], order['analytic_account'])
        self.assertTrue(saved['analytic_child'])

# Reuse fixture helpers without inheriting unrelated test cases.
for name in ['build_input', 'save', 'action', 'balance']:
    setattr(AnalysisTests, name, getattr(check_stock_operations.StockOperationsTests, name))
if __name__ == '__main__': unittest.main(verbosity=2)

"""Dashboard projections: permissions, periods, snapshots and currency isolation."""
import unittest
import sqlite3
import uuid
import check_sales

class DashboardTests(unittest.TestCase):
    def setUp(self):
        check_sales.SalesTests.setUp(self)
        rights = self.pb.request('GET', 'collections/core_roles/records/' + self.user['role'], token=self.pb.admin_token)[1]['permissions']
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': rights + ['analysis.read', 'analysis.financial']}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'access_grants': {'analysis': {'actions': ['read', 'financial'], 'scope': 'all'}}}, self.pb.admin_token)
    quote_save = check_sales.SalesTests.quote_save
    def tearDown(self): self.pb.close()
    def metrics(self, start='2026-10-01', end='2026-10-31', token=None):
        return self.pb.request('GET', f'horizon/dashboard/metrics?from={start}&to={end}', token=token or self.token)
    def order(self, number, amount, cost, currency='EUR', date='2026-10-10T12:00:00Z', status='confirmed'):
        return self.pb.create('sales_orders', dict(order_number=number, quote=self.quote_record['id'], opportunity=self.opp['id'], analytic_account=self.opp['analytic_account'], company=self.company['id'], owner=self.user['id'], status=status, order_date=date, subtotal=amount, currency=currency, exchange_rate=1, quote_snapshot=dict(subtotal=amount, cost_total=cost)))
    def test_period_currency_snapshots_and_permission_boundaries(self):
        status, self.quote_record = self.quote_save(); self.assertEqual(status, 200, self.quote_record)
        self.order('EUR-1', 100, 60)
        self.order('EUR-2', 50, 30)
        self.order('USD-1', 250, 200, 'USD')
        self.order('NEXT', 999, 1, date='2026-11-01T12:00:00Z')
        self.order('CANCEL', 999, 1, status='cancelled')
        self.order('DRAFT', 999, 1, status='draft')
        # 22:30 UTC in September is already October in Paris.
        self.order('PARIS', 10, 4, date='2026-09-30T22:30:00Z')
        status, result = self.metrics(); self.assertEqual(status, 200, result)
        self.assertEqual(result['ordered']['values'], [dict(currency='EUR', amount=160, count=3, percent=None), dict(currency='USD', amount=250, count=1, percent=None)])
        self.assertEqual(result['margin']['values'][0], dict(currency='EUR', amount=66, count=3, percent=41.25))
        curve = result['ordered']['trend']
        self.assertEqual(curve['step'], 'day')
        self.assertEqual(curve['dates'][0], '2026-10-01')
        self.assertEqual(curve['dates'][-1], '2026-10-31')
        self.assertEqual(curve['series'][0]['values'][0], 10)  # Europe/Paris midnight boundary
        self.assertEqual(sum(curve['series'][0]['values']), 160)
        self.assertEqual(sum(curve['series'][1]['values']), 250)
        self.assertEqual(sum(result['margin']['trend']['series'][0]['values']), 66)
        self.assertEqual(result['forecast']['values'], [])
        self.assertIsNone(result['committed'])
        self.assertEqual(self.pb.request('PATCH', 'collections/sales_quotes/records/' + self.quote_record['id'], {'cost_total': 999}, self.pb.admin_token)[0], 200)
        self.assertEqual(self.metrics()[1]['margin']['values'], result['margin']['values'])
        status, december = self.metrics('2026-12-01', '2026-12-31'); self.assertEqual(status, 200, december)
        self.assertEqual(december['forecast']['values'][0]['amount'], 12000)
        self.assertEqual(december['ordered']['values'], [])
        status, reader = self.metrics(token=self.reader_token); self.assertEqual(status, 200, reader)
        self.assertIsNone(reader['forecast']); self.assertIsNone(reader['ordered']); self.assertIsNone(reader['margin'])
        self.assertEqual(self.metrics('2026-10-01', '2026-12-31')[1]['ordered']['trend']['step'], 'week')
        self.assertEqual(self.metrics('2026-01-01', '2026-12-31')[1]['ordered']['trend']['step'], 'month')
        self.assertEqual(self.metrics('2026-02-30')[0], 400)
        self.assertEqual(self.metrics('2024-01-01', '2026-10-31')[0], 400)
    def test_committed_purchases_are_period_filtered_and_exclude_drafts(self):
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['purchasing.read', 'crm.read', 'analysis.read', 'analysis.financial']}, self.pb.admin_token)
        for number, state, amount, date in [('BC-1', 'validated', 45.5, '2026-10-05T12:00:00Z'), ('BC-2', 'draft', 500, '2026-10-05T12:00:00Z'), ('BC-3', 'cancelled', 600, '2026-10-05T12:00:00Z'), ('BC-4', 'received', 22.25, '2026-10-06T12:00:00Z'), ('BC-5', 'validated', 1000, '2026-11-05T12:00:00Z')]:
            self.pb.create('purchasing_orders', dict(order_number=number, title=number, supplier=self.company['id'], currency='EUR', status=state, subtotal=amount, validated_at=date, created_by=self.user['id'], owner=self.user['id'], creation_key=str(uuid.uuid4())))
        status, result = self.metrics(); self.assertEqual(status, 200, result)
        self.assertEqual(result['committed']['values'][0], dict(currency='EUR', amount=67.75, count=2, percent=None))
        self.assertIsNone(result['ordered'])

    def test_personal_tasks_keep_source_permissions_dates_and_status(self):
        for name, assigned, due in [('Call', self.user['id'], '2026-10-12'), ('Other user', self.reader['id'], '2026-10-12'), ('Later', self.user['id'], '2026-12-12')]:
            status, result = self.pb.request('POST', 'collections/core_activity_events/records', dict(source_module='crm', source_entity='crm_opportunities', source_record_id=self.opp['id'], type='task', body=name, metadata=dict(task=dict(title=name, assigned_to=assigned, priority='normal', due_date=due))), self.token)
            self.assertEqual(status, 200, result)
        status, result = self.pb.request('GET', 'horizon/dashboard/tasks?from=2026-10-11&to=2026-10-17', token=self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual([item['title'] for item in result['items']], ['Call'])
        self.assertEqual(self.pb.request('GET', 'horizon/calendar/events?from=2026-10-11T00:00:00.000Z&to=2026-10-18T00:00:00.000Z&owner=' + self.user['id'], token=self.token)[0], 200)
        self.assertEqual(self.pb.request('PATCH', 'collections/core_tasks/records/' + result['items'][0]['id'], {'status': 'done'}, self.token)[0], 200)
        self.assertEqual(self.pb.request('GET', 'horizon/dashboard/tasks?from=2026-10-11&to=2026-10-17', token=self.token)[1]['items'], [])

    def test_activity_filters_modules_and_ignores_deleted_sources(self):
        status, quote = self.quote_save(); self.assertEqual(status, 200, quote)
        status, result = self.pb.request('GET', 'horizon/dashboard/activity', token=self.reader_token)
        self.assertEqual(status, 200, result)
        self.assertTrue(result['items'])
        self.assertTrue(all(item['href'].startswith('/crm/') for item in result['items']))
        orphan = result['items'][0]['id']
        # Legacy orphan fixture only; never alter live data to build the projection.
        with sqlite3.connect(self.pb.data / 'data.db') as database:
            database.execute('UPDATE core_activity_events SET source_record_id = ? WHERE id = ?', ('orphan1234567890', orphan))
        status, result = self.pb.request('GET', 'horizon/dashboard/activity', token=self.reader_token)
        self.assertEqual(status, 200, result)
        self.assertTrue(all(item['id'] != orphan for item in result['items']))
        self.assertEqual(self.pb.request('GET', 'horizon/dashboard/metrics?from=2026-01-01&to=2026-12-31')[0], 401)

if __name__ == '__main__': unittest.main(verbosity=2)

"""Personal dashboard layouts: migration, ownership, validation, atomic revisions."""
import unittest
from concurrent.futures import ThreadPoolExecutor
from check_auth import LocalPocketBase

class DashboardLayoutTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.addCleanup(self.pb.close)
        self.token = self.pb.login()[1]['token']
        self.second = self.pb.login('other@local.invalid')[1]['token']
        self.path = 'horizon/dashboard/layouts'
        self.preference = {'defaultId': 'work', 'dashboards': [{'id': 'work', 'name': 'Mon suivi', 'widgets': [{'type': 'forecast', 'width': 3, 'height': 2}, {'type': 'activity', 'width': 6, 'height': 4}]}]}

    def save(self, revision=0, preference=None, token=None, extra=None):
        return self.pb.request('POST', self.path, {'revision': revision, 'preference': preference if preference is not None else self.preference, **(extra or {})}, token or self.token)

    def test_defaults_persistence_isolation_and_locked_collection(self):
        self.assertEqual(self.pb.request('GET', self.path)[0], 401)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1], {'revision': 0, 'preference': {'defaultId': 'horizon', 'dashboards': []}})
        status, result = self.save()
        self.assertEqual(status, 200, result)
        self.assertEqual(result, {'revision': 1, 'preference': self.preference})
        self.assertEqual(self.pb.request('GET', self.path, token=self.second)[1]['revision'], 0)
        other = {'defaultId': 'horizon', 'dashboards': []}
        self.assertEqual(self.save(preference=other, token=self.second)[0], 200)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1], result)
        self.assertEqual(self.save(1, extra={'user': 'someone'})[0], 400)
        records = self.pb.request('GET', 'collections/dashboard_preferences/records', token=self.pb.admin_token)[1]['items']
        self.assertEqual(len(records), 2)
        for row in records:
            self.assertNotEqual(self.pb.request('GET', 'collections/dashboard_preferences/records/' + row['id'], token=self.token)[0], 200)
            self.assertNotEqual(self.pb.request('PATCH', 'collections/dashboard_preferences/records/' + row['id'], {'preference': other}, self.token)[0], 200)
            self.assertNotEqual(self.pb.request('DELETE', 'collections/dashboard_preferences/records/' + row['id'], token=self.token)[0], 204)
        self.assertNotEqual(self.pb.request('POST', 'collections/dashboard_preferences/records', {}, self.token)[0], 200)
        self.pb.process.terminate(); self.pb.process.wait(timeout=5)
        self.pb.launch_and_authenticate(self.pb.args)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1], result)
        audits = self.pb.request('GET', 'collections/core_audit/records?filter=entity%3D%22dashboard_preferences%22', token=self.pb.admin_token)[1]
        self.assertEqual(audits['totalItems'], 2)

    def test_bounds_and_default_consistency(self):
        invalid = []
        for change in [{'id': 'horizon'}, {'name': ''}, {'name': 'x' * 81}, {'name': '\nunsafe'}, {'widgets': [{'type': 'activity', 'width': 1, 'height': 2}]}, {'widgets': [{'type': 'business', 'width': 6, 'height': 1}]}, {'widgets': [{'type': 'other', 'width': 6, 'height': 4}]}, {'widgets': [{'type': ['forecast'], 'width': 3, 'height': 2}]}, {'widgets': [{'type': 'forecast', 'width': 1.5, 'height': 2}]}, {'widgets': [{'type': 'forecast', 'width': 3, 'height': 13}]}, {'widgets': [{'type': 'forecast', 'width': 3, 'height': 2, 'source': 'private'}]}, {'widgets': self.preference['dashboards'][0]['widgets'] * 2}]:
            invalid.append({'defaultId': 'work', 'dashboards': [{**self.preference['dashboards'][0], **change}]})
        invalid.extend([{'defaultId': 'missing', 'dashboards': []}, {**self.preference, 'sql': ''}, {'defaultId': 'work', 'dashboards': self.preference['dashboards'] * 2}, {'defaultId': 'horizon', 'dashboards': [{**self.preference['dashboards'][0], 'id': 'work' + str(i)} for i in range(13)]}])
        for pref in invalid:
            self.assertEqual(self.save(preference=pref)[0], 400, pref)
        self.assertEqual(self.save()[0], 200)
        self.assertEqual(self.save(1, {'defaultId': 'horizon', 'dashboards': []})[0], 200)

    def test_widget_instances_configuration_positions_and_carousel_validation(self):
        import copy
        data = dict(title='Mes devis', source='quotes', scope='own', status='sent', search='', company='', companyLabel='', period='dashboard', presentation='list', limit=5)
        config = dict(title='Commercial', period='dashboard', data=data, pages=[data], automatic=False, interval=15, scope='own', links=['quotes', 'crm'])
        widget = dict(id='instance-a', type='business', width=2, height=2, x=10, y=4, config=config)
        pref = copy.deepcopy(self.preference)
        pref['dashboards'][0]['widgets'] = [widget, dict(widget, id='instance-b', x=0)]
        status, saved = self.save(preference=pref); self.assertEqual(status, 200, saved)
        self.assertEqual(saved['preference']['dashboards'][0]['widgets'][0]['config']['pages'][0]['source'], 'quotes')
        self.assertFalse(saved['preference']['dashboards'][0]['widgets'][0]['config']['automatic'])
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1], saved)
        changes = [dict(widget, id='instance-b'), dict(widget, x=11), dict(widget, y=1001), dict(widget, config=dict(config, pages=[])), dict(widget, config=dict(config, interval=2)), dict(widget, config=dict(config, sql='select *')), dict(widget, config=dict(config, pages=[dict(data, source='orders')])), dict(widget, config=dict(config, data=dict(data, source='invoices')))]
        for invalid in changes:
            bad = copy.deepcopy(pref); bad['dashboards'][0]['widgets'][0] = invalid
            self.assertEqual(self.save(1, bad)[0], 400, invalid)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1]['revision'], 1)
        self.assertEqual(self.save(1, saved['preference'])[0], 200)

    def test_twelve_default_dashboards_fit_the_existing_json_budget(self):
        import json
        data = dict(title='', source='opportunities', scope='accessible', status='', search='', company='', companyLabel='', period='all', presentation='list', limit=7)
        pages = [dict(data, title=title, source=source) for title, source in [('Opportunités', 'opportunities'), ('Devis', 'quotes'), ('Commandes clients', 'orders'), ('Factures', 'invoices')]]
        config = dict(title='', period='dashboard', data=data, pages=pages, automatic=True, interval=10, scope='own', links=['crm', 'quotes', 'calendar'])
        widgets = [dict(id='instance-' + str(i), type='forecast', width=2, height=1, config=config) for i in range(8)]
        pref = dict(defaultId='work-0', dashboards=[dict(id='work-' + str(i), name='Travail', widgets=widgets) for i in range(12)])
        self.assertGreater(len(json.dumps(pref)), 60000)
        status, result = self.save(preference=pref); self.assertEqual(status, 200, result)
        self.assertLess(len(json.dumps(result['preference'])), 60000)
        self.assertEqual(len(result['preference']['dashboards']), 12)
        self.assertEqual(self.save(1, result['preference'])[0], 200)

    def test_inactive_user_or_role_is_denied(self):
        self.pb.request('PATCH', 'collections/core_users/records/' + self.pb.user['id'], {'active': False}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[0], 403)
        self.assertEqual(self.save()[0], 403)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.pb.user['id'], {'active': True}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.pb.role['id'], {'active': False}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[0], 403)
        self.assertEqual(self.save()[0], 403)

    def test_concurrent_revision_conflict(self):
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.save(), range(2)))
        self.assertEqual(sorted(result[0] for result in results), [200, 409], results)
        self.assertEqual(self.save()[0], 409)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1]['revision'], 1)

if __name__ == '__main__':
    unittest.main()

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
        for change in [{'id': 'horizon'}, {'name': ''}, {'name': 'x' * 81}, {'name': '\nunsafe'}, {'widgets': [{'type': 'activity', 'width': 3, 'height': 2}]}, {'widgets': [{'type': 'business', 'width': 6, 'height': 3}]}, {'widgets': [{'type': 'other', 'width': 6, 'height': 4}]}, {'widgets': [{'type': ['forecast'], 'width': 3, 'height': 2}]}, {'widgets': [{'type': 'forecast', 'width': 5, 'height': 2}]}, {'widgets': [{'type': 'forecast', 'width': 3, 'height': 9}]}, {'widgets': [{'type': 'forecast', 'width': 3, 'height': 2, 'source': 'private'}]}, {'widgets': self.preference['dashboards'][0]['widgets'] * 2}]:
            invalid.append({'defaultId': 'work', 'dashboards': [{**self.preference['dashboards'][0], **change}]})
        invalid.extend([{'defaultId': 'missing', 'dashboards': []}, {**self.preference, 'sql': ''}, {'defaultId': 'work', 'dashboards': self.preference['dashboards'] * 2}, {'defaultId': 'horizon', 'dashboards': [{**self.preference['dashboards'][0], 'id': 'work' + str(i)} for i in range(13)]}])
        for pref in invalid:
            self.assertEqual(self.save(preference=pref)[0], 400, pref)
        self.assertEqual(self.save()[0], 200)
        self.assertEqual(self.save(1, {'defaultId': 'horizon', 'dashboards': []})[0], 200)

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

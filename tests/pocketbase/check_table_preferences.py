"""Private table preferences: ownership, bounds, CAS and additive migration."""
import json
import unittest
from concurrent.futures import ThreadPoolExecutor
from check_auth import LocalPocketBase

class TablePreferencesTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.addCleanup(self.pb.close)
        self.token = self.pb.login()[1]['token']
        self.other = self.pb.create_user('tables-second@local.invalid', self.pb.role['id'])
        self.second = self.pb.login('tables-second@local.invalid')[1]['token']
        self.path = 'horizon/table-preferences/contacts.companies'
        self.preference = {'order': ['name', 'phone', 'email'], 'hidden': ['email']}

    def save(self, revision=0, preference=None, token=None, extra=None):
        return self.pb.request('POST', self.path, {'revision': revision, 'preference': preference or self.preference, **(extra or {})}, token or self.token)

    def test_defaults_persistence_and_reset_tombstone(self):
        self.assertEqual(self.pb.request('GET', self.path, token=self.token), (200, {'revision': 0, 'preference': {'order': [], 'hidden': []}}))
        status, saved = self.save()
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved, {'revision': 1, 'preference': self.preference})
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1], saved)
        status, reset = self.save(1, {'order': [], 'hidden': []})
        self.assertEqual(status, 200, reset)
        self.assertEqual(reset['revision'], 2)
        self.assertEqual(reset['preference'], {'order': [], 'hidden': []})
        self.assertEqual(self.save()[0], 409)  # stale local import cannot undo an explicit reset
        audits = self.pb.request('GET', 'collections/core_audit/records?filter=entity%3D%22core_table_preferences%22', token=self.pb.admin_token)[1]
        self.assertEqual(audits['totalItems'], 2)
        self.pb.process.terminate(); self.pb.process.wait(timeout=5)
        self.pb.launch_and_authenticate(self.pb.args)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1], reset)

    def test_owner_isolation_and_direct_rest_locked(self):
        self.assertEqual(self.save()[0], 200)
        self.assertEqual(self.pb.request('GET', self.path, token=self.second)[1]['revision'], 0)
        self.assertEqual(self.save(token=self.second, preference={'order': ['name'], 'hidden': []})[0], 200)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1]['preference'], self.preference)
        self.assertEqual(self.save(1, extra={'user': self.other['id']})[0], 400)
        rows = self.pb.request('GET', 'collections/core_table_preferences/records', token=self.pb.admin_token)[1]['items']
        for record in rows:
            self.assertEqual(self.pb.request('GET', 'collections/core_table_preferences/records/' + record['id'], token=self.token)[0], 403)
            self.assertNotEqual(self.pb.request('PATCH', 'collections/core_table_preferences/records/' + record['id'], {'preference': {}}, self.token)[0], 200)
        self.assertNotEqual(self.pb.request('POST', 'collections/core_table_preferences/records', {}, self.token)[0], 200)

    def test_permissions_contexts_and_payload_validation(self):
        self.assertEqual(self.pb.request('GET', self.path)[0], 401)
        token = self.pb.login('other@local.invalid')[1]['token']
        self.assertEqual(self.pb.request('GET', self.path, token=token)[0], 403)
        for context in ['toString.bad', 'contacts.unknown', 'sales.unknown', 'inventory.operations.IN,IN']:
            self.assertEqual(self.pb.request('GET', 'horizon/table-preferences/' + context, token=self.token)[0], 400)
        for pref in [{'order': ['x']}, {'order': [], 'hidden': [], 'sql': 'x'}, {'order': [1], 'hidden': []}, {'order': ['\n'], 'hidden': []}, {'order': ['x' * 161], 'hidden': []}, {'order': ['x'] * 101, 'hidden': []}]:
            self.assertEqual(self.save(preference=pref)[0], 400)
        for rev in [-1, 1.5, '0']:
            self.assertEqual(self.save(revision=rev)[0], 400)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.pb.user['id'], {'active': False}, self.pb.admin_token)
        self.assertNotEqual(self.pb.request('GET', self.path, token=self.token)[0], 200)

    def test_optional_widths_preserve_old_format_and_validate_bounds(self):
        pref = {**self.preference, 'widths': {'name': 220.25, 'email': 180}}
        status, saved = self.save(preference=pref)
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['preference'], pref)
        self.pb.process.terminate(); self.pb.process.wait(timeout=5)
        self.pb.launch_and_authenticate(self.pb.args)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1], saved)
        for widths in [[], None, {'name': 35}, {'name': 10001}, {'name': '100'}, {'\n': 100}, {'x' * 161: 100}, {str(i): 100 for i in range(101)}]:
            self.assertEqual(self.save(1, {**self.preference, 'widths': widths})[0], 400)
        status, reset = self.save(1, {**self.preference, 'widths': {}})
        self.assertEqual(status, 200, reset)
        self.assertEqual(reset['preference']['widths'], {})

    def test_concurrent_saves_do_not_overwrite(self):
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.save(), range(2)))
        self.assertEqual(sorted(status for status, _ in results), [200, 409], results)
        self.assertEqual(self.pb.request('GET', self.path, token=self.token)[1]['revision'], 1)
        self.assertEqual(self.save()[0], 409)

if __name__ == '__main__':
    unittest.main()

"""Shared presentation policies: admin-only writes, required fields, CAS, audit, restart."""
import unittest
from concurrent.futures import ThreadPoolExecutor
from check_auth import LocalPocketBase

class TableColumnPoliciesTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.addCleanup(self.pb.close)
        role = self.pb.create('core_roles', {'name': 'columns_admin', 'label': 'Admin colonnes', 'active': True, 'permissions': ['settings.references', 'contacts.read']})
        self.admin_user = self.pb.create_user('columns-admin@local.invalid', role['id'])
        self.admin = self.pb.login('columns-admin@local.invalid')[1]['token']
        self.reader = self.pb.login()[1]['token']
        self.path = 'horizon/table-column-policies'

    def save(self, revision=0, excluded=None, token=None, key='contacts.companies'):
        return self.pb.request('POST', self.path + '/' + key, {'revision': revision, 'excluded': excluded if excluded is not None else ['phone']}, token or self.admin)

    def test_defaults_save_audit_restart_and_preserved_personal_preferences(self):
        status, defaults = self.pb.request('GET', self.path, token=self.reader)
        self.assertEqual(status, 200, defaults)
        self.assertTrue(all(item['revision'] == 0 and item['excluded'] == [] for item in defaults['items']))
        pref = {'revision': 0, 'preference': {'order': ['name', 'phone'], 'hidden': []}}
        self.assertEqual(self.pb.request('POST', 'horizon/table-preferences/contacts.companies', pref, self.reader)[0], 200)
        status, saved = self.save(excluded=['phone', 'phone'])
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved, {'key': 'contacts.companies', 'revision': 1, 'excluded': ['phone']})
        self.assertEqual(self.pb.request('GET', 'horizon/table-preferences/contacts.companies', token=self.reader)[1]['preference'], pref['preference'])
        rows = self.pb.request('GET', 'collections/core_audit/records?filter=entity%3D%22settings_table_columns%22', token=self.pb.admin_token)[1]
        self.assertEqual(rows['totalItems'], 1)
        self.pb.process.terminate(); self.pb.process.wait(timeout=5)
        self.pb.launch_and_authenticate(self.pb.args)
        policies = self.pb.request('GET', self.path, token=self.reader)[1]['items']
        self.assertIn(saved, policies)
        self.assertEqual(self.save(1, [])[1]['revision'], 2)

    def test_permissions_and_rest_rules(self):
        self.assertEqual(self.pb.request('GET', self.path)[0], 401)
        self.assertEqual(self.save(token=self.reader)[0], 403)
        # A settings grant alone is insufficient without the administrator ERP profile.
        role = self.pb.create('core_roles', {'name': 'columns_user', 'label': 'Non admin', 'active': True, 'permissions': ['settings.references']})
        user = self.pb.create_user('columns-user@local.invalid', role['id'], profile='user')
        token = self.pb.login('columns-user@local.invalid')[1]['token']
        self.assertEqual(self.save(token=token)[0], 403)
        inactive_token = token
        self.assertEqual(self.save()[0], 200)
        records = self.pb.request('GET', 'collections/settings_table_columns/records', token=self.pb.admin_token)[1]['items']
        for token in [self.reader, self.admin]:
            self.assertEqual(self.pb.request('GET', 'collections/settings_table_columns/records', token=token)[0], 403)
            self.assertNotEqual(self.pb.request('PATCH', 'collections/settings_table_columns/records/' + records[0]['id'], {'excluded': []}, token)[0], 200)
        self.pb.request('PATCH', 'collections/core_users/records/' + user['id'], {'active': False}, self.pb.admin_token)
        self.assertNotEqual(self.pb.request('GET', self.path, token=inactive_token)[0], 200)

    def test_validation_and_concurrent_writes(self):
        for excluded in [['name'], ['unknown'], [1], 'phone', ['phone'] * 101]:
            self.assertEqual(self.save(excluded=excluded)[0], 400)
        for key in ['toString', 'contacts.unknown', 'inventory.operations.IN']:
            self.assertEqual(self.save(key=key)[0], 400)
        self.assertEqual(self.save(revision=-1)[0], 400)
        with ThreadPoolExecutor(max_workers=2) as pool:
            result = list(pool.map(lambda _: self.save(), range(2)))
        self.assertEqual(sorted(status for status, _ in result), [200, 409], result)
        self.assertEqual(self.save()[0], 409)
        self.assertEqual(self.save(key='inventory.operations', excluded=['readiness'])[0], 200)

if __name__ == '__main__': unittest.main()

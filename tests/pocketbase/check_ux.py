"""Shared UX settings: migrations, bounds, permissions, concurrency and audit."""
import json
import sqlite3
import subprocess
import unittest
from check_auth import LocalPocketBase

class UxTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.addCleanup(self.pb.close)
        self.token = self.pb.login()[1]['token']
        role = self.pb.create('core_roles', {'name': 'ux_admin', 'label': 'UX admin', 'active': True, 'permissions': ['settings.references']})
        self.admin = self.pb.create_user('ux-admin@local.invalid', role['id'], profile='admin')
        self.admin_token = self.pb.login('ux-admin@local.invalid')[1]['token']
        self.record = self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1]

    def save(self, config=None, updated=None, token=None):
        return self.pb.request('POST', 'horizon/settings/ux', {'updated': updated or self.record['updated'], 'config': config or self.record['config']}, token or self.admin_token)

    def test_shared_read_write_permissions_and_audit(self):
        self.assertEqual(self.record['config']['row_height'], 32)
        self.assertEqual(self.pb.request('GET', 'horizon/settings/ux')[0], 401)
        self.assertEqual(self.save(token=self.token)[0], 403)
        self.assertEqual(self.pb.request('PATCH', 'collections/settings_ux/records/' + self.record['id'], {'config': self.record['config']}, self.admin_token)[0], 403)
        status, saved = self.save({**self.record['config'], 'row_height': 36})
        self.assertEqual(status, 200, saved)
        self.assertEqual(self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1]['config']['row_height'], 36)
        audits = self.pb.request('GET', 'collections/core_audit/records?filter=entity%3D%22settings_ux%22', token=self.pb.admin_token)[1]
        self.assertEqual(audits['totalItems'], 1, audits)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.admin['id'], {'active': False}, self.pb.admin_token)
        self.assertIn(self.save(updated=saved['updated'])[0], [401, 403])

    def test_bounds_unknown_fields_and_css_injection(self):
        for patch in [{'row_height': 20}, {'row_height': 33.2}, {'page_margin': 101}, {'title_font': 100}, {'control_height': 5}, {'header_light': 'url(https://evil.invalid)'}, {'header_dark': '#fff'}, {'activity_light': 'red'}, {'accent_background': 'url(evil)'}, {'launcher_tile_size': 10}, {'smart_height': 10}, {'sidebar_group_gap': -1}, {'unknown': 1}]:
            self.assertEqual(self.save({**self.record['config'], **patch})[0], 400, patch)
        self.assertEqual(self.pb.request('POST', 'horizon/settings/ux', {'updated': self.record['updated'], 'config': self.record['config'], 'css': 'body{}'}, self.admin_token)[0], 400)
        self.assertEqual(self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1], self.record)

    def test_ten_pixel_text_is_saved(self):
        status, saved = self.save({**self.record['config'], 'table_font': 10, 'control_font': 10, 'page_margin': 0})
        self.assertEqual(status, 200, saved)
        config = self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1]['config']
        self.assertEqual(config['table_font'], 10)
        self.assertEqual(config['control_font'], 10)

    def test_appearance_and_navigation_are_saved(self):
        self.assertEqual(self.record['config']['activity_light'], '#E5EBF3')
        self.assertEqual(self.record['config']['launcher_tile_size'], 104)
        status, saved = self.save({**self.record['config'], 'activity_light': '#E0E8F0', 'button_height': 36, 'smart_height': 30, 'launcher_tile_size': 120, 'sidebar_group_gap': 12})
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['config']['activity_light'], '#E0E8F0')
        self.assertEqual(saved['config']['button_height'], 36)
        self.assertEqual(saved['config']['smart_height'], 30)
        self.assertEqual(saved['config']['launcher_tile_size'], 120)

    def test_upgrade_preserves_existing_configuration(self):
        self.pb.process.terminate()
        self.pb.process.wait(timeout=5)
        result = subprocess.run(self.pb.args + ['migrate', 'down', '1'], input='y\n', text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            config = json.loads(connection.execute('SELECT config FROM settings_ux').fetchone()[0])
            self.assertNotIn('button_height', config)
            config.update({'row_height': 40, 'header_light': '#AABBCC'})
            connection.execute('UPDATE settings_ux SET config = ?', (json.dumps(config),))
        subprocess.run(self.pb.args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        self.pb.launch_and_authenticate(self.pb.args)
        saved = self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1]['config']
        self.assertEqual(saved['row_height'], 40)
        self.assertEqual(saved['header_light'], '#AABBCC')
        self.assertEqual(saved['button_height'], 32)
        self.assertEqual(saved['activity_light'], '#E5EBF3')

    def test_optimistic_lock_and_superuser(self):
        role = self.pb.create('core_roles', {'name': 'ux_super', 'label': 'UX super', 'active': True, 'permissions': ['settings.references']})
        self.pb.create_user('ux-super@local.invalid', role['id'], profile='superuser')
        token = self.pb.login('ux-super@local.invalid')[1]['token']
        self.assertEqual(self.save({**self.record['config'], 'page_margin': 48}, token=token)[0], 200)
        self.assertEqual(self.save()[0], 409)

if __name__ == '__main__':
    unittest.main(verbosity=2)

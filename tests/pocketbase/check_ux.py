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
        for patch in [{'row_height': 20}, {'row_height': 33.2}, {'page_margin': 101}, {'title_font': 100}, {'control_height': 5}, {'header_light': 'url(https://evil.invalid)'}, {'header_dark': '#fff'}, {'table_border_light': 'red'}, {'table_header_text_light': 'red'}, {'table_header_text_dark': 'url(evil)'}, {'table_border_dark': 'url(evil)'}, {'activity_light': 'red'}, {'accent_background': 'url(evil)'}, {'launcher_tile_size': 10}, {'smart_height': 10}, {'sidebar_group_gap': -1}, {'sidebar_width': 179}, {'sidebar_width': 361}, {'sidebar_font': 12.25}, {'sidebar_icon_size': 29}, {'sidebar_text_color': 'red'}, {'sidebar_background_top': 'url(evil)'}, {'sidebar_submenu_indent': -1}, {'filter_option_height': 23}, {'filter_button_height': 57}, {'filter_font': 12.5}, {'filter_selected_background_dark': 'url(evil)'}, {'unknown': 1}]:
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
        status, saved = self.save({**self.record['config'], 'activity_light': '#E0E8F0', 'button_height': 36, 'smart_height': 30, 'launcher_tile_size': 120, 'sidebar_group_gap': 12, 'sidebar_width': 260, 'sidebar_font': 13.5, 'sidebar_icon_size': 20, 'table_border_light': '#AABBCC', 'table_border_dark': '#334455', 'table_header_text_light': '#112233', 'table_header_text_dark': '#DDEEFF', 'sidebar_radius': 8, 'sidebar_background_top': '#112233', 'sidebar_text_color': '#AABBCC'})
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['config']['activity_light'], '#E0E8F0')
        self.assertEqual(saved['config']['button_height'], 36)
        self.assertEqual(saved['config']['smart_height'], 30)
        self.assertEqual(saved['config']['launcher_tile_size'], 120)
        self.assertEqual(saved['config']['sidebar_width'], 260)
        self.assertEqual(saved['config']['sidebar_font'], 13.5)
        self.assertEqual(saved['config']['sidebar_icon_size'], 20)
        self.assertEqual(saved['config']['sidebar_background_top'], '#112233')
        self.assertEqual(saved['config']['sidebar_text_color'], '#AABBCC')
        self.assertEqual(saved['config']['table_border_light'], '#AABBCC')
        self.assertEqual(saved['config']['table_border_dark'], '#334455')
        self.assertEqual(saved['config']['table_header_text_light'], '#112233')
        self.assertEqual(saved['config']['table_header_text_dark'], '#DDEEFF')

    def test_upgrade_preserves_existing_configuration(self):
        self.pb.process.terminate()
        self.pb.process.wait(timeout=5)
        # Simulate the pre-sidebar JSON only on this disposable DB, then replay its additive migration.
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            config = json.loads(connection.execute('SELECT config FROM settings_ux').fetchone()[0])
            for key in ['table_header_text_light', 'table_header_text_dark', 'table_border_light', 'table_border_dark', 'sidebar_background_top', 'sidebar_background_middle', 'sidebar_background_bottom', 'sidebar_text_color', 'sidebar_icon_color', 'sidebar_title_color', 'sidebar_submenu_color', 'sidebar_active_start', 'sidebar_active_end', 'sidebar_active_text', 'sidebar_hover_color', 'sidebar_width', 'sidebar_font', 'sidebar_submenu_font', 'sidebar_title_font', 'sidebar_icon_size', 'sidebar_radius', 'sidebar_padding_x', 'sidebar_submenu_indent']:
                config.pop(key)
            config.update({'row_height': 40, 'header_light': '#AABBCC'})
            connection.execute('UPDATE settings_ux SET config = ?', (json.dumps(config),))
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791710012_sidebar_appearance.js',))
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791710013_table_border_appearance.js',))
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791710015_table_header_text_appearance.js',))
        subprocess.run(self.pb.args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        self.pb.launch_and_authenticate(self.pb.args)
        saved = self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1]['config']
        self.assertEqual(saved['row_height'], 40)
        self.assertEqual(saved['header_light'], '#AABBCC')
        self.assertEqual(saved['button_height'], 32)
        self.assertEqual(saved['sidebar_width'], 216)
        self.assertEqual(saved['sidebar_font'], 12.5)
        self.assertEqual(saved['sidebar_background_top'], '#031C2C')
        self.assertEqual(saved['activity_light'], '#E5EBF3')
        self.assertEqual(saved['table_border_light'], '#DCE5EF')
        self.assertEqual(saved['table_border_dark'], '#364860')
        self.assertEqual(saved['table_header_text_light'], '#4C678E')
        self.assertEqual(saved['table_header_text_dark'], '#B8C5D7')

    def test_filter_appearance_migration_and_save(self):
        self.assertEqual(self.record['config']['filter_option_height'], 36)
        status, saved = self.save({**self.record['config'], 'filter_option_height': 40, 'filter_button_height': 30, 'filter_font': 14, 'filter_selected_text_dark': '#AABBCC'})
        self.assertEqual(status, 200, saved)
        self.pb.process.terminate(); self.pb.process.wait(timeout=5)
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            config = json.loads(connection.execute('SELECT config FROM settings_ux').fetchone()[0])
            config.pop('filter_background_light')
            connection.execute('UPDATE settings_ux SET config = ?', (json.dumps(config),))
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791840007_filter_appearance.js',))
        for _ in range(2): subprocess.run(self.pb.args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        self.pb.launch_and_authenticate(self.pb.args)
        config = self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1]['config']
        self.assertEqual(config['filter_background_light'], '#FFFFFF')
        self.assertEqual(config['filter_option_height'], 40)
        self.assertEqual(config['filter_font'], 14)
        self.assertEqual(config['filter_selected_text_dark'], '#AABBCC')
        self.assertEqual(config['row_height'], 32)

    def test_tracking_header_colors_migrate_and_persist_without_resetting_preferences(self):
        self.assertEqual(self.record['config']['order_tracking_header_light'], '#FFF0F7')
        self.assertEqual(self.record['config']['order_tracking_header_dark'], '#352638')
        for patch in [{'order_tracking_header_light': 'url(evil)'}, {'order_tracking_header_dark': '#fff'}]:
            self.assertEqual(self.save({**self.record['config'], **patch})[0], 400)
        status, saved = self.save({**self.record['config'], 'row_height': 40, 'order_tracking_header_light': '#FDECF4', 'order_tracking_header_dark': '#3B2938'})
        self.assertEqual(status, 200, saved)
        self.pb.process.terminate(); self.pb.process.wait(timeout=5)
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            config = json.loads(connection.execute('SELECT config FROM settings_ux').fetchone()[0])
            config.pop('order_tracking_header_dark')
            connection.execute('UPDATE settings_ux SET config = ?', (json.dumps(config),))
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791840014_order_tracking_appearance.js',))
        for _ in range(2): subprocess.run(self.pb.args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        self.pb.launch_and_authenticate(self.pb.args)
        config = self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1]['config']
        self.assertEqual(config['order_tracking_header_light'], '#FDECF4')
        self.assertEqual(config['order_tracking_header_dark'], '#352638')
        self.assertEqual(config['row_height'], 40)

    def test_tracking_text_colors_preserve_custom_headers_and_migrate_idempotently(self):
        for patch in [{'order_tracking_text_light': 'url(evil)'}, {'order_tracking_text_dark': '#fff'}]:
            self.assertEqual(self.save({**self.record['config'], **patch})[0], 400)
        status, saved = self.save({**self.record['config'], 'row_height': 40, 'table_header_text_dark': '#ABCDEF', 'order_tracking_text_light': '#70334D', 'order_tracking_text_dark': '#FFC1DE'})
        self.assertEqual(status, 200, saved)
        self.pb.process.terminate(); self.pb.process.wait(timeout=5)
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            config = json.loads(connection.execute('SELECT config FROM settings_ux').fetchone()[0])
            config.pop('order_tracking_text_dark')
            connection.execute('UPDATE settings_ux SET config = ?', (json.dumps(config),))
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791840015_order_tracking_text.js',))
        for _ in range(2): subprocess.run(self.pb.args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        self.pb.launch_and_authenticate(self.pb.args)
        config = self.pb.request('GET', 'horizon/settings/ux', token=self.token)[1]['config']
        self.assertEqual(config['order_tracking_text_light'], '#70334D')
        self.assertEqual(config['order_tracking_text_dark'], '#ABCDEF')
        self.assertEqual(config['row_height'], 40)

    def test_optimistic_lock_and_superuser(self):
        role = self.pb.create('core_roles', {'name': 'ux_super', 'label': 'UX super', 'active': True, 'permissions': ['settings.references']})
        self.pb.create_user('ux-super@local.invalid', role['id'], profile='superuser')
        token = self.pb.login('ux-super@local.invalid')[1]['token']
        self.assertEqual(self.save({**self.record['config'], 'page_margin': 48}, token=token)[0], 200)
        self.assertEqual(self.save()[0], 409)

if __name__ == '__main__':
    unittest.main(verbosity=2)

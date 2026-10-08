"""Profiles, account administration and employee hierarchy on disposable databases."""
import unittest
import shutil
import subprocess
from pathlib import Path
from check_auth import LocalPocketBase, TEST_PASSWORD, ROOT


class AccessHrTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.addCleanup(self.pb.close)
        role = self.pb.create('core_roles', {'name': 'erp_admin', 'label': 'Admin', 'active': True, 'permissions': ['settings.users', 'settings.references', 'contacts.read', 'contacts.write', 'crm.read', 'crm.write', 'hr.read', 'hr.write', 'hr.organisation.manage']})
        self.admin = self.pb.create_user('erp-admin@local.invalid', role['id'], 'admin')
        self.pb.request('PATCH', f'collections/core_users/records/{self.admin["id"]}', {'hr_scope': 'all'}, self.pb.admin_token)
        self.token = self.pb.login('erp-admin@local.invalid')[1]['token']
        self.employee_input = {'first_name': 'Marie', 'last_name': 'Martin', 'professional_email': '', 'professional_phone': '', 'job_title': 'Poste descriptif', 'employment_type': 'employee', 'team': '', 'manager': '', 'is_manager': False, 'is_direction': False, 'external_company': '', 'start_date': '', 'end_date': '', 'status': 'active'}

    def employee(self, **changes):
        status, record = self.pb.request('POST', 'horizon/hr/employees/save', {'input': {**self.employee_input, **changes}}, self.token)
        self.assertEqual(status, 200, record)
        return record

    def test_identity_tag_colors_are_global_fixed_and_administered(self):
        path = 'collections/settings_identity_tags/records'
        self.assertEqual(self.pb.request('GET', path)[1]['items'], [])
        status, data = self.pb.request('GET', path, token=self.token)
        self.assertEqual(status, 200, data)
        tags = {item['code']: item for item in data['items']}
        self.assertEqual(set(tags), {'admin', 'superuser', 'user', 'viewer', 'direction', 'manager', 'collaborator'})
        tag_path = f'{path}/{tags["direction"]["id"]}'
        status, changed = self.pb.request('PATCH', tag_path, {'tone': 'pink', 'color': '#123abc'}, self.token)
        self.assertEqual(status, 200, changed)
        self.assertEqual(changed['color'], '#123abc')
        for invalid in [{'color': 'red'}, {'tone': 'rainbow'}, {'active': False}, {'code': 'user'}, {'label': 'Autre'}, {'sort_order': 100}]:
            self.assertEqual(self.pb.request('PATCH', tag_path, invalid, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', path, {'code': 'other'}, self.token)[0], 403)
        self.assertEqual(self.pb.request('DELETE', tag_path, token=self.token)[0], 403)
        for profile in ['user', 'viewer', 'superuser']:
            self.assertEqual(self.account(f'colors-{profile}@local.invalid', profile)[0], 200)
            token = self.pb.login(f'colors-{profile}@local.invalid')[1]['token']
            self.assertEqual(self.pb.request('GET', tag_path, token=token)[1]['color'], '#123abc')
            self.assertEqual(self.pb.request('PATCH', tag_path, {'color': '', 'tone': 'green'}, token)[0], 200 if profile == 'superuser' else 404)
        audits = self.pb.request('GET', 'collections/core_audit/records?filter=entity%3D%22settings_identity_tags%22', token=self.pb.admin_token)[1]['items']
        self.assertTrue(any(item['entity'] == 'settings_identity_tags' and item['user'] == self.admin['id'] for item in audits))

    def account(self, email, profile='user', employee='', grants=None, record=None, token=None):
        return self.pb.request('POST', 'horizon/access/users/save', {'id': record['id'] if record else '', 'updated': record['updated'] if record else '', 'input': {'name': email.split('@')[0], 'email': email, 'active': True, 'erp_profile': profile, 'employee': employee, 'grants': grants or {}, 'password': '' if record else TEST_PASSWORD}}, token or self.token)

    def test_accounts_profiles_private_roles_and_last_admin(self):
        self.assertEqual(self.pb.request('GET', 'horizon/access/users', token=self.pb.login()[1]['token'])[0], 403)
        for profile in ['superuser', 'user', 'viewer']:
            status, record = self.account(f'{profile}@local.invalid', profile)
            self.assertEqual(status, 200, record)
            token = self.pb.login(f'{profile}@local.invalid')[1]['token']
            self.assertEqual(self.pb.request('GET', 'horizon/access/users', token=token)[0], 403)
            self.assertEqual(self.account('forged@local.invalid', 'admin', token=token)[0], 403)
        admin = self.pb.request('GET', 'horizon/access/users', token=self.token)[1]['users']
        own = next(item for item in admin if item['id'] == self.admin['id'])
        self.assertEqual(self.account('erp-admin@local.invalid', 'user', record=own)[0], 400)
        self.assertEqual(self.pb.request('PATCH', f'collections/core_users/records/{own["id"]}', {'erp_profile': 'admin'}, self.pb.login('user@local.invalid')[1]['token'])[0], 403)
        roles = [item['role'] for item in self.pb.request('GET', 'collections/core_users/records', token=self.pb.admin_token)[1]['items'] if item['email'] in ['superuser@local.invalid', 'user@local.invalid', 'viewer@local.invalid']]
        self.assertEqual(len(set(roles)), 3)
        audits = self.pb.request('GET', 'collections/core_audit/records?filter=entity="core_users"', token=self.pb.admin_token)[1]['items']
        self.assertTrue(audits)
        self.assertNotIn('password', str(audits))

    def test_viewer_and_functional_settings_cannot_escalate(self):
        self.assertEqual(self.account('bad-viewer@local.invalid', 'viewer', grants={'crm': {'actions': ['read', 'write'], 'scope': 'all'}})[0], 400)
        self.assertEqual(self.account('unsupported@local.invalid', grants={'crm': {'actions': ['read'], 'scope': 'reports'}})[0], 400)
        self.assertEqual(self.account('future@local.invalid', grants={'projects': {'actions': ['read'], 'scope': 'all'}})[0], 400)
        self.assertEqual(self.account('sales-reader@local.invalid', grants={'sales': {'actions': ['read'], 'scope': 'all'}})[0], 200)
        self.assertEqual(self.account('bad-sales-viewer@local.invalid', 'viewer', grants={'sales': {'actions': ['read', 'write'], 'scope': 'all'}})[0], 400)
        status, viewer = self.account('viewer-crm@local.invalid', 'viewer', grants={'crm': {'actions': ['read'], 'scope': 'all'}})
        self.assertEqual(status, 200, viewer)
        token = self.pb.login('viewer-crm@local.invalid')[1]['token']
        self.assertEqual(self.pb.request('POST', 'horizon/crm/save', {'input': {}}, token)[0], 403)
        self.assertEqual(self.pb.request('GET', 'collections/settings_numbering_sequences/records', token=token)[1]['items'], [])
        raw = self.pb.request('GET', f'collections/core_users/records/{viewer["id"]}', token=self.pb.admin_token)[1]
        self.pb.request('PATCH', f'collections/core_roles/records/{raw["role"]}', {'permissions': ['crm.read', 'crm.write', 'contacts.read', 'contacts.write', 'settings.references']}, self.pb.admin_token)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/save', {'input': {}}, token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'horizon/settings/sequences/save', {}, token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'collections/contacts_companies/records', {'name': 'Viewer company'}, token)[0], 400)
        self.assertEqual(self.pb.request('GET', 'collections/contacts_companies/records', token=self.pb.admin_token)[1]['items'], [])
        self.assertEqual(self.pb.request('POST', 'collections/settings_countries/records', {'code': 'ZZ', 'label': 'Viewer country', 'active': True, 'sort_order': 1}, token)[0], 400)

    def test_hierarchy_resources_without_accounts_cycles_and_status(self):
        manager = self.employee(is_manager=True)
        child = self.employee(first_name='Paul', manager=manager['id'], is_manager=True)
        self.assertFalse(child['has_account'])
        body = {'id': manager['id'], 'updated': manager['updated'], 'input': {**self.employee_input, 'is_manager': True, 'manager': child['id']}}
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', body, self.token)[0], 400)
        body['input'] = {**self.employee_input, 'is_manager': False}
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', body, self.token)[0], 400)
        body = {'id': child['id'], 'updated': 'outdated', 'input': self.employee_input}
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', body, self.token)[0], 409)
        self.assertEqual(self.pb.request('PATCH', f'collections/hr_employees/records/{child["id"]}', {'manager': ''}, self.token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', {'input': {**self.employee_input, 'start_date': '2026-99-99'}}, self.token)[0], 400)

    def test_scopes_self_team_and_organisation_grants(self):
        team = self.pb.request('POST', 'horizon/hr/teams/save', {'name': 'Bureau études', 'managers': [], 'active': True}, self.token)[1]
        self.assertEqual(self.pb.request('POST', 'horizon/hr/teams/save', {'id': team['id'], 'updated': team['updated'], 'code': 'other', 'name': team['name']}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/teams/save', {'id': team['id'], 'updated': 'obsolete', 'managers': [], 'active': True, 'name': team['name']}, self.token)[0], 409)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/teams/save', {'id': team['id'], 'updated': team['updated'], 'managers': [], 'active': True, 'name': 'Bureau d’études'}, self.token)[0], 200)
        employee = self.employee(team=team['id'])
        colleague = self.employee(first_name='Paul', team=team['id'])
        self.employee(first_name='Outside')
        for scope, ids in [('self', [employee['id']]), ('team', [employee['id'], colleague['id']])]:
            status, account = self.account(f'{scope}@local.invalid', employee=employee['id'] if scope == 'self' else colleague['id'], grants={'hr': {'actions': ['read'], 'scope': scope}})
            self.assertEqual(status, 200, account)
            token = self.pb.login(f'{scope}@local.invalid')[1]['token']
            self.assertEqual({item['id'] for item in self.pb.request('GET', 'horizon/hr/directory', token=token)[1]['employees']}, set(ids))
            self.assertEqual({item['id'] for item in self.pb.request('GET', 'collections/hr_employees/records', token=token)[1]['items']}, set(ids))
        self.assertEqual(self.account('bad-org@local.invalid', grants={'hr': {'actions': ['read', 'organisation.manage'], 'scope': 'reports'}})[0], 400)

    def test_teams_multiple_managers_archive_and_organisation_integrity(self):
        manager = self.employee(is_manager=True)
        direction = self.employee(first_name='Alice', is_direction=True)
        body = {'name': 'Bureau d’études', 'active': True, 'managers': [manager['id'], direction['id']]}
        status, team = self.pb.request('POST', 'horizon/hr/teams/save', body, self.token)
        self.assertEqual(status, 200, team)
        self.assertNotIn('code', team)
        self.assertEqual(set(team['managers']), {manager['id'], direction['id']})
        member = self.employee(team=team['id'])
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', {'id': manager['id'], 'updated': manager['updated'], 'input': self.employee_input}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/teams/save', {**body, 'managers': [member['id']]}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/teams/save', {**body, 'managers': [manager['id'], manager['id']]}, self.token)[0], 400)
        status, _ = self.account('team-reader@local.invalid', grants={'hr': {'actions': ['read'], 'scope': 'all'}})
        self.assertEqual(status, 200)
        token = self.pb.login('team-reader@local.invalid')[1]['token']
        self.assertEqual(self.pb.request('POST', 'horizon/hr/teams/save', body, token)[0], 403)
        status, archived = self.pb.request('POST', 'horizon/hr/teams/save', {**body, 'id': team['id'], 'updated': team['updated'], 'active': False}, self.token)
        self.assertEqual(status, 200, archived)
        self.assertEqual(archived['managers'], team['managers'])
        self.assertEqual(self.pb.request('GET', f'collections/hr_employees/records/{member["id"]}', token=self.pb.admin_token)[1]['team'], team['id'])
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', {'input': {**self.employee_input, 'team': team['id']}}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', {'id': manager['id'], 'updated': manager['updated'], 'input': self.employee_input}, self.token)[0], 200)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/teams/save', {**body, 'id': team['id'], 'updated': archived['updated']}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/teams/save', {**body, 'id': team['id'], 'updated': archived['updated'], 'managers': [direction['id']]}, self.token)[0], 200)

    def test_manager_scope_is_server_enforced_and_revocation_immediate(self):
        manager = self.employee(is_manager=True)
        child = self.employee(first_name='Paul', manager=manager['id'])
        outsider = self.employee(first_name='Outside')
        status, account = self.account('manager@local.invalid', employee=manager['id'], grants={'hr': {'actions': ['read', 'write'], 'scope': 'reports'}})
        self.assertEqual(status, 200, account)
        token = self.pb.login('manager@local.invalid')[1]['token']
        directory = self.pb.request('GET', 'horizon/hr/directory', token=token)[1]['employees']
        self.assertEqual([item['id'] for item in directory], [child['id']])
        self.assertEqual(self.pb.request('GET', f'collections/hr_employees/records/{outsider["id"]}', token=token)[0], 404)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', {'id': outsider['id'], 'updated': outsider['updated'], 'input': self.employee_input}, token)[0], 403)
        self.assertEqual(self.account('manager@local.invalid', employee=manager['id'], grants={}, record=account)[0], 200)
        self.assertEqual(self.pb.request('GET', 'horizon/hr/directory', token=token)[0], 403)

    def test_employee_link_uniqueness_end_disables_account_and_no_job_rights(self):
        employee = self.employee(job_title='Admin directeur commercial')
        status, account = self.account('linked@local.invalid', employee=employee['id'])
        self.assertEqual(status, 200, account)
        self.assertEqual(account['erp_profile'], 'user')
        self.assertEqual(self.account('duplicate@local.invalid', employee=employee['id'])[0], 400)
        self.assertEqual(self.pb.login('linked@local.invalid')[0], 200)
        body = {'id': employee['id'], 'updated': employee['updated'], 'input': {**self.employee_input, 'status': 'ended'}}
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', body, self.token)[0], 200)
        self.assertNotEqual(self.pb.login('linked@local.invalid')[0], 200)
        self.assertEqual(self.pb.request('GET', f'collections/hr_employees/records/{employee["id"]}', token=self.pb.admin_token)[0], 200)


    def test_direction_hierarchy_responsibility_and_explicit_rights(self):
        direction = self.employee(first_name='Direction', is_direction=True)
        manager = self.employee(first_name='Manager', is_manager=True, manager=direction['id'])
        child = self.employee(first_name='Collaborateur', manager=manager['id'])
        direct = self.employee(first_name='Direct', manager=direction['id'])
        self.assertTrue(direction['is_direction'])
        self.assertFalse(direction['is_manager'])
        self.assertEqual(child['manager'], manager['id'])
        status, account = self.account('direction@local.invalid', employee=direction['id'])
        self.assertEqual(status, 200, account)
        token = self.pb.login('direction@local.invalid')[1]['token']
        self.assertEqual(account['erp_profile'], 'user')
        self.assertTrue(account['employee_identity']['is_direction'])
        self.assertEqual(self.pb.request('GET', 'horizon/hr/directory', token=token)[0], 403)
        status, account = self.account('direction@local.invalid', employee=direction['id'], record=account, grants={'hr': {'actions': ['read'], 'scope': 'reports'}})
        self.assertEqual(status, 200, account)
        visible = self.pb.request('GET', 'horizon/hr/directory', token=token)[1]['employees']
        self.assertEqual({item['id'] for item in visible}, {manager['id'], direct['id']})
        self.assertEqual(self.pb.request('GET', f'collections/hr_employees/records/{child["id"]}', token=token)[0], 404)
        self.assertEqual(self.pb.request('GET', 'horizon/access/users', token=token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', {'input': {**self.employee_input, 'is_direction': True}}, token)[0], 403)
        status, editor = self.account('hr-editor@local.invalid', grants={'hr': {'actions': ['read', 'write'], 'scope': 'all'}})
        self.assertEqual(status, 200, editor)
        editor_token = self.pb.login('hr-editor@local.invalid')[1]['token']
        body = {'id': direct['id'], 'updated': direct['updated'], 'input': {**self.employee_input, 'first_name': 'Direct', 'manager': direction['id'], 'is_direction': True}}
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', body, editor_token)[0], 403)
        for changes in [{'is_direction': True, 'is_manager': True}, {'is_direction': True, 'manager': manager['id']}]:
            self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', {'input': {**self.employee_input, **changes}}, self.token)[0], 400)
        body = {'id': direction['id'], 'updated': direction['updated'], 'input': self.employee_input}
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', body, self.token)[0], 400)
        body['input'] = {**self.employee_input, 'is_direction': True, 'manager': manager['id']}
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', body, self.token)[0], 400)
        nested = self.employee(first_name='Direction adjointe', is_direction=True, manager=direction['id'])
        body['input'] = {**self.employee_input, 'is_manager': True}
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', body, self.token)[0], 400)
        self.assertEqual(nested['manager'], direction['id'])


class AccessMigrationTests(unittest.TestCase):
    def test_team_migration_preserves_names_members_and_hides_legacy_code(self):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791331205':
                shutil.copy(path, previous)
        original = pb.args[:]
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        team = pb.create('core_teams', {'code': 'be', 'name': 'Bureau études', 'active': True})
        employee = pb.create('hr_employees', {'first_name': 'Marie', 'last_name': 'Martin', 'employment_type': 'employee', 'status': 'active', 'team': team['id']})
        pb.process.terminate(); pb.process.wait(timeout=10)
        result = subprocess.run(original + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        pb.args = original
        pb.launch_and_authenticate(original)
        current = pb.request('GET', f'collections/core_teams/records/{team["id"]}', token=pb.admin_token)[1]
        self.assertEqual(current['name'], team['name'])
        self.assertEqual(current['code'], 'be')
        schema = pb.request('GET', 'collections/core_teams', token=pb.admin_token)[1]
        self.assertTrue(next(field for field in schema['fields'] if field['name'] == 'code')['hidden'])
        self.assertEqual(current['managers'], [])
        self.assertEqual(pb.request('GET', f'collections/hr_employees/records/{employee["id"]}', token=pb.admin_token)[1]['team'], team['id'])

    def test_direction_migration_preserves_existing_hierarchy_without_bootstrap(self):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791331204':
                shutil.copy(path, previous)
        original = pb.args[:]
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        manager = pb.create('hr_employees', {'first_name': 'Marie', 'last_name': 'Martin', 'employment_type': 'employee', 'status': 'active', 'is_manager': True})
        child = pb.create('hr_employees', {'first_name': 'Paul', 'last_name': 'Durand', 'employment_type': 'employee', 'status': 'active', 'manager': manager['id']})
        pb.process.terminate(); pb.process.wait(timeout=10)
        result = subprocess.run(original + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        pb.args = original
        pb.launch_and_authenticate(original)
        current = pb.request('GET', f'collections/hr_employees/records/{manager["id"]}', token=pb.admin_token)[1]
        self.assertTrue(current['is_manager'])
        self.assertFalse(current['is_direction'])
        current = pb.request('GET', f'collections/hr_employees/records/{child["id"]}', token=pb.admin_token)[1]
        self.assertEqual(current['manager'], manager['id'])
        self.assertFalse(current['is_direction'])

    def test_upgrade_preserves_roles_and_bootstraps_only_explicit_account(self):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791331203':
                shutil.copy(path, previous)
        original = pb.args[:]
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        role = pb.create('core_roles', {'name': 'historical_admin', 'label': 'Administrateur historique', 'active': True, 'permissions': ['contacts.read', 'settings.references']})
        untouched = pb.create_user('untouched@local.invalid', role['id'])
        pb.process.terminate(); pb.process.wait(timeout=10)
        missing = subprocess.run(original + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
        self.assertNotEqual(missing.returncode, 0)
        self.assertIn('HORIZON_INITIAL_ADMIN_EMAIL is required', missing.stderr)
        env = {**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}
        result = subprocess.run(original + ['migrate', 'up'], env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        pb.args = original
        pb.launch_and_authenticate(original)
        own = pb.request('GET', f'collections/core_users/records/{pb.user["id"]}', token=pb.admin_token)[1]
        existing = pb.request('GET', f'collections/core_users/records/{untouched["id"]}', token=pb.admin_token)[1]
        self.assertEqual(own['erp_profile'], 'admin')
        self.assertEqual(existing['erp_profile'], 'user')
        self.assertEqual(existing['role'], role['id'])
        self.assertEqual(pb.request('GET', f'collections/core_roles/records/{role["id"]}', token=pb.admin_token)[1]['permissions'], role['permissions'])
        self.assertEqual(pb.login('untouched@local.invalid')[0], 200)
        token = pb.login()[1]['token']
        self.assertEqual(pb.request('GET', 'horizon/access/users', token=token)[0], 200)
        self.assertEqual(pb.request('GET', 'horizon/access/users', token=pb.login('untouched@local.invalid')[1]['token'])[0], 403)
        pb.process.terminate(); pb.process.wait(timeout=10)
        self.assertEqual(subprocess.run(original + ['migrate', 'up'], env=env, capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main()

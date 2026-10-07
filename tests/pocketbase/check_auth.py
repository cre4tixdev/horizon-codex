"""Real PocketBase tests. Only a disposable local database is used; never the Synology."""
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
# Fictional, local-only application credential shared with Playwright fixtures.
TEST_PASSWORD = 'Local-Horizon-test-only-2026!'


class LocalPocketBase:
    def __init__(self, port=None):
        self.environment = dict(os.environ)
        self.environment.pop('PAPPERS_API_KEY', None)
        self.environment.pop('HORIZON_INITIAL_ADMIN_EMAIL', None)
        self.binary = os.environ.get('POCKETBASE_BINARY', 'pocketbase')
        version = subprocess.check_output([self.binary, '--version'], text=True)
        if '0.40.4' not in version:
            raise RuntimeError('These fixtures require PocketBase 0.40.4.')
        self.temp = tempfile.TemporaryDirectory(prefix='horizon-auth-')
        self.data = Path(self.temp.name) / 'data'
        if port is None:
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0))
                port = sock.getsockname()[1]
        self.url = f'http://127.0.0.1:{port}'
        self.args = [self.binary, f'--dir={self.data}',
                     f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}',
                     f'--hooksDir={ROOT / "pocketbase/pb_hooks"}', '--automigrate=false', '--hooksWatch=false']
        self.admin_password = 'Local-' + secrets.token_urlsafe(32)
        self.admin_token = ''
        self.process = None
        self.log = open(Path(self.temp.name) / 'server.log', 'w+')

    def request(self, method, path, data=None, token='', extra_headers=None):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = token
        if extra_headers:
            headers.update(extra_headers)
        req = Request(self.url + '/api/' + path, headers=headers, method=method,
                      data=json.dumps(data).encode() if data is not None else None)
        try:
            with urlopen(req, timeout=5) as response:
                body = response.read()
                return response.status, json.loads(body) if body else None
        except HTTPError as error:
            return error.code, json.loads(error.read())

    def launch_and_authenticate(self, args):
        self.process = subprocess.Popen(args + ['serve', f'--http=127.0.0.1:{self.url.rsplit(":", 1)[1]}'],
                                        stdout=self.log, stderr=self.log, env=self.environment)
        for _ in range(100):
            if self.process.poll() is not None:
                raise RuntimeError('Local PocketBase exited before becoming ready.')
            try:
                if self.request('GET', 'health')[0] == 200:
                    break
            except (URLError, TimeoutError):
                time.sleep(.05)
        else:
            raise RuntimeError('Local PocketBase did not start.')
        status, result = self.request('POST', 'collections/_superusers/auth-with-password',
                                      {'identity': 'admin@local.invalid', 'password': self.admin_password})
        if status != 200:
            raise RuntimeError('Local fixture superuser authentication failed.')
        self.admin_token = result['token']

    def start(self, existing=False):
        if existing:
            empty = Path(self.temp.name) / 'empty_migrations'
            empty.mkdir()
            args = [arg for arg in self.args if not arg.startswith('--migrationsDir=')]
            args.append(f'--migrationsDir={empty}')
            subprocess.run(args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
            subprocess.run(args + ['superuser', 'upsert', 'admin@local.invalid', self.admin_password],
                           check=True, stdout=subprocess.DEVNULL)
            self.launch_and_authenticate(args)
            status, collection = self.request('GET', 'collections/users', token=self.admin_token)
            if status != 200:
                raise RuntimeError('Missing standard auth collection in compatibility fixture.')
            self.request('PATCH', f'collections/{collection["id"]}', {'createRule': ''}, self.admin_token)
            self.legacy_user = self.create('users', {'name': 'Compte historique', 'email': 'preserved@local.invalid',
                                                    'password': TEST_PASSWORD, 'passwordConfirm': TEST_PASSWORD})
            self.process.terminate()
            self.process.wait(timeout=10)
        subprocess.run(self.args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        # Reapplying is a no-op; migrations must remain reconstructible and repeatable.
        subprocess.run(self.args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        subprocess.run(self.args + ['superuser', 'upsert', 'admin@local.invalid', self.admin_password],
                       check=True, stdout=subprocess.DEVNULL)
        self.launch_and_authenticate(self.args)
        self.role = self.create('core_roles', {'name': 'reader', 'label': 'Lecture', 'active': True,
                                              'permissions': ['contacts.read']})
        self.other_role = self.create('core_roles', {'name': 'other', 'label': 'Autre', 'active': True,
                                                    'permissions': []})
        self.user = self.create_user('reader@local.invalid', self.role['id'])
        self.other_user = self.create_user('other@local.invalid', self.other_role['id'])
        return self

    def create(self, collection, data):
        status, result = self.request('POST', f'collections/{collection}/records', data, self.admin_token)
        if status != 200:
            # Only validation diagnostics, never credential payloads/tokens.
            raise RuntimeError(f'Fixture creation failed: {collection}, status {status}, fields {result.get("data", {})}')
        return result

    def create_user(self, email, role, profile=None):
        # Test setup only: a functional settings fixture has an explicit ERP profile.
        permissions = self.request('GET', f'collections/core_roles/records/{role}', token=self.admin_token)[1].get('permissions', [])
        profile = profile or ('admin' if 'settings.users' in permissions else 'superuser' if 'settings.references' in permissions else 'user')
        return self.create('core_users', {'name': 'Utilisateur test', 'email': email, 'role': role,
                                          'erp_profile': profile, 'active': True, 'password': TEST_PASSWORD, 'passwordConfirm': TEST_PASSWORD})

    def login(self, email='reader@local.invalid', password=TEST_PASSWORD):
        return self.request('POST', 'collections/core_users/auth-with-password?expand=role',
                            {'identity': email, 'password': password})

    def close(self):
        if self.process:
            self.process.terminate()
            self.process.wait(timeout=10)
        self.log.close()
        self.temp.cleanup()


class AuthRulesTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase()
        self.addCleanup(self.pb.close)
        self.pb.start()
        status, result = self.pb.login()
        self.assertEqual(status, 200)
        self.token = result['token']

    def test_login_expands_own_role_and_refreshes(self):
        status, result = self.pb.login()
        self.assertEqual(status, 200)
        self.assertEqual(result['record']['expand']['role']['permissions'], ['contacts.read'])
        status, result = self.pb.request('POST', 'collections/core_users/auth-refresh?expand=role', token=self.token)
        self.assertEqual(status, 200)
        self.assertEqual(result['record']['expand']['role']['id'], self.pb.role['id'])

    def test_anonymous_registration_and_reads_are_denied(self):
        for collection in ('core_users', 'core_roles'):
            status, result = self.pb.request('GET', f'collections/{collection}/records')
            self.assertEqual(status, 200)
            self.assertEqual(result['items'], [])
            self.assertEqual(self.pb.request('POST', f'collections/{collection}/records', {})[0], 403)
        self.assertEqual(self.pb.request('POST', 'collections/users/records', {})[0], 403)
        self.assertEqual(self.pb.login(password='wrong')[0], 400)

    def test_user_cannot_read_other_identity_or_role(self):
        for collection, record in [('core_users', self.pb.other_user), ('core_roles', self.pb.other_role)]:
            self.assertEqual(self.pb.request('GET', f'collections/{collection}/records/{record["id"]}', token=self.token)[0], 404)
        status, result = self.pb.request('GET', 'collections/core_users/records', token=self.token)
        self.assertEqual(status, 200)
        self.assertEqual([record['id'] for record in result['items']], [self.pb.user['id']])

    def test_no_privilege_escalation_or_role_changes(self):
        paths = [('core_users', self.pb.user['id'], {'role': self.pb.other_role['id']}),
                 ('core_users', self.pb.user['id'], {'active': False}),
                 ('core_roles', self.pb.role['id'], {'permissions': ['settings.roles']})]
        for collection, record_id, payload in paths:
            self.assertEqual(self.pb.request('PATCH', f'collections/{collection}/records/{record_id}', payload, self.token)[0], 403)
            self.assertEqual(self.pb.request('DELETE', f'collections/{collection}/records/{record_id}', token=self.token)[0], 403)

    def test_disabled_user_rejects_login_refresh_and_old_token_reads(self):
        self.pb.request('PATCH', f'collections/core_users/records/{self.pb.user["id"]}', {'active': False}, self.pb.admin_token)
        self.assertEqual(self.pb.login()[0], 403)
        self.assertEqual(self.pb.request('POST', 'collections/core_users/auth-refresh', token=self.token)[0], 403)
        self.assertEqual(self.pb.request('GET', f'collections/core_users/records/{self.pb.user["id"]}', token=self.token)[0], 404)
        self.assertEqual(self.pb.request('GET', f'collections/core_roles/records/{self.pb.role["id"]}', token=self.token)[0], 404)

    def test_disabled_role_rejects_login_refresh_and_old_token_reads(self):
        self.pb.request('PATCH', f'collections/core_roles/records/{self.pb.role["id"]}', {'active': False}, self.pb.admin_token)
        self.assertEqual(self.pb.login()[0], 403)
        self.assertEqual(self.pb.request('POST', 'collections/core_users/auth-refresh', token=self.token)[0], 403)
        self.assertEqual(self.pb.request('GET', f'collections/core_users/records/{self.pb.user["id"]}', token=self.token)[0], 404)

    def test_permission_values_are_validated_server_side(self):
        for value in ('contacts.read', ['*'], ['contacts.read', 'contacts.read'], {'contacts.read': True}, [42]):
            status, _ = self.pb.request('PATCH', f'collections/core_roles/records/{self.pb.role["id"]}', {'permissions': value}, self.pb.admin_token)
            self.assertEqual(status, 400)

    def test_standard_users_cannot_access_horizon(self):
        other = self.pb.create('users', {'email': 'legacy@local.invalid', 'password': TEST_PASSWORD,
                                        'passwordConfirm': TEST_PASSWORD})
        status, response = self.pb.request('POST', 'collections/users/auth-with-password',
                                            {'identity': other['email'], 'password': TEST_PASSWORD})
        self.assertEqual(status, 200)
        status, response = self.pb.request('GET', 'collections/core_users/records', token=response['token'])
        self.assertEqual(status, 200)
        self.assertEqual(response['items'], [])


class MigrationCompatibilityTests(unittest.TestCase):
    def test_existing_standard_accounts_are_preserved_and_registration_locked(self):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        pb.start(existing=True)
        status, record = pb.request('GET', f'collections/users/records/{pb.legacy_user["id"]}', token=pb.admin_token)
        self.assertEqual(status, 200)
        self.assertEqual(record['name'], 'Compte historique')
        self.assertEqual(record['email'], 'preserved@local.invalid')
        status, collection = pb.request('GET', 'collections/users', token=pb.admin_token)
        self.assertEqual(status, 200)
        self.assertIsNone(collection['createRule'])
        self.assertEqual(collection['viewRule'], 'id = @request.auth.id')

    def manual_fixture(self, change=None):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        empty = Path(pb.temp.name) / 'manual_migrations'
        empty.mkdir()
        args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')]
        args.append(f'--migrationsDir={empty}')
        subprocess.run(args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        subprocess.run(args + ['superuser', 'upsert', 'admin@local.invalid', pb.admin_password],
                       check=True, stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(args)
        schema = json.loads((ROOT / 'tests/pocketbase/fixtures/manual_auth.json').read_text())
        if change:
            change(schema)
        for collection in schema:
            status, _ = pb.request('POST', 'collections', collection, pb.admin_token)
            self.assertEqual(status, 200, 'Manual fixture schema creation failed.')
        role = pb.create('core_roles', {'name': 'development', 'label': 'Développement',
                                        'active': True, 'permissions': []})
        user = pb.create_user('manual@local.invalid', role['id'])
        before = {}
        for name in ('core_roles', 'core_users'):
            before[name] = pb.request('GET', f'collections/{name}', token=pb.admin_token)[1]
        pb.process.terminate()
        pb.process.wait(timeout=10)
        return pb, before, role, user

    def test_manual_schema_adoption_preserves_schema_ids_records_and_login(self):
        pb, before, role, user = self.manual_fixture()
        # Verify adoption itself separately from later intentional schema changes.
        import shutil
        isolated = Path(pb.temp.name) / 'adoption_migrations'
        isolated.mkdir()
        shutil.copy(ROOT / 'pocketbase/pb_migrations/1791072000_core_auth.js', isolated)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={isolated}']
        for _ in range(2):
            result = subprocess.run(pb.args + ['migrate', 'up'], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
        pb.launch_and_authenticate(pb.args)
        for name in before:
            status, after = pb.request('GET', f'collections/{name}', token=pb.admin_token)
            self.assertEqual(status, 200)
            self.assertTrue(after == before[name], 'Adoption must not rewrite schema or auth secrets.')
        status, result = pb.login(email='manual@local.invalid')
        self.assertEqual(status, 200)
        self.assertEqual(result['record']['id'], user['id'])
        self.assertEqual(result['record']['role'], role['id'])
        self.assertEqual(result['record']['expand']['role']['permissions'], [])
        self.assertEqual(result['record']['collectionId'], before['core_users']['id'])

    def test_adoption_refuses_drift_without_changing_existing_data(self):
        changes = [
            ('listRule', lambda schema: schema[1].update(listRule='')),
            ('role.required', lambda schema: next(field for field in schema[1]['fields'] if field['name'] == 'role').update(required=False)),
            ('avatar.protected', lambda schema: next(field for field in schema[1]['fields'] if field['name'] == 'avatar').update(protected=False)),
            ('auth_options', lambda schema: schema[1]['authToken'].update(duration=432000)),
        ]
        for path, change in changes:
            with self.subTest(path=path):
                pb, before, role, user = self.manual_fixture(change)
                result = subprocess.run(pb.args + ['migrate', 'up'], capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(f'incompatible core_users.{path}', result.stderr)
                import sqlite3
                with sqlite3.connect(pb.data / 'data.db') as connection:
                    self.assertEqual(connection.execute('SELECT role FROM core_users WHERE id = ?', (user['id'],)).fetchone()[0], role['id'])
                    self.assertEqual(connection.execute('SELECT listRule FROM _collections WHERE name = ?', ('core_users',)).fetchone()[0], before['core_users']['listRule'])
                    self.assertEqual(connection.execute('SELECT count(*) FROM _migrations WHERE file = ?', ('1791072000_core_auth.js',)).fetchone()[0], 0)

    def test_adoption_refuses_partial_installation(self):
        pb, before, role, user = self.manual_fixture()
        args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')]
        args.append(f'--migrationsDir={Path(pb.temp.name) / "manual_migrations"}')
        pb.launch_and_authenticate(args)
        status, _ = pb.request('DELETE', f'collections/{before["core_users"]["id"]}', token=pb.admin_token)
        self.assertEqual(status, 204)
        pb.process.terminate()
        pb.process.wait(timeout=10)
        result = subprocess.run(pb.args + ['migrate', 'up'], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('both core_roles and core_users must exist together', result.stderr)
        import sqlite3
        with sqlite3.connect(pb.data / 'data.db') as connection:
            self.assertEqual(connection.execute('SELECT count(*) FROM core_roles WHERE id = ?', (role['id'],)).fetchone()[0], 1)
            self.assertEqual(connection.execute("SELECT count(*) FROM _collections WHERE name = 'core_users'").fetchone()[0], 0)

    def test_rollback_refuses_to_delete_adopted_accounts(self):
        pb, before, role, user = self.manual_fixture()
        # Use the core migration alone to reach its down handler directly.
        import shutil
        isolated = Path(pb.temp.name) / 'isolated_migrations'
        isolated.mkdir()
        shutil.copy(ROOT / 'pocketbase/pb_migrations/1791072000_core_auth.js', isolated)
        args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')]
        args.append(f'--migrationsDir={isolated}')
        result = subprocess.run(args + ['migrate', 'up'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        result = subprocess.run(args + ['migrate', 'down', '1'], input='y\n', text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Core auth rollback refused', result.stderr)
        import sqlite3
        with sqlite3.connect(pb.data / 'data.db') as connection:
            self.assertEqual(connection.execute('SELECT count(*) FROM core_users WHERE id = ?', (user['id'],)).fetchone()[0], 1)


if __name__ == '__main__':
    if '--serve' in sys.argv:
        pb = LocalPocketBase(port=18090)
        try:
            pb.start()
            writer_role = pb.create('core_roles', {'name': 'contacts_writer', 'label': 'Contacts', 'active': True, 'permissions': ['contacts.read', 'contacts.write']})
            writer = pb.create_user('writer@local.invalid', writer_role['id'])
            admin_role = pb.create('core_roles', {'name': 'erp_admin', 'label': 'Admin', 'active': True, 'permissions': ['settings.users', 'settings.references', 'contacts.read', 'contacts.write', 'crm.read', 'crm.write', 'hr.read', 'hr.write', 'hr.organisation.manage']})
            admin_user = pb.create_user('erp-admin@local.invalid', admin_role['id'], 'admin')
            pb.request('PATCH', f'collections/core_users/records/{admin_user["id"]}', {'hr_scope': 'all'}, pb.admin_token)
            crm_role = pb.create('core_roles', {'name': 'crm_writer', 'label': 'CRM', 'active': True, 'permissions': ['contacts.read', 'contacts.write', 'crm.read', 'crm.write']})
            pb.create_user('crm@local.invalid', crm_role['id'])
            crm_admin = pb.create('core_roles', {'name': 'crm_admin', 'label': 'CRM paramètres', 'active': True, 'permissions': ['crm.read', 'crm.write', 'contacts.read', 'settings.references']})
            pb.create_user('crm-admin@local.invalid', crm_admin['id'])
            crm_reader = pb.create('core_roles', {'name': 'crm_reader', 'label': 'CRM lecture', 'active': True, 'permissions': ['crm.read', 'contacts.read']})
            pb.create_user('crm-reader@local.invalid', crm_reader['id'])
            pb.create('core_notifications', {'user': writer['id'], 'title': 'Notification de recette', 'body': 'Un message réservé à ce compte.'})
            references_role = pb.create('core_roles', {'name': 'references_editor', 'label': 'Référentiels', 'active': True, 'permissions': ['contacts.read', 'contacts.write', 'settings.references']})
            pb.create_user('references@local.invalid', references_role['id'])
            views_role = pb.create('core_roles', {'name': 'views_admin', 'label': 'Administrateur des vues', 'active': True, 'permissions': ['contacts.read', 'core.views.manage']})
            pb.create_user('views-admin@local.invalid', views_role['id'])
            colleague = pb.create_user('activity@local.invalid', pb.role['id'])
            pb.request('PATCH', f'collections/core_users/records/{colleague["id"]}', {'name': 'Alice Martin'}, pb.admin_token)
            print('Local PocketBase auth fixture ready on 127.0.0.1:18090', flush=True)
            pb.process.wait()
        except KeyboardInterrupt:
            pass
        finally:
            pb.close()
    else:
        unittest.main()

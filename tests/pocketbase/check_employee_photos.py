"""Employee photo ownership, protected projections and non-destructive migration."""
import base64
import json
import shutil
import subprocess
import unittest
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from check_auth import LocalPocketBase, ROOT

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')

def upload(pb, path, token, fields, content=PNG, method='POST'):
    boundary = 'employee-photo-fixture'
    parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode() for key, value in fields.items()]
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="portrait.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + content + b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    request = Request(pb.url + '/api/' + path, data=b''.join(parts), headers={'Authorization': token, 'Content-Type': f'multipart/form-data; boundary={boundary}'}, method=method)
    try:
        with urlopen(request) as response: return response.status, json.loads(response.read())
    except HTTPError as error: return error.code, json.loads(error.read())

class EmployeePhotoTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.addCleanup(self.pb.close)
        self.role = self.pb.create('core_roles', {'name': 'photo_admin', 'label': 'Admin', 'active': True, 'permissions': ['settings.users', 'hr.read', 'hr.write', 'hr.organisation.manage', 'contacts.read', 'contacts.write']})
        self.admin = self.pb.create_user('photo-admin@local.invalid', self.role['id'], 'admin')
        self.pb.request('PATCH', 'collections/core_users/records/' + self.admin['id'], {'hr_scope': 'all'}, self.pb.admin_token)
        self.token = self.pb.login('photo-admin@local.invalid')[1]['token']
        self.input = dict(first_name='Photo', last_name='Employé', professional_email='', professional_phone='', job_title='', employment_type='employee', team='', manager='', is_manager=False, is_direction=False, external_company='', start_date='', end_date='', status='active')

    def employee(self):
        status, record = self.pb.request('POST', 'horizon/hr/employees/save', {'input': self.input}, self.token)
        self.assertEqual(status, 200, record)
        return record

    def associate(self, user, employee):
        return self.pb.request('POST', 'horizon/access/users/save', {'id': user['id'], 'updated': user['updated'], 'input': dict(email=user['email'], name=user['name'], active=True, erp_profile='user', employee=employee['id'], grants={'contacts': {'actions': ['read', 'write'], 'scope': 'all'}})}, self.token)

    def read_photo(self, path, token):
        with urlopen(Request(self.pb.url + '/api/' + path, headers={'Authorization': token})) as response:
            return response.status, response.read()

    def test_association_inherits_once_and_projections_follow_employee(self):
        employee = self.employee()
        user = self.pb.create_user('photo-owner@local.invalid', self.pb.role['id'])
        status, user = upload(self.pb, 'collections/core_users/records/' + user['id'], self.pb.admin_token, {}, method='PATCH')
        self.assertEqual(status, 200, user)
        original_avatar = user['avatar']
        status, user = self.associate(user, employee)
        self.assertEqual(status, 200, user)
        owner = self.pb.login('photo-owner@local.invalid')[1]['token']
        status, profile = self.pb.request('GET', 'horizon/account', token=owner)
        self.assertEqual(status, 200, profile)
        self.assertEqual(profile['employee_id'], employee['id'])
        self.assertTrue(profile['avatar'])
        own_path = 'horizon/account/avatar/' + user['id']
        self.assertEqual(self.read_photo(own_path, owner), (200, PNG))
        self.assertEqual(self.read_photo(own_path, self.token), (200, PNG))
        self.assertIn(self.pb.request('GET', own_path)[0], [401, 403])
        other = self.pb.login('other@local.invalid')[1]['token']
        self.assertEqual(self.pb.request('GET', own_path, token=other)[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/hr/directory', token=owner)[0], 403)
        self.assertEqual(upload(self.pb, 'horizon/account/save', owner, {'updated': profile['updated'], 'input': json.dumps(dict(name=profile['name'], first_name='Photo', last_name='Employé', public_email=''))})[0], 400)
        company = self.pb.create('contacts_companies', {'name': 'Photo source', 'active': True})
        status, event = self.pb.request('POST', 'collections/core_activity_events/records', {'source_module': 'contacts', 'source_entity': 'contacts_companies', 'source_record_id': company['id'], 'type': 'note', 'body': 'Photo', 'metadata': {}, 'mentions': []}, owner)
        self.assertEqual(status, 200, event)
        self.assertEqual(self.read_photo('horizon/activity/events/' + event['id'] + '/avatar', self.token), (200, PNG))
        employee = self.pb.request('GET', 'collections/hr_employees/records/' + employee['id'], token=self.pb.admin_token)[1]
        self.assertEqual(self.pb.request('POST', 'horizon/hr/employees/save', {'id': employee['id'], 'updated': employee['updated'], 'input': self.input, 'remove_avatar': 'bad'}, self.token)[0], 400)
        status, employee = self.pb.request('POST', 'horizon/hr/employees/save', {'id': employee['id'], 'updated': employee['updated'], 'input': self.input, 'remove_avatar': True}, self.token)
        self.assertEqual(status, 200, employee)
        self.assertEqual(self.read_photo(own_path, owner)[0], 204)
        self.assertEqual(self.read_photo('horizon/activity/events/' + event['id'] + '/avatar', self.token)[0], 204)
        current = self.pb.request('GET', 'collections/core_users/records/' + user['id'], token=self.pb.admin_token)[1]
        self.assertEqual(current['avatar'], original_avatar)
        self.assertEqual(self.associate(current, employee)[0], 200)
        self.assertEqual(self.read_photo(own_path, owner)[0], 204)
        # Unlink/relink cannot restore the historic account photo either.
        current = self.pb.request('GET', 'collections/core_users/records/' + user['id'], token=self.pb.admin_token)[1]
        self.assertTrue(current['employee_photo_migrated'])
        self.assertEqual(self.associate(current, {'id': ''})[0], 200)
        current = self.pb.request('GET', 'collections/core_users/records/' + user['id'], token=self.pb.admin_token)[1]
        self.assertEqual(self.associate(current, employee)[0], 200)
        self.assertEqual(self.read_photo(own_path, owner)[0], 204)
        # A replacement on the employee appears on the associated account immediately.
        status, employee = upload(self.pb, 'horizon/hr/employees/save', self.token, {'id': employee['id'], 'updated': employee['updated'], 'input': json.dumps(self.input)})
        self.assertEqual(status, 200, employee)
        self.assertEqual(self.read_photo(own_path, owner), (200, PNG))

    def test_association_preserves_existing_employee_photo(self):
        employee = self.employee()
        status, employee = upload(self.pb, 'horizon/hr/employees/save', self.token, {'id': employee['id'], 'updated': employee['updated'], 'input': json.dumps(self.input)})
        self.assertEqual(status, 200, employee)
        filename = employee['avatar']
        user = self.pb.create_user('photo-conflict@local.invalid', self.pb.role['id'])
        status, user = upload(self.pb, 'collections/core_users/records/' + user['id'], self.pb.admin_token, {}, method='PATCH')
        self.assertEqual(status, 200)
        self.assertEqual(self.associate(user, employee)[0], 200)
        self.assertEqual(self.pb.request('GET', 'collections/hr_employees/records/' + employee['id'], token=self.pb.admin_token)[1]['avatar'], filename)

class EmployeePhotoMigrationTests(unittest.TestCase):
    def test_migration_preserves_originals_conflicts_and_is_repeatable(self):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791840008': shutil.copy(path, previous)
        original = pb.args[:]
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        cases = []
        for index in range(2):
            employee = pb.create('hr_employees', {'first_name': 'Photo', 'last_name': str(index), 'employment_type': 'employee', 'status': 'active'})
            if index:
                status, employee = upload(pb, 'collections/hr_employees/records/' + employee['id'], pb.admin_token, {}, method='PATCH')
                self.assertEqual(status, 200)
            user = pb.create_user(f'legacy-photo-{index}@local.invalid', pb.role['id'])
            status, user = upload(pb, 'collections/core_users/records/' + user['id'], pb.admin_token, {'employee': employee['id']}, method='PATCH')
            self.assertEqual(status, 200)
            cases.append((employee, user))
        pb.process.terminate(); pb.process.wait(timeout=10)
        for _ in range(2):
            result = subprocess.run(original + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        pb.args = original
        pb.launch_and_authenticate(original)
        for employee, user in cases:
            current = pb.request('GET', 'collections/hr_employees/records/' + employee['id'], token=pb.admin_token)[1]
            self.assertTrue(current['avatar'])
            if employee['avatar']: self.assertEqual(current['avatar'], employee['avatar'])
            self.assertEqual(pb.request('GET', 'collections/core_users/records/' + user['id'], token=pb.admin_token)[1]['avatar'], user['avatar'])
            token = pb.request('POST', 'files/token', token=pb.admin_token)[1]['token']
            for record in (current, user):
                with urlopen(f'{pb.url}/api/files/{record["collectionId"]}/{record["id"]}/{record["avatar"]}?token={token}') as response: self.assertEqual(response.read(), PNG)

if __name__ == '__main__': unittest.main(verbosity=2)

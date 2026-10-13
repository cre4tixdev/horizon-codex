"""Self-service profile and protected avatar; only a disposable PocketBase database."""
import base64
import json
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from check_auth import LocalPocketBase, TEST_PASSWORD

class AccountTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.token = self.pb.login()[1]['token']
        self.input = dict(first_name='Guillaume', last_name='Clairardin', name='Guillaume Clairardin', public_email='contact@local.invalid')
    def tearDown(self):
        self.pb.close()
    def profile(self):
        status, result = self.pb.request('GET', 'horizon/account', token=self.token)
        self.assertEqual(status, 200, result)
        return result
    def save(self, **extra):
        return self.pb.request('POST', 'horizon/account/save', dict(updated=self.profile()['updated'], input=self.input, **extra), self.token)
    def test_own_profile_allowlist_conflict_and_viewer(self):
        self.assertIn(self.pb.request('GET', 'horizon/account')[0], [401, 403])
        original = self.profile()
        for field in ['role', 'mail_from', 'employee', 'access_grants', 'passwordHash', 'password']: self.assertNotIn(field, original)
        status, saved = self.save()
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['name'], self.input['name'])
        self.assertEqual(saved['email'], 'reader@local.invalid')
        self.assertEqual(self.pb.request('POST', 'horizon/account/save', dict(updated='stale', input=self.input), self.token)[0], 409)
        self.assertEqual(self.save(id=self.pb.other_user['id'])[0], 400)
        for key in ['email', 'role', 'erp_profile', 'mail_from', 'active', 'employee', 'access_grants']:
            status, _ = self.pb.request('POST', 'horizon/account/save', dict(updated=saved['updated'], input={**self.input, key: 'forbidden'}), self.token)
            self.assertEqual(status, 400, key)
        self.assertEqual(self.pb.request('GET', 'collections/core_users/records/' + self.pb.other_user['id'], token=self.pb.admin_token)[1]['name'], 'Utilisateur test')
        self.pb.request('PATCH', 'collections/core_users/records/' + original['id'], {'erp_profile': 'viewer'}, self.pb.admin_token)
        self.assertEqual(self.save()[0], 200)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.pb.role['id'], {'active': False}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', 'horizon/account', token=self.token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'horizon/account/save', dict(updated=saved['updated'], input=self.input), self.token)[0], 403)
    def test_avatar_upload_private_removal_and_bad_mime(self):
        png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
        def upload(content, filename, mime, legacy=False):
            boundary = 'horizon-account-test-boundary'
            fields = dict(updated=self.profile()['updated'], input=json.dumps(self.input), remove_avatar='false')
            parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode() for key, value in fields.items()]
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode() + content + b'\r\n')
            parts.append(f'--{boundary}--\r\n'.encode())
            req = Request(self.pb.url + ('/api/collections/core_users/records/' + self.profile()['id'] if legacy else '/api/horizon/account/save'), data=b''.join(parts), headers={'Authorization': self.pb.admin_token if legacy else self.token, 'Content-Type': f'multipart/form-data; boundary={boundary}'}, method='PATCH' if legacy else 'POST')
            try:
                with urlopen(req) as response: return response.status, json.loads(response.read())
            except HTTPError as error: return error.code, json.loads(error.read())
        self.assertEqual(upload(png, 'avatar.png', 'image/png')[0], 400)
        status, saved = upload(png, 'avatar.png', 'image/png', legacy=True)
        self.assertEqual(status, 200, saved)
        path = f'{self.pb.url}/api/files/{saved["collectionId"]}/{saved["id"]}/{saved["avatar"]}'
        with self.assertRaises(HTTPError): urlopen(path)
        token = self.pb.request('POST', 'files/token', token=self.token)[1]['token']
        with urlopen(path + '?token=' + token) as response: self.assertEqual(response.read(), png)
        other = self.pb.login('other@local.invalid')[1]['token']
        other_file_token = self.pb.request('POST', 'files/token', token=other)[1]['token']
        with self.assertRaises(HTTPError): urlopen(path + '?token=' + other_file_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.pb.role['id'], {'permissions': ['contacts.read', 'contacts.write']}, self.pb.admin_token)
        company = self.pb.create('contacts_companies', {'name': 'Fil test photo', 'active': True})
        status, publication = self.pb.request('POST', 'collections/core_activity_events/records', {'source_module': 'contacts', 'source_entity': 'contacts_companies', 'source_record_id': company['id'], 'type': 'note', 'body': 'Publication illustrée', 'metadata': {}, 'mentions': []}, self.token)
        self.assertEqual(status, 200, publication)
        avatar_path = self.pb.url + '/api/horizon/activity/events/' + publication['id'] + '/avatar'
        with urlopen(Request(avatar_path, headers={'Authorization': self.token})) as response: self.assertEqual(response.read(), png)
        with self.assertRaises(HTTPError): urlopen(Request(avatar_path, headers={'Authorization': other}))
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.pb.other_role['id'], {'permissions': ['contacts.read']}, self.pb.admin_token)
        with urlopen(Request(avatar_path, headers={'Authorization': other})) as response: self.assertEqual(response.read(), png)
        self.assertEqual(upload(b'bad', 'avatar.svg', 'image/svg+xml')[0], 400)
        self.assertEqual(self.save(remove_avatar=True)[0], 400)
        self.assertEqual(self.profile()['avatar'], saved['avatar'])
        with urlopen(Request(self.pb.url + '/api/horizon/account/avatar/' + saved['id'], headers={'Authorization': self.token})) as response: self.assertEqual(response.read(), png)
        with self.assertRaises(HTTPError): urlopen(Request(self.pb.url + '/api/horizon/account/avatar/' + saved['id'], headers={'Authorization': other}))
    def test_presence_own_account_and_values(self):
        self.assertEqual(self.profile()['presence'], 'available')
        for value in ['away', 'busy', 'offline', 'available']:
            status, saved = self.pb.request('POST', 'horizon/account/presence', {'presence': value}, self.token)
            self.assertEqual(status, 200, saved)
            self.assertEqual(saved['presence'], value)
            self.assertEqual(self.profile()['presence'], value)
        self.assertEqual(self.pb.request('POST', 'horizon/account/presence', {'presence': 'invalid'}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/account/presence', {'presence': 'busy', 'id': self.pb.other_user['id']}, self.token)[0], 400)
        self.assertEqual(self.pb.request('GET', 'collections/core_users/records/' + self.pb.other_user['id'], token=self.pb.admin_token)[1]['presence'], '')

    def test_password_verification_rotation_and_safe_audit(self):
        new = 'New-Horizon-local-password-2026!'
        body = dict(current_password='incorrect', password=new, password_confirm=new)
        self.assertEqual(self.pb.request('POST', 'horizon/account/password', body, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/account/password', dict(body, current_password=TEST_PASSWORD, password_confirm='other'), self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/account/password', dict(body, current_password=TEST_PASSWORD), self.token)[0], 200)
        self.assertNotEqual(self.pb.request('POST', 'collections/core_users/auth-refresh', token=self.token)[0], 200)
        self.assertNotEqual(self.pb.login()[0], 200)
        self.assertEqual(self.pb.login(password=new)[0], 200)
        audits = self.pb.request('GET', 'collections/core_audit/records', token=self.pb.admin_token)[1]
        self.assertNotIn(new, json.dumps(audits))
        self.assertNotIn(TEST_PASSWORD, json.dumps(audits))

if __name__ == '__main__': unittest.main(verbosity=2)

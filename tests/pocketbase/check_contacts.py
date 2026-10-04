"""Contacts permissions, validation and audit on disposable PocketBase only."""
import base64
import sqlite3
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import unittest
from check_auth import LocalPocketBase


class ContactsTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase()
        self.addCleanup(self.pb.close)
        self.pb.start()
        role = self.pb.create('core_roles', {'name': 'contacts_editor', 'label': 'Contacts', 'active': True,
                                            'permissions': ['contacts.read', 'contacts.write']})
        self.writer = self.pb.create_user('contacts@local.invalid', role['id'])
        self.writer_role = role
        self.token = self.pb.login('contacts@local.invalid')[1]['token']
        self.reader = self.pb.login()[1]['token']
        self.other = self.pb.login('other@local.invalid')[1]['token']

    def create_company(self, name='Société test'):
        status, record = self.pb.request('POST', 'collections/contacts_companies/records', {'name': name, 'active': True}, self.token)
        self.assertEqual(status, 200, record)
        return record

    def test_crud_archive_preserves_relations_and_audits_actor(self):
        company = self.create_company()
        person = self.pb.create('contacts_people', {'company': company['id'], 'last_name': 'Contact', 'active': True})
        role = self.pb.create('contacts_company_roles', {'company': company['id'], 'role': 'customer', 'active': True})
        status, _ = self.pb.request('PATCH', f'collections/contacts_companies/records/{company["id"]}', {'active': False}, self.token)
        self.assertEqual(status, 200)
        self.assertEqual(self.pb.request('GET', f'collections/contacts_people/records/{person["id"]}', token=self.reader)[1]['company'], company['id'])
        self.assertEqual(self.pb.request('GET', f'collections/contacts_company_roles/records/{role["id"]}', token=self.reader)[0], 200)
        self.assertEqual(self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=self.token)[0], 403)
        _, audits = self.pb.request('GET', 'collections/core_audit/records', token=self.pb.admin_token)
        archives = [item for item in audits['items'] if item['action'] == 'archive']
        self.assertEqual(len(archives), 1)
        self.assertEqual(archives[0]['user'], self.writer['id'])
        self.assertTrue(archives[0]['before']['active'])
        self.assertFalse(archives[0]['after']['active'])
        self.assertEqual(self.pb.request('GET', 'collections/core_audit/records', token=self.token)[0], 403)
        self.assertEqual(self.pb.request('PATCH', f'collections/contacts_companies/records/{company["id"]}', {'active': True}, self.token)[0], 200)

    def test_anonymous_and_missing_permission_cannot_read(self):
        company = self.create_company()
        for token in ['', self.other]:
            self.assertEqual(self.pb.request('GET', 'collections/contacts_companies/records', token=token)[1]['items'], [])
            self.assertEqual(self.pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=token)[0], 404)
        self.assertEqual(self.pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=self.reader)[0], 200)

    def test_readonly_cannot_create_or_update(self):
        company = self.create_company()
        for token in ['', self.other, self.reader]:
            self.assertEqual(self.pb.request('POST', 'collections/contacts_companies/records', {'name': 'Interdit', 'active': True}, token)[0], 400)
            self.assertEqual(self.pb.request('PATCH', f'collections/contacts_companies/records/{company["id"]}', {'name': 'Interdit'}, token)[0], 404)

    def test_permissions_match_exactly_and_disabled_role_is_denied(self):
        company = self.create_company()
        self.pb.request('PATCH', f'collections/core_roles/records/{self.writer_role["id"]}', {'permissions': ['contacts.read_extra', 'contacts.write']}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', 'collections/contacts_companies/records', token=self.token)[1]['items'], [])
        self.pb.request('PATCH', f'collections/core_roles/records/{self.writer_role["id"]}', {'permissions': ['contacts.read', 'contacts.write'], 'active': False}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=self.token)[0], 404)

    def test_names_roles_addresses_and_archived_company_validation(self):
        company = self.create_company()
        for collection, data in [ ('contacts_companies', {'name': '   '}), ('contacts_people', {'first_name': '  ', 'last_name': ''}), ('contacts_addresses', {'company': company['id'], 'type': 'billing', 'line1': 'Rue', 'city': 'Paris', 'country': 'France'}) ]:
            self.assertEqual(self.pb.request('POST', f'collections/{collection}/records', data, self.token)[0], 400)
        data = {'company': company['id'], 'role': 'supplier', 'active': True}
        self.assertEqual(self.pb.request('POST', 'collections/contacts_company_roles/records', data, self.token)[0], 200)
        self.assertEqual(self.pb.request('POST', 'collections/contacts_company_roles/records', data, self.token)[0], 400)
        address = {'company': company['id'], 'type': 'billing', 'line1': 'Rue', 'city': 'Paris', 'country': 'FR'}
        self.assertEqual(self.pb.request('POST', 'collections/contacts_addresses/records', address, self.token)[0], 200)
        self.pb.request('PATCH', f'collections/contacts_companies/records/{company["id"]}', {'active': False}, self.token)
        for collection, data in [('contacts_people', {'company': company['id'], 'last_name': 'Test'}), ('contacts_addresses', address), ('contacts_company_roles', {'company': company['id'], 'role': 'partner'})]:
            self.assertEqual(self.pb.request('POST', f'collections/{collection}/records', data, self.token)[0], 400)

    def test_protected_logo_requires_read_permission(self):
        png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
        boundary = 'HorizonLocalFileFixture'
        parts = []
        for field, value in [('name', 'Protected company'), ('active', 'true')]:
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"\r\n\r\n{value}\r\n'.encode())
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="logo"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + png + b'\r\n')
        parts.append(f'--{boundary}--\r\n'.encode())
        req = Request(self.pb.url + '/api/collections/contacts_companies/records', data=b''.join(parts), method='POST', headers={'Content-Type': f'multipart/form-data; boundary={boundary}', 'Authorization': self.token})
        with urlopen(req) as response:
            import json
            company = json.loads(response.read())
        url = self.pb.url + f'/api/files/{company["collectionId"]}/{company["id"]}/{company["logo"]}'
        for user_token, allowed in [('', False), (self.reader, True), (self.other, False)]:
            token = self.pb.request('POST', 'files/token', {}, user_token)[1].get('token', '') if user_token else ''
            try:
                with urlopen(url + '?token=' + token) as response:
                    self.assertTrue(allowed)
                    self.assertEqual(response.read(), png)
            except HTTPError as error:
                self.assertFalse(allowed)
                self.assertIn(error.code, [403, 404])

    def test_audit_failure_rolls_back_business_save(self):
        company = self.create_company()
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            connection.execute("CREATE TRIGGER fail_test_audit BEFORE INSERT ON core_audit BEGIN SELECT RAISE(ABORT, 'test audit failure'); END;")
        status, _ = self.pb.request('PATCH', f'collections/contacts_companies/records/{company["id"]}', {'name': 'Must rollback'}, self.token)
        self.assertGreaterEqual(status, 400)
        self.assertEqual(self.pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=self.reader)[1]['name'], company['name'])


if __name__ == '__main__':
    unittest.main()

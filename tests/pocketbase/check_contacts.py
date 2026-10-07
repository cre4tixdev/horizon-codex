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

    def test_postal_and_email_address_batch_permissions_and_retry(self):
        company = self.create_company()
        route = 'horizon/contacts/addresses/save'
        payload = {'company': company['id'], 'operation': 'operation-addresses-2026', 'entries': [
            {'creation_id': 'newemail1234567', 'input': {'type': 'billing', 'label': 'Comptabilité', 'email': 'billing@local.invalid', 'is_primary': True}},
            {'creation_id': 'postal000000001', 'input': {'type': 'shipping', 'label': 'Entrepôt', 'line1': '12 rue du Test', 'city': 'Lyon', 'country': 'FR', 'email': 'warehouse@local.invalid'}},
        ]}
        # Record ids must be 15 characters, stable across an ambiguous retry.
        for token in ['', self.reader, self.other]:
            self.assertIn(self.pb.request('POST', route, payload, token)[0], [401, 403])
        status, result = self.pb.request('POST', route, payload, self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(len(result['items']), 2)
        self.assertEqual(result['items'][0]['line1'], '')
        self.assertEqual(result['items'][1]['email'], 'warehouse@local.invalid')
        status, retry = self.pb.request('POST', route, payload, self.token)
        self.assertEqual(status, 200, retry)
        self.assertEqual([item['id'] for item in retry['items']], [item['id'] for item in result['items']])
        addresses = self.pb.request('GET', 'collections/contacts_addresses/records', token=self.token)[1]['items']
        self.assertEqual(len(addresses), 2)
        other_company = self.create_company('Autre société')
        self.assertEqual(self.pb.request('POST', route, {**payload, 'company': other_company['id']}, self.token)[0], 403)
        self.pb.request('PATCH', f'collections/contacts_companies/records/{company["id"]}', {'active': False}, self.token)
        self.assertEqual(self.pb.request('POST', route, payload, self.token)[0], 400)

    def test_address_batch_atomic_validation_primary_and_audit(self):
        company = self.create_company()
        route = 'horizon/contacts/addresses/save'
        old = self.pb.create('contacts_addresses', {'company': company['id'], 'type': 'billing', 'email': 'old@local.invalid', 'is_primary': True})
        payload = {'company': company['id'], 'operation': 'operation-addresses-atomic', 'entries': [
            {'creation_id': 'addressnew12345', 'input': {'type': 'billing', 'email': 'new@local.invalid', 'is_primary': True}},
            {'creation_id': 'addressbad12345', 'input': {'type': 'shipping', 'line1': 'Adresse incomplète'}},
        ]}
        self.assertEqual(self.pb.request('POST', route, payload, self.token)[0], 400)
        self.assertTrue(self.pb.request('GET', f'collections/contacts_addresses/records/{old["id"]}', token=self.token)[1]['is_primary'])
        self.assertEqual(self.pb.request('GET', 'collections/contacts_addresses/records', token=self.token)[1]['totalItems'], 1)
        payload['entries'] = payload['entries'][:1]
        status, result = self.pb.request('POST', route, payload, self.token)
        self.assertEqual(status, 200, result)
        self.assertTrue(result['items'][0]['is_primary'])
        self.assertFalse(self.pb.request('GET', f'collections/contacts_addresses/records/{old["id"]}', token=self.token)[1]['is_primary'])
        audits = self.pb.request('GET', 'collections/core_audit/records?perPage=500', token=self.pb.admin_token)[1]['items']
        self.assertTrue(any(item['entity_id'] == result['items'][0]['id'] and item['user'] == self.writer['id'] for item in audits))
        for input in [{'type': 'other'}, {'type': 'billing', 'email': 'invalid'}, {'type': 'shipping', 'country': 'FR'}]:
            self.assertEqual(self.pb.request('POST', 'collections/contacts_addresses/records', {'company': company['id'], **input}, self.token)[0], 400)

    def test_crud_archive_preserves_relations_and_audits_actor(self):
        company = self.create_company()
        person = self.pb.create('contacts_people', {'company': company['id'], 'last_name': 'Contact', 'active': True})
        role = self.pb.create('contacts_company_roles', {'company': company['id'], 'role': 'customer', 'active': True})
        status, _ = self.pb.request('PATCH', f'collections/contacts_companies/records/{company["id"]}', {'active': False}, self.token)
        self.assertEqual(status, 200)
        self.assertEqual(self.pb.request('GET', f'collections/contacts_people/records/{person["id"]}', token=self.reader)[1]['company'], company['id'])
        self.assertEqual(self.pb.request('GET', f'collections/contacts_company_roles/records/{role["id"]}', token=self.reader)[0], 200)
        status, rejected = self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=self.token)
        self.assertEqual(status, 409, rejected)
        _, audits = self.pb.request('GET', 'collections/core_audit/records?perPage=500', token=self.pb.admin_token)
        archives = [item for item in audits['items'] if item['action'] == 'archive']
        self.assertEqual(len(archives), 1)
        self.assertEqual(archives[0]['user'], self.writer['id'])
        self.assertTrue(archives[0]['before']['active'])
        self.assertFalse(archives[0]['after']['active'])
        self.assertEqual(self.pb.request('GET', 'collections/core_audit/records', token=self.token)[0], 403)
        self.assertEqual(self.pb.request('PATCH', f'collections/contacts_companies/records/{company["id"]}', {'active': True}, self.token)[0], 200)

    def test_delete_unused_company_cleans_owned_rows_and_audits(self):
        company = self.create_company()
        role = self.pb.create('contacts_company_roles', {'company': company['id'], 'role': 'customer'})
        address = self.pb.create('contacts_addresses', {'company': company['id'], 'type': 'registered', 'line1': 'Rue', 'city': 'Paris', 'country': 'FR'})
        for token in ['', self.reader, self.other]:
            self.assertNotEqual(self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=token)[0], 204)
        status, result = self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=self.token)
        self.assertEqual(status, 204, result)
        for collection, record in [('contacts_companies', company), ('contacts_company_roles', role), ('contacts_addresses', address)]:
            self.assertEqual(self.pb.request('GET', f'collections/{collection}/records/{record["id"]}', token=self.pb.admin_token)[0], 404)
        _, audits = self.pb.request('GET', 'collections/core_audit/records?perPage=500', token=self.pb.admin_token)
        deleted = [item for item in audits['items'] if item['action'] == 'delete']
        self.assertEqual(len(deleted), 3)
        self.assertTrue(all(item['user'] == self.writer['id'] and item['after'] is None for item in deleted))
        parent = next(item for item in deleted if item['entity'] == 'contacts_companies')
        self.assertEqual(parent['before']['name'], company['name'])

    def test_delete_protects_hidden_archived_documents_and_multirelations_even_for_admin(self):
        company = self.create_company()
        status, definition = self.pb.request('POST', 'collections', {'name': 'test_sales_documents', 'type': 'base', 'fields': [
            {'name': 'customer', 'type': 'relation', 'collectionId': company['collectionId'], 'maxSelect': 2, 'cascadeDelete': True},
            {'name': 'active', 'type': 'bool'},
        ], 'listRule': None, 'viewRule': None}, self.pb.admin_token)
        self.assertEqual(status, 200, definition)
        document = self.pb.create('test_sales_documents', {'customer': [company['id']], 'active': False})
        self.assertIn(self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=self.reader)[0], [403, 404])
        for token in [self.token, self.pb.admin_token]:
            status, result = self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=token)
            self.assertEqual(status, 409, result)
        self.assertEqual(self.pb.request('GET', f'collections/test_sales_documents/records/{document["id"]}', token=self.pb.admin_token)[0], 200)
        self.assertEqual(self.pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=self.token)[0], 200)

    def test_delete_person_when_unused_and_refuse_related_person(self):
        person = self.pb.create('contacts_people', {'last_name': 'Unused', 'active': True})
        self.assertEqual(self.pb.request('DELETE', f'collections/contacts_people/records/{person["id"]}', token=self.token)[0], 204)
        person = self.pb.create('contacts_people', {'last_name': 'Linked', 'active': False})
        status, definition = self.pb.request('POST', 'collections', {'name': 'test_person_documents', 'type': 'base', 'fields': [
            {'name': 'person', 'type': 'relation', 'collectionId': person['collectionId'], 'maxSelect': 1},
        ]}, self.pb.admin_token)
        self.assertEqual(status, 200, definition)
        self.pb.create('test_person_documents', {'person': person['id']})
        status, result = self.pb.request('DELETE', f'collections/contacts_people/records/{person["id"]}', token=self.token)
        self.assertEqual(status, 409, result)

    def test_delete_rolls_back_parent_and_children_when_audit_fails(self):
        company = self.create_company()
        role = self.pb.create('contacts_company_roles', {'company': company['id'], 'role': 'supplier'})
        _, definition = self.pb.request('GET', 'collections/core_audit', token=self.pb.admin_token)
        for field in definition['fields']:
            if field['name'] == 'action':
                field['max'] = 1
        status, result = self.pb.request('PATCH', 'collections/core_audit', {'fields': definition['fields']}, self.pb.admin_token)
        self.assertEqual(status, 200, result)
        self.assertNotEqual(self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=self.token)[0], 204)
        for collection, record in [('contacts_companies', company), ('contacts_company_roles', role)]:
            self.assertEqual(self.pb.request('GET', f'collections/{collection}/records/{record["id"]}', token=self.pb.admin_token)[0], 200)

    def test_accounting_profile_permissions_validation_and_owned_cleanup(self):
        company = self.create_company()
        self.assertEqual(company['preferred_language'], 'fr')
        self.assertEqual(company['default_currency'], 'EUR')
        self.assertEqual(company['einvoice_status'], 'unknown')
        route = 'collections/accounting_third_party_accounts/records'
        payload = {'company': company['id'], 'type': 'customer', 'account_code': '411100', 'active': True}
        for token in ['', self.reader, self.other]:
            self.assertNotEqual(self.pb.request('POST', route, payload, token)[0], 200)
        status, account = self.pb.request('POST', route, payload, self.token)
        self.assertEqual(status, 200, account)
        self.assertEqual(self.pb.request('GET', route, token=self.reader)[1]['totalItems'], 1)
        self.assertEqual(self.pb.request('POST', route, payload, self.token)[0], 400)
        self.assertEqual(self.pb.request('PATCH', route + '/' + account['id'], {'account_code': '411 100'}, self.token)[0], 400)
        self.assertEqual(self.pb.request('PATCH', route + '/' + account['id'], {'account_code': '', 'active': True}, self.token)[0], 400)
        _, audits = self.pb.request('GET', 'collections/core_audit/records?perPage=500', token=self.pb.admin_token)
        self.assertTrue(any(item['module'] == 'accounting' and item['entity_id'] == account['id'] and item['user'] == self.writer['id'] for item in audits['items']))
        self.assertEqual(self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=self.token)[0], 204)
        self.assertEqual(self.pb.request('GET', route + '/' + account['id'], token=self.pb.admin_token)[0], 404)

    def test_delete_company_refuses_documents_linked_indirectly_through_account(self):
        company = self.create_company()
        account = self.pb.create('accounting_third_party_accounts', {'company': company['id'], 'type': 'customer', 'account_code': '411100', 'active': True})
        status, definition = self.pb.request('POST', 'collections', {'name': 'test_ledger_lines', 'type': 'base', 'fields': [
            {'name': 'account', 'type': 'relation', 'collectionId': account['collectionId'], 'maxSelect': 1},
        ]}, self.pb.admin_token)
        self.assertEqual(status, 200, definition)
        self.pb.create('test_ledger_lines', {'account': account['id']})
        self.assertEqual(self.pb.request('DELETE', f'collections/contacts_companies/records/{company["id"]}', token=self.token)[0], 409)
        self.assertEqual(self.pb.request('GET', f'collections/accounting_third_party_accounts/records/{account["id"]}', token=self.pb.admin_token)[0], 200)

    def test_lei_and_electronic_invoice_fields_saved_and_validated(self):
        company = self.create_company()
        route = f'collections/contacts_companies/records/{company["id"]}'
        payload = {'lei': '506700GE1G29325QX363', 'billing_email': 'billing@local.invalid', 'einvoice_routing_address': '0225:123456789', 'einvoice_platform': 'Plateforme du tiers', 'einvoice_service_code': 'SERVICE01', 'einvoice_status': 'ready'}
        status, result = self.pb.request('PATCH', route, payload, self.token)
        self.assertEqual(status, 200, result)
        for field, value in payload.items():
            self.assertEqual(result[field], value)
        self.assertEqual(self.pb.request('PATCH', route, {'einvoice_status': 'verified_by_government'}, self.token)[0], 400)
        self.assertEqual(self.pb.request('PATCH', route, {'billing_email': 'invalide'}, self.token)[0], 400)
        for invalid in ['ABC', '506700ge1g29325qx363', '506700GE1G29325QX36!']:
            self.assertEqual(self.pb.request('PATCH', route, {'lei': invalid}, self.token)[0], 400)

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
        for collection, data in [('contacts_people', {'company': company['id'], 'last_name': 'Test'}), ('contacts_addresses', address), ('contacts_company_roles', {'company': company['id'], 'role': 'customer'})]:
            self.assertEqual(self.pb.request('POST', f'collections/{collection}/records', data, self.token)[0], 400)

    def test_company_can_be_customer_and_supplier_and_rejects_other_roles(self):
        company = self.create_company()
        status, collection = self.pb.request('GET', 'collections/contacts_company_roles', token=self.pb.admin_token)
        self.assertEqual(status, 200)
        self.assertEqual(next(field for field in collection['fields'] if field['name'] == 'role')['values'], ['customer', 'supplier'])
        for role in ['customer', 'supplier']:
            status, record = self.pb.request('POST', 'collections/contacts_company_roles/records', {'company': company['id'], 'role': role, 'active': True}, self.token)
            self.assertEqual(status, 200, record)
        for role in ['prospect', 'partner', 'other']:
            self.assertEqual(self.pb.request('POST', 'collections/contacts_company_roles/records', {'company': company['id'], 'role': role, 'active': True}, self.token)[0], 400)
        self.assertEqual(self.pb.request('GET', 'collections/contacts_company_roles/records', token=self.token)[1]['totalItems'], 2)

    def test_role_migration_refuses_unexpected_historical_role_without_deleting_it(self):
        import subprocess
        company = self.create_company()
        record = self.pb.create('contacts_company_roles', {'company': company['id'], 'role': 'customer'})
        self.pb.process.terminate()
        self.pb.process.wait(timeout=10)
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            connection.execute('UPDATE contacts_company_roles SET role = ? WHERE id = ?', ('partner', record['id']))
            connection.execute('DELETE FROM _migrations WHERE file = ?', ('1791158401_company_roles.js',))
        result = subprocess.run(self.pb.args + ['migrate', 'up'], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('historical roles', result.stdout + result.stderr)
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            self.assertEqual(connection.execute('SELECT role FROM contacts_company_roles WHERE id = ?', (record['id'],)).fetchone()[0], 'partner')

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

    def test_identifiers_and_catalog_validation(self):
        company = self.create_company()
        path = f'collections/contacts_companies/records/{company["id"]}'
        for data in [{'siren': '123'}, {'siret': '123'}, {'siren': '123456789', 'siret': '98765432100001'}, {'default_currency': 'ZZZ'}, {'preferred_language': 'xx'}, {'enrichment': {'provider': 'pappers'}}]:
            self.assertGreaterEqual(self.pb.request('PATCH', path, data, self.token)[0], 400, data)
        self.assertEqual(self.pb.request('PATCH', path, {'siren': '123 456 789', 'siret': '12345678900001', 'default_currency': 'EUR', 'preferred_language': 'fr'}, self.token)[0], 200)
        _, currencies = self.pb.request('GET', 'collections/accounting_currencies/records?filter=code%3D%22EUR%22', token=self.pb.admin_token)
        currency = currencies['items'][0]
        self.assertEqual(self.pb.request('PATCH', f'collections/accounting_currencies/records/{currency["id"]}', {'active': False}, self.pb.admin_token)[0], 200)
        self.assertEqual(self.pb.request('PATCH', path, {'name': 'Conserver historique'}, self.token)[0], 200)
        self.assertEqual(self.pb.request('POST', 'collections/contacts_companies/records', {'name': 'Nouveau', 'default_currency': 'EUR'}, self.token)[0], 400)

    def test_reference_administration_and_primary_addresses(self):
        company = self.create_company()
        collection = 'settings_countries'
        for token in ['', self.reader, self.token, self.other]:
            self.assertGreaterEqual(self.pb.request('POST', f'collections/{collection}/records', {'code': 'SE', 'label': 'Suède', 'active': True}, token)[0], 400)
        self.pb.request('PATCH', f'collections/core_roles/records/{self.writer_role["id"]}', {'permissions': ['contacts.read', 'contacts.write', 'settings.references']}, self.pb.admin_token)
        self.pb.request('PATCH', f'collections/core_users/records/{self.writer["id"]}', {'erp_profile': 'superuser'}, self.pb.admin_token)
        status, reference = self.pb.request('POST', f'collections/{collection}/records', {'code': 'SE', 'label': 'Suède', 'active': True}, self.token)
        self.assertEqual(status, 200, reference)
        self.assertEqual(self.pb.request('PATCH', f'collections/{collection}/records/{reference["id"]}', {'code': 'NO'}, self.token)[0], 400)
        self.assertEqual(self.pb.request('DELETE', f'collections/{collection}/records/{reference["id"]}', token=self.token)[0], 403)
        address = {'company': company['id'], 'type': 'registered', 'line1': 'Rue', 'city': 'Paris', 'country': 'FR', 'is_primary': True}
        self.assertEqual(self.pb.request('POST', 'collections/contacts_addresses/records', address, self.token)[0], 200)
        self.assertEqual(self.pb.request('POST', 'collections/contacts_addresses/records', address, self.token)[0], 400)
        address['type'] = 'billing'
        self.assertEqual(self.pb.request('POST', 'collections/contacts_addresses/records', address, self.token)[0], 200)
        address['country'] = 'ZZ'
        self.assertGreaterEqual(self.pb.request('POST', 'collections/contacts_addresses/records', address, self.token)[0], 400)

    def test_contacts_revision_permissions_and_no_company_search_proxy(self):
        route = 'horizon/company-lookup/'
        self.assertEqual(self.pb.request('GET', route + 'status', token=self.token)[1], {'contacts_revision': 5})
        for token in ['', self.other]:
            self.assertIn(self.pb.request('GET', route + 'status', token=token)[0], [401, 403])
        self.assertEqual(self.pb.request('GET', route + 'search?q=ab', token=self.reader)[0], 404)
        self.assertEqual(self.pb.request('GET', route + 'preview?identifier=invalid', token=self.token)[0], 404)
        self.assertEqual(self.pb.request('POST', route + 'apply', {'token': 'fake'}, self.token)[0], 404)
        self.pb.request('PATCH', f'collections/core_roles/records/{self.writer_role["id"]}', {'active': False}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', route + 'status', token=self.token)[0], 403)


class ContactsMigrationTests(unittest.TestCase):
    def old_database(self):
        import shutil
        from pathlib import Path
        from check_auth import ROOT
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        directory = Path(pb.temp.name) / 'v1_migrations'
        directory.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('179107*.js'):
            shutil.copy(path, directory / path.name)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={directory}']
        pb.start()
        return pb

    def migrate(self, pb):
        import subprocess
        from check_auth import ROOT
        pb.process.terminate()
        pb.process.wait(timeout=10)
        args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}']
        result = subprocess.run(args + ['migrate', 'up'], env={**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}, capture_output=True, text=True)
        pb.launch_and_authenticate(args if result.returncode == 0 else pb.args)
        return result

    def accounting_database(self):
        import shutil
        from pathlib import Path
        from check_auth import ROOT
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        directory = Path(pb.temp.name) / 'accounting_migrations'
        directory.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791158404':
                shutil.copy(path, directory / path.name)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={directory}']
        pb.start()
        return pb

    def manual_lei_field(self, pb, maximum=20, pattern='^[A-Z0-9]{20}$'):
        _, collection = pb.request('GET', 'collections/contacts_companies', token=pb.admin_token)
        fields = collection['fields'] + [{'name': 'lei', 'type': 'text', 'max': maximum, 'pattern': pattern, 'required': False}]
        status, result = pb.request('PATCH', 'collections/contacts_companies', {'fields': fields}, pb.admin_token)
        self.assertEqual(status, 200, result)

    def test_lei_migration_accepts_manual_field_and_preserves_identifiers(self):
        pb = self.accounting_database()
        self.manual_lei_field(pb)
        company = pb.create('contacts_companies', {'name': 'Manuel', 'rcs_number': 'RCS Paris historique', 'lei': '506700GE1G29325QX363'})
        self.assertEqual(self.migrate(pb).returncode, 0)
        _, saved = pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=pb.admin_token)
        self.assertEqual(saved['lei'], '506700GE1G29325QX363')
        self.assertEqual(saved['rcs_number'], 'RCS Paris historique')
        _, collection = pb.request('GET', 'collections/contacts_companies', token=pb.admin_token)
        self.assertEqual(len([field for field in collection['fields'] if field['name'] == 'lei']), 1)

    def test_lei_migration_refuses_different_manual_schema_without_data_loss(self):
        pb = self.accounting_database()
        self.manual_lei_field(pb, maximum=120, pattern='')
        company = pb.create('contacts_companies', {'name': 'Manuel divergent', 'lei': 'VALEUR HISTORIQUE'})
        self.assertNotEqual(self.migrate(pb).returncode, 0)
        _, saved = pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=pb.admin_token)
        self.assertEqual(saved['lei'], 'VALEUR HISTORIQUE')

    def test_upgrade_preserves_currency_language_address_and_records(self):
        pb = self.old_database()
        company = pb.create('contacts_companies', {'name': 'Ancienne', 'active': True, 'preferred_currency': 'NOK', 'preferred_language': 'sv', 'fiscal_identifier': 'LEGACY-FISCAL'})
        address = pb.create('contacts_addresses', {'company': company['id'], 'type': 'registered', 'line1': 'Rue', 'city': 'Stockholm', 'country': 'SE'})
        self.assertEqual(self.migrate(pb).returncode, 0)
        _, saved = pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=pb.admin_token)
        self.assertEqual(saved['default_currency'], 'NOK')
        self.assertNotIn('preferred_currency', saved)
        self.assertEqual(saved['preferred_language'], 'sv')
        self.assertEqual(saved['fiscal_identifier'], 'LEGACY-FISCAL')
        self.assertEqual(saved['rcs_number'], '')
        self.assertEqual(saved['lei'], '')
        self.assertTrue(pb.request('GET', f'collections/contacts_addresses/records/{address["id"]}', token=pb.admin_token)[1]['is_primary'])
        for collection, code in [('settings_countries', 'SE'), ('settings_languages', 'sv'), ('accounting_currencies', 'NOK')]:
            items = pb.request('GET', f'collections/{collection}/records?perPage=100', token=pb.admin_token)[1]['items']
            self.assertTrue(any(item['code'] == code for item in items))

    def test_currency_conflict_aborts_without_losing_values(self):
        pb = self.old_database()
        company = pb.create('contacts_companies', {'name': 'Conflit', 'preferred_currency': 'USD', 'default_currency': 'EUR'})
        self.assertNotEqual(self.migrate(pb).returncode, 0)
        _, saved = pb.request('GET', f'collections/contacts_companies/records/{company["id"]}', token=pb.admin_token)
        self.assertEqual(saved['preferred_currency'], 'USD')
        self.assertEqual(saved['default_currency'], 'EUR')
        self.assertEqual(pb.request('GET', 'collections/settings_countries', token=pb.admin_token)[0], 404)


if __name__ == '__main__':
    unittest.main()

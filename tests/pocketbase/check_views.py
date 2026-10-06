"""Saved views and paginated groupings on a disposable database only."""
import unittest
from urllib.parse import urlencode
from check_auth import LocalPocketBase


class ViewsTests(unittest.TestCase):
    def test_navigation_rank_boundaries_filters_and_permissions(self):
        ids = []
        for index in range(28):
            company = self.pb.create('contacts_companies', {'name': f'Navigation {index:02}', 'active': True})
            ids.append(company['id'])
            self.pb.create('contacts_company_roles', {'company': company['id'], 'role': 'customer', 'active': True})
        def nav(record_id, **options):
            return self.pb.request('GET', 'horizon/contacts/navigation?' + urlencode({'kind': 'companies', 'id': record_id, 'q': 'Navigation', **options}), token=self.reader)
        status, middle = nav(ids[24], role='customer')
        self.assertEqual(status, 200, middle)
        self.assertEqual(middle, {'position': 25, 'total': 28, 'previous': ids[23], 'next': ids[25]})
        self.assertEqual(nav(ids[0])[1]['previous'], '')
        self.assertEqual(nav(ids[-1])[1]['next'], '')
        self.assertEqual(nav(ids[0], direction='desc')[1]['position'], 28)
        grouped = self.groups(q='Navigation', direction='desc')[1]
        self.assertEqual(nav(grouped['items'][0]['id'], group='country', direction='desc')[1]['position'], 1)
        self.assertEqual(nav(ids[0], q='absent')[1], {'position': 0, 'total': 0, 'previous': '', 'next': ''})
        self.assertEqual(nav(ids[0], role='supplier')[1]['position'], 0)
        self.assertEqual(nav(ids[0], sort='name; DROP TABLE contacts_people')[0], 400)
        self.assertEqual(nav('bad')[0], 400)
        self.assertEqual(self.pb.request('GET', 'horizon/contacts/navigation?kind=companies&id=' + ids[0], token=self.other)[0], 403)

    def setUp(self):
        self.pb = LocalPocketBase()
        self.addCleanup(self.pb.close)
        self.pb.start()
        self.reader = self.pb.login()[1]['token']
        self.other = self.pb.login('other@local.invalid')[1]['token']
        role = self.pb.create('core_roles', {'name': 'view_admin', 'label': 'Administrateur des vues', 'active': True, 'permissions': ['contacts.read', 'core.views.manage']})
        self.admin = self.pb.create_user('views@local.invalid', role['id'])
        self.admin_token = self.pb.login('views@local.invalid')[1]['token']
        self.colleague = self.pb.create_user('colleague@local.invalid', self.pb.role['id'])
        self.colleague_token = self.pb.login('colleague@local.invalid')[1]['token']

    def create_view(self, visibility='personal', **changes):
        body = {'name': 'Clients France', 'context': 'contacts.companies', 'visibility': visibility, 'params': {'role': 'customer', 'group': 'country', 'sort': 'name:desc'}, **changes}
        status, view = self.pb.request('POST', 'collections/core_saved_views/records', body, self.reader)
        self.assertEqual(status, 200, view)
        return view

    def test_owner_private_shared_and_admin_permissions(self):
        private = self.create_view(owner=self.colleague['id'])
        self.assertEqual(private['owner'], self.pb.user['id'])
        shared = self.create_view('shared')
        path = 'collections/core_saved_views/records'
        self.assertEqual(self.pb.request('GET', path, token=self.colleague_token)[1]['totalItems'], 1)
        for token in ['', self.other]:
            self.assertEqual(self.pb.request('GET', path, token=token)[1]['totalItems'], 0)
            self.assertIn(self.pb.request('POST', path, {'name': 'No access', 'context': 'contacts.companies', 'visibility': 'shared', 'params': {}}, token)[0], [400, 403])
        self.assertEqual(self.pb.request('GET', path, token=self.admin_token)[1]['totalItems'], 2)
        for view in [private, shared]:
            record_path = f'{path}/{view["id"]}'
            self.assertEqual(self.pb.request('PATCH', record_path, {'name': 'Interdit'}, self.colleague_token)[0], 404)
            self.assertEqual(self.pb.request('DELETE', record_path, token=self.colleague_token)[0], 404)
            self.assertEqual(self.pb.request('PATCH', record_path, {'owner': self.colleague['id']}, self.reader)[0], 404)
            self.assertEqual(self.pb.request('PATCH', record_path, {'context': 'contacts.people'}, self.admin_token)[0], 404)
            self.assertEqual(self.pb.request('PATCH', record_path, {'name': 'Renommée'}, self.admin_token)[0], 200)
        self.assertEqual(self.pb.request('DELETE', f'{path}/{shared["id"]}', token=self.reader)[0], 204)
        self.assertEqual(self.pb.request('DELETE', f'{path}/{private["id"]}', token=self.admin_token)[0], 204)
        audits = self.pb.request('GET', 'collections/core_audit/records?perPage=100', token=self.pb.admin_token)[1]['items']
        self.assertTrue(any(item['entity'] == 'core_saved_views' and item['action'] == 'delete' and item['user'] == self.pb.user['id'] for item in audits))

    def test_validation_and_context_isolation(self):
        for params in [{'sql': 'SELECT *'}, {'group': 'company'}, {'sort': 'last_name:asc'}, {'role': 'partner'}, {'q': 'a' * 201}, []]:
            status, _ = self.pb.request('POST', 'collections/core_saved_views/records', {'name': 'Invalid', 'context': 'contacts.companies', 'visibility': 'personal', 'params': params}, self.reader)
            self.assertEqual(status, 400, params)
        person = self.create_view(context='contacts.people', params={'group': 'company', 'sort': 'last_name:desc'})
        self.assertEqual(person['params']['group'], 'company')
        self.assertEqual(self.pb.request('GET', 'collections/core_saved_views/records?' + urlencode({'filter': 'context="contacts.companies"'}), token=self.reader)[1]['totalItems'], 0)

    def groups(self, **options):
        return self.pb.request('GET', 'horizon/contacts/groups?' + urlencode({'kind': 'companies', 'group': 'country', **options}), token=self.reader)

    def test_group_counts_pagination_country_primary_and_role(self):
        companies = []
        for index in range(28):
            company = self.pb.create('contacts_companies', {'name': f'Grouped {index:02}', 'active': True})
            companies.append(company)
            self.pb.create('contacts_addresses', {'company': company['id'], 'type': 'registered', 'line1': '1 rue du Test', 'city': 'Paris', 'country': 'FR', 'is_primary': True})
            self.pb.create('contacts_company_roles', {'company': company['id'], 'role': 'customer', 'active': index != 27})
            self.pb.create('contacts_company_roles', {'company': company['id'], 'role': 'supplier', 'active': True})
        self.pb.create('contacts_addresses', {'company': companies[0]['id'], 'type': 'shipping', 'line1': 'Elsewhere', 'city': 'Lyon', 'country': 'FR'})
        status, page = self.groups(q='Grouped', role='customer')
        self.assertEqual(status, 200, page)
        self.assertEqual(page['totalItems'], 27)
        self.assertEqual(page['totalPages'], 2)
        self.assertEqual(len(page['items']), 25)
        self.assertEqual(page['groups'][0]['total'], 27)
        self.assertEqual(page['groups'][0]['group_key'], 'FR')
        second = self.groups(q='Grouped', role='customer', page=2)[1]
        self.assertEqual(len(second['items']), 2)
        self.assertFalse(set(item['id'] for item in page['items']) & set(item['id'] for item in second['items']))
        self.assertEqual(self.groups(role='supplier')[1]['totalItems'], 28)
        self.assertEqual(self.groups(sort='email DESC; DROP TABLE contacts_people')[0], 400)
        self.assertEqual(self.pb.request('GET', 'horizon/contacts/groups?kind=companies&group=country', token=self.other)[0], 403)
        self.pb.request('PATCH', f'collections/contacts_companies/records/{companies[0]["id"]}', {'active': False}, self.pb.admin_token)
        self.assertEqual(self.groups(state='archived')[1]['totalItems'], 1)

    def test_people_group_by_company_or_country_and_missing_values(self):
        company = self.pb.create('contacts_companies', {'name': 'Groupe de personnes', 'active': True})
        self.pb.create('contacts_people', {'company': company['id'], 'last_name': 'Alpha', 'active': True})
        self.pb.create('contacts_people', {'company': company['id'], 'last_name': 'Beta', 'active': True})
        self.pb.create('contacts_people', {'last_name': 'Sans société', 'active': True})
        status, result = self.groups(kind='people', group='company')
        self.assertEqual(status, 200, result)
        self.assertEqual(sorted(group['total'] for group in result['groups']), [1, 2])
        self.assertEqual(self.groups(kind='people', group='country')[1]['groups'][0]['total'], 3)


if __name__ == '__main__':
    unittest.main()

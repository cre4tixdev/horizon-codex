"""Fixed purchase analytics: stable identities, settings rights and snapshots."""
import copy
import unittest
import check_purchasing

class FixedAnalyticTests(check_purchasing.PurchasingTests):
    def fixed(self):
        status, choices = self.pb.request('GET', 'horizon/purchasing/choices', token=self.token)
        self.assertEqual(status, 200, choices); return choices['fixed_accounts']
    def settings_access(self):
        _, role = self.pb.request('GET', 'collections/core_roles/records/' + self.user['role'], token=self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': role['permissions'] + ['settings.references']}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'admin'}, self.pb.admin_token)
    def test_stock_and_all_internal_categories(self):
        choices = self.fixed(); self.assertEqual(len(choices), 6); self.assertEqual({row['code'] for row in choices}, {'99101','99201','99202','99203','99204','99205'})
        for fixed in choices:
            input = copy.deepcopy(self.input); input.update(opportunity='', supplier=self.supplier['id']); input['lines'][0].update(allocations=[dict(fixed_account=fixed['id'], quantity=6)])
            status, order = self.pb.request('POST', 'horizon/purchasing/orders/save', dict(input=input, creation_key='fixed-purpose-' + fixed['key'].replace('_','-')), self.token); self.assertEqual(status, 200, order)
            self.assertEqual(order['lines'][0]['purpose'], fixed['purpose']); self.assertEqual(order['lines'][0]['allocations'][0]['fixed_account'], fixed['id'])
            status, order = self.transition('orders', order); self.assertEqual(status, 200, order)
    def test_fixed_without_crm_and_invalid_account(self):
        choices = self.fixed(); fixed = next(row for row in choices if row['key']=='internal_software')
        input = copy.deepcopy(self.input); input.update(opportunity='', supplier=self.supplier['id']); input['lines'][0].update(allocations=[dict(fixed_account=fixed['id'], quantity=6)])
        _, role = self.pb.request('GET', 'collections/core_roles/records/' + self.user['role'], token=self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': [permission for permission in role['permissions'] if not permission.startswith('crm.')]}, self.pb.admin_token)
        status, order = self.pb.request('POST', 'horizon/purchasing/orders/save', dict(input=input, creation_key='without-crm-fixed-001'), self.token); self.assertEqual(status, 200, order)
        self.assertEqual(order['lines'][0]['allocations'][0]['fixed_account'], fixed['id'])
        input['lines'][0]['allocations'][0]['fixed_account'] = self.opp['analytic_account']
        self.assertEqual(self.pb.request('POST', 'horizon/purchasing/orders/save', dict(input=input, creation_key='invalid-root-as-fixed'), self.token)[0], 400)
        self.assertEqual(self.pb.request('GET', 'horizon/accounting/fixed-accounts', token=self.token)[0], 403)
    def test_codes_change_preserves_relation_and_document(self):
        fixed = next(row for row in self.fixed() if row['key']=='stock')
        input = copy.deepcopy(self.input); input.update(opportunity='', supplier=self.supplier['id']); input['lines'][0].update(allocations=[dict(fixed_account=fixed['id'], quantity=6)])
        _, order = self.pb.request('POST', 'horizon/purchasing/orders/save', dict(input=input, creation_key='fixed-renumber-order'), self.token); status, order = self.transition('orders', order); self.assertEqual(status, 200, order)
        snapshot = self.pb.request('GET', 'collections/purchasing_orders/records/' + order['id'], token=self.pb.admin_token)[1]['document_snapshot']
        self.settings_access(); status, settings = self.pb.request('GET', 'horizon/accounting/fixed-accounts', token=self.token); self.assertEqual(status, 200, settings)
        values = [{key: row[key] for key in ['id','updated','code','label']} for row in settings['items']]; next(row for row in values if row['id']==fixed['id'])['code']='99199'
        status, saved = self.pb.request('POST', 'horizon/accounting/fixed-accounts', dict(items=values), self.token); self.assertEqual(status, 200, saved)
        refreshed = self.pb.request('GET', 'horizon/purchasing/orders/' + order['id'], token=self.token)[1]
        self.assertEqual(refreshed['lines'][0]['allocations'][0]['analytic_account'], fixed['id']); self.assertEqual(refreshed['lines'][0]['allocations'][0]['code'], '99199')
        self.assertEqual(self.pb.request('GET', 'collections/purchasing_orders/records/' + order['id'], token=self.pb.admin_token)[1]['document_snapshot'], snapshot)
        self.assertEqual(self.pb.request('POST', 'horizon/accounting/fixed-accounts', dict(items=values), self.token)[0], 409)
        values = [{key: row[key] for key in ['id','updated','code','label']} for row in saved['items']]; values[0]['code']=values[1]['code']
        self.assertEqual(self.pb.request('POST', 'horizon/accounting/fixed-accounts', dict(items=values), self.token)[0], 400)
        values = [{key: row[key] for key in ['id','updated','code','label']} for row in saved['items']]; values[0]['code'], values[1]['code'] = values[1]['code'], values[0]['code']
        status, swapped = self.pb.request('POST', 'horizon/accounting/fixed-accounts', dict(items=values), self.token); self.assertEqual(status, 200, swapped); self.assertEqual({row['id']: row['code'] for row in swapped['items']}, {row['id']: row['code'] for row in values})
        values = [{key: row[key] for key in ['id','updated','code','label']} for row in swapped['items']]; values[0]['code']=self.opp['opportunity_number']
        self.assertEqual(self.pb.request('POST', 'horizon/accounting/fixed-accounts', dict(items=values), self.token)[0], 400)

    def test_request_inherits_fixed_and_refuses_category_change(self):
        fixed = next(row for row in self.fixed() if row['key']=='internal_software')
        input = copy.deepcopy(self.input); input['opportunity']=''; input['lines'][0]['allocations']=[dict(fixed_account=fixed['id'], quantity=6)]
        status, request = self.save_request(input); self.assertEqual(status, 200, request); status, request = self.transition('requests', request); self.assertEqual(status, 200, request)
        _, orders = self.order(request); order = orders['items'][0]; self.assertEqual(order['lines'][0]['allocations'][0]['fixed_account'], fixed['id'])
        input.update(supplier=self.supplier['id']); input['lines'][0].update(request_line=request['lines'][0]['id'], purpose='consumption', allocations=[dict(fixed_account=next(row for row in self.fixed() if row['key']=='internal_service')['id'], quantity=6)])
        self.assertEqual(self.pb.request('POST', 'horizon/purchasing/orders/save', dict(id=order['id'], updated=order['updated'], input=input), self.token)[0], 400)

if __name__=='__main__': unittest.main(verbosity=2)

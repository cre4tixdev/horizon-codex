"""Internal invoices: immutable numbering, payments, deposits and source controls."""
import copy
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import uuid
import unittest
from concurrent.futures import ThreadPoolExecutor
import json
import threading
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
import check_documents
import check_auth
import check_purchasing
import check_stock_operations
import shutil
import subprocess
import check_sales

class BillingTests(unittest.TestCase):
    def setUp(self):
        fixture = check_sales.SalesTests('test_third_level_heading_saved'); fixture.setUp()
        self.pb = fixture.pb; self.addCleanup(self.pb.close); self.user = fixture.user; self.token = fixture.token; self.opp = fixture.opp
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'admin'}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['billing.read', 'billing.write', 'billing.invoice.validate', 'billing.payment.manage', 'contacts.read', 'crm.read', 'sales.read', 'sales.write', 'sales.quote.validate', 'sales.order.confirm', 'settings.references', 'documents.template.manage']}, self.pb.admin_token)
        self.fixture = fixture
        self.company = fixture.company
        self.pb.create('contacts_addresses', {'company': self.company['id'], 'type': 'billing', 'line1': 'Rue Test', 'city': 'Paris', 'postal_code': '75001', 'country': 'FR', 'is_primary': True})
        self.settings = self.get('settings')
        self.settings['issuer'].update(name='CVS Engineering Test', address='Rue de test', postal_code='75001', city='Paris', country='FR', siret='00000000000000', late_payment_notice='Pénalités selon conditions contractuelles.')
        self.assertEqual(self.call('settings', self.settings)[0], 200)
        self.account = self.pb.request('GET', 'collections/accounting_analytic_accounts/records', token=self.pb.admin_token)[1]['items'][0]['id']
        self.input = dict(company=self.company['id'], invoice_kind='standard', supplier_invoice_number='', title='Facture test', invoice_date='2026-10-13', due_date='2026-11-13', service_date='2026-10-13', currency='EUR', notes='', discrepancy_reason='', payment_terms='', source_orders=[], source_operations=[], deduction_ids=[], source_invoice='', template_id='', schedules=[], lines=[dict(key='line-one', kind='item', product='', description='Prestation', reference='', quantity=1, unit='u', unit_price=100, discount=0, tax_code='VAT20', analytic_allocations=[dict(analytic_account=self.account, percentage=100)], source_type='', source_line='', source_order='', source_operation='', source_operation_line='', credit_source_line='')])
    def call(self, path, data): return self.pb.request('POST', 'horizon/billing/' + path, data, self.token)
    def get(self, path):
        status, result = self.pb.request('GET', 'horizon/billing/' + path, token=self.token); self.assertEqual(status, 200, result); return result
    def save(self, input=None, kind='customer', record=None, key=None):
        body = dict(kind=kind, creation_key=key or str(uuid.uuid4()), input=input or self.input)
        if record: body.update(id=record['id'], updated=record['updated'])
        return self.call('documents/save', body)
    def action(self, record, action='validate'): return self.call('documents/transition', dict(kind=record['kind'], id=record['id'], updated=record['updated'], action=action))
    def test_payment_terms_client_defaults_override_and_archival(self):
        settings = self.get('settings'); terms = settings['payment_conditions']
        self.assertGreaterEqual(len(terms), 4)
        term = next(item for item in terms if item['days'] == 45)
        status, _ = self.pb.request('PATCH', 'collections/contacts_companies/records/' + self.company['id'], {'payment_term': term['id']}, self.pb.admin_token); self.assertEqual(status, 200)
        order = self.order(); status, prepared = self.prepare(order); self.assertEqual(status, 200, prepared)
        self.assertEqual(prepared['payment_term'], term['id']); self.assertEqual(prepared['due_date'], (datetime.now(ZoneInfo('Europe/Paris')).date() + timedelta(days=45)).isoformat())
        data = copy.deepcopy(self.input); data.update(payment_term=term['id'], payment_terms='Accord particulier : virement à 10 jours', due_date='2026-10-23')
        invoice = self.validated(data)
        settings = self.get('settings'); settings['default_payment_term'] = term['id']
        for item in settings['payment_conditions']:
            if item['id'] == term['id']: item.update(description='Nouveau texte', days=60)
        self.assertEqual(self.call('settings', settings)[0], 200)
        stored = self.get('record/customer/' + invoice['id']); self.assertEqual(stored['payment_terms'], data['payment_terms']); self.assertEqual(stored['due_date'], data['due_date'])
        preview = self.call('preview', dict(kind='customer', id=invoice['id'], format='html'))[1]; self.assertIn(data['payment_terms'], preview['html'])
        self.assertEqual(self.save(dict(data, payment_term='notfound'))[0], 400)
        settings = self.get('settings'); settings['payment_conditions'][0]['days'] = 1.5; self.assertEqual(self.call('settings', settings)[0], 400)
        settings = self.get('settings'); settings['default_payment_term'] = next(item['id'] for item in settings['payment_conditions'] if item['id'] != term['id']); settings['payment_conditions'] = [item for item in settings['payment_conditions'] if item['id'] != term['id']]
        self.assertEqual(self.call('settings', settings)[0], 200)
        self.assertFalse(next(item for item in self.get('settings')['payment_conditions'] if item['id'] == term['id'])['active'])
        self.assertEqual(self.save(data)[0], 400)
        status, _ = self.pb.request('PATCH', 'collections/contacts_companies/records/' + self.company['id'], {'name': 'Client modifié'}, self.pb.admin_token); self.assertEqual(status, 200)
        choices = self.pb.request('GET', 'horizon/settings/payment-terms', token=self.token); self.assertEqual(choices[0], 200)
        self.assertEqual(self.pb.request('GET', 'collections/settings_payment_terms/records', token=self.token)[0], 403)

    def test_customer_reference_prepared_overridden_and_frozen(self):
        order = self.order()
        status, order = self.fixture.transition('customer-order-reference', order, customer_order_number='CLIENT-42'); self.assertEqual(status, 200, order)
        status, prepared = self.prepare(order); self.assertEqual(status, 200, prepared); self.assertEqual(prepared['customer_order_number'], 'CLIENT-42')
        data = {**self.input, **prepared, 'due_date': '2026-11-13', 'customer_order_number': 'FACTURE-CLIENT-42'}
        invoice = self.validated(data)
        related = self.get('related/customer/' + invoice['id']); self.assertEqual(related['orders'][0]['id'], order['id']); self.assertEqual(related['orders'][0]['reference'], 'CLIENT-42')
        self.fixture.transition('customer-order-reference', order, customer_order_number='CLIENT-NEW')
        stored = self.get('record/customer/' + invoice['id']); self.assertEqual(stored['customer_order_number'], 'FACTURE-CLIENT-42')
        preview = self.call('preview', dict(kind='customer', id=invoice['id'], format='html'))[1]; self.assertIn('Commande client : FACTURE-CLIENT-42', preview['html'])
        status, credit = self.call('documents/credit', dict(kind='customer', id=invoice['id'])); self.assertEqual(status, 200, credit); self.assertEqual(credit['customer_order_number'], 'FACTURE-CLIENT-42')
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], dict(permissions=['billing.read']), self.pb.admin_token)
        related = self.get('related/customer/' + invoice['id']); self.assertEqual(related, dict(orders=[], deliveries=[]))

    def test_invoice_number_immutability_and_dashboard(self):
        status, draft = self.save(); self.assertEqual(status, 200, draft); self.assertEqual(draft['number'], '')
        status, done = self.action(draft); self.assertEqual(status, 200, done); self.assertEqual(done['total'], 120); self.assertTrue(done['number'].startswith('FAC-'))
        self.assertEqual(self.save(record=done)[0], 400)
        self.assertEqual(self.action(done, 'cancel')[0], 400)
        self.assertEqual(self.get('dashboard')['customer']['due_amount'], 120)
        status, archived = self.action(done, 'archive'); self.assertEqual(status, 200, archived); self.assertEqual(self.get('dashboard')['customer']['due_amount'], 120); self.assertEqual(self.get('documents?kind=customer&status=unpaid')['totalItems'], 1)
        self.assertEqual(self.call('preview', dict(kind='customer', id=done['id'], format='html'))[0], 200)
    def test_payments_partial_retry_and_cancellation(self):
        draft = self.save()[1]; status, invoice = self.action(draft); self.assertEqual(status, 200, invoice)
        body = dict(creation_key=str(uuid.uuid4()), payment_date='2026-10-13', method='Virement', reference='Règlement test', allocations=[dict(kind='customer', id=invoice['id'], amount=40)])
        status, payment = self.call('payments', body); self.assertEqual(status, 200, payment)
        self.assertEqual(self.call('payments', body)[1]['id'], payment['id'])
        current = self.get('record/customer/' + invoice['id']); self.assertEqual(current['balance'], 80); self.assertEqual(current['payment_status'], 'partial')
        self.assertEqual(self.call('payments', dict(body, creation_key=str(uuid.uuid4()), allocations=[dict(kind='customer', id=invoice['id'], amount=100)]))[0], 409)
        row = self.get('payments')['items'][0]
        self.assertEqual(self.call('payments/cancel', dict(id=row['id'], updated=row['updated'], reason='Erreur de saisie'))[0], 200)
        self.assertEqual(self.get('record/customer/' + invoice['id'])['balance'], 120)

    def validated(self, input=None, kind='customer'):
        status, draft = self.save(input, kind); self.assertEqual(status, 200, draft)
        status, result = self.action(draft); self.assertEqual(status, 200, result); return result
    def prepared_input(self, prepared):
        data = copy.deepcopy(self.input)
        for key in ['company', 'invoice_kind', 'deposit_percent', 'title', 'lines', 'source_orders', 'source_operations', 'deduction_ids', 'source_invoice']:
            if key in prepared: data[key] = prepared[key]
        return data
    def prepare(self, order, mode='standard', percent=30):
        return self.call('documents/prepare', dict(kind='customer', source_type='order', source_ids=[order['id']], mode=mode, deposit_percent=percent))
    def order(self):
        status, quote = self.fixture.quote_save(lines=[dict(description='Installation', quantity=4, unit='u', unit_price=100)])
        self.assertEqual(status, 200, quote)
        status, quote = self.fixture.transition('finalize', quote); self.assertEqual(status, 200, quote)
        status, quote = self.fixture.transition('confirm', quote); self.assertEqual(status, 200, quote); return quote
    def test_partial_credit_refund_rounding_and_snapshot(self):
        data = copy.deepcopy(self.input); data['lines'][0].update(quantity=3, unit_price=33.333333)
        invoice = self.validated(data)
        payment = dict(creation_key=str(uuid.uuid4()), payment_date='2026-10-13', method='Virement', reference='', allocations=[dict(kind='customer', id=invoice['id'], amount=120)])
        self.assertEqual(self.call('payments', payment)[0], 200)
        totals = []
        for _ in range(3):
            status, prepared = self.call('documents/credit', dict(kind='customer', id=invoice['id'])); self.assertEqual(status, 200, prepared)
            prepared['lines'][0]['quantity'] = 1
            credit = self.validated(self.prepared_input(prepared), 'customer_credit'); totals.append(credit['total'])
            body = dict(payment, creation_key=str(uuid.uuid4()), allocations=[dict(kind='customer_credit', id=credit['id'], amount=credit['balance'])])
            status, refund = self.call('payments', body); self.assertEqual(status, 200, refund)
        self.assertAlmostEqual(sum(totals), 120)
        self.assertEqual(self.call('documents/credit', dict(kind='customer', id=invoice['id']))[0], 400)
        self.assertEqual(self.get('record/customer/' + invoice['id'])['balance'], 0)
        self.pb.request('PATCH', 'collections/contacts_companies/records/' + self.company['id'], {'name': 'Nom modifié'}, self.pb.admin_token)
        self.assertNotEqual(self.get('record/customer/' + invoice['id'])['company_name'], 'Nom modifié')
    def test_return_to_quote_reports_invoice_state_and_redacts_without_billing_read(self):
        order = self.order()
        status, prepared = self.prepare(order); self.assertEqual(status, 200, prepared)
        status, draft = self.save(self.prepared_input(prepared)); self.assertEqual(status, 200, draft)
        body = dict(id=order['id'], updated=order['updated'], target='validated')
        def blocked():
            status, response = self.pb.request('POST', 'horizon/sales/quotes/reopen', body, self.token)
            self.assertEqual(status, 400, response)
            self.assertEqual(self.pb.request('GET', 'horizon/sales/quotes/' + order['id'], token=self.token)[1]['status'], 'accepted')
            return response
        document = blocked()['data']['documents'][0]
        self.assertIn('Brouillon', document['message'])
        self.assertEqual(document['href'], '/billing/customer/' + draft['id'])
        status, invoice = self.action(draft); self.assertEqual(status, 200, invoice)
        document = blocked()['data']['documents'][0]
        self.assertIn('Validée', document['message'])
        self.assertEqual(document['label'], invoice['number'])
        role = 'collections/core_roles/records/' + self.user['role']
        rights = self.pb.request('GET', role, token=self.pb.admin_token)[1]['permissions']
        self.pb.request('PATCH', role, dict(permissions=[right for right in rights if right != 'billing.read']), self.pb.admin_token)
        response = blocked()
        self.assertTrue(all(not doc['href'] and not doc['label'] for doc in response['data']['documents']))
        self.assertNotIn(invoice['id'], json.dumps(response))

    def test_deposit_heading_and_legacy_draft_preserve_validated_snapshot(self):
        order = self.order()
        status, prepared = self.prepare(order, 'deposit'); self.assertEqual(status, 200, prepared)
        self.assertEqual(prepared['deposit_percent'], 30)
        self.assertEqual(prepared['lines'][0]['description'], 'Installation')
        self.assertEqual(prepared['lines'][0]['quantity'], 4)
        status, draft = self.save(self.prepared_input(prepared)); self.assertEqual(status, 200, draft)
        preview = self.call('preview', dict(kind='customer', id=draft['id'], format='html'))[1]
        self.assertIn('Acompte de 30 %', preview['html']); self.assertNotIn('Acompte 30 % · Installation', preview['html'])
        # Simulate an older preparation already on the NAS, without touching production.
        row = self.pb.request('GET', 'collections/billing_invoice_lines/records', token=self.pb.admin_token)[1]['items'][0]
        self.pb.request('PATCH', 'collections/billing_invoice_lines/records/' + row['id'], dict(description='Acompte 30 % · Installation', quantity=1.2), self.pb.admin_token)
        self.pb.request('PATCH', 'collections/billing_invoices/records/' + draft['id'], dict(title='Ancienne préparation', deposit_percent=0), self.pb.admin_token)
        draft = self.get('record/customer/' + draft['id'])
        legacy_preview = self.call('preview', dict(kind='customer', id=draft['id'], format='html'))[1]
        self.assertIn('Acompte de 30 %', legacy_preview['html']); self.assertNotIn('Acompte 30 % · Installation', legacy_preview['html'])
        self.assertEqual(draft['title'], 'Ancienne préparation'); self.assertEqual(draft['deposit_percent'], 30); self.assertEqual(draft['lines'][0]['quantity'], 4); self.assertEqual(draft['lines'][0]['description'], 'Installation')
        status, invoice = self.action(draft); self.assertEqual(status, 200, invoice)
        self.assertEqual(invoice['total'], 144); self.assertEqual(invoice['lines'][0]['description'], 'Installation')
        before = self.pb.request('GET', 'collections/billing_invoices/records/' + invoice['id'], token=self.pb.admin_token)[1]['document_snapshot']
        self.get('record/customer/' + invoice['id']); self.call('preview', dict(kind='customer', id=invoice['id'], format='html'))
        after = self.pb.request('GET', 'collections/billing_invoices/records/' + invoice['id'], token=self.pb.admin_token)[1]['document_snapshot']
        self.assertEqual(before, after); self.assertEqual(after['deposit_presentation'], 2); self.assertEqual(after['fields']['deposit_percent'], 30)

    def test_deposit_percentage_calculation_validation_and_credit(self):
        order = self.order()
        status, prepared = self.prepare(order, 'deposit'); self.assertEqual(status, 200, prepared)
        data = self.prepared_input(prepared)
        status, draft = self.save(data); self.assertEqual(status, 200, draft)
        data['deposit_percent'] = 40
        body = dict(kind='customer', id=draft['id'], updated=draft['updated'], input=data)
        status, calculated = self.call('documents/calculate', body); self.assertEqual(status, 200, calculated)
        self.assertEqual(calculated['total'], 192); self.assertEqual(calculated['lines'][0]['quantity'], 4); self.assertEqual(calculated['lines'][0]['base_total'], 160)
        unchanged = self.get('record/customer/' + draft['id']); self.assertEqual(unchanged['deposit_percent'], 30); self.assertEqual(unchanged['updated'], draft['updated'])
        modified = copy.deepcopy(data); modified['lines'][0]['quantity'] = 1
        self.assertEqual(self.call('documents/calculate', dict(body, input=modified))[0], 400)
        for invalid in [0, -1, 101]:
            self.assertEqual(self.call('documents/calculate', dict(body, input=dict(data, deposit_percent=invalid)))[0], 400)
        status, draft = self.save(data, record=draft); self.assertEqual(status, 200, draft)
        self.assertEqual(draft['deposit_percent'], 40); self.assertEqual(draft['total'], 192)
        status, invoice = self.action(draft); self.assertEqual(status, 200, invoice)
        self.assertEqual(self.save(data, record=invoice)[0], 400)
        self.assertEqual(self.call('documents/calculate', dict(body, updated=invoice['updated']))[0], 400)
        status, credit = self.call('documents/credit', dict(kind='customer', id=invoice['id'])); self.assertEqual(status, 200, credit)
        credit['lines'][0]['quantity'] = 1
        credit_input = self.prepared_input(credit); credit_input['deposit_percent'] = 99
        result = self.validated(credit_input, 'customer_credit')
        self.assertEqual(result['deposit_percent'], 40); self.assertEqual(result['total'], 48)
        self.assertEqual(result['lines'][0]['quantity'], 1)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], dict(permissions=['billing.read']), self.pb.admin_token)
        self.assertEqual(self.call('documents/calculate', body)[0], 403)

    def test_partial_order_deposit_balance_and_duplicate_prevention(self):
        order = self.order()
        status, prepared = self.prepare(order, 'deposit'); self.assertEqual(status, 200, prepared)
        deposit = self.validated(self.prepared_input(prepared)); self.assertEqual(deposit['total'], 144)
        status, prepared = self.prepare(order); self.assertEqual(status, 200, prepared)
        prepared['lines'][0]['quantity'] = 2
        first = self.validated(self.prepared_input(prepared)); self.assertEqual(first['total'], 96)
        self.assertEqual(first['deposit_total'], 120)
        status, prepared = self.prepare(order, 'balance'); self.assertEqual(status, 200, prepared)
        self.assertEqual(prepared['lines'][0]['quantity'], 2)
        final = self.validated(self.prepared_input(prepared)); self.assertEqual(final['total'], 240)
        self.assertEqual(final['deposit_total'], 0)
        self.assertEqual(self.prepare(order)[0], 400)
        self.assertEqual(self.call('documents/credit', dict(kind='customer', id=deposit['id']))[0], 200)
        prepared = self.call('documents/credit', dict(kind='customer', id=deposit['id']))[1]
        self.assertEqual(self.save(self.prepared_input(prepared), 'customer_credit')[0], 409)
        prepared = self.call('documents/credit', dict(kind='customer', id=first['id']))[1]
        credit = self.validated(self.prepared_input(prepared), 'customer_credit')
        self.assertEqual(credit['total'], 96)
        self.assertEqual(self.prepare(order)[1]['lines'][0]['quantity'], 2)
    def test_schedules_retry_stale_and_api_permissions(self):
        data = copy.deepcopy(self.input); data['schedules'] = [dict(due_date='2026-10-20', amount=40), dict(due_date='2026-11-13', amount=80)]
        key = str(uuid.uuid4()); status, draft = self.save(data, key=key); self.assertEqual(status, 200, draft)
        self.assertEqual(self.save(data, key=key)[1]['id'], draft['id'])
        data['title'] = 'Différent'; self.assertEqual(self.save(data, key=key)[0], 409)
        self.assertEqual(self.save(data, record=dict(draft, updated='stale'))[0], 409)
        self.assertEqual(self.pb.request('GET', 'collections/billing_invoices/records', token=self.token)[0], 403)
        self.assertEqual(self.pb.request('PATCH', 'collections/billing_invoices/records/' + draft['id'], {'total': 0}, self.token)[0], 403)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'viewer'}, self.pb.admin_token)
        self.assertEqual(self.save()[0], 403); self.assertEqual(self.action(draft)[0], 403)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['contacts.read']}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', 'horizon/billing/dashboard', token=self.token)[0], 403)
    def test_tax_version_and_foreign_currency_refusal(self):
        self.validated()
        settings = self.get('settings'); settings['tax_codes'][0]['rate'] = 19
        self.assertEqual(self.call('settings', settings)[0], 400)
        self.assertEqual(self.save(dict(self.input, currency='USD'))[0], 400)
    def test_credit_repeated_source_rejected_and_unpaid_credit_no_refund(self):
        invoice = self.validated()
        prepared = self.call('documents/credit', dict(kind='customer', id=invoice['id']))[1]
        duplicate = copy.deepcopy(prepared['lines'][0]); duplicate['key'] = 'duplicate'; duplicate['quantity'] = .5; prepared['lines'][0]['quantity'] = .5; prepared['lines'].append(duplicate)
        self.assertEqual(self.save(self.prepared_input(prepared), 'customer_credit')[0], 400)
        prepared['lines'].pop(); prepared['lines'][0]['quantity'] = 1
        credit = self.validated(self.prepared_input(prepared), 'customer_credit'); self.assertEqual(credit['balance'], 0)
        body = dict(creation_key=str(uuid.uuid4()), payment_date='2026-10-13', method='Virement', reference='', allocations=[dict(kind='customer_credit', id=credit['id'], amount=1)])
        self.assertEqual(self.call('payments', body)[0], 409)

    def test_credit_preserves_original_party_after_archive(self):
        invoice = self.validated()
        self.pb.request('PATCH', 'collections/contacts_companies/records/' + self.company['id'], dict(active=False, name='Nom actualisé'), self.pb.admin_token)
        status, prepared = self.call('documents/credit', dict(kind='customer', id=invoice['id'])); self.assertEqual(status, 200, prepared)
        credit = self.validated(self.prepared_input(prepared), 'customer_credit'); self.assertEqual(credit['company_name'], invoice['company_name'])
        html = self.call('preview', dict(kind='customer_credit', id=credit['id'], format='html'))[1]['html']; self.assertNotIn('Nom actualisé', html); self.assertIn(invoice['number'], html)
    def test_activity_publish_read_task_and_module_only_permissions(self):
        invoice = self.validated()
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], dict(permissions=['billing.read', 'billing.write']), self.pb.admin_token)
        status, event = self.pb.request('POST', 'collections/core_activity_events/records', dict(source_module='billing', source_entity='billing_invoices', source_record_id=invoice['id'], type='note', body='Note financière'), self.token); self.assertEqual(status, 200, event)
        status, feed = self.pb.request('GET', 'horizon/activity/events?entity=billing_invoices&id=' + invoice['id'], token=self.token); self.assertEqual(status, 200, feed); self.assertTrue(any(row['body'] == 'Note financière' for row in feed['items']))
        self.assertEqual(self.pb.request('GET', 'collections/core_activity_events/records/' + event['id'], token=self.token)[0], 200)
        status, task = self.pb.request('POST', 'collections/core_activity_events/records', dict(source_module='billing', source_entity='billing_invoices', source_record_id=invoice['id'], type='task', body='Contrôler', metadata=dict(task=dict(title='Vérifier', assigned_to=self.user['id'], priority='normal', due_date='2026-10-20'))), self.token); self.assertEqual(status, 200, task)
        status, tasks = self.pb.request('GET', 'horizon/activity/tasks?entity=billing_invoices&id=' + invoice['id'], token=self.token); self.assertEqual(status, 200, tasks)
        self.assertEqual(self.pb.request('PATCH', 'collections/core_tasks/records/' + tasks['items'][0]['id'], dict(status='done'), self.token)[0], 200)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], dict(permissions=['contacts.read']), self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', 'collections/core_activity_events/records/' + event['id'], token=self.token)[0], 404)
        self.assertEqual(self.pb.request('GET', 'horizon/activity/events?entity=billing_invoices&id=' + invoice['id'], token=self.token)[0], 403)
    def test_concurrent_source_claims_validation_and_payments(self):
        order = self.order(); status, prepared = self.prepare(order); self.assertEqual(status, 200, prepared)
        data = self.prepared_input(prepared)
        with ThreadPoolExecutor(max_workers=2) as pool: results = list(pool.map(lambda _: self.save(data), range(2)))
        self.assertEqual(sorted(row[0] for row in results), [200, 409])
        draft = next(row[1] for row in results if row[0] == 200)
        with ThreadPoolExecutor(max_workers=2) as pool: results = list(pool.map(lambda _: self.action(draft), range(2)))
        self.assertEqual(sorted(row[0] for row in results), [200, 409])
        invoice = next(row[1] for row in results if row[0] == 200)
        def payment(_): return self.call('payments', dict(creation_key=str(uuid.uuid4()), payment_date='2026-10-13', method='Virement', reference='', allocations=[dict(kind='customer', id=invoice['id'], amount=480)]))
        with ThreadPoolExecutor(max_workers=2) as pool: results = list(pool.map(payment, range(2)))
        self.assertEqual(sorted(row[0] for row in results), [200, 409])
        tracking = self.get('tracking/customer/' + order['id']); self.assertEqual(next(iter(tracking.values()))['invoiced'], 4)
    def test_payment_multi_invoice_and_schedule_distribution(self):
        data = copy.deepcopy(self.input); data['schedules'] = [dict(due_date='2026-10-20', amount=40), dict(due_date='2026-11-13', amount=80)]
        first = self.validated(data); second = self.validated()
        body = dict(creation_key=str(uuid.uuid4()), payment_date='2026-10-13', method='Virement', reference='Deux factures', allocations=[dict(kind='customer', id=first['id'], amount=60), dict(kind='customer', id=second['id'], amount=80)])
        status, result = self.call('payments', body); self.assertEqual(status, 200, result)
        first = self.get('record/customer/' + first['id']); self.assertEqual([row['balance'] for row in first['schedules']], [0, 60]); self.assertEqual(first['balance'], 60)
        self.assertEqual(self.get('record/customer/' + second['id'])['balance'], 40)
    def test_pdf_binary_transport_and_model_preview_without_mutation(self):
        converter = ThreadingHTTPServer(('127.0.0.1', 0), check_documents.Converter); threading.Thread(target=converter.serve_forever, daemon=True).start(); self.addCleanup(converter.server_close); self.addCleanup(converter.shutdown)
        self.pb.process.terminate(); self.pb.process.wait(timeout=10); self.pb.environment['HORIZON_GOTENBERG_URL'] = f'http://127.0.0.1:{converter.server_port}'; self.pb.launch_and_authenticate(self.pb.args)
        invoice = self.validated()
        request = Request(self.pb.url + '/api/horizon/billing/preview', method='POST', headers={'Authorization': self.token, 'Content-Type': 'application/json'}, data=json.dumps(dict(kind='customer', id=invoice['id'], format='pdf')).encode())
        with urlopen(request, timeout=10) as response:
            self.assertEqual(response.headers['Content-Type'], 'application/pdf'); self.assertTrue(response.read().startswith(b'%PDF-'))
        self.assertIn(b'Prestation', check_documents.Converter.payloads[-1])
        original = self.call('preview', dict(kind='customer', id=invoice['id'], format='html'))[1]['html']
        model = json.loads((check_auth.ROOT / 'pocketbase/pb_hooks/assets/default-invoice-layout.json').read_text())
        model['blocks'].append(dict(model['blocks'][0], id='test-label', text='Modèle alternatif'))
        self.assertEqual(self.call('preview', dict(kind='customer', id=invoice['id'], format='html', content_json=model))[0], 200)
        self.assertEqual(self.call('preview', dict(kind='customer', id=invoice['id'], format='html'))[1]['html'], original)

class SupplierBillingTests(unittest.TestCase):
    call = BillingTests.call
    get = BillingTests.get
    save = BillingTests.save
    action = BillingTests.action
    prepared_input = BillingTests.prepared_input
    def setUp(self):
        self.fixture = check_stock_operations.StockOperationsTests('test_partial_receipt_and_remainder'); self.fixture.setUp(); self.pb = self.fixture.pb; self.addCleanup(self.pb.close); self.token = self.fixture.token
        role = self.pb.request('GET', 'collections/core_roles/records/' + self.fixture.user['role'], token=self.pb.admin_token)[1]
        self.pb.request('PATCH', 'collections/core_roles/records/' + role['id'], dict(permissions=role['permissions'] + ['billing.read', 'billing.write', 'billing.invoice.validate', 'billing.payment.manage']), self.pb.admin_token)
        self.input = dict(company=self.fixture.supplier['id'], invoice_kind='standard', supplier_invoice_number='FOUR-42', title='Facture fournisseur', invoice_date='2026-10-13', due_date='2026-11-13', service_date='2026-10-13', currency='EUR', notes='', discrepancy_reason='', payment_terms='', source_orders=[], source_operations=[], deduction_ids=[], source_invoice='', template_id='', schedules=[], lines=[])
    def attach(self, invoice):
        boundary = 'horizonbillingoriginal'
        data = f'--{boundary}\r\nContent-Disposition: form-data; name="updated"\r\n\r\n{invoice["updated"]}\r\n--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="original.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.7\nOriginal test\n%%EOF\r\n--{boundary}--\r\n'.encode()
        request = Request(self.pb.url + '/api/horizon/billing/files/' + invoice['kind'] + '/' + invoice['id'], method='POST', data=data, headers={'Authorization': self.token, 'Content-Type': f'multipart/form-data; boundary={boundary}'})
        with urlopen(request, timeout=10) as response: return json.load(response)
    def test_supplier_deposit_keeps_quantities_and_percentage(self):
        status, order = self.pb.request('POST', 'horizon/purchasing/orders/save', dict(creation_key=str(uuid.uuid4()), input=dict(self.fixture.input, supplier=self.fixture.supplier['id'])), self.token); self.assertEqual(status, 200, order)
        status, order = check_purchasing.PurchasingTests.transition(self.fixture, 'orders', order); self.assertEqual(status, 200, order)
        status, prepared = self.call('documents/prepare', dict(kind='supplier', source_type='order', source_ids=[order['id']], mode='deposit', deposit_percent=12.5)); self.assertEqual(status, 200, prepared)
        self.assertEqual(prepared['deposit_percent'], 12.5); self.assertEqual(prepared['lines'][0]['quantity'], order['lines'][0]['quantity'])
        status, draft = self.save(self.prepared_input(prepared), 'supplier'); self.assertEqual(status, 200, draft)
        self.assertGreater(draft['total'], 0); self.assertEqual(draft['issues'], [])
        draft = self.attach(draft)
        status, invoice = self.action(draft); self.assertEqual(status, 200, invoice)
        self.assertEqual(invoice['deposit_percent'], 12.5); self.assertEqual(invoice['lines'][0]['quantity'], order['lines'][0]['quantity'])

    def test_supplier_order_matching_original_differences_and_duplicates(self):
        status, order = self.pb.request('POST', 'horizon/purchasing/orders/save', dict(creation_key=str(uuid.uuid4()), input=dict(self.fixture.input, supplier=self.fixture.supplier['id'])), self.token); self.assertEqual(status, 200, order)
        status, order = check_purchasing.PurchasingTests.transition(self.fixture, 'orders', order); self.assertEqual(status, 200, order)
        status, prepared = self.call('documents/prepare', dict(kind='supplier', source_type='order', source_ids=[order['id']], mode='standard', deposit_percent=30)); self.assertEqual(status, 200, prepared)
        self.assertIn(order['number'], prepared['title'])
        self.assertEqual(prepared['source_orders'], [order['id']])
        self.assertEqual(prepared['lines'][0]['source_line'], order['lines'][0]['id'])
        self.assertIn(order['number'], next(item['name'] for item in self.get('choices')['sources']['supplier'] if item['id'] == order['id']))
        data = self.prepared_input(prepared); data['lines'][0]['unit_price'] = 1
        status, draft = self.save(data, 'supplier'); self.assertEqual(status, 200, draft); self.assertEqual(len(draft['issues']), 2)
        self.assertEqual(self.action(draft)[0], 400)
        draft = self.attach(draft); self.assertEqual(self.action(draft)[0], 400)
        data['discrepancy_reason'] = 'Prestation facturée avant livraison, prix convenu.'
        status, draft = self.save(data, 'supplier', draft); self.assertEqual(status, 200, draft)
        status, invoice = self.action(draft); self.assertEqual(status, 200, invoice); self.assertEqual(invoice['supplier_invoice_number'], 'FOUR-42'); self.assertEqual(invoice['total'], 7.2)
        current = self.pb.request('GET', 'horizon/purchasing/orders/' + order['id'], token=self.token)[1]
        self.assertEqual(check_purchasing.PurchasingTests.transition(self.fixture, 'orders', current, 'reopen')[0], 400)
        self.assertEqual(self.save(dict(data, supplier_invoice_number='four-42'), 'supplier')[0], 409)
        request = Request(self.pb.url + f'/api/files/{invoice["collectionId"]}/{invoice["id"]}/{invoice["attachments"][0]}')
        with self.assertRaises(check_auth.HTTPError) as result: urlopen(request)
        self.assertEqual(result.exception.code, 404)
        token = self.pb.request('POST', 'files/token', {}, self.token)[1]['token']
        with urlopen(self.pb.url + f'/api/files/{invoice["collectionId"]}/{invoice["id"]}/{invoice["attachments"][0]}?token={token}') as response: self.assertTrue(response.read().startswith(b'%PDF-'))
        credit = self.call('documents/credit', dict(kind='supplier', id=invoice['id']))[1]; status, draft_credit = self.save(dict(self.prepared_input(credit), supplier_invoice_number='AV-FOUR-42'), 'supplier_credit'); self.assertEqual(status, 200, draft_credit)
        self.assertEqual(self.action(draft_credit)[0], 400)
        draft_credit = self.attach(draft_credit); status, done_credit = self.action(draft_credit); self.assertEqual(status, 200, done_credit); self.assertEqual(done_credit['total'], 7.2)

    def test_multiple_partial_receipts_and_operation_duplicate_controls(self):
        order = self.fixture.purchase(); draft = self.fixture.pending_receipts(order)[0]
        input = self.fixture.build_input(); input['purchase_order'] = order['id']; input['warehouse'] = order['delivery_warehouse']; input['lines'][0].update(draft['lines'][0]); input['lines'][0]['quantity'] = 2
        status, draft = self.fixture.save(input, record=draft); self.assertEqual(status, 200, draft)
        status, first = self.fixture.action(draft); self.assertEqual(status, 200, first)
        remainder = self.fixture.pending_receipts(order)[0]; status, second = self.fixture.action(remainder); self.assertEqual(status, 200, second)
        status, prepared = self.call('documents/prepare', dict(kind='supplier', source_type='operation', source_ids=[first['id'], second['id']], mode='standard', deposit_percent=30)); self.assertEqual(status, 200, prepared)
        self.assertEqual([line['quantity'] for line in prepared['lines']], [2, 4]); self.assertEqual(len({line['source_operation'] for line in prepared['lines']}), 2)
        status, bill = self.save(self.prepared_input(prepared), 'supplier'); self.assertEqual(status, 200, bill)
        self.assertEqual(self.call('documents/prepare', dict(kind='supplier', source_type='operation', source_ids=[first['id']], mode='standard', deposit_percent=30))[0], 400)
        bill = self.attach(bill); status, bill = self.action(bill); self.assertEqual(status, 200, bill); self.assertEqual(bill['total'], 5.76)
        self.assertEqual(self.get('dashboard')['supplier']['pending_count'], 0)

class BillingMigrationTests(unittest.TestCase):
    def test_upgrade_preserves_existing_records_and_reapplies_without_changes(self):
        pb = check_auth.LocalPocketBase(); self.addCleanup(pb.close)
        directory = check_auth.Path(pb.temp.name) / 'previous_migrations'; directory.mkdir()
        for file in (check_auth.ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if file.name < '1791840003_billing.js': shutil.copy(file, directory / file.name)
        args = pb.args; pb.args = [value for value in args if not value.startswith('--migrationsDir=')] + [f'--migrationsDir={directory}']; pb.start()
        company = pb.create('contacts_companies', dict(name='Préserver client', active=True))
        pb.request('PATCH', 'collections/core_roles/records/' + pb.role['id'], dict(permissions=['contacts.read', 'contacts.write']), pb.admin_token)
        token = pb.login('reader@local.invalid')[1]['token']
        status, event = pb.request('POST', 'collections/core_activity_events/records', dict(source_module='contacts', source_entity='contacts_companies', source_record_id=company['id'], author=pb.user['id'], type='note', body='Historique conservé'), token); self.assertEqual(status, 200, event)
        pb.request('PATCH', 'collections/core_users/records/' + pb.user['id'], dict(erp_profile='admin'), pb.admin_token)
        pb.process.terminate(); pb.process.wait(timeout=10)
        for _ in range(2): subprocess.run(args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        pb.args = args; pb.launch_and_authenticate(args)
        self.assertEqual(pb.request('GET', 'collections/contacts_companies/records/' + company['id'], token=pb.admin_token)[1]['name'], 'Préserver client')
        self.assertEqual(pb.request('GET', 'collections/core_activity_events/records/' + event['id'], token=pb.admin_token)[1]['body'], 'Historique conservé')
        role = pb.request('GET', 'collections/core_roles/records/' + pb.role['id'], token=pb.admin_token)[1]; self.assertIn('billing.invoice.validate', role['permissions'])
        self.assertEqual(pb.request('GET', 'collections/billing_invoices/records', token=pb.admin_token)[1]['totalItems'], 0)

class PaymentTermsUpgradeTests(unittest.TestCase):
    def test_upgrade_preserves_existing_invoice_and_default(self):
        pb = check_auth.LocalPocketBase(); self.addCleanup(pb.close)
        directory = check_auth.Path(pb.temp.name) / 'previous_terms_migrations'; directory.mkdir()
        for file in (check_auth.ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if file.name < '1791840004_payment_terms.js': shutil.copy(file, directory / file.name)
        args = pb.args; pb.args = [value for value in args if not value.startswith('--migrationsDir=')] + [f'--migrationsDir={directory}']; pb.start()
        company = pb.create('contacts_companies', dict(name='Client historique', active=True))
        settings = pb.request('GET', 'collections/settings_billing/records', token=pb.admin_token)[1]['items'][0]
        pb.request('PATCH', 'collections/settings_billing/records/' + settings['id'], dict(payment_days=17, payment_terms='Accord historique 17 jours'), pb.admin_token)
        invoice = pb.create('billing_invoices', dict(company=company['id'], number='HIST-001', status='validated', direction='customer', invoice_kind='standard', currency='EUR', invoice_date='2026-10-01', due_date='2026-10-18', payment_terms='Texte figé', total=120, document_snapshot={'historical': 'preserved'}))
        pb.process.terminate(); pb.process.wait(timeout=10)
        for _ in range(2): subprocess.run(args + ['migrate', 'up'], check=True, stdout=subprocess.DEVNULL)
        pb.args = args; pb.launch_and_authenticate(args)
        after = pb.request('GET', 'collections/billing_invoices/records/' + invoice['id'], token=pb.admin_token)[1]
        for key in ['company', 'number', 'status', 'invoice_date', 'due_date', 'payment_terms', 'total', 'document_snapshot']: self.assertEqual(after[key], invoice[key])
        settings = pb.request('GET', 'collections/settings_billing/records/' + settings['id'], token=pb.admin_token)[1]
        term = pb.request('GET', 'collections/settings_payment_terms/records/' + settings['default_payment_term'], token=pb.admin_token)[1]
        self.assertEqual(term['days'], 17); self.assertEqual(term['description'], 'Accord historique 17 jours'); self.assertEqual(after['payment_term'], ''); self.assertEqual(after['customer_order_number'], '')

if __name__ == '__main__': unittest.main()

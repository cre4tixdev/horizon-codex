"""Sales draft numbering, pricing, cancellation, revenue and access policy."""
import unittest
import json
import base64
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import shutil
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import check_crm

class SalesTests(unittest.TestCase):
    def setUp(self):
        check_crm.CrmTests.setUp(self)
        self.pb.request('PATCH', f'collections/core_roles/records/{self.user["role"]}', {'permissions': ['crm.read', 'crm.write', 'sales.read', 'sales.write', 'contacts.read']}, self.pb.admin_token)
        status, self.opp = check_crm.CrmTests.save(self)
        self.assertEqual(status, 200, self.opp)
        self.quote = {'opportunity': self.opp['id'], 'title': 'Installation studio', 'quote_date': '2026-10-08', 'valid_until': '2026-11-08', 'notes': '', 'lines': [{'description': 'Intégration', 'quantity': 2.5, 'unit': 'h', 'unit_price': 100.25}]}

    save = check_crm.CrmTests.save

    def quote_save(self, key='quote-creation-key-00001', **changes):
        return self.pb.request('POST', 'horizon/sales/quotes/save', {'creation_key': key, 'input': {**self.quote, **changes}}, self.token)

    def grant_lifecycle(self):
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['crm.read', 'crm.write', 'sales.read', 'sales.write', 'sales.quote.validate', 'sales.order.confirm', 'contacts.read']}, self.pb.admin_token)

    def transition(self, route, quote, **values):
        return self.pb.request('POST', 'horizon/sales/quotes/' + route, {'id': quote['id'], 'updated': quote['updated'], **values}, self.token)

    def test_summary_counts_states_and_excludes_archives(self):
        self.grant_lifecycle()
        _, draft = self.quote_save(key='summary-draft-creation', title='Summary brouillon')
        _, final = self.quote_save(key='summary-final-creation', title='Summary devis')
        self.assertEqual(self.transition('finalize', final)[0], 200)
        _, sent = self.quote_save(key='summary-sent-creation', title='Summary envoyé')
        self.pb.request('PATCH', 'collections/sales_quotes/records/' + sent['id'], {'status': 'sent'}, self.pb.admin_token)
        _, accepted = self.quote_save(key='summary-order-creation', title='Summary commande')
        _, accepted = self.transition('finalize', accepted)
        self.assertEqual(self.transition('confirm', accepted)[0], 200)
        _, archived = self.quote_save(key='summary-archive-creation')
        self.assertEqual(self.transition('manage', archived, action='archive')[0], 200)
        path = 'horizon/sales/quotes/summary'
        status, summary = self.pb.request('GET', path, token=self.token)
        self.assertEqual(status, 200, summary)
        self.assertEqual(summary, {'draft': 1, 'validated': 1, 'sent': 1, 'accepted': 1})
        self.assertEqual(self.pb.request('GET', path + '?opportunity=' + self.opp['id'] + '&status=draft', token=self.token)[1], summary)
        self.assertEqual(self.pb.request('GET', path + '?q=Summary%20devis', token=self.token)[1], {'draft': 0, 'validated': 1, 'sent': 0, 'accepted': 0})
        self.assertEqual(self.pb.request('GET', path + '?company=' + self.company['id'], token=self.token)[1], summary)
        self.assertEqual(self.pb.request('GET', path + '?company=invalid', token=self.token)[0], 400)
        self.assertEqual(self.pb.request('GET', path)[0], 401)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['crm.read']}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', path, token=self.token)[0], 403)

    def test_lifecycle_permissions_snapshots_and_return(self):
        _, quote = self.quote_save(lines=[{'description': 'Article', 'quantity': 2, 'unit_price': 100, 'unit_cost': 60}, {'description': 'Option', 'quantity': 1, 'unit_price': 50, 'is_option': True}])
        self.assertEqual(self.transition('finalize', quote)[0], 403)
        self.assertEqual(self.transition('confirm', quote)[0], 403)
        self.grant_lifecycle()
        status, final = self.transition('finalize', quote)
        self.assertEqual(status, 200, final)
        self.assertEqual(final['status'], 'validated')
        self.assertEqual(self.pb.request('PATCH', 'collections/sales_quotes/records/' + final['id'], {'subtotal': 1}, self.pb.admin_token)[0], 400)
        self.assertEqual(self.transition('reopen', quote, target='draft')[0], 409)
        status, draft = self.transition('reopen', final, target='draft')
        self.assertEqual(status, 200, draft)
        self.assertEqual(draft['status'], 'draft')
        self.assertEqual(self.transition('confirm', draft)[0], 400)
        status, final = self.transition('finalize', draft)
        self.assertEqual(status, 200, final)
        status, confirmed = self.transition('confirm', final, customer_order_number='PO-42')
        self.assertEqual(status, 200, confirmed)
        self.assertEqual(confirmed['status'], 'accepted')
        self.assertEqual(confirmed['order']['customer_number'], 'PO-42')
        self.assertFalse(confirmed['can_delete'])
        retry = self.transition('confirm', final)[1]
        self.assertEqual(retry['order']['id'], confirmed['order']['id'])
        order = self.pb.request('GET', 'collections/sales_orders/records/' + confirmed['order']['id'], token=self.pb.admin_token)[1]
        self.assertEqual(order['analytic_account'], self.opp['analytic_account'])
        self.assertEqual(order['subtotal'], 200)
        rows = self.pb.request('GET', 'collections/sales_order_lines/records?filter=order="' + order['id'] + '"', token=self.pb.admin_token)[1]['items']
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['unit_cost'], 60)
        self.assertEqual(self.pb.request('GET', 'horizon/sales/opportunities/' + self.opp['id'], token=self.token)[1]['revenue'][0]['amount'], 200)
        self.assertEqual(self.transition('manage', confirmed, action='delete')[0], 400)
        status, restored = self.transition('reopen', confirmed, target='validated')
        self.assertEqual(status, 200, restored)
        self.assertEqual(restored['status'], 'validated')
        self.assertIsNone(restored['order'])
        previous = self.pb.request('GET', 'collections/sales_orders/records/' + order['id'], token=self.pb.admin_token)[1]
        self.assertEqual(previous['status'], 'cancelled')
        self.assertEqual(previous['quote_snapshot'], order['quote_snapshot'])
        _, again = self.transition('confirm', restored)
        self.assertNotEqual(again['order']['id'], order['id'])
        self.assertTrue(again['order']['number'].endswith('-2'))
        self.assertEqual(self.pb.request('PATCH', 'collections/sales_orders/records/' + again['order']['id'], {'status': 'in_progress'}, self.pb.admin_token)[0], 200)
        self.assertEqual(self.transition('reopen', again, target='validated')[0], 409)

    def test_archive_cancel_delete_and_sent_history(self):
        self.grant_lifecycle()
        _, quote = self.quote_save()
        _, archived = self.transition('manage', quote, action='archive')
        self.assertTrue(archived['archived_at'])
        self.assertEqual(archived['status'], 'draft')
        self.assertEqual(self.pb.request('GET', 'horizon/sales/quotes', token=self.token)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', 'horizon/sales/quotes?status=archived', token=self.token)[1]['totalItems'], 1)
        self.assertEqual(self.transition('finalize', archived)[0], 400)
        _, restored = self.transition('manage', archived, action='restore')
        _, final = self.transition('finalize', restored)
        _, cancelled = self.transition('cancel', final, reason='Projet abandonné')
        self.assertEqual(cancelled['status'], 'cancelled')
        status, deleted = self.transition('manage', cancelled, action='delete')
        self.assertEqual(status, 200, deleted)
        self.assertEqual(deleted, {'deleted': True})
        _, quote = self.quote_save(key='sent-history-quote-key')
        self.assertEqual(quote['quote_sequence'], 2)
        self.pb.request('PATCH', 'collections/sales_quotes/records/' + quote['id'], {'status': 'sent'}, self.pb.admin_token)
        sent = self.pb.request('GET', 'horizon/sales/quotes/' + quote['id'], token=self.token)[1]
        self.assertTrue(sent['sent_at'])
        _, draft = self.transition('reopen', sent, target='draft')
        self.assertEqual(draft['sent_at'], sent['sent_at'])
        self.assertFalse(draft['can_delete'])
        self.assertEqual(self.transition('manage', draft, action='delete')[0], 400)

    def test_customer_order_evidence_is_validated_protected_and_preserved(self):
        self.grant_lifecycle()
        _, quote = self.quote_save()
        status, quote = self.transition('finalize', quote)
        self.assertEqual(status, 200, quote)
        def upload(filename, data, mime):
            boundary = 'horizon-command-proof-boundary'
            parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode() for key, value in {'id': quote['id'], 'updated': quote['updated'], 'customer_order_number': 'PO-7'}.items()]
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="command_file"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode() + data + b'\r\n')
            parts.append(f'--{boundary}--\r\n'.encode())
            request = Request(self.pb.url + '/api/horizon/sales/quotes/confirm', data=b''.join(parts), headers={'Authorization': self.token, 'Content-Type': f'multipart/form-data; boundary={boundary}'}, method='POST')
            try:
                with urlopen(request) as response: return response.status, json.loads(response.read())
            except HTTPError as error: return error.code, json.loads(error.read())
        self.assertEqual(upload('fake.pdf', b'plain text', 'application/pdf')[0], 400)
        png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlVgAAAAASUVORK5CYII=')
        status, confirmed = upload('commande.png', png, 'image/png')
        self.assertEqual(status, 200, confirmed)
        event_id, file = confirmed['order']['event_id'], confirmed['order']['files'][0]
        path = self.pb.url + '/api/files/core_activity_events/' + event_id + '/' + file
        with self.assertRaises(HTTPError): urlopen(path)
        token = self.pb.request('POST', 'files/token', token=self.token)[1]['token']
        with urlopen(path + '?token=' + token) as response: self.assertEqual(response.read(), png)
        self.assertEqual(self.transition('reopen', confirmed, target='validated')[0], 200)
        proof = self.pb.request('GET', 'collections/core_activity_events/records/' + event_id, token=self.pb.admin_token)[1]
        self.assertEqual(proof['attachments'], [file])

    def test_numbering_pricing_and_atomic_retry(self):
        status, first = self.quote_save()
        self.assertEqual(status, 200, first)
        self.assertEqual(first['quote_number'], '00001-1')
        self.assertEqual(first['subtotal'], 250.63)
        self.assertEqual(first['tax_rate'], 20)
        self.assertEqual(first['tax'], 50.13)
        self.assertEqual(first['total'], 300.76)
        self.assertEqual(first['analytic_account'], self.opp['analytic_account'])
        self.assertEqual(first['currency'], 'EUR')
        self.assertNotIn('creation_key', first)
        self.assertEqual(self.quote_save()[1]['id'], first['id'])
        self.assertEqual(self.quote_save(key='quote-creation-key-00002')[1]['quote_number'], '00001-2')
        self.assertEqual(self.quote_save(key='quote-creation-invalid-1', lines=[{'description': '', 'unit': 'h', 'quantity': -1, 'unit_price': 2}])[0], 400)
        self.assertEqual(self.pb.request('GET', 'horizon/sales/quotes?opportunity=' + self.opp['id'], token=self.token)[1]['totalItems'], 2)
        self.assertEqual(self.quote_save(key='quote-missing-opportunity', opportunity='')[0], 400)
        _, other = self.save(key='other-opportunity-00001')
        self.assertEqual(self.quote_save(key='other-opportunity-quote-1', opportunity=other['id'])[1]['quote_number'], '00002-1')

    def test_footer_discount_margin_cost_tax_and_revenue(self):
        lines = [{'description': 'Article', 'quantity': 2, 'unit_price': 100, 'unit_cost': 60, 'discount': 10}, {'description': 'Option', 'quantity': 1, 'unit_price': 50, 'unit_cost': 20, 'is_option': True}]
        status, quote = self.quote_save(lines=lines, discount=10)
        self.assertEqual(status, 200, quote)
        for field, value in {'subtotal_before_discount': 180, 'discount': 10, 'discount_amount': 18, 'subtotal': 162, 'cost_total': 120, 'margin_amount': 42, 'margin_percent': 35, 'tax': 32.4, 'total': 194.4, 'options_total': 50}.items():
            self.assertEqual(quote[field], value, field)
        self.assertEqual(quote['lines'][0]['line_total'], 180)
        self.assertEqual(quote['lines'][0]['tax_base'], 162)
        self.assertEqual(quote['lines'][0]['tax_amount'], 32.4)
        self.assertEqual(self.pb.request('GET', 'horizon/sales/quotes/' + quote['id'], token=self.token)[1]['discount'], 10)
        self.assertEqual(self.pb.request('GET', 'horizon/sales/opportunities/' + self.opp['id'], token=self.token)[1]['revenue'][0]['amount'], 162)
        for invalid in [-1, 101, '10', None]:
            self.assertEqual(self.quote_save(key='invalid-footer-discount', discount=invalid)[0], 400)
        self.assertEqual(self.quote_save(key='injected-discount-amount', discount_amount=99)[0], 400)
        status, saved = self.pb.request('POST', 'horizon/sales/quotes/save', {'id': quote['id'], 'updated': quote['updated'], 'input': {**self.quote, 'lines': lines, 'discount': 100}}, self.token)
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['subtotal'], 0)
        self.assertEqual(saved['tax'], 0)
        self.assertEqual(saved['cost_total'], 120)
        self.assertEqual(saved['margin_amount'], -120)
        self.assertEqual(saved['margin_percent'], -100)

    def test_amount_discount_units_and_terms_snapshot(self):
        lines = [{'description': 'Article', 'quantity': 2, 'unit_price': 100, 'unit_cost': 60, 'unit': 'u'}]
        status, quote = self.quote_save(lines=lines, discount=30, discount_mode='amount')
        self.assertEqual(status, 200, quote)
        self.assertEqual(quote['subtotal'], 170)
        self.assertEqual(quote['discount_mode'], 'amount')
        self.assertEqual(quote['tax'], 34)
        self.assertEqual(self.quote_save(key='too-high-amount-discount', lines=lines, discount=200.01, discount_mode='amount')[0], 400)
        self.assertEqual(self.quote_save(key='invalid-mode-discount', discount_mode='other')[0], 400)
        self.assertEqual(self.quote_save(key='invalid-unit-reference', lines=[{**lines[0], 'unit': 'invented'}])[0], 400)
        units = self.pb.request('GET', 'collections/inventory_units/records', token=self.token)[1]['items']
        unit = next(item for item in units if item['code'] == 'u')
        self.assertIn(self.pb.request('PATCH', 'collections/inventory_units/records/' + unit['id'], {'label': 'Changed'}, self.token)[0], [403, 404])
        self.pb.request('PATCH', 'collections/inventory_units/records/' + unit['id'], {'active': False}, self.pb.admin_token)
        self.assertEqual(self.quote_save(key='inactive-unit-reference', lines=lines)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/sales/quotes/save', {'id': quote['id'], 'updated': quote['updated'], 'input': {**self.quote, 'lines': lines + lines}}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/sales/quotes/save', {'id': quote['id'], 'updated': quote['updated'], 'input': {**self.quote, 'lines': lines, 'discount_mode': 'amount', 'discount': 30}}, self.token)[0], 200)
        settings = self.pb.request('GET', 'horizon/sales/settings', token=self.token)[1]
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'admin'}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['sales.read', 'sales.write', 'crm.read', 'crm.write', 'settings.references']}, self.pb.admin_token)
        term = {'id': 'terms-template-key-001', 'label': 'Conditions locales', 'content': 'Texte approuvé pour test', 'active': True}
        body = {key: settings[key] for key in ['updated', 'column_widths', 'validity_days', 'default_tax_rate']}
        status, settings = self.pb.request('POST', 'horizon/sales/settings', {**body, 'terms': [term]}, self.token)
        self.assertEqual(status, 200, settings)
        status, with_terms = self.quote_save(key='quote-with-terms-key', terms_id=term['id'])
        self.assertEqual(status, 200, with_terms)
        self.assertEqual(with_terms['terms_content'], term['content'])
        body['updated'] = settings['updated']
        self.assertEqual(self.pb.request('POST', 'horizon/sales/settings', {**body, 'terms': [{**term, 'content': 'Nouveau texte', 'active': False}]}, self.token)[0], 200)
        status, preserved = self.pb.request('POST', 'horizon/sales/quotes/save', {'id': with_terms['id'], 'updated': with_terms['updated'], 'input': {**self.quote, 'terms_id': term['id']}}, self.token)
        self.assertEqual(status, 200, preserved)
        self.assertEqual(preserved['terms_content'], term['content'])
        self.assertEqual(self.quote_save(key='inactive-terms-template', terms_id=term['id'])[0], 400)
        self.assertEqual(self.quote_save(key='injected-terms-content', terms_content='fake')[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/sales/settings', {**body, 'terms': [None]}, self.token)[0], 400)

    def test_large_terms_settings_audit(self):
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'admin'}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['sales.read', 'sales.write', 'crm.read', 'settings.references']}, self.pb.admin_token)
        terms = [{'id': f'long-terms-template-{index:03d}', 'label': f'Conditions {index}', 'content': 'x' * 20000, 'active': True} for index in range(6)]
        settings = self.pb.request('GET', 'horizon/sales/settings', token=self.token)[1]
        for _ in range(2):
            body = {key: settings[key] for key in ['updated', 'column_widths', 'validity_days', 'default_tax_rate']}
            status, settings = self.pb.request('POST', 'horizon/sales/settings', {**body, 'terms': terms}, self.token)
            self.assertEqual(status, 200, settings)
        events = self.pb.request('GET', 'collections/core_audit/records?filter=entity="settings_sales"&sort=-created', token=self.pb.admin_token)[1]['items']
        self.assertEqual(len(events[0]['before']['terms']), 6)
        self.assertEqual(len(events[0]['after']['terms']), 6)

    def test_parallel_creation_and_idempotence(self):
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda i: self.quote_save(key=f'parallel-quote-number-{i:03d}'), range(4)))
        self.assertTrue(all(status == 200 for status, _ in results), results)
        self.assertEqual({item['quote_sequence'] for _, item in results}, {1, 2, 3, 4})
        with ThreadPoolExecutor(max_workers=4) as pool:
            retries = list(pool.map(lambda _: self.quote_save(key='parallel-same-quote-key'), range(4)))
        self.assertTrue(all(status == 200 for status, _ in retries), retries)
        self.assertEqual(len({item['id'] for _, item in retries}), 1)

    def test_cancel_revenue_and_orders_without_double_count(self):
        _, first = self.quote_save()
        _, second = self.quote_save(key='quote-second-for-revenue')
        path = 'horizon/sales/opportunities/' + self.opp['id']
        self.assertEqual(self.pb.request('GET', path, token=self.token)[1]['revenue'], [{'currency': 'EUR', 'amount': 501.26}])
        order = self.pb.create('sales_orders', {'order_number': 'BC-001', 'quote': first['id'], 'opportunity': self.opp['id'], 'analytic_account': self.opp['analytic_account'], 'company': self.company['id'], 'contact': '', 'owner': self.user['id'], 'status': 'confirmed', 'currency': 'EUR', 'subtotal': 100, 'tax': 0, 'total': 100})
        self.assertEqual(self.pb.request('GET', path, token=self.token)[1]['revenue'][0]['amount'], 501.26)
        status, cancelled = self.pb.request('POST', 'horizon/sales/quotes/cancel', {'id': second['id'], 'updated': second['updated'], 'reason': 'Variante écartée'}, self.token)
        self.assertEqual(status, 200, cancelled)
        self.assertEqual(self.pb.request('GET', path, token=self.token)[1]['revenue'][0]['amount'], 250.63)
        self.assertEqual(self.quote_save(key='quote-after-cancellation')[1]['quote_number'], '00001-3')
        self.pb.request('PATCH', f'collections/sales_orders/records/{order["id"]}', {'status': 'cancelled'}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', path, token=self.token)[1]['orderCount'], 0)

    def test_sections_options_discount_cost_and_activity(self):
        lines = [
            {'kind': 'section', 'description': 'Vidéo', 'show_total': True},
            {'kind': 'item', 'description': 'Caméra', 'brand': 'Sony', 'reference': 'CAM-1', 'quantity': 2.5, 'unit': 'u', 'unit_price': 100.25, 'unit_cost': 60, 'discount': 10},
            {'kind': 'subsection', 'description': 'Accessoires', 'show_total': True},
            {'kind': 'item', 'description': 'Option', 'quantity': 3, 'unit_price': 10, 'is_option': True},
            {'kind': 'note', 'description': 'Livraison incluse'},
            {'kind': 'section', 'description': 'Audio'},
            {'kind': 'item', 'description': 'Micro', 'quantity': 2, 'unit_price': 20},
        ]
        status, quote = self.quote_save(lines=lines, valid_until='')
        self.assertEqual(status, 200, quote)
        self.assertEqual(quote['valid_until'][:10], '2026-11-07')
        self.assertEqual(quote['subtotal'], 265.56)
        self.assertEqual(quote['options_total'], 30)
        self.assertEqual(quote['cost_total'], 150)
        self.assertEqual(quote['margin_amount'], 115.56)
        self.assertEqual(quote['lines'][0]['section_total'], 225.56)
        self.assertEqual(quote['lines'][0]['section_options_total'], 30)
        self.assertEqual(quote['lines'][2]['section_options_total'], 30)
        self.assertEqual(quote['lines'][1]['brand'], 'Sony')
        self.assertEqual(self.pb.request('GET', 'horizon/sales/opportunities/' + self.opp['id'], token=self.token)[1]['revenue'][0]['amount'], 265.56)
        source = {'source_module': 'sales', 'source_entity': 'sales_quotes', 'source_record_id': quote['id']}
        status, comment = self.pb.request('POST', 'collections/core_activity_events/records', {**source, 'type': 'note', 'body': 'Préparation du devis', 'mentions': [], 'metadata': {}}, self.token)
        self.assertEqual(status, 200, comment)
        events = self.pb.request('GET', 'collections/core_activity_events/records', token=self.token)[1]['items']
        self.assertTrue(any(event['source_record_id'] == quote['id'] and event['type'] == 'change' and event['body'] == 'Fiche créée' for event in events))
        reader_events = self.pb.request('GET', 'collections/core_activity_events/records', token=self.reader_token)[1]['items']
        self.assertFalse(any(event['source_record_id'] == quote['id'] for event in reader_events))
        invalid = {**lines[1], 'discount': 101}
        self.assertEqual(self.quote_save(key='invalid-quote-discount', lines=[invalid])[0], 400)

    def test_section_option_inheritance_persistence_tax_and_revenue(self):
        lines = [
            {'kind': 'section', 'description': 'Option complète', 'is_option': True, 'show_total': True},
            {'description': 'Article optionnel', 'quantity': 1, 'unit_price': 20, 'unit_cost': 5, 'is_option': False},
            {'kind': 'subsection', 'description': 'Sous-titre'},
            {'kind': 'subsection3', 'description': 'Titre niveau 3'},
            {'description': 'Accessoire', 'quantity': 1, 'unit_price': 30},
            {'kind': 'section', 'description': 'Suite'},
            {'description': 'Article ferme', 'quantity': 1, 'unit_price': 40, 'unit_cost': 5},
        ]
        status, quote = self.quote_save(lines=lines, discount=10)
        self.assertEqual(status, 200, quote)
        self.assertEqual([line['is_option'] for line in quote['lines']], [True, True, True, True, True, False, False])
        self.assertEqual((quote['subtotal'], quote['options_total'], quote['cost_total'], quote['tax']), (36, 50, 5, 7.2))
        self.assertEqual(quote['lines'][0]['section_options_total'], 50)
        stored = self.pb.request('GET', 'horizon/sales/quotes/' + quote['id'], token=self.token)[1]
        self.assertTrue(stored['lines'][0]['is_option'])
        self.assertEqual(self.pb.request('GET', 'horizon/sales/opportunities/' + self.opp['id'], token=self.token)[1]['revenue'][0]['amount'], 36)
        for line in lines:
            line['is_option'] = False
        status, saved = self.pb.request('POST', 'horizon/sales/quotes/save', {'id': quote['id'], 'updated': quote['updated'], 'input': {**self.quote, 'lines': lines}}, self.token)
        self.assertEqual(status, 200, saved)
        self.assertEqual((saved['subtotal'], saved['options_total']), (90, 0))

    def test_sales_settings_rights_validation_and_version(self):
        path = 'horizon/sales/settings'
        status, settings = self.pb.request('GET', path, token=self.token)
        self.assertEqual(status, 200, settings)
        self.assertEqual(settings['validity_days'], 30)
        self.assertEqual(settings['column_widths']['is_option'], 52)
        self.assertGreaterEqual(settings['column_widths']['actions'], 64)
        change = {'updated': settings['updated'], 'validity_days': 45, 'default_tax_rate': 20, 'column_widths': {**settings['column_widths'], 'description': 350}}
        self.assertEqual(self.pb.request('POST', path, change, self.token)[0], 403)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'admin'}, self.pb.admin_token)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['sales.read', 'sales.write', 'crm.read', 'crm.write', 'settings.references']}, self.pb.admin_token)
        status, saved = self.pb.request('POST', path, change, self.token)
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['column_widths']['description'], 350)
        self.assertEqual(self.pb.request('POST', path, {**change, 'updated': saved['updated'], 'column_widths': {**saved['column_widths'], 'actions': 40}}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', path, change, self.token)[0], 409)
        self.assertEqual(self.pb.request('POST', path, {**change, 'updated': saved['updated'], 'column_widths': {**change['column_widths'], 'unexpected': 80}}, self.token)[0], 400)
        self.assertEqual(self.pb.request('PATCH', 'collections/settings_sales/records/' + saved['id'], {'validity_days': 1}, self.token)[0], 403)

    def test_upgrade_preserves_existing_quote_and_lines(self):
        pb = check_crm.LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for migration in (check_crm.ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791504003_sales_quote_editor.js':
                shutil.copy(migration, previous)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        company = pb.create('contacts_companies', {'name': 'Ancien devis', 'active': True})
        stage = pb.request('GET', 'collections/crm_stages/records?sort=sort_order', token=pb.admin_token)[1]['items'][0]
        account = pb.create('accounting_analytic_accounts', {'code': '11450', 'label': 'Ancien devis', 'company': company['id'], 'status': 'open', 'active': True})
        opportunity = pb.create('crm_opportunities', {**self.opp, 'id': '', 'company': company['id'], 'owner': pb.user['id'], 'contact': '', 'stage': stage['id'], 'opportunity_number': '11450', 'analytic_account': account['id'], 'creation_key': '', 'active': True})
        quote = pb.create('sales_quotes', {'quote_number': '11450-1', 'quote_sequence': 1, 'revision': 1, 'title': 'Historique', 'status': 'draft', 'opportunity': opportunity['id'], 'analytic_account': account['id'], 'company': company['id'], 'owner': pb.user['id'], 'created_by': pb.user['id'], 'creation_key': 'historical-quote-key', 'currency': 'EUR', 'subtotal': 12.34, 'total': 12.34, 'quote_date': '2026-10-08 00:00:00.000Z'})
        line = pb.create('sales_quote_lines', {'quote': quote['id'], 'position': 1, 'description': 'Ligne historique', 'quantity': 1, 'unit': 'u', 'unit_price': 12.34, 'line_total': 12.34})
        pb.process.terminate(); pb.process.wait(timeout=5)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={check_crm.ROOT / "pocketbase/pb_migrations"}']
        for _ in range(2):
            subprocess.run(pb.args + ['migrate', 'up'], env=pb.environment, check=True, stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        current = pb.request('GET', f'collections/sales_quotes/records/{quote["id"]}', token=pb.admin_token)[1]
        current_line = pb.request('GET', f'collections/sales_quote_lines/records/{line["id"]}', token=pb.admin_token)[1]
        self.assertEqual(current['quote_number'], '11450-1')
        self.assertEqual(current['subtotal'], 12.34)
        self.assertEqual(current['subtotal_before_discount'], 12.34)
        self.assertEqual(current['discount'], 0)
        self.assertEqual(current['discount_amount'], 0)
        self.assertEqual(current['discount_mode'], 'percent')
        self.assertEqual(current['terms_content'], '')
        self.assertEqual(current_line['tax_base'], 12.34)
        self.assertEqual(current['options_total'], 0)
        self.assertEqual(current_line['kind'], 'item')
        self.assertEqual(current_line['line_total'], 12.34)
        self.assertFalse(current_line['is_option'])

    def test_margin_repricing_and_tax_options(self):
        lines = [{'description': 'Article', 'quantity': 2, 'unit_cost': 100, 'unit_price': 1, 'price_source': 'margin', 'margin_percent': 25, 'discount': 10}, {'description': 'Option', 'quantity': 1, 'unit_cost': 100, 'unit_price': 1, 'price_source': 'margin', 'margin_percent': 25, 'is_option': True}]
        status, quote = self.quote_save(lines=lines)
        self.assertEqual(status, 200, quote)
        self.assertEqual(quote['lines'][0]['unit_price'], 125)
        self.assertEqual(quote['subtotal'], 225)
        self.assertEqual(quote['tax'], 45)
        self.assertEqual(quote['total'], 270)
        self.assertEqual(quote['options_total'], 125)
        self.assertEqual(quote['lines'][1]['tax_amount'], 25)
        lines[0]['unit_cost'] = 200
        status, changed = self.pb.request('POST', 'horizon/sales/quotes/save', {'id': quote['id'], 'updated': quote['updated'], 'input': {**self.quote, 'lines': lines}}, self.token)
        self.assertEqual(status, 200, changed)
        self.assertEqual(changed['lines'][0]['unit_price'], 250)
        self.assertEqual(changed['tax'], 90)
        self.assertEqual(changed['total'], 540)
        self.assertEqual(self.quote_save(key='invalid-margin-zero-cost', lines=[{**lines[0], 'unit_cost': 0}])[0], 400)
        self.assertEqual(self.quote_save(key='invalid-tax-rate-quote', tax_rate=101)[0], 400)

    def test_third_level_heading_saved(self):
        status, quote = self.quote_save(lines=[{'kind': 'section', 'description': 'Premier', 'show_total': True}, {'kind': 'subsection', 'description': 'Deuxième'}, {'kind': 'subsection3', 'description': 'Troisième', 'show_total': True}, {'description': 'Article', 'quantity': 1, 'unit_price': 10}])
        self.assertEqual(status, 200, quote)
        self.assertEqual(quote['lines'][2]['kind'], 'subsection3')
        self.assertEqual(quote['lines'][2]['section_total'], 10)

    def test_long_quote_audit_can_preserve_all_lines(self):
        lines = [{'kind': 'note', 'description': str(index) + 'x' * 1995} for index in range(200)]
        status, quote = self.quote_save(lines=lines)
        self.assertEqual(status, 200, quote)
        status, saved = self.pb.request('POST', 'horizon/sales/quotes/save', {'id': quote['id'], 'updated': quote['updated'], 'input': {**self.quote, 'lines': lines}}, self.token)
        self.assertEqual(status, 200, saved)
        events = self.pb.request('GET', 'collections/core_audit/records?filter=entity_id="' + quote['id'] + '"&sort=-created', token=self.pb.admin_token)[1]['items']
        self.assertEqual(len(events[0]['metadata']['lines_before']), 200)
        self.assertEqual(len(events[0]['metadata']['lines_after']), 200)

    def test_permissions_tampering_and_conflicts(self):
        status, quote = self.quote_save()
        self.assertEqual(status, 200, quote)
        self.assertEqual(self.pb.request('GET', 'horizon/sales/quotes', token=self.reader_token)[0], 403)
        self.assertEqual(self.pb.request('GET', 'collections/sales_quotes/records', token=self.reader_token)[1]['items'], [])
        self.assertEqual(self.pb.request('PATCH', 'collections/sales_quotes/records/' + quote['id'], {'quote_number': 'hacked'}, self.token)[0], 403)
        self.assertEqual(self.quote_save(key='quote-tampered-total', total=1)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/sales/quotes/save', {'id': quote['id'], 'updated': 'stale', 'input': self.quote}, self.token)[0], 409)
        self.pb.request('PATCH', f'collections/core_users/records/{self.user["id"]}', {'erp_profile': 'viewer'}, self.pb.admin_token)
        self.assertEqual(self.quote_save(key='viewer-forbidden-quote')[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/sales/quotes', token=self.token)[0], 200)

if __name__ == '__main__':
    unittest.main(verbosity=2)

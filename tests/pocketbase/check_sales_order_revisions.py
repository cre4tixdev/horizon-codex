"""Customer order revisions on isolated databases, with original quote preserved."""
import copy
import uuid
from check_stock_operations import StockOperationsTests

class OrderRevisionTests(StockOperationsTests):
    def revision_input(self, quote):
        status, quote = self.pb.request('GET', 'horizon/sales/quotes/' + quote['id'], token=self.token)
        self.assertEqual(status, 200, quote)
        fields = ['owner', 'discount', 'discount_mode', 'terms_id', 'opportunity', 'title', 'notes']
        input = {key: quote[key] for key in fields}
        input.update(quote_date=quote['quote_date'][:10], valid_until=quote['valid_until'][:10])
        keys = ['id', 'product', 'product_supplier', 'price_source', 'margin_percent', 'kind', 'brand', 'reference', 'unit_cost', 'discount', 'is_option', 'show_total', 'description', 'quantity', 'unit', 'unit_price']
        input['lines'] = [{key: line[key] for key in keys} for line in quote['lines']]
        return dict(id=quote['id'], updated=quote['updated'], input=input, customer_order_number=quote['order']['customer_number'])
    def preview_revision(self, body):
        return self.pb.request('POST', 'horizon/sales/orders/revision-preview', body, self.token)
    def save_revision(self, body, preview):
        return self.pb.request('POST', 'horizon/sales/orders/revise', dict(body, preview_token=preview['token']), self.token)
    def test_revision_preserves_quote_lines_and_order_identity(self):
        quote = self.customer_order()
        original = self.pb.request('GET', 'collections/sales_quotes/records/' + quote['id'], token=self.pb.admin_token)[1]
        original_lines = self.pb.request('GET', 'collections/sales_quote_lines/records?filter=quote="' + quote['id'] + '"', token=self.pb.admin_token)[1]['items']
        body = self.revision_input(quote)
        original_line = body['input']['lines'][0]['id']
        body['input']['title'] = 'Commande révisée'
        body['input']['lines'][0]['quantity'] = 6
        extra = copy.deepcopy(body['input']['lines'][0]); extra.update(id='', description='Nouvelle prestation', product='', product_supplier='', quantity=1, unit_price=20, unit_cost=5)
        body['input']['lines'].append(extra)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        self.assertEqual(saved['order']['id'], quote['order']['id']); self.assertEqual(saved['quote_number'], quote['quote_number'])
        self.assertEqual(saved['order']['revision'], 1); self.assertEqual(saved['title'], 'Commande révisée')
        self.assertEqual(saved['lines'][0]['id'], original_line); self.assertEqual(saved['lines'][0]['quantity'], 6)
        self.assertEqual(len(saved['lines']), 2)
        after = self.pb.request('GET', 'collections/sales_quotes/records/' + quote['id'], token=self.pb.admin_token)[1]
        for key in ['title', 'subtotal', 'tax', 'total', 'status', 'owner']: self.assertEqual(after[key], original[key])
        after_lines = self.pb.request('GET', 'collections/sales_quote_lines/records?filter=quote="' + quote['id'] + '"', token=self.pb.admin_token)[1]['items']
        self.assertEqual(after_lines, original_lines)
        self.assertEqual(self.save_revision(body, preview)[0], 409)
        status, history = self.pb.request('GET', 'horizon/sales/orders/' + quote['order']['id'] + '/revisions', token=self.token)
        self.assertEqual(status, 200, history); self.assertEqual(len(history['items']), 1)

    def test_revision_adjusts_reservation_and_draft_and_rechecks_preview(self):
        quote = self.customer_order(); self.stock(4)
        status, choices = self.pb.request('GET', 'horizon/inventory/stock/reservations/' + quote['id'], token=self.token); self.assertEqual(status, 200)
        status, _ = self.pb.request('POST', 'horizon/inventory/stock/reservations', dict(quote=quote['id'], revision=choices['revision'], selections=[dict(source_line=quote['lines'][0]['id'], location=self.location, quantity=4)]), self.token); self.assertEqual(status, 200)
        status, draft = self.prepare_delivery(quote); self.assertEqual(status, 200, draft)
        body = self.revision_input(quote); body['input']['lines'][0]['quantity'] = 2
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], []); self.assertEqual(len(preview['impacts']), 2)
        # Another user changes a draft after preview: no revision or adjustments may be committed.
        self.assertEqual(self.action(draft, 'cancel')[0], 200)
        self.assertEqual(self.save_revision(body, preview)[0], 409)
        self.assertEqual(self.balance()['reserved'], 4)
        status, draft = self.prepare_delivery(quote); self.assertEqual(status, 200, draft)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview)
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        self.assertEqual(self.balance()['reserved'], 2)
        status, revised_draft = self.pb.request('GET', 'horizon/inventory/operations/' + draft['id'], token=self.token); self.assertEqual(status, 200)
        self.assertEqual(revised_draft['lines'][0]['quantity'], 2)
        self.assertEqual(self.action(revised_draft)[0], 200)
        status, source = self.pb.request('GET', 'horizon/inventory/stock/reservations/' + quote['id'], token=self.token); self.assertEqual(status, 200)
        self.assertEqual(source['lines'][0]['quantity'], 2)

    def test_revision_removes_draft_delivery_line_and_cancels_empty_draft(self):
        quote = self.customer_order()
        # Keep a second commercial line so removing the stocked line is valid.
        body = self.revision_input(quote)
        extra = copy.deepcopy(body['input']['lines'][0]); extra.update(id='', product='', product_supplier='', description='Prestation conservée')
        body['input']['lines'].append(extra)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview)
        status, quote = self.save_revision(body, preview); self.assertEqual(status, 200, quote)
        status, draft = self.prepare_delivery(quote); self.assertEqual(status, 200, draft)
        body = self.revision_input(quote); body['input']['lines'].pop(0)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        self.assertTrue(any('brouillon annulé et archivé' in item['message'] for item in preview['impacts']))
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        self.assertEqual(len(saved['lines']), 1)
        status, cancelled = self.pb.request('GET', 'horizon/inventory/operations/' + draft['id'], token=self.token)
        self.assertEqual(status, 200, cancelled); self.assertEqual(cancelled['status'], 'cancelled'); self.assertTrue(cancelled['archived_at']); self.assertEqual(cancelled['number'], '')
        self.assertEqual(cancelled['lines'], draft['lines'])  # historical draft remains readable
        moves = self.pb.request('GET', 'collections/inventory_moves/records?filter=operation="' + draft['id'] + '"', token=self.pb.admin_token)[1]
        self.assertEqual(moves['totalItems'], 0)
        self.assertEqual(self.action(cancelled)[0], 400)
        active = self.pb.request('GET', 'horizon/inventory/operations?sales_quote=' + quote['id'], token=self.token)[1]
        archived = self.pb.request('GET', 'horizon/inventory/operations?sales_quote=' + quote['id'] + '&state=archived', token=self.token)[1]
        self.assertNotIn(draft['id'], [item['id'] for item in active['items']])
        self.assertIn(draft['id'], [item['id'] for item in archived['items']])
        status, restored = self.action(cancelled, 'restore'); self.assertEqual(status, 200, restored)
        self.assertEqual(restored['status'], 'cancelled'); self.assertEqual(restored['archived_at'], '')

    def test_revision_draft_removal_rechecks_realization_and_stock_permissions(self):
        quote = self.customer_order(); self.stock(4)
        body = self.revision_input(quote)
        extra = copy.deepcopy(body['input']['lines'][0]); extra.update(id='', description='Autre équipement')
        body['input']['lines'].append(extra)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview)
        status, quote = self.save_revision(body, preview); self.assertEqual(status, 200, quote)
        status, draft = self.prepare_delivery(quote); self.assertEqual(status, 200, draft)
        body = self.revision_input(quote); body['input']['lines'].pop(0)
        status, role = self.pb.request('GET', 'collections/core_roles/records/' + self.user['role'], token=self.pb.admin_token)
        self.assertEqual(status, 200, role)
        self.pb.request('PATCH', 'collections/core_roles/records/' + role['id'], {'permissions': [right for right in role['permissions'] if right != 'inventory.write']}, self.pb.admin_token)
        status, denied = self.preview_revision(body); self.assertEqual(status, 200, denied); self.assertTrue(denied['blocks'])
        self.assertEqual(self.save_revision(body, denied)[0], 400)
        self.pb.request('PATCH', 'collections/core_roles/records/' + role['id'], {'permissions': role['permissions']}, self.pb.admin_token)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        adjusted = self.pb.request('GET', 'horizon/inventory/operations/' + draft['id'], token=self.token)[1]
        self.assertEqual(adjusted['status'], 'draft'); self.assertEqual(len(adjusted['lines']), 1)
        self.assertEqual(adjusted['lines'][0]['source_line'], draft['lines'][1]['source_line'])
        # Preparing the remaining line does not permit deleting it after execution.
        body = self.revision_input(saved); body['input']['lines'][0].update(product='', product_supplier='')
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        self.assertEqual(self.action(adjusted)[0], 200)
        self.assertEqual(self.save_revision(body, preview)[0], 409)
        status, realized = self.preview_revision(body); self.assertEqual(status, 200, realized); self.assertTrue(realized['blocks'])

    def test_revision_changes_draft_product_without_changing_stock_history(self):
        quote = self.customer_order()
        status, draft = self.prepare_delivery(quote); self.assertEqual(status, 200, draft)
        original = self.pb.request('GET', 'collections/inventory_products/records/' + self.item['id'], token=self.pb.admin_token)[1]
        fields = ['name', 'description', 'manufacturer', 'manufacturer_ref', 'barcode', 'variant_group', 'category', 'kind', 'base_unit', 'brand', 'stock_policy', 'replenishment_policy', 'tracking', 'sale_enabled', 'purchase_enabled', 'sale_currency', 'reference_cost', 'cost_override']
        product = {key: original[key] for key in fields}; product.update(sku='REVISION-REPLACEMENT', name='Produit de remplacement', offers=[])
        status, replacement = self.pb.request('POST', 'horizon/inventory/products/save', dict(creation_key=str(uuid.uuid4()), input=product), self.token)
        self.assertEqual(status, 200, replacement)
        body = self.revision_input(quote); body['input']['lines'][0].update(product=replacement['id'], product_supplier='', description=replacement['name'])
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        status, adjusted = self.pb.request('GET', 'horizon/inventory/operations/' + draft['id'], token=self.token)
        self.assertEqual(status, 200, adjusted); self.assertEqual(adjusted['status'], 'draft')
        self.assertEqual(adjusted['lines'][0]['product'], replacement['id'])
        self.assertEqual(adjusted['lines'][0]['reference'], replacement['sku'])
        self.assertEqual(adjusted['lines'][0]['source_line'], draft['lines'][0]['source_line'])
        self.assertEqual(adjusted['lines'][0]['traces'], [])
        self.assertEqual(adjusted['lines'][0]['allocations'], draft['lines'][0]['allocations'])
        # Switch to a free-text service: the now irrelevant BL is cancelled.
        body = self.revision_input(saved); body['input']['lines'][0].update(product='', product_supplier='')
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        self.assertEqual(self.save_revision(body, preview)[0], 200)
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/operations/' + draft['id'], token=self.token)[1]['status'], 'cancelled')

    def test_revision_blocks_execution_but_allows_reduction_after_return(self):
        quote = self.customer_order(); self.stock(4)
        status, draft = self.prepare_delivery(quote); self.assertEqual(status, 200)
        status, done = self.action(draft); self.assertEqual(status, 200)
        body = self.revision_input(quote); body['input']['lines'][0]['quantity'] = 3
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertTrue(preview['blocks'])
        self.assertEqual(self.save_revision(body, preview)[0], 400)
        ret = self.build_input('RET', 1); ret['origin'] = done['id']; ret['lines'][0]['origin_line'] = done['lines'][0]['id']
        status, returned = self.save(ret); self.assertEqual(status, 200); self.assertEqual(self.action(returned)[0], 200)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        self.assertEqual(saved['lines'][0]['quantity'], 3)
        status, related = self.pb.request('GET', 'horizon/sales/opportunities/' + self.opp['id'], token=self.token)
        self.assertEqual(status, 200, related); self.assertEqual(related['revenue'][0]['amount'], saved['subtotal'])
        self.assertEqual(self.pb.request('GET', 'horizon/inventory/operations/delivery-needed/' + quote['id'], token=self.token)[1], {'needed': False})
        body = self.revision_input(saved); body['input']['lines'][0]['product'] = ''
        self.assertTrue(self.preview_revision(body)[1]['blocks'])

    def test_revision_reorder_delete_guards_and_permissions(self):
        quote = self.customer_order(); body = self.revision_input(quote)
        new = copy.deepcopy(body['input']['lines'][0]); new.update(id='', description='Autre ligne')
        body['input']['lines'].append(new)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200)
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        body = self.revision_input(saved); body['input']['lines'].reverse()
        status, preview = self.preview_revision(body); self.assertEqual(status, 200)
        status, reordered = self.save_revision(body, preview); self.assertEqual(status, 200, reordered)
        self.assertEqual(reordered['lines'][0]['id'], saved['lines'][1]['id'])
        body = self.revision_input(reordered); body['input']['lines'].pop()
        status, preview = self.preview_revision(body); self.assertEqual(status, 200)
        status, reduced = self.save_revision(body, preview); self.assertEqual(status, 200, reduced)
        self.assertEqual(len(reduced['lines']), 1)
        order_line = self.pb.request('GET', 'collections/sales_order_lines/records?filter=order="' + quote['order']['id'] + '"', token=self.pb.admin_token)[1]['items'][0]
        self.assertNotEqual(self.pb.request('PATCH', 'collections/sales_order_lines/records/' + order_line['id'], {'quantity': 100}, self.pb.admin_token)[0], 200)
        self.assertNotEqual(self.pb.request('PATCH', 'collections/sales_orders/records/' + quote['order']['id'], {'subtotal': 1}, self.pb.admin_token)[0], 200)
        self.assertEqual(self.pb.request('GET', 'collections/sales_order_revisions/records', token=self.token)[0], 403)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'permissions': ['sales.read', 'sales.write', 'crm.read']}, self.pb.admin_token)
        self.assertEqual(self.preview_revision(body)[0], 403)

    def test_revision_respects_pending_purchases_and_expands_remaining_needs(self):
        quote, purchase = self.sourced_purchase()
        original = self.pb.request('GET', 'horizon/purchasing/orders/' + purchase['id'], token=self.token)[1]
        body = self.revision_input(quote); body['input']['lines'][0]['quantity'] = 2
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertTrue(preview['blocks'])
        self.assertIn('/purchasing/requests/', preview['blocks'][0]['href'])
        body['input']['lines'][0]['quantity'] = 12
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        status, needs = self.pb.request('GET', 'horizon/purchasing/needs/' + quote['id'], token=self.token); self.assertEqual(status, 200, needs)
        self.assertEqual(needs['lines'][0]['quantity'], 2)
        self.assertEqual(self.pb.request('GET', 'horizon/purchasing/orders/' + purchase['id'], token=self.token)[1], original)

import check_billing

class BillingOrderRevisionTests(check_billing.BillingTests):
    revision_input = OrderRevisionTests.revision_input
    preview_revision = OrderRevisionTests.preview_revision
    save_revision = OrderRevisionTests.save_revision
    def test_revised_price_applies_to_future_invoices_preserving_validated_snapshot(self):
        quote = self.order()
        status, prepared = self.prepare(quote); self.assertEqual(status, 200, prepared)
        input = self.prepared_input(prepared); input['lines'][0]['quantity'] = 2
        invoice = self.validated(input)
        original = self.get('record/customer/' + invoice['id'])
        body = self.revision_input(quote); body['input']['lines'][0]['quantity'] = 1
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], []); self.assertTrue(any('avoir' in item['message'] for item in preview['impacts']))
        body['input']['lines'][0].update(quantity=6, unit_price=120)
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        self.assertEqual(self.get('record/customer/' + invoice['id']), original)
        status, future = self.prepare(saved); self.assertEqual(status, 200, future)
        self.assertEqual(future['lines'][0]['quantity'], 4); self.assertEqual(future['lines'][0]['unit_price'], 130)
        final_invoice = self.validated(self.prepared_input(future))
        self.assertEqual(original['subtotal'] + final_invoice['subtotal'], saved['subtotal'])

    def test_reducing_invoiced_quantity_prepares_one_draft_credit_and_reuses_it(self):
        quote = self.order()
        status, prepared = self.prepare(quote); self.assertEqual(status, 200, prepared)
        invoice = self.validated(self.prepared_input(prepared)); original = self.get('record/customer/' + invoice['id'])
        body = self.revision_input(quote); body['input']['lines'][0]['quantity'] = 3
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        self.assertTrue(any('avoir brouillon' in item['message'] for item in preview['impacts']))
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        credits = self.get('documents?kind=customer_credit&source_order=' + quote['id'])['items']
        self.assertEqual(len(credits), 1); credit = self.get('record/customer_credit/' + credits[0]['id'])
        self.assertEqual(credit['status'], 'draft'); self.assertEqual(credit['source_invoice'], invoice['id'])
        self.assertEqual(credit['lines'][0]['quantity'], 1); self.assertEqual(credit['lines'][0]['unit_price'], 100)
        self.assertEqual(credit['lines'][0]['credit_source_line'], original['lines'][0]['id'])
        self.assertEqual(credit['total'], 120)
        self.assertEqual(self.get('record/customer/' + invoice['id']), original)
        self.assertEqual(self.save_revision(body, preview)[0], 409)
        body = self.revision_input(saved); body['input']['notes'] = 'Avoir en attente de validation'
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        self.assertEqual(len(self.get('documents?kind=customer_credit&source_order=' + quote['id'])['items']), 1)
        self.assertEqual(self.action(credit)[0], 200)
        # Complete removal is represented by quantity zero, preserving the source identity.
        body = self.revision_input(saved); body['input']['lines'][0]['quantity'] = 0
        status, preview = self.preview_revision(body); self.assertEqual(status, 200, preview); self.assertEqual(preview['blocks'], [])
        status, saved = self.save_revision(body, preview); self.assertEqual(status, 200, saved)
        self.assertEqual(saved['lines'][0]['quantity'], 0)
        credits = self.get('documents?kind=customer_credit&source_order=' + quote['id'])['items']
        self.assertEqual(len(credits), 2)
        remaining = next(item for item in credits if item['status'] == 'draft')
        self.assertEqual(self.get('record/customer_credit/' + remaining['id'])['lines'][0]['quantity'], 3)


import unittest
import shutil
import sqlite3
import subprocess
from pathlib import Path
from unittest.mock import patch
from check_auth import LocalPocketBase, ROOT

class OrderRevisionMigrationTests(unittest.TestCase):
    def test_numbering_migration_preserves_legacy_numbers_and_allows_empty_drafts(self):
        pb = LocalPocketBase(); self.addCleanup(pb.close)
        directory = Path(pb.temp.name) / 'before_stock_draft_numbering'; directory.mkdir()
        for file in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if file.name < '1791840013_stock_draft_numbering.js': shutil.copy(file, directory / file.name)
        pb.args = [value for value in pb.args if not value.startswith('--migrationsDir=')] + [f'--migrationsDir={directory}']
        fixture = StockOperationsTests('test_draft_idempotency_number_and_append_only')
        with patch('check_crm.LocalPocketBase', return_value=pb): fixture.setUp()
        for index, state in enumerate(['draft', 'done']):
            status, record = pb.request('POST', 'collections/inventory_operations/records', dict(number=f'MEU/IN/{index+40:05}', kind='IN', status=state, warehouse=fixture.warehouse, actor=fixture.user['id'], creation_key=str(uuid.uuid4()), lines=[], document_snapshot={'historical': state}), pb.admin_token)
            self.assertEqual(status, 200, record)
        pb.process.terminate(); pb.process.wait(timeout=10)
        def history():
            with sqlite3.connect(pb.data / 'data.db') as connection:
                return connection.execute('SELECT * FROM inventory_operations ORDER BY id').fetchall(), connection.execute('SELECT id,counters FROM inventory_warehouses ORDER BY id').fetchall()
        before = history()
        args = [value for value in pb.args if not value.startswith('--migrationsDir=')] + [f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}']
        for _ in range(2):
            result = subprocess.run(args + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr); self.assertEqual(history(), before)
        pb.args = args; pb.launch_and_authenticate(args)
        for _ in range(2):
            status, draft = fixture.save(fixture.build_input()); self.assertEqual(status, 200, draft); self.assertEqual(draft['number'], '')
        with sqlite3.connect(pb.data / 'data.db') as connection:
            sql = connection.execute("SELECT sql FROM sqlite_master WHERE name='idx_stock_operation_number'").fetchone()[0]
            self.assertIn('WHERE', sql.upper())

    def test_upgrade_preserves_existing_order_and_replays_safely(self):
        pb = LocalPocketBase(); self.addCleanup(pb.close)
        directory = Path(pb.temp.name) / 'before_order_revisions'; directory.mkdir()
        for file in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if file.name < '1791840012_sales_order_revisions.js': shutil.copy(file, directory / file.name)
        pb.args = [value for value in pb.args if not value.startswith('--migrationsDir=')] + [f'--migrationsDir={directory}']
        fixture = StockOperationsTests('test_customer_return_reopens_delivery_remainder')
        with patch('check_crm.LocalPocketBase', return_value=pb): fixture.setUp()
        quote = fixture.customer_order()
        pb.process.terminate(); pb.process.wait(timeout=10)
        def history():
            with sqlite3.connect(pb.data / 'data.db') as connection:
                return [connection.execute(sql).fetchall() for sql in ['SELECT id,quote,order_number,order_date,quote_snapshot,subtotal,tax,total,updated FROM sales_orders', 'SELECT * FROM sales_order_lines ORDER BY id', 'SELECT * FROM sales_quotes ORDER BY id', 'SELECT * FROM sales_quote_lines ORDER BY id']]
        before = history()
        args = [value for value in pb.args if not value.startswith('--migrationsDir=')] + [f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}']
        for _ in range(2):
            result = subprocess.run(args + ['migrate', 'up'], env=pb.environment, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr); self.assertEqual(history(), before)
        pb.args = args; pb.launch_and_authenticate(args)
        status, saved = pb.request('GET', 'horizon/sales/quotes/' + quote['id'], token=fixture.token)
        self.assertEqual(status, 200, saved); self.assertEqual(saved['order']['revision'], 0)
        with sqlite3.connect(pb.data / 'data.db') as connection:
            indexes = connection.execute('PRAGMA index_list(sales_order_lines)').fetchall()
            self.assertEqual(next(index[2] for index in indexes if index[1] == 'idx_sales_order_line_position'), 0)

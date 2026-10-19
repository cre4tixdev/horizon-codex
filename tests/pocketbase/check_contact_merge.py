"""Contact merges on disposable local databases, never the NAS."""
import unittest
from check_auth import LocalPocketBase

class ContactMergeTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase(); self.addCleanup(self.pb.close); self.pb.start()
        role = self.pb.create('core_roles', dict(name='merger', label='Fusion', active=True, permissions=['contacts.read','contacts.write','contacts.merge','contacts.import']))
        self.user = self.pb.create_user('merge@local.invalid', role['id'])
        self.token = self.pb.login(self.user['email'])[1]['token']
        self.source = self.pb.create('contacts_companies', dict(name='Métropole test', active=True, phone='0102030405'))
        self.target = self.pb.create('contacts_companies', dict(name='M6 test', legal_name='Métropole test', active=True))
    def call(self, action, body, token=None):
        return self.pb.request('POST', 'horizon/contacts/merge/'+action, body, token or self.token)
    def selection(self, source=None, target=None, kind='companies'):
        return dict(kind=kind,source=(source or self.source)['id'],target=(target or self.target)['id'])
    def record(self, table, id):
        return self.pb.request('GET','collections/'+table+'/records/'+id,token=self.pb.admin_token)[1]
    def preview(self, **kwargs):
        body=self.selection(**kwargs); code, result=self.call('preview',body); self.assertEqual(code,200,result); return body,result
    def apply(self, body, preview, **kwargs):
        return self.call('apply',dict(body,fingerprint=preview['fingerprint'],confirmed=True,choices={},**kwargs))
    def test_merge_companies_children_roles_references_audit_and_replay(self):
        person=self.pb.create('contacts_people',dict(first_name='Alice',company=self.source['id'],active=True))
        a=self.pb.create('contacts_addresses',dict(company=self.source['id'],type='billing',email='source@example.invalid',is_primary=True))
        self.pb.create('contacts_addresses',dict(company=self.target['id'],type='billing',email='target@example.invalid',is_primary=True))
        for parent in [self.source,self.target]: self.pb.create('contacts_company_roles',dict(company=parent['id'],role='customer',active=True))
        ref=self.pb.create('core_external_references',dict(provider='odoo:test',entity_type='contacts_companies',external_id='2313',horizon_record_id=self.source['id']))
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[],preview); self.assertEqual(preview['counts']['people'],1)
        self.assertEqual(self.record('contacts_people',person['id'])['company'],self.source['id'])
        code,result=self.apply(body,preview); self.assertEqual(code,200,result)
        self.assertEqual(self.record('contacts_people',person['id'])['company'],self.target['id'])
        address=self.record('contacts_addresses',a['id']); self.assertEqual(address['company'],self.source['id']); self.assertTrue(address['is_primary'])
        copies=self.pb.request('GET','collections/contacts_addresses/records?filter=company="'+self.target['id']+'"',token=self.pb.admin_token)[1]['items']; copy=next(row for row in copies if row['email']=='source@example.invalid'); self.assertFalse(copy['is_primary'])
        source=self.record('contacts_companies',self.source['id']); self.assertFalse(source['active']); self.assertEqual(source['merged_into'],self.target['id']); self.assertTrue(source['merged_at'])
        self.assertEqual(self.record('contacts_companies',self.target['id'])['phone'],'0102030405')
        self.assertEqual(self.record('core_external_references',ref['id'])['horizon_record_id'],self.target['id'])
        self.assertEqual(self.apply(body,preview)[0],200)
        audits=self.pb.request('GET','collections/core_audit/records?filter=action="merge"',token=self.pb.admin_token)[1]['items']; self.assertEqual(len(audits),1)
        for patch in [dict(active=True),dict(name='Edited'),dict(merged_into='')]: self.assertEqual(self.pb.request('PATCH','collections/contacts_companies/records/'+source['id'],patch,self.pb.admin_token)[0],400)
        self.assertEqual(self.pb.request('DELETE','collections/contacts_companies/records/'+source['id'],token=self.pb.admin_token)[0],400)
        self.assertEqual(self.pb.request('POST','collections/contacts_people/records',dict(first_name='New',company=source['id']),self.pb.admin_token)[0],400)
    def test_permissions_stale_confirmation_and_identity_conflict(self):
        body,preview=self.preview()
        self.assertEqual(self.call('preview',body,self.pb.login(self.pb.user['email'])[1]['token'])[0],403)
        self.assertEqual(self.call('apply',dict(body,fingerprint=preview['fingerprint'],choices={}))[0],400)
        self.pb.request('PATCH','collections/contacts_companies/records/'+self.target['id'],dict(phone='changed'),self.pb.admin_token)
        self.assertEqual(self.apply(body,preview)[0],409)
        for parent,siren in [(self.source,'123456789'),(self.target,'987654321')]: self.pb.request('PATCH','collections/contacts_companies/records/'+parent['id'],dict(siren=siren),self.pb.admin_token)
        body,preview=self.preview(); self.assertTrue(preview['blockers']); self.assertEqual(self.apply(body,preview)[0],409)
        self.assertTrue(self.record('contacts_companies',self.source['id'])['active'])
    def test_legal_conflicts_show_each_field_value_and_company(self):
        source=dict(siren='123456789',vat_number='FR00123456789',lei='11111111111111111111')
        target=dict(siren='987654321',vat_number='FR00987654321',lei='22222222222222222222')
        for record,values in [(self.source,source),(self.target,target)]:
            code,result=self.pb.request('PATCH','collections/contacts_companies/records/'+record['id'],values,self.pb.admin_token)
            self.assertEqual(code,200,result)
        body,preview=self.preview()
        self.assertEqual(len(preview['blockers']),3,preview)
        for key,field in [('siren','SIREN'),('vat_number','N° TVA'),('lei','LEI')]:
            messages=[message for message in preview['blockers'] if message.startswith(field+' incompatible')]
            self.assertEqual(len(messages),1,preview)
            for value in [source[key],target[key],self.source['name'],self.target['name'],'fiche à fusionner','fiche conservée']:
                self.assertIn(value,messages[0])
        status,result=self.apply(body,preview); self.assertEqual(status,409,result)
        self.assertEqual(result['message'],preview['blockers'][0])
        self.assertTrue(self.record('contacts_companies',self.source['id'])['active'])

    def test_compatible_third_party_account_transferred(self):
        self.pb.create('accounting_third_party_accounts',dict(company=self.source['id'],type='customer',account_code='411TEST',active=True))
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[]); self.assertEqual(self.apply(body,preview)[0],200)
        account=self.pb.request('GET','collections/accounting_third_party_accounts/records',token=self.pb.admin_token)[1]['items'][0]; self.assertEqual(account['company'],self.target['id'])
    def test_people_merge_choice_and_protected_markers(self):
        a=self.pb.create('contacts_people',dict(first_name='Alice',last_name='Test',email='a@example.invalid',active=True))
        b=self.pb.create('contacts_people',dict(first_name='Alicia',last_name='Test',active=True))
        body,preview=self.preview(source=a,target=b,kind='people')
        code,result=self.call('apply',dict(body,fingerprint=preview['fingerprint'],confirmed=True,choices=dict(first_name='source'))); self.assertEqual(code,200,result)
        target=self.record('contacts_people',b['id']); self.assertEqual(target['first_name'],'Alice'); self.assertEqual(target['email'],'a@example.invalid')
        self.assertEqual(self.pb.request('PATCH','collections/contacts_people/records/'+b['id'],dict(merged_into=a['id']),self.token)[0],400)
        body=self.selection(source=b,target=self.source,kind='people'); self.assertEqual(self.call('preview',body)[0],404)

    def test_import_replay_keeps_external_identity_after_merge(self):
        import uuid
        import base64
        from pathlib import Path
        image=base64.b64encode((Path(__file__).resolve().parents[1]/'fixtures/import-logo.png').read_bytes()).decode()
        headers=['external_id','name','image_base64']
        def prepare(name):
            data=dict(type='companies',source='file',filename='merge.csv',namespace='merge-reference',key=str(uuid.uuid4()),headers=headers,rows=[['2313',name,image]],mapping={key:i for i,key in enumerate(headers)},mode='upsert')
            status,job=self.pb.request('POST','horizon/imports/preview',data,self.token); self.assertEqual(status,200,job); return job
        job=prepare('Imported merge source')
        status,result=self.pb.request('POST','horizon/imports/jobs/'+job['id']+'/apply',{},self.token); self.assertEqual(status,200,result)
        imported=self.record('contacts_companies',result['rows'][0]['target'])
        body,preview=self.preview(source=imported); self.assertEqual(self.apply(body,preview)[0],200)
        self.assertTrue(self.record('contacts_companies',self.target['id'])['logo'])
        self.assertEqual(self.record('contacts_companies',imported['id'])['logo'],imported['logo'])
        again=prepare('Updated external target'); self.assertEqual(again['summary']['update'],1,again)
        status,result=self.pb.request('POST','horizon/imports/jobs/'+again['id']+'/apply',{},self.token); self.assertEqual(status,200,result)
        self.assertEqual(self.record('contacts_companies',self.target['id'])['name'],'Updated external target')
        self.assertFalse(self.record('contacts_companies',imported['id'])['active'])

    def test_dependency_changes_and_transaction_rollback(self):
        body,preview=self.preview()
        person=self.pb.create('contacts_people',dict(first_name='New child',company=self.source['id'],active=True))
        self.assertEqual(self.apply(body,preview)[0],409)
        # A SIRET also identifies the legal entity, even when SIREN is blank.
        self.pb.request('PATCH','collections/contacts_companies/records/'+self.source['id'],dict(siret='12345678900001'),self.pb.admin_token)
        self.pb.request('PATCH','collections/contacts_companies/records/'+self.target['id'],dict(siren='987654321'),self.pb.admin_token)
        body,preview=self.preview(); self.assertEqual(len(preview['blockers']),1,preview)
        self.assertIn('SIREN incompatible',preview['blockers'][0]); self.assertIn('123456789 (déduit du SIRET 12345678900001)',preview['blockers'][0]); self.assertIn('987654321',preview['blockers'][0])
        self.assertEqual(self.apply(body,preview)[0],409)
        self.assertEqual(self.record('contacts_people',person['id'])['company'],self.source['id'])
        # Combining two individually valid people can still produce an invalid name.
        a=self.pb.create('contacts_people',dict(last_name='Source',email='rollback@example.invalid',active=True))
        b=self.pb.create('contacts_people',dict(first_name='Destination',active=True))
        body,preview=self.preview(source=a,target=b,kind='people')
        status,_=self.call('apply',dict(body,fingerprint=preview['fingerprint'],confirmed=True,choices=dict(first_name='source',last_name='target'))); self.assertEqual(status,400)
        self.assertTrue(self.record('contacts_people',a['id'])['active'])
        target=self.record('contacts_people',b['id']); self.assertEqual(target['email'],''); self.assertEqual(target['first_name'],'Destination')

    def test_viewer_permission_revocation_and_no_merge_chains(self):
        viewer=self.pb.create_user('merge-viewer@local.invalid',self.user['role'],'viewer')
        self.assertEqual(self.call('preview',self.selection(),self.pb.login(viewer['email'])[1]['token'])[0],403)
        body,preview=self.preview(); self.assertEqual(self.apply(body,preview)[0],200)
        third=self.pb.create('contacts_companies',dict(name='Third',active=True))
        body,preview=self.preview(source=self.target,target=third); self.assertEqual(preview['blockers'],[]); self.assertEqual(self.apply(body,preview)[0],200)
        self.assertEqual(self.record('contacts_companies',self.source['id'])['merged_into'],third['id'])
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],dict(permissions=['contacts.read','contacts.write']),self.pb.admin_token)
        self.assertEqual(self.apply(body,preview)[0],403)

class ContactMergeMigrationTests(unittest.TestCase):
    def test_upgrade_existing_database_preserves_records_and_grants_admin_role(self):
        from pathlib import Path
        import subprocess
        pb=LocalPocketBase(); self.addCleanup(pb.close)
        current=list(pb.args)
        directory=Path(pb.temp.name)/'previous_migrations'; directory.mkdir()
        root=Path(__file__).resolve().parents[2]/'pocketbase/pb_migrations'
        for migration in root.glob('*.js'):
            if migration.name < '1791840028': (directory/migration.name).symlink_to(migration)
        pb.args=[arg if not arg.startswith('--migrationsDir=') else '--migrationsDir='+str(directory) for arg in pb.args]
        pb.start()
        role=pb.create('core_roles',dict(name='existing_admin',label='Admin existant',active=True,permissions=['contacts.read','contacts.write']))
        pb.create_user('existing-admin@local.invalid',role['id'],'admin')
        company=pb.create('contacts_companies',dict(name='Société préexistante',active=True))
        person=pb.create('contacts_people',dict(first_name='Avant migration',company=company['id'],active=True))
        pb.process.terminate(); pb.process.wait(timeout=10)
        pb.args=current
        for _ in range(2): subprocess.run(pb.args+['migrate','up'],check=True,stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        for table, original in [('contacts_companies',company),('contacts_people',person)]:
            actual=pb.request('GET','collections/'+table+'/records/'+original['id'],token=pb.admin_token)[1]
            for key,value in original.items(): self.assertEqual(actual[key],value,key)
            self.assertEqual(actual['merged_into'],''); self.assertEqual(actual['merged_at'],'')
        actual=pb.request('GET','collections/core_roles/records/'+role['id'],token=pb.admin_token)[1]
        self.assertIn('contacts.merge',actual['permissions'])

class CompanyHistoryMergeTests(unittest.TestCase):
    call=ContactMergeTests.call
    selection=ContactMergeTests.selection
    record=ContactMergeTests.record
    preview=ContactMergeTests.preview
    apply=ContactMergeTests.apply
    def setUp(self):
        import check_billing
        self.billing=check_billing.BillingTests('test_invoice_number_immutability_and_dashboard'); self.billing.setUp()
        self.pb=self.billing.pb; self.addCleanup(self.pb.close); self.user=self.billing.user; self.token=self.billing.token
        role=self.record('core_roles',self.user['role'])
        rights=list(set(role['permissions']+['contacts.write','contacts.merge','documents.read','purchasing.read','purchasing.write','inventory.read','inventory.write']))
        code,result=self.pb.request('PATCH','collections/core_roles/records/'+role['id'],dict(permissions=rights),self.pb.admin_token); self.assertEqual(code,200,result)
        self.source=self.billing.company; self.target=self.pb.create('contacts_companies',dict(name='Survivant test historique',active=True))
        self.pb.create('contacts_addresses',dict(company=self.target['id'],type='billing',line1='Adresse survivant',city='Paris',postal_code='75001',country='FR',is_primary=True))
    def test_histories_filters_credit_payment_and_new_invoice(self):
        import copy, uuid
        bill=self.billing
        order=bill.order(); invoice=bill.validated(); target_invoice=bill.validated(dict(bill.input,company=self.target['id']))
        status,draft=bill.save(); self.assertEqual(status,200,draft)
        originals=[('billing_invoices',invoice['id']),('billing_invoices',target_invoice['id']),('sales_quotes',order['id']),('sales_orders',order['order']['id'])]
        before={key:self.record(*key) for key in originals}
        html=bill.call('preview',dict(kind='customer',id=invoice['id'],format='html'))[1]['html']
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[],preview)
        code,result=self.apply(body,preview); self.assertEqual(code,200,result)
        for key in originals: self.assertEqual(self.record(*key),before[key],key)
        self.assertEqual(bill.call('preview',dict(kind='customer',id=invoice['id'],format='html'))[1]['html'],html)
        self.assertEqual(self.record('billing_invoices',draft['id'])['company'],self.target['id'])
        for company in [self.target['id'],self.source['id']]:
            rows=bill.get('documents?kind=customer&company='+company)['items']; self.assertTrue({invoice['id'],target_invoice['id'],draft['id']}.issubset({r['id'] for r in rows}))
            status,rows=self.pb.request('GET','horizon/sales/quotes?company='+company,token=self.token); self.assertEqual(status,200,rows); self.assertIn(order['id'],[r['id'] for r in rows['items']])
            status,rows=self.pb.request('GET','horizon/crm/list-index?company='+company+'&sort=-created',token=self.token); self.assertEqual(status,200,rows); self.assertIn(self.billing.opp['id'],[r['id'] for r in rows['items']])
        status,links=self.pb.request('GET','horizon/contacts/companies/'+self.target['id']+'/business-links',token=self.token); self.assertEqual(status,200,links); self.assertEqual(len(links['customer-invoices']),3); self.assertTrue(links['sales-orders'])
        status,prepared=bill.prepare(order); self.assertEqual(status,200,prepared); self.assertEqual(prepared['company'],self.target['id'])
        data=bill.prepared_input(prepared); status,new=bill.save(data); self.assertEqual(status,200,new); self.assertEqual(new['company'],self.target['id'])
        status,payment=bill.call('payments',dict(creation_key=str(uuid.uuid4()),payment_date='2026-10-19',method='Virement',reference='Fusion',allocations=[dict(kind='customer',id=invoice['id'],amount=120),dict(kind='customer',id=target_invoice['id'],amount=120)])); self.assertEqual(status,200,payment); self.assertEqual(self.record('billing_payments',payment['id'])['company'],self.target['id'])
        status,credit=bill.call('documents/credit',dict(kind='customer',id=invoice['id'])); self.assertEqual(status,200,credit)
        saved=bill.validated(bill.prepared_input(credit),'customer_credit'); self.assertEqual(saved['company'],self.target['id'])
        self.assertEqual(self.record('billing_credit_notes',saved['id'])['document_snapshot']['company'],before[('billing_invoices',invoice['id'])]['document_snapshot']['company'])
        self.assertEqual(self.apply(body,preview)[0],200)
    def test_stale_destination_history_and_missing_owner_rights(self):
        invoice=self.billing.validated()
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[])
        self.billing.validated(dict(self.billing.input,company=self.target['id']))
        self.assertEqual(self.apply(body,preview)[0],409)
        status,draft=self.billing.save(); self.assertEqual(status,200,draft)
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],dict(permissions=['contacts.read','contacts.write','contacts.merge']),self.pb.admin_token)
        body,preview=self.preview(); self.assertTrue(preview['blockers']); self.assertNotIn('billing',preview['counts']); self.assertEqual(self.apply(body,preview)[0],409)
        self.assertEqual(self.record('billing_invoices',invoice['id'])['company'],self.source['id'])
    def test_consecutive_merges_keep_originals_and_flatten_aliases(self):
        invoice=self.billing.validated(); original=self.record('billing_invoices',invoice['id'])
        body,preview=self.preview(); self.assertEqual(self.apply(body,preview)[0],200)
        third=self.pb.create('contacts_companies',dict(name='Troisième identité',active=True))
        body,preview=self.preview(source=self.target,target=third); self.assertEqual(preview['blockers'],[],preview)
        self.assertEqual(self.apply(body,preview)[0],200)
        for parent in [self.source,self.target]: self.assertEqual(self.record('contacts_companies',parent['id'])['merged_into'],third['id'])
        self.assertEqual(self.record('billing_invoices',invoice['id']),original)
        rows=self.billing.get('documents?kind=customer&company='+third['id'])['items']; self.assertIn(invoice['id'],[r['id'] for r in rows])
    def test_conflicting_account_codes_block_merge(self):
        for parent,code in [(self.source,'411ONE'),(self.target,'411TWO')]: self.pb.create('accounting_third_party_accounts',dict(company=parent['id'],type='customer',account_code=code,active=True))
        body,preview=self.preview(); self.assertTrue(preview['blockers']); self.assertEqual(self.apply(body,preview)[0],409)
        self.assertTrue(self.record('contacts_companies',self.source['id'])['active'])

    def test_confirm_old_quote_new_quote_and_deposit_after_merge(self):
        import uuid
        fixture=self.billing.fixture
        status,quote=fixture.quote_save(lines=[dict(description='Installation',quantity=10,unit='u',unit_price=100)]); self.assertEqual(status,200,quote)
        status,quote=fixture.transition('finalize',quote); self.assertEqual(status,200,quote)
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[],preview); self.assertEqual(self.apply(body,preview)[0],200)
        status,confirmed=fixture.transition('confirm',quote); self.assertEqual(status,200,confirmed)
        order=self.record('sales_orders',confirmed['order']['id']); self.assertEqual(order['company'],self.target['id']); self.assertEqual(order['quote_snapshot']['company'],self.source['id'])
        status,deposit=self.billing.prepare(confirmed,mode='deposit',percent=30); self.assertEqual(status,200,deposit); self.assertEqual(deposit['company'],self.target['id'])
        invoice=self.billing.validated(self.billing.prepared_input(deposit)); self.assertEqual(invoice['company'],self.target['id'])
        status,new=fixture.quote_save(key=str(uuid.uuid4()),lines=[dict(description='Nouvelle offre',quantity=1,unit='u',unit_price=100)]); self.assertEqual(status,200,new); self.assertEqual(new['company'],self.target['id'])
    def test_merged_activity_tasks_and_document_acl(self):
        import json
        import check_ged
        # Reuse the existing multipart fixture with the same disposable server and identity.
        role=self.record('core_roles',self.user['role']); self.pb.request('PATCH','collections/core_roles/records/'+role['id'],dict(permissions=role['permissions']+['documents.write']),self.pb.admin_token)
        ged=check_ged.GedTests(); ged.pb=self.pb; ged.people={'writer':dict(user=self.user,token=self.token)}
        ged.input=dict(name='',space='customers',folder='',category='',tags=[],description='',visibility='team',readers=[],links=[])
        file=ged.upload(links=[dict(entity='contacts_companies',id=self.source['id'])])
        source_link=self.pb.request('GET','collections/documents_links/records',token=self.pb.admin_token)[1]['items'][0]
        status,event=self.pb.request('POST','collections/core_activity_events/records',dict(source_module='contacts',source_entity='contacts_companies',source_record_id=self.source['id'],type='task',body='Historique société',metadata=dict(task=dict(title='À rappeler',assigned_to=self.user['id'],priority='normal',due_date='2026-10-20'))),self.token); self.assertEqual(status,200,event)
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[],preview); self.assertEqual(self.apply(body,preview)[0],200)
        status,feed=self.pb.request('GET','horizon/activity/events?entity=contacts_companies&id='+self.target['id'],token=self.token); self.assertEqual(status,200,feed); self.assertIn(event['id'],[r['id'] for r in feed['items']])
        status,tasks=self.pb.request('GET','horizon/activity/tasks?entity=contacts_companies&id='+self.target['id'],token=self.token); self.assertEqual(status,200,tasks); self.assertEqual(len(tasks['items']),1)
        status,result=self.pb.request('PATCH','collections/core_tasks/records/'+tasks['items'][0]['id'],dict(status='done'),self.token); self.assertEqual(status,200,result)
        status,files=self.pb.request('GET','horizon/ged/files?space=customers&context_id='+self.target['id'],token=self.token); self.assertEqual(status,200,files); self.assertIn(file['id'],[r['id'] for r in files['items']])
        self.assertEqual(self.record('documents_links',source_link['id']),source_link)
        # Native Contacts ACL still applies to attachments linked to an old alias.
        self.pb.request('PATCH','collections/contacts_companies',dict(viewRule='id != "'+self.source['id']+'" && @request.auth.id != ""'),self.pb.admin_token)
        status,files=self.pb.request('GET','horizon/ged/files?space=customers&context_id='+self.target['id'],token=self.token); self.assertEqual(status,200,files); self.assertNotIn(file['id'],[r['id'] for r in files['items']])
        status,feed=self.pb.request('GET','horizon/activity/events?entity=contacts_companies&id='+self.target['id'],token=self.token); self.assertEqual(status,200,feed); self.assertNotIn(event['id'],[r['id'] for r in feed['items']])
    def test_supplier_duplicate_reference_blocks_then_remains_unique_across_aliases(self):
        import check_billing
        for company in [self.source,self.target]: self.pb.create('contacts_company_roles',dict(company=company['id'],role='supplier',active=True))
        data=dict(self.billing.input,supplier_invoice_number='ACME-42',discrepancy_reason='Facture fournisseur manuelle contrôlée')
        status,original=self.billing.save(data,'supplier'); self.assertEqual(status,200,original)
        original=check_billing.SupplierBillingTests.attach(self.billing,original)
        status,original=self.billing.action(original); self.assertEqual(status,200,original)
        before=self.record('billing_supplier_invoices',original['id'])
        status,duplicate=self.billing.save(dict(data,company=self.target['id']),'supplier'); self.assertEqual(status,200,duplicate)
        body,preview=self.preview(); self.assertTrue(any('référence' in message for message in preview['blockers'])); self.assertEqual(self.apply(body,preview)[0],409)
        status,result=self.billing.action(duplicate,'cancel'); self.assertEqual(status,200,result)
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[],preview); self.assertEqual(self.apply(body,preview)[0],200)
        self.assertEqual(self.record('billing_supplier_invoices',original['id']),before)
        status,result=self.billing.save(dict(data,company=self.target['id']),'supplier'); self.assertEqual(status,409,result)

    def test_owner_failure_rolls_back_entire_merge(self):
        import sqlite3
        person=self.pb.create('contacts_people',dict(first_name='À conserver',company=self.source['id'],active=True))
        status,draft=self.billing.save(); self.assertEqual(status,200,draft)
        original_target=self.record('contacts_companies',self.target['id'])
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[],preview)
        with sqlite3.connect(self.pb.data / 'data.db') as connection:
            connection.execute("CREATE TRIGGER merge_fixture_failure BEFORE UPDATE OF company ON billing_invoices WHEN NEW.company != OLD.company BEGIN SELECT RAISE(ABORT, 'Disposable fixture failure'); END")
        self.assertNotEqual(self.apply(body,preview)[0],200)
        self.assertEqual(self.record('contacts_companies',self.target['id']),original_target)
        self.assertTrue(self.record('contacts_companies',self.source['id'])['active'])
        self.assertEqual(self.record('contacts_people',person['id'])['company'],self.source['id'])
        self.assertEqual(self.record('billing_invoices',draft['id'])['company'],self.source['id'])
        self.assertEqual(self.pb.request('GET','collections/core_audit/records?filter=action="merge"',token=self.pb.admin_token)[1]['totalItems'],0)

    def test_unknown_relation_is_blocking(self):
        status,result=self.pb.request('POST','collections',dict(name='future_company_dependencies',type='base',fields=[dict(name='company',type='relation',collectionId=self.source['collectionId'],maxSelect=1)]),self.pb.admin_token); self.assertEqual(status,200,result)
        self.pb.create('future_company_dependencies',dict(company=self.source['id']))
        body,preview=self.preview(); self.assertTrue(preview['blockers']); self.assertEqual(self.apply(body,preview)[0],409)

class CompanySupplierMergeTests(unittest.TestCase):
    call=ContactMergeTests.call
    selection=ContactMergeTests.selection
    record=ContactMergeTests.record
    preview=ContactMergeTests.preview
    apply=ContactMergeTests.apply
    def setUp(self):
        import check_purchasing
        self.purchase=check_purchasing.PurchasingTests('test_service_execution_policy_and_historical_purchases'); self.purchase.setUp()
        self.pb=self.purchase.pb; self.addCleanup(self.pb.close); self.user=self.purchase.user; self.token=self.purchase.token
        role=self.record('core_roles',self.user['role']); rights=list(set(role['permissions']+['contacts.write','contacts.merge']))
        status,result=self.pb.request('PATCH','collections/core_roles/records/'+role['id'],dict(permissions=rights),self.pb.admin_token); self.assertEqual(status,200,result)
        self.source=self.purchase.supplier; self.target=self.pb.create('contacts_companies',dict(name='Fournisseur conservé',active=True))
    def test_supplier_offers_drafts_frozen_orders_and_receipts(self):
        fixture=self.purchase
        orders=[]
        for index in range(2):
            status,request=fixture.save_request(); self.assertEqual(status,200,request)
            status,request=fixture.transition('requests',request); self.assertEqual(status,200,request)
            status,rows=fixture.order(request); self.assertEqual(status,200,rows); orders.append(rows['items'][0])
        status,orders[0]=fixture.transition('orders',orders[0]); self.assertEqual(status,200,orders[0])
        historical=self.record('purchasing_orders',orders[0]['id'])
        offers_before=self.pb.request('GET','collections/inventory_product_suppliers/records',token=self.pb.admin_token)[1]['items']
        prices_before=self.pb.request('GET','collections/inventory_supplier_price_history/records',token=self.pb.admin_token)[1]['items']
        body,preview=self.preview(); self.assertEqual(preview['blockers'],[],preview)
        status,result=self.apply(body,preview); self.assertEqual(status,200,result)
        self.assertEqual(self.record('purchasing_orders',orders[0]['id']),historical)
        self.assertEqual(self.record('purchasing_orders',orders[1]['id'])['supplier'],self.target['id'])
        for company in [self.source,self.target]:
            status,rows=self.pb.request('GET','horizon/purchasing/orders?supplier='+company['id'],token=self.token); self.assertEqual(status,200,rows); self.assertEqual(rows['totalItems'],2)
        rows=self.pb.request('GET','collections/inventory_product_suppliers/records',token=self.pb.admin_token)[1]['items']; self.assertTrue(rows); self.assertTrue(all(row['supplier']==self.target['id'] for row in rows if row['active']))
        for original in offers_before:
            current=self.record('inventory_product_suppliers',original['id'])
            self.assertEqual({k:v for k,v in current.items() if k not in ['supplier','updated']},{k:v for k,v in original.items() if k not in ['supplier','updated']})
        self.assertEqual(self.pb.request('GET','collections/inventory_supplier_price_history/records',token=self.pb.admin_token)[1]['items'],prices_before)
        status,result=fixture.transition('orders',orders[1]); self.assertEqual(status,409,result) # stale after reassignment
        status,current=self.pb.request('GET','horizon/purchasing/orders/'+orders[1]['id'],token=self.token); self.assertEqual(status,200,current)
        status,result=fixture.transition('orders',current); self.assertEqual(status,200,result)

if __name__=='__main__': unittest.main()

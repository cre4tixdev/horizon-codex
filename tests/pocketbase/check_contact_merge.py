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
        address=self.record('contacts_addresses',a['id']); self.assertEqual(address['company'],self.target['id']); self.assertFalse(address['is_primary'])
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
    def test_source_with_business_dependency_blocked_target_dependency_allowed(self):
        self.pb.create('accounting_third_party_accounts',dict(company=self.source['id'],type='customer',account_code='411TEST',active=True))
        body,preview=self.preview(); self.assertTrue(preview['blockers']); self.assertEqual(self.apply(body,preview)[0],409)
        body,preview=self.preview(source=self.target,target=self.source); self.assertEqual(preview['blockers'],[]); self.assertEqual(self.apply(body,preview)[0],200)
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
        body,preview=self.preview(); self.assertTrue(preview['blockers']); self.assertEqual(self.apply(body,preview)[0],409)
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
        body,preview=self.preview(source=self.target,target=third); self.assertTrue(preview['blockers']); self.assertEqual(self.apply(body,preview)[0],409)
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

if __name__=='__main__': unittest.main()

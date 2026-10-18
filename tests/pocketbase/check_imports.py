"""Import Contacts through private routes on disposable PocketBase only."""
import unittest
import uuid
from check_auth import LocalPocketBase

class ImportTests(unittest.TestCase):
    def setUp(self):
        self.pb=LocalPocketBase();self.addCleanup(self.pb.close);self.pb.start()
        self.role=self.pb.create('core_roles',dict(name='importer',label='Importeur',active=True,permissions=['contacts.read','contacts.write','contacts.import']))
        self.user=self.pb.create_user('importer@local.invalid',self.role['id'])
        self.token=self.pb.login(self.user['email'])[1]['token']
    def call(self,path,body=None,token=None):
        return self.pb.request('POST' if body is not None else 'GET','horizon/imports/'+path,body,token or self.token,extra_headers={'X-Horizon-Import-Response':'changes'} if path.endswith('/resolve') else None)
    def preview(self,headers,rows,kind='companies',mode='upsert',mapping=None,namespace='repertoire'):
        body=dict(type=kind,source='file',filename='contacts.csv',namespace=namespace,key=str(uuid.uuid4()),headers=headers,rows=rows,mapping=mapping or {key:i for i,key in enumerate(headers)},mode=mode)
        code,job=self.call('preview',body);self.assertEqual(code,200,job);return job
    def records(self,table):return self.pb.request('GET','collections/'+table+'/records?perPage=500',token=self.pb.admin_token)[1]['items']
    def apply(self,job):
        for _ in range(50):
            code,job=self.call('jobs/'+job['id']+'/apply',{});self.assertEqual(code,200,job)
            if job['status']=='completed':return job
        self.fail('Import never completed')
    def test_dry_run_apply_roles_address_audit_and_replay(self):
        headers=['external_id','name','siren','email','customer','supplier','line1','city','country']
        data=[['cvs','CVS Import','123456789','contact@example.invalid','oui','oui','1 rue Test','Paris','FR']]
        job=self.preview(headers,data);self.assertEqual(job['summary']['create'],1,job)
        self.assertEqual(self.records('contacts_companies'),[])
        result=self.apply(job);company=self.records('contacts_companies')[0]
        self.assertEqual(company['name'],'CVS Import');self.assertEqual(len(self.records('contacts_company_roles')),2)
        self.assertEqual(len(self.records('contacts_addresses')),1)
        self.assertTrue(any(a['user']==self.user['id'] and a['entity_id']==company['id'] for a in self.records('core_audit')))
        self.apply(result);self.assertEqual(len(self.records('contacts_companies')),1)
        again=self.preview(headers,data);self.assertEqual(again['summary']['skip'],1,again);self.apply(again)
        self.assertEqual(len(self.records('core_external_references')),1)
    def test_person_parent_update_blank_and_stale_preview(self):
        self.apply(self.preview(['external_id','name'],[['soc','Parent']]))
        person=self.preview(['external_id','last_name','first_name','email','company_external_id'],[['p1','Martin','Alice','alice@example.invalid','soc']],kind='people',namespace='people-export')
        self.assertEqual(person['summary']['create'],1,person);self.apply(person)
        row=self.records('contacts_people')[0];self.assertTrue(row['company'])
        update=self.preview(['external_id','last_name','phone','email'],[['p1','Martin','0123456789','']],kind='people',namespace='people-export')
        self.assertEqual(update['summary']['update'],1,update);self.apply(update)
        person=self.records('contacts_people')[0];self.assertEqual(person['email'],'alice@example.invalid');self.assertEqual(person['phone'],'0123456789')
        stale=self.preview(['external_id','last_name'],[['p1','Durand']],kind='people',namespace='people-export')
        self.pb.request('PATCH','collections/contacts_people/records/'+person['id'],dict(phone='0999999999'),self.pb.admin_token)
        self.assertEqual(self.call('jobs/'+stale['id']+'/apply',{})[0],409)
        self.assertEqual(self.records('contacts_people')[0]['last_name'],'Martin')
        self.assertEqual(self.call('jobs/'+stale['id'])[1]['status'],'blocked')
    def test_conflicts_errors_resolutions_no_name_merge(self):
        self.apply(self.preview(['name'],[['Homonyme']]))
        job=self.preview(['name'],[['Homonyme']],namespace='autre-fichier');self.assertEqual(job['summary']['conflict'],1,job)
        self.assertEqual(self.call('jobs/'+job['id']+'/apply',{})[0],400)
        code,job=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][0]['id'],resolution='skip'));self.assertEqual(code,200,job);self.apply(job)
        self.assertEqual(len(self.records('contacts_companies')),1)
        invalid=self.preview(['name','email'],[['Invalide','bad']]);self.assertEqual(invalid['summary']['error'],1,invalid)
        code,ignored=self.call('jobs/'+invalid['id']+'/resolve',dict(row=invalid['rows'][0]['id'],resolution='skip'));self.assertEqual(code,200,ignored);self.apply(ignored)
        missing=self.preview(['last_name','company_external_id'],[['Contact','missing']],kind='people');self.assertEqual(missing['summary']['error'],1)
    def test_native_email_and_url_validation_before_apply_and_legacy_preparation(self):
        import json
        for kind in ['companies','people']:
            label='name' if kind=='companies' else 'last_name'
            invalid=self.preview([label,'email'],[['Native validation','foo@bar..fr']],kind=kind)
            self.assertEqual(invalid['summary']['error'],1,invalid)
            self.assertIn('E-mail',invalid['rows'][0]['error'])
            code,fixed=self.call('jobs/'+invalid['id']+'/resolve',dict(row=invalid['rows'][0]['id'],resolution='',values=dict(email='correct-native@example.invalid')))
            self.assertEqual(code,200,fixed);self.assertEqual(fixed['summary']['error'],0)
            self.apply(fixed)
        invalid_url=self.preview(['name','website'],[['Invalid website','https://not a valid domain.fr']])
        self.assertEqual(invalid_url['summary']['error'],1);self.assertIn('Site web',invalid_url['rows'][0]['error'])
        # Simulate a persisted preparation made before the native validator was added.
        old=self.preview(['name','email'],[['Legacy valid','legacy@example.invalid'],['Legacy bad','was-valid@example.invalid']])
        row=old['rows'][1]
        stored=self.pb.request('GET','collections/core_import_rows/records/'+row['id'],token=self.pb.admin_token)[1]
        staged=stored['normalized_data'];staged=json.loads(staged) if isinstance(staged,str) else staged
        staged['input']['email']='foo@bar..fr'
        self.assertEqual(self.pb.request('PATCH','collections/core_import_rows/records/'+row['id'],dict(normalized_data=staged),self.pb.admin_token)[0],200)
        before_companies=self.records('contacts_companies');before_refs=self.records('core_external_references')
        code,refused=self.call('jobs/'+old['id']+'/apply',{})
        self.assertEqual(code,400,refused);self.assertIn('Ligne 2',refused['message']);self.assertIn('E-mail',refused['message'])
        current=self.call('jobs/'+old['id'])[1]
        self.assertEqual(current['status'],'preview');self.assertEqual(current['summary']['error'],1)
        self.assertIn('E-mail',current['rows'][1]['error'])
        self.assertEqual(self.records('contacts_companies'),before_companies);self.assertEqual(self.records('core_external_references'),before_refs)
        self.assertEqual(self.call('jobs/'+old['id']+'/resolve',dict(row=row['id'],resolution='',values=dict(email='legacy-fixed@example.invalid')))[0],200)
        self.apply(old);self.assertEqual(len(self.records('contacts_companies')),len(before_companies)+2)

    def test_legacy_partial_import_keeps_committed_batches_on_native_validation_failure(self):
        import json
        data=[[str(i),'Legacy batch '+str(i),'batch'+str(i)+'@example.invalid'] for i in range(30)]
        job=self.preview(['external_id','name','email'],data)
        code,partial=self.call('jobs/'+job['id']+'/apply',{});self.assertEqual(code,200,partial)
        self.assertEqual(partial['summary']['applied'],25)
        row=partial['rows'][26]
        stored=self.pb.request('GET','collections/core_import_rows/records/'+row['id'],token=self.pb.admin_token)[1]
        staged=stored['normalized_data'];staged=json.loads(staged) if isinstance(staged,str) else staged
        staged['input']['email']='foo@bar..fr'
        self.pb.request('PATCH','collections/core_import_rows/records/'+row['id'],dict(normalized_data=staged),self.pb.admin_token)
        code,error=self.call('jobs/'+job['id']+'/apply',{})
        self.assertEqual(code,400,error);self.assertIn('Ligne 27',error['message']);self.assertIn('nouvelle simulation',error['message'])
        blocked=self.call('jobs/'+job['id'])[1]
        self.assertEqual(blocked['status'],'blocked');self.assertEqual(blocked['summary']['applied'],25)
        self.assertEqual(len(self.records('contacts_companies')),25);self.assertEqual(len(self.records('core_external_references')),25)
        self.assertEqual(self.call('jobs/'+job['id']+'/discard',{})[0],200)
        replay=self.preview(['external_id','name','email'],data)
        self.apply(replay);self.assertEqual(len(self.records('contacts_companies')),30);self.assertEqual(len(self.records('core_external_references')),30)

    def test_recheck_stale_preview_keeps_choices_and_requires_new_confirmation(self):
        self.apply(self.preview(['external_id','name','email'],[['existing','Initial','initial@example.invalid']]))
        company=self.records('contacts_companies')[0]
        job=self.preview(['external_id','name','email'],[['existing','New','initial@example.invalid'],['ignored','Ignored','wrong']])
        self.assertEqual(self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][1]['id'],resolution='skip'))[0],200)
        self.pb.request('PATCH','collections/contacts_companies/records/'+company['id'],dict(phone='0123456789'),self.pb.admin_token)
        code,conflict=self.call('jobs/'+job['id']+'/apply',{})
        self.assertEqual(code,409,conflict);self.assertIn('Ligne 1',conflict['message']);self.assertIn('Téléphone',conflict['message'])
        blocked=self.call('jobs/'+job['id'])[1];self.assertEqual(blocked['error'],conflict['message'])
        code,fresh=self.call('jobs/'+job['id']+'/recheck',{})
        self.assertEqual(code,200,fresh);self.assertEqual(fresh['id'],job['id']);self.assertEqual(fresh['status'],'preview');self.assertEqual(fresh['error'],'')
        self.assertEqual(fresh['rows'][1]['resolution'],'skip');self.assertEqual(fresh['rows'][0]['before']['phone'],'0123456789')
        self.assertEqual(self.records('contacts_companies')[0]['name'],'Initial')
        self.apply(fresh);self.assertEqual(self.records('contacts_companies')[0]['name'],'New')
        self.assertEqual(self.call('jobs/'+job['id']+'/recheck',{})[0],409)

    def test_recheck_partial_copies_only_remaining_rows_and_is_idempotent(self):
        data=[[str(i),'Batch '+str(i),'recheck'+str(i)+'@example.invalid'] for i in range(30)]
        data[25][1]='Batch 0'
        job=self.preview(['external_id','name','email'],data)
        self.assertEqual(job['summary']['create'],29);self.assertEqual(job['summary']['conflict'],1)
        # Keep a manual correction and an explicit ignore in the remaining rows.
        self.assertEqual(self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][27]['id'],resolution='',values=dict(name='Corrected remaining')))[0],200)
        self.assertEqual(self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][28]['id'],resolution='skip'))[0],200)
        # Reproduce a persisted preparation created by the old, name-blind scanner.
        legacy=job['rows'][25]
        saved=self.pb.request('GET','collections/core_import_rows/records/'+legacy['id'],token=self.pb.admin_token)[1]['normalized_data']
        saved['plan'].update(status='create',match='Nouvelle fiche',candidates=[]);saved.pop('base',None)
        self.pb.request('PATCH','collections/core_import_rows/records/'+legacy['id'],dict(status='create',match_type='Nouvelle fiche',normalized_data=saved),self.pb.admin_token)
        code,partial=self.call('jobs/'+job['id']+'/apply',{});self.assertEqual(code,200,partial);self.assertEqual(partial['summary']['applied'],25)
        self.assertEqual(self.call('jobs/'+job['id']+'/recheck',{})[0],409)
        code,conflict=self.call('jobs/'+job['id']+'/apply',{})
        self.assertEqual(code,409,conflict);self.assertIn('Ligne 26',conflict['message']);self.assertIn('À résoudre',conflict['message'])
        original=self.call('jobs/'+job['id'])[1]
        companies=self.records('contacts_companies');refs=self.records('core_external_references')
        code,fresh=self.call('jobs/'+job['id']+'/recheck',{})
        self.assertEqual(code,200,fresh);self.assertNotEqual(fresh['id'],job['id']);self.assertEqual(fresh['status'],'preview')
        self.assertEqual(fresh['summary']['total'],5);self.assertEqual([r['number'] for r in fresh['rows']],list(range(26,31)))
        self.assertEqual(fresh['rows'][2]['data']['name'],'Corrected remaining');self.assertEqual(fresh['rows'][3]['resolution'],'skip')
        self.assertEqual(fresh['rows'][0]['status'],'conflict');self.assertTrue(fresh['rows'][0]['candidates'])
        self.assertEqual(self.call('jobs/'+job['id']+'/recheck',{})[1]['id'],fresh['id'])
        self.assertEqual(self.call('jobs/'+job['id'])[1],original)
        self.assertEqual(self.records('contacts_companies'),companies);self.assertEqual(self.records('core_external_references'),refs)
        # Confirmation stays blocked until the new correspondence is explicitly resolved.
        self.assertEqual(self.call('jobs/'+fresh['id']+'/apply',{})[0],400)
        self.assertEqual(self.call('jobs/'+fresh['id']+'/resolve',dict(row=fresh['rows'][0]['id'],resolution='create'))[0],200)
        self.apply(fresh);self.assertEqual(len(self.records('contacts_companies')),29);self.assertEqual(len(self.records('core_external_references')),29)
        other=self.pb.create_user('recheck-other@local.invalid',self.role['id']);token=self.pb.login(other['email'])[1]['token']
        self.assertEqual(self.call('jobs/'+job['id']+'/recheck',{},token)[0],404)
        self.pb.request('PATCH','collections/core_roles/records/'+self.role['id'],dict(permissions=['contacts.read','contacts.write']),self.pb.admin_token)
        self.assertEqual(self.call('jobs/'+job['id']+'/recheck',{})[0],403)

    def test_private_jobs_profiles_native_crud_and_revocation(self):
        job=self.preview(['name'],[['Privé']])
        other=self.pb.create_user('other-importer@local.invalid',self.role['id']);token=self.pb.login(other['email'])[1]['token']
        for path,body in [('jobs/'+job['id'],None),('jobs/'+job['id']+'/apply',{}),('jobs/'+job['id']+'/resolve',dict(row=job['rows'][0]['id'],resolution='skip'))]:self.assertEqual(self.call(path,body,token)[0],404)
        self.assertEqual(self.call('history',token=token)[1]['items'],[])
        for table in ['core_import_jobs','core_import_rows','core_import_profiles','core_external_references','settings_import_odoo']:
            self.assertEqual(self.pb.request('GET','collections/'+table+'/records',token=self.token)[0],403)
        profile=dict(name='Profil test',type='companies',headers=['name'],mapping=dict(name=0),mode='upsert')
        self.assertEqual(self.call('profiles',profile)[0],200);self.assertEqual(self.call('profiles',profile)[0],409)
        self.assertEqual(self.call('profiles',token=token)[1]['items'],[])
        self.pb.request('PATCH','collections/core_roles/records/'+self.role['id'],dict(permissions=['contacts.read','contacts.write']),self.pb.admin_token)
        self.assertEqual(self.call('jobs/'+job['id']+'/apply',{})[0],403)
    def test_batches_duplicates_modes_and_repeated_request(self):
        job=self.preview(['external_id','name'],[[str(i),'Société '+str(i)] for i in range(51)])
        code,partial=self.call('jobs/'+job['id']+'/apply',{});self.assertEqual(code,200,partial);self.assertEqual(partial['status'],'applying');self.assertEqual(partial['summary']['applied'],25)
        self.assertEqual(len(self.records('contacts_companies')),25)
        self.apply(partial);self.assertEqual(len(self.records('contacts_companies')),51)
        duplicate=self.preview(['external_id','name'],[['same','A'],['same','B']]);self.assertEqual(duplicate['summary']['conflict'],1,duplicate)
        update_only=self.preview(['name'],[['Absent']],mode='update');self.assertEqual(update_only['summary']['skip'],1);self.apply(update_only);self.assertEqual(len(self.records('contacts_companies')),51)

    def test_incremental_decisions_recheck_duplicates_and_keep_unrelated_snapshots(self):
        import time, json
        data=[['a','Premier','shared@example.invalid'],['b','Second','shared@example.invalid'],['c','Troisième','shared@example.invalid']]
        data += [[str(i),'Autre '+str(i),'unique'+str(i)+'@example.invalid'] for i in range(597)]
        job=self.preview(['external_id','name','email'],data)
        self.assertEqual(job['summary']['conflict'],2)
        unrelated=job['rows'][-1]['id']
        before=self.pb.request('GET','collections/core_import_rows/records/'+unrelated,token=self.pb.admin_token)[1]
        start=time.monotonic()
        code,patch=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][0]['id'],resolution='skip'))
        elapsed=time.monotonic()-start
        self.assertEqual(code,200,patch);self.assertTrue(patch['partial'])
        self.assertEqual(patch['summary']['total'],600);self.assertEqual(patch['summary']['conflict'],1)
        self.assertEqual({r['id'] for r in patch['rows']},{r['id'] for r in job['rows'][:2]})
        after=self.pb.request('GET','collections/core_import_rows/records/'+unrelated,token=self.pb.admin_token)[1]
        self.assertEqual(before,after)
        print('\n600-row ignore: %.3fs, %d response bytes, %d changed rows' % (elapsed,len(json.dumps(patch)),len(patch['rows'])))
        # Re-enable the first row: second becomes duplicate again; third stays blocked.
        code,restored=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][0]['id'],resolution=''))
        self.assertEqual(code,200,restored);self.assertEqual(restored['summary']['conflict'],2)
        self.assertEqual(len(restored['rows']),2)
        # Changing an identity frees only its first successor, preserving the chain.
        code,corrected=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][0]['id'],resolution='',values=dict(email='changed@example.invalid')))
        self.assertEqual(code,200,corrected);self.assertEqual(corrected['summary']['conflict'],1)
        code,last=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][1]['id'],resolution='skip'))
        self.assertEqual(code,200,last);self.assertEqual(last['summary']['conflict'],0)
        self.assertEqual(len(last['rows']),2)
        code,legacy=self.pb.request('POST','horizon/imports/jobs/'+job['id']+'/resolve',dict(row=job['rows'][1]['id'],resolution='skip'),self.token)
        self.assertEqual(code,200,legacy);self.assertNotIn('partial',legacy);self.assertEqual(len(legacy['rows']),600)
        current=self.call('jobs/'+job['id'])[1]
        self.assertEqual(len(current['rows']),600);self.assertEqual(current['summary']['create'],599)
        # Final validation still detects a target changed since the initial preview.
        self.apply(self.preview(['external_id','name'],[['existing','Initial']]))
        company=self.records('contacts_companies')[0]
        stale=self.preview(['external_id','name'],[['existing','New'],['other','Other']])
        self.pb.request('PATCH','collections/contacts_companies/records/'+company['id'],dict(phone='0123456789'),self.pb.admin_token)
        self.assertEqual(self.call('jobs/'+stale['id']+'/resolve',dict(row=stale['rows'][1]['id'],resolution='skip'))[0],200)
        self.assertEqual(self.call('jobs/'+stale['id']+'/apply',{})[0],409)

    def test_incremental_duplicate_restores_original_ambiguity(self):
        self.apply(self.preview(['name'],[['Homonyme']]))
        job=self.preview(['name'],[['Homonyme'],['Homonyme']],namespace='new-source')
        self.assertEqual(job['summary']['conflict'],2)
        code,patch=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][0]['id'],resolution='skip'))
        self.assertEqual(code,200,patch);self.assertEqual(patch['summary']['conflict'],1)
        second=next(r for r in patch['rows'] if r['number']==2)
        self.assertTrue(second['candidates']);self.assertNotIn('Doublon dans le fichier',second['match'])
        self.assertEqual(self.call('jobs/'+job['id']+'/apply',{})[0],400)

    def test_homonyms_at_line_614_are_flagged_before_apply_and_legacy_batch_recovers(self):
        import json
        data=[[str(i),'Large name '+str(i),'large-name-'+str(i)+'@example.invalid'] for i in range(640)]
        data[612][1]='Homonyme 614';data[613][1]='Homonyme 614'
        job=self.preview(['external_id','name','email'],data)
        self.assertEqual(job['summary']['conflict'],1);self.assertEqual(job['rows'][613]['status'],'conflict')
        self.assertIn('Nom identique dans le fichier',job['rows'][613]['match'])
        self.assertEqual(self.call('jobs/'+job['id']+'/apply',{})[0],400)
        self.assertEqual(self.records('contacts_companies'),[])
        # Ignoring the first homonym frees the other; automatic mode restores the warning.
        code,freed=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][612]['id'],resolution='skip'))
        self.assertEqual(code,200,freed);self.assertEqual(freed['summary']['conflict'],0);self.assertEqual(len(freed['rows']),2)
        code,again=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][612]['id'],resolution=''))
        self.assertEqual(code,200,again);self.assertEqual(again['summary']['conflict'],1)
        code,renamed=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][612]['id'],resolution='',values=dict(name='Different name')))
        self.assertEqual(code,200,renamed);self.assertEqual(renamed['summary']['conflict'],0);self.assertEqual(len(renamed['rows']),2)
        self.assertEqual(self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][612]['id'],resolution='',values=dict(name='Homonyme 614')))[1]['summary']['conflict'],1)
        # Simulate the old preparation where line 614 had been accepted as a creation.
        stored=self.pb.request('GET','collections/core_import_rows/records/'+job['rows'][613]['id'],token=self.pb.admin_token)[1]
        staged=stored['normalized_data'];staged=json.loads(staged) if isinstance(staged,str) else staged
        staged['plan'].update(status='create',match='Nouvelle fiche',candidates=[]);staged.pop('base',None)
        self.pb.request('PATCH','collections/core_import_rows/records/'+job['rows'][613]['id'],dict(status='create',match_type='Nouvelle fiche',normalized_data=staged),self.pb.admin_token)
        for _ in range(24):self.assertEqual(self.call('jobs/'+job['id']+'/apply',{})[0],200)
        code,error=self.call('jobs/'+job['id']+'/apply',{})
        self.assertEqual(code,400,error);self.assertIn('Ligne 614',error['message'])
        self.assertEqual(self.call('jobs/'+job['id'])[1]['summary']['applied'],600)
        code,recovery=self.call('jobs/'+job['id']+'/recheck',{})
        self.assertEqual(code,200,recovery);self.assertEqual(recovery['summary']['total'],40);self.assertEqual(recovery['summary']['conflict'],1)
        duplicate=next(r for r in recovery['rows'] if r['number']==614)
        self.assertIn('Nom identique dans le fichier',duplicate['match'])
        self.assertEqual(self.call('jobs/'+recovery['id']+'/resolve',dict(row=duplicate['id'],resolution='create'))[0],200)
        self.apply(recovery)
        self.assertEqual(self.pb.request('GET','collections/contacts_companies/records?perPage=1',token=self.pb.admin_token)[1]['totalItems'],640)
        self.assertEqual(self.pb.request('GET','collections/core_external_references/records?perPage=1',token=self.pb.admin_token)[1]['totalItems'],640)

    def test_person_name_conflicts_respect_company_and_explicit_create(self):
        a=self.pb.create('contacts_companies',dict(name='Company A',active=True))
        b=self.pb.create('contacts_companies',dict(name='Company B',active=True))
        # Resolve company by the existing name; no company is created by this person import.
        job=self.preview(['first_name','last_name','email','company_name'],[['Alice','Martin','a1@example.invalid','Company A'],['Alice','Martin','a2@example.invalid','Company A'],['Alice','Martin','a3@example.invalid','Company B']],kind='people')
        self.assertEqual(job['summary']['conflict'],1);self.assertEqual(job['rows'][1]['status'],'conflict');self.assertEqual(job['rows'][2]['status'],'create')
        code,fixed=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][1]['id'],resolution='create'))
        self.assertEqual(code,200,fixed);self.assertEqual(fixed['summary']['conflict'],0)
        self.apply(fixed);people=self.records('contacts_people')
        self.assertEqual(len(people),3);self.assertEqual(sum(p['company']==a['id'] for p in people),2);self.assertEqual(sum(p['company']==b['id'] for p in people),1)

    def test_explicit_distinct_name_does_not_bypass_strong_duplicates(self):
        job=self.preview(['external_id','name','email'],[['one','Same name','same@example.invalid'],['two','Same name','same@example.invalid']])
        self.assertIn('Doublon dans le fichier',job['rows'][1]['match'])
        code,forced=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][1]['id'],resolution='create'))
        self.assertEqual(code,200,forced);self.assertEqual(forced['summary']['conflict'],1)
        self.assertIn('Doublon dans le fichier',forced['rows'][0]['match'])
        self.assertEqual(self.call('jobs/'+job['id']+'/apply',{})[0],400)
        code,freed=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][0]['id'],resolution='skip'))
        self.assertEqual(code,200,freed);self.assertEqual(freed['summary']['conflict'],0)
        self.apply(freed);self.assertEqual(len(self.records('contacts_companies')),1)

    def test_updated_person_email_uses_preserved_company_for_duplicate_checks(self):
        self.pb.create('contacts_companies',dict(name='Preserved parent',active=True))
        self.apply(self.preview(['external_id','last_name','email','company_name'],[['p1','Original','old-person@example.invalid','Preserved parent']],kind='people',namespace='preserved-persons'))
        job=self.preview(['external_id','last_name','email','company_name'],[['p1','Original','new-person@example.invalid',''],['p2','Other','new-person@example.invalid','Preserved parent']],kind='people',namespace='preserved-persons')
        self.assertEqual(job['summary']['update'],1);self.assertEqual(job['summary']['conflict'],1)
        self.assertIn('Doublon dans le fichier',job['rows'][1]['match'])
        self.assertEqual(self.call('jobs/'+job['id']+'/apply',{})[0],400)
        self.assertEqual(self.records('contacts_people')[0]['email'],'old-person@example.invalid')

    def test_people_link_to_external_company_even_when_company_names_are_duplicated(self):
        self.apply(self.preview(['external_id','name'],[['2313','Diffuseur test'],['2339','Distributeur test']]))
        by_name={r['name']:r for r in self.records('contacts_companies')}
        duplicate=self.pb.create('contacts_companies',dict(name='Diffuseur test',active=True))
        data=[[str(500+i),'Contact fictif '+str(i),'diffuseur'+str(i)+'@example.invalid','2313','Diffuseur test'] for i in range(6)]
        data += [[str(600+i),'Distribution fictive '+str(i),'distribution'+str(i)+'@example.invalid','2339','Distributeur test'] for i in range(2)]
        job=self.preview(['external_id','last_name','email','company_external_id','company_name'],data,kind='people')
        self.assertEqual(job['summary']['create'],8)
        expected=by_name['Diffuseur test']['id'];other=by_name['Distributeur test']['id']
        self.assertTrue(all(r['data']['company']==expected for r in job['rows'][:6]))
        result=self.apply(job);self.assertEqual(result['summary']['create'],8)
        people=self.records('contacts_people')
        self.assertEqual(sum(r['company']==expected for r in people),6)
        self.assertEqual(sum(r['company']==other for r in people),2)
        self.assertEqual(sum(r['company']==duplicate['id'] for r in people),0)
        self.assertTrue(all(r['company'] for r in people))
        # Company details query is by ID, so a same-name second company has no contacts.
        for target,count in [(expected,6),(other,2),(duplicate['id'],0)]:
            code,page=self.pb.request('GET','collections/contacts_people/records?filter=company%3D%22'+target+'%22',token=self.token)
            self.assertEqual(code,200,page);self.assertEqual(page['totalItems'],count)

    def test_file_ids_are_isolated_between_operators(self):
        self.apply(self.preview(['external_id','name'],[['same-id','Société du premier fichier']]))
        other=self.pb.create_user('separate-importer@local.invalid',self.role['id']);token=self.pb.login(other['email'])[1]['token']
        body=dict(type='companies',source='file',filename='contacts.csv',namespace='repertoire',key=str(uuid.uuid4()),headers=['external_id','name'],rows=[['same-id','Autre source']],mapping=dict(external_id=0,name=1),mode='upsert')
        code,job=self.call('preview',body,token);self.assertEqual(code,200,job);self.assertEqual(job['summary']['create'],1,job);self.assertEqual(job['summary']['update'],0)
        code,job=self.call('jobs/'+job['id']+'/apply',{},token);self.assertEqual(code,200,job)
        self.assertEqual(len(self.records('contacts_companies')),2)

    def test_edit_invalid_row_and_manual_link(self):
        job=self.preview(['name','email'],[['Corriger','wrong']]);self.assertEqual(job['summary']['error'],1)
        code,fixed=self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][0]['id'],resolution='',values=dict(email='correct@example.invalid')))
        self.assertEqual(code,200,fixed);self.assertEqual(fixed['summary']['error'],0,fixed);self.apply(fixed)
        self.assertEqual(self.records('contacts_companies')[0]['email'],'correct@example.invalid')
        second=self.preview(['name','email'],[['Corriger','new@example.invalid']],namespace='another-file')
        self.assertEqual(second['summary']['conflict'],1,second)
        target=self.records('contacts_companies')[0]['id']
        code,linked=self.call('jobs/'+second['id']+'/resolve',dict(row=second['rows'][0]['id'],resolution='target:'+target))
        self.assertEqual(code,200,linked);self.assertEqual(linked['summary']['update'],1,linked);self.apply(linked)
        self.assertEqual(len(self.records('contacts_companies')),1)

    def test_bulk_decisions_and_preparation_deletion_are_private_and_preserve_history(self):
        job=self.preview(['name','email'],[['Lot '+str(i),'incorrect' if i==0 else 'lot'+str(i)+'@example.invalid'] for i in range(60)])
        code,ignored=self.call('jobs/'+job['id']+'/resolve-bulk',dict(filter='error',resolution='skip'));self.assertEqual(code,200,ignored)
        self.assertEqual(ignored['summary']['skip'],1);self.assertEqual(ignored['summary']['create'],59)
        code,automatic=self.call('jobs/'+job['id']+'/resolve-bulk',dict(filter='skip',resolution=''));self.assertEqual(code,200,automatic);self.assertEqual(automatic['summary']['error'],1)
        code,ignored=self.call('jobs/'+job['id']+'/resolve-bulk',dict(filter='all',resolution='skip'));self.assertEqual(code,200,ignored);self.assertEqual(ignored['summary']['skip'],60)
        other=self.pb.create_user('discard-other@local.invalid',self.role['id']);token=self.pb.login(other['email'])[1]['token']
        self.assertEqual(self.call('jobs/'+job['id']+'/discard',{},token)[0],404)
        self.assertEqual(self.call('jobs/'+job['id']+'/resolve-bulk',dict(filter='all',resolution=''),token)[0],404)
        self.assertEqual(self.call('jobs/'+job['id']+'/resolve-bulk',dict(filter='all',resolution='create'))[0],400)
        self.assertEqual(self.call('jobs/'+job['id']+'/discard',{})[0],200)
        self.assertEqual(self.call('jobs/'+job['id'])[0],404);self.assertEqual(self.records('core_import_rows'),[])
        self.assertEqual(self.records('contacts_companies'),[])
        history=self.preview(['external_id','name'],[['keep','Préserver']]);self.apply(history)
        self.assertEqual(self.call('jobs/'+history['id']+'/discard',{})[0],409)
        self.assertEqual(self.call('jobs/'+history['id']+'/resolve-bulk',dict(filter='all',resolution='skip'))[0],409)
        self.assertEqual(len(self.records('core_external_references')),1);self.assertEqual(len(self.records('contacts_companies')),1)
        partial=self.preview(['name'],[['Suite '+str(i)] for i in range(30)])
        self.assertEqual(self.call('jobs/'+partial['id']+'/apply',{})[0],200)
        self.assertEqual(self.call('jobs/'+partial['id']+'/discard',{})[0],200)
        self.pb.request('PATCH','collections/core_roles/records/'+self.role['id'],dict(permissions=['contacts.read','contacts.write']),self.pb.admin_token)
        self.assertEqual(self.call('jobs/'+partial['id']+'/discard',{})[0],403)

    def test_partial_imports_can_be_retired_without_losing_data_or_resuming(self):
        for state in ['applying','blocked']:
            job=self.preview(['external_id','name'],[[state+str(i),state+' retire '+str(i)] for i in range(30)],namespace='retire-'+state)
            code,partial=self.call('jobs/'+job['id']+'/apply',{});self.assertEqual(code,200,partial);self.assertEqual(partial['summary']['applied'],25)
            if state=='blocked':self.pb.request('PATCH','collections/core_import_jobs/records/'+job['id'],dict(status='blocked'),self.pb.admin_token)
            before_rows=self.records('core_import_rows');before_companies=self.records('contacts_companies');before_refs=self.records('core_external_references')
            other=self.pb.create_user('retire-'+state+'@local.invalid',self.role['id']);other_token=self.pb.login(other['email'])[1]['token']
            self.assertEqual(self.call('jobs/'+job['id']+'/discard',{},other_token)[0],404)
            code,result=self.call('jobs/'+job['id']+'/discard',{})
            self.assertEqual(code,200,result);self.assertEqual(result,dict(deleted=False,archived=True))
            saved=self.pb.request('GET','collections/core_import_jobs/records/'+job['id'],token=self.pb.admin_token)[1]
            self.assertEqual(saved['status'],'cancelled');self.assertTrue(saved['archived_at'])
            self.assertEqual(self.records('core_import_rows'),before_rows);self.assertEqual(self.records('contacts_companies'),before_companies);self.assertEqual(self.records('core_external_references'),before_refs)
            self.assertNotIn(job['id'],[r['id'] for r in self.call('history')[1]['items']])
            self.assertEqual(self.call('jobs/'+job['id']+'/apply',{})[0],409)
            self.assertEqual(self.call('jobs/'+job['id']+'/recheck',{})[0],409)
            self.assertEqual(self.call('jobs/'+job['id']+'/resolve',dict(row=job['rows'][-1]['id'],resolution='skip'))[0],409)
            self.assertEqual(self.call('jobs/'+job['id'])[1]['status'],'cancelled')
            self.assertEqual(self.call('jobs/'+job['id']+'/discard',{})[1],result)
            self.assertEqual(self.pb.request('GET','collections/core_import_jobs/records/'+job['id'],token=self.pb.admin_token)[1]['archived_at'],saved['archived_at'])
        audits=[r for r in self.records('core_audit') if r['entity']=='core_import_jobs' and r['action']=='archive']
        self.assertEqual(len(audits),2)
        completed=self.apply(self.preview(['name'],[['Completed stays visible']]))
        self.assertEqual(self.call('jobs/'+completed['id']+'/discard',{})[0],409)
        self.assertIn(completed['id'],[r['id'] for r in self.call('history')[1]['items']])

    def test_base64_images_become_protected_files_and_reimport_is_unchanged(self):
        import base64
        image='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII='
        job=self.preview(['external_id','name','image_base64'],[['img1','Logo importé',image]])
        self.assertEqual(job['summary']['create'],1,job);self.apply(job)
        company=self.records('contacts_companies')[0];self.assertTrue(company['logo'])
        saved=self.pb.data/'storage'/company['collectionId']/company['id']/company['logo'];self.assertEqual(saved.read_bytes(),base64.b64decode(image))
        self.assertNotEqual(self.pb.request('GET','files/'+company['collectionId']+'/'+company['id']+'/'+company['logo'])[0],200)
        again=self.preview(['external_id','name','image_base64'],[['img1','Logo importé','data:image/png;base64,'+image]])
        self.assertEqual(again['summary']['skip'],1,again);self.apply(again)
        self.assertEqual(self.records('contacts_companies')[0]['logo'],company['logo'])
        person=self.preview(['external_id','last_name','image_base64'],[['img2','Photo importée',image]],kind='people');self.apply(person)
        self.assertTrue(self.records('contacts_people')[0]['avatar'])
        bad=self.preview(['name','image_base64'],[['Mauvais','PHN2Zz48L3N2Zz4=']]);self.assertEqual(bad['summary']['error'],1)
        self.assertIn('Image invalide',bad['rows'][0]['error'])

    def test_odoo_readonly_encrypted_config_partner_and_country_mapping(self):
        import json, threading, sqlite3
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
        calls=[];state={'redirect':False,'large':False,'fallback':False}
        fields=['image_1920','image_128','image_256','id','name','email','phone','mobile','website','vat','street','street2','zip','city','country_id','parent_id','function','customer_rank','supplier_rank','l10n_fr_siren','l10n_fr_siret']
        class Handler(BaseHTTPRequestHandler):
            def log_message(self,*args):pass
            def do_GET(self):
                calls.append((self.path,{},self.headers.get('Authorization')));self.send_response(200);self.end_headers();self.wfile.write(b'{}')
            def do_POST(self):
                body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                calls.append((self.path,body,self.headers.get('Authorization')))
                if state['redirect']:
                    self.send_response(302);self.send_header('Location',f'http://localhost:{self.server.server_port}/trap');self.end_headers();return
                if self.path.endswith('/fields_get'):result={f:dict(type='char',string=f) for f in fields}
                elif self.path.endswith('/search_count'):result=1201 if state['large'] else 1
                elif self.path=='/json/2/res.country/search_read':result=[dict(id=33,code='FR')]
                elif self.path=='/json/2/res.partner/search_read' and not any(d[0]=='is_company' for d in body['domain']):
                    result=[dict(id=41,image_1920='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII=')] if state['fallback'] else []
                else:
                    person=any(d[0]=='is_company' and d[2] is False for d in body['domain'])
                    result=[dict(id=52,name='Camille Import',email='camille@example.invalid',parent_id=[41,'Odoo Société'],function='Achats')] if person else [dict(id=41,name='Odoo Société',image_256='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII=',email='odoo@example.invalid',customer_rank=1,supplier_rank=1,street='1 rue Odoo',city='Paris',country_id=[33,'France'])]
                if state['fallback'] and self.path=='/json/2/res.partner/search_read' and any(d[0]=='is_company' for d in body['domain']):
                    for record in result:record['image_256']=False
                if state['large'] and self.path=='/json/2/res.partner/search_read' and any(d[0]=='is_company' for d in body['domain']):
                    after=next(d[2] for d in body['domain'] if d[0]=='id')
                    result=[dict(id=i,name='Chargement '+str(i)) for i in range(after+1,min(after+202,1202))]
                self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(json.dumps(result).encode())
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();self.addCleanup(server.server_close);self.addCleanup(server.shutdown)
        self.pb.process.terminate();self.pb.process.wait(timeout=10)
        self.pb.environment.update(HORIZON_TEST_MODE='1',HORIZON_IMPORT_ENCRYPTION_KEY='0123456789abcdef0123456789abcdef',HORIZON_ODOO_TEST_ORIGIN=f'http://127.0.0.1:{server.server_port}')
        self.pb.launch_and_authenticate(self.pb.args)
        role=self.pb.create('core_roles',dict(name='import_settings',label='Import Settings',active=True,permissions=['contacts.read','contacts.write','contacts.import','settings.references']))
        admin=self.pb.create_user('import-settings@local.invalid',role['id'],'superuser');token=self.pb.login(admin['email'])[1]['token']
        config=dict(base_url='https://cvs-sas.odoo.com',database='cvs-sas',api_key='fictional-odoo-key')
        self.assertEqual(self.call('odoo',config)[0],403)
        code,configured=self.call('odoo',config,token);self.assertEqual(code,200,configured);self.assertTrue(configured['configured']);self.assertNotIn('fictional-odoo-key',json.dumps(configured))
        with sqlite3.connect(self.pb.data/'data.db') as db:
            cipher=db.execute('SELECT api_key_cipher FROM settings_import_odoo').fetchone()[0];self.assertNotIn('fictional-odoo-key',cipher)
        self.assertEqual(self.call('odoo',{**config,'base_url':'http://127.0.0.1:1234'},token)[0],400)
        code,missing_data=self.call('odoo/read',dict(type='people',after_id=0,query='',since=''));self.assertEqual(code,200,missing_data)
        missing_body=dict(type='people',source='odoo',filename='Contact avant société',namespace=missing_data['namespace'],key=str(uuid.uuid4()),headers=missing_data['headers'],rows=missing_data['rows'],mapping={key:i for i,key in enumerate(missing_data['headers'])},mode='upsert')
        code,missing_job=self.call('preview',missing_body);self.assertEqual(code,200,missing_job)
        self.assertEqual(missing_job['summary']['error'],1)
        self.assertIn('Odoo Société',missing_job['rows'][0]['error']);self.assertIn('41',missing_job['rows'][0]['error'])
        self.assertEqual(self.call('jobs/'+missing_job['id']+'/apply',{})[0],400)
        for kind in ['companies','people']:
            code,data=self.call('odoo/read',dict(type=kind,after_id=0,query='',since=''));self.assertEqual(code,200,data)
            body=dict(type=kind,source='odoo',filename='Odoo',namespace=data['namespace'],key=str(uuid.uuid4()),headers=data['headers'],rows=data['rows'],mapping={key:i for i,key in enumerate(data['headers'])},mode='upsert')
            code,job=self.call('preview',body);self.assertEqual(code,200,job);self.assertEqual(job['summary']['create'],1,job);self.apply(job)
        self.assertEqual(len(self.records('contacts_people')),1);self.assertEqual(self.records('contacts_people')[0]['company'],self.records('contacts_companies')[0]['id'])
        self.assertEqual(self.records('contacts_addresses')[0]['country'],'FR');self.assertTrue(self.records('contacts_companies')[0]['logo'])
        person=self.records('contacts_people')[0];self.assertEqual(person['last_name'],'Camille Import')
        self.assertNotEqual(person['id'],'52')
        state['fallback']=True
        code,fallback=self.call('odoo/read',dict(type='companies',after_id=0,query='',since=''));self.assertEqual(code,200,fallback)
        self.assertTrue(fallback['rows'][0][fallback['headers'].index('image_base64')])
        self.assertEqual(fallback['image_fields'],['image_256','image_128','image_1920'])
        self.assertTrue(all(body.get('context')=={'bin_size':False} for path,body,_ in calls if path=='/json/2/res.partner/search_read'))
        state['fallback']=False
        state['large']=True;loaded=[];cursor=0
        while True:
            code,data=self.call('odoo/read',dict(type='companies',after_id=cursor,query='',since=''))
            self.assertEqual(code,200,data);self.assertEqual(data['total'],1201)
            loaded.extend(data['rows']);cursor=data['after_id']
            if not data['has_more']:break
        self.assertEqual(len(loaded),1201)
        body=dict(type='companies',source='odoo',filename='Odoo complet',namespace=data['namespace'],key=str(uuid.uuid4()),headers=data['headers'],rows=loaded,mapping={key:i for i,key in enumerate(data['headers'])},mode='upsert')
        code,large=self.call('preview',body);self.assertEqual(code,200,large)
        self.assertEqual(large['summary']['total'],1201);self.assertEqual(len(large['rows']),1201)
        state['large']=False

        self.assertTrue(all(path.endswith('/search_read') or path.endswith('/fields_get') or path.endswith('/search_count') for path,_,_ in calls));self.assertTrue(all(auth=='bearer fictional-odoo-key' for _,_,auth in calls))
        self.assertEqual(self.call('odoo/read',dict(type='companies',after_id=0,query='',since='',method='unlink'))[0],400)
        state['redirect']=True;before_calls=len(calls)
        self.assertEqual(self.call('odoo/read',dict(type='companies',after_id=0,query='',since=''))[0],400)
        self.assertEqual(len(calls),before_calls+2);self.assertIsNone(next(auth for path,_,auth in calls if path=='/trap'))

class ImportUpgradeTests(unittest.TestCase):
    def test_archive_upgrade_preserves_partial_jobs_and_is_repeatable(self):
        import shutil, subprocess
        from pathlib import Path
        from check_auth import ROOT
        pb=LocalPocketBase();self.addCleanup(pb.close)
        old=Path(pb.temp.name)/'before_archive';old.mkdir()
        for source in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if source.name<'1791840027':shutil.copy2(source,old/source.name)
        pb.args=[('--migrationsDir='+str(old)) if arg.startswith('--migrationsDir=') else arg for arg in pb.args];pb.start()
        user=pb.create_user('archive-upgrade@local.invalid',pb.role['id'])
        job=pb.create('core_import_jobs',dict(type='companies',source='file',filename='existing.csv',namespace='existing',creation_key='existing-archive-test',status='applying',mode='upsert',created_by=user['id'],mapping=dict(name=0),summary=dict(total=30,applied=25)))
        row=pb.create('core_import_rows',dict(job=job['id'],row_number=1,source_key='one',status='applied',normalized_data=dict(input=dict(name='Already imported'))))
        pb.process.terminate();pb.process.wait(timeout=10)
        pb.args=[('--migrationsDir='+str(ROOT/'pocketbase/pb_migrations')) if arg.startswith('--migrationsDir=') else arg for arg in pb.args]
        for _ in range(2):subprocess.run(pb.args+['migrate','up'],check=True,stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        saved=pb.request('GET','collections/core_import_jobs/records/'+job['id'],token=pb.admin_token)[1]
        self.assertEqual(saved['status'],'applying');self.assertEqual(saved['summary'],job['summary']);self.assertEqual(saved['archived_at'],'')
        self.assertEqual(pb.request('GET','collections/core_import_rows/records/'+row['id'],token=pb.admin_token)[1],row)

    def test_upgrade_preserves_contacts_and_only_grants_existing_admins(self):
        import shutil, subprocess
        from pathlib import Path
        from check_auth import ROOT
        pb=LocalPocketBase();self.addCleanup(pb.close)
        old=Path(pb.temp.name)/'old_migrations';old.mkdir()
        for source in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if source.name<'1791840026':shutil.copy2(source,old/source.name)
        pb.args=[('--migrationsDir='+str(old)) if arg.startswith('--migrationsDir=') else arg for arg in pb.args];pb.start()
        role=pb.create('core_roles',dict(name='previous_admin',label='Previous admin',active=True,permissions=['contacts.read','contacts.write','settings.references']))
        pb.create_user('previous-admin@local.invalid',role['id'],'admin')
        company=pb.create('contacts_companies',dict(name='Société conservée',active=True))
        pb.process.terminate();pb.process.wait(timeout=10)
        pb.args=[('--migrationsDir='+str(ROOT/'pocketbase/pb_migrations')) if arg.startswith('--migrationsDir=') else arg for arg in pb.args]
        for _ in range(2):subprocess.run(pb.args+['migrate','up'],check=True,stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        self.assertEqual(pb.request('GET','collections/contacts_companies/records/'+company['id'],token=pb.admin_token)[1]['name'],company['name'])
        self.assertIn('contacts.import',pb.request('GET','collections/core_roles/records/'+role['id'],token=pb.admin_token)[1]['permissions'])
        self.assertEqual(pb.request('GET','collections/core_roles/records/'+pb.role['id'],token=pb.admin_token)[1]['permissions'],['contacts.read'])
        self.assertEqual(pb.request('GET','collections/core_import_jobs/records',token=pb.admin_token)[1]['totalItems'],0)

if __name__=='__main__':unittest.main()

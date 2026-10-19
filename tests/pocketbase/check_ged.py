"""GED: real disposable PocketBase, private files, versions and intersecting ACLs."""
import json
import io
import zipfile
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode
from check_auth import LocalPocketBase

PDF = b'%PDF-1.4\nGED test\n%%EOF'
class GedTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start(); self.addCleanup(self.pb.close)
        self.people = {}
        for who, actions in [('writer',['read','write']),('reader',['read']),('manager',['read','write','manage','settings']),('none',[])]:
            role = self.pb.create('core_roles',dict(name='ged_'+who,label=who,active=True,permissions=['documents.'+a for a in actions]+(['settings.references'] if who=='manager' else [])+['contacts.read']))
            user = self.pb.create_user(who+'-ged@local.invalid',role['id'],'admin' if who=='manager' else None)
            self.people[who] = dict(user=user,token=self.pb.login(user['email'])[1]['token'])
        self.token=self.people['writer']['token']
        self.input=dict(name='',space='internal',folder='',category='',tags=['Technique'],description='Notice produit',visibility='team',readers=[],links=[])
    def call(self,method,path,body=None,who='writer'):
        return self.pb.request(method,'horizon/ged/'+path,body,self.people[who]['token'])
    def multipart(self,path,fields,files,who='writer'):
        boundary='horizon-ged-fixture'
        parts=[f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k,v in fields.items()]
        for name,content,mime in files:
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n'.encode()+content+b'\r\n')
        parts.append(f'--{boundary}--\r\n'.encode())
        request=Request(self.pb.url+'/api/horizon/ged/'+path,data=b''.join(parts),headers={'Authorization':self.people[who]['token'],'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
        try:
            with urlopen(request) as r:return r.status,json.load(r)
        except HTTPError as r:
            data=json.load(r);r.close();return r.code,data
    def upload(self,**extra):
        code,result=self.multipart('upload',{'input':json.dumps(dict(self.input,**extra))},[('notice.pdf',PDF,'application/pdf')]);self.assertEqual(code,200,result);return result['items'][0]
    def test_upload_versions_archive_private_download_and_immutability(self):
        r=self.upload();self.assertEqual(r['current']['number'],1);self.assertEqual(r['current']['size'],len(PDF))
        file='files/'+r['id']+'/versions/'+r['current']['id']+'/file'
        request=Request(self.pb.url+'/api/horizon/ged/'+file,headers={'Authorization':self.people['reader']['token']})
        with urlopen(request) as response:self.assertEqual(response.read(),PDF);self.assertEqual(response.headers['Cache-Control'],'no-store')
        self.assertEqual(self.call('GET','files/'+r['id'],who='none')[0],403)
        self.assertEqual(self.call('POST','files/'+r['id']+'/save',dict(updated=r['updated'],input=dict(self.input,name='Pas mon document')),who='reader')[0],403)
        code,current=self.multipart('files/'+r['id']+'/version',{'updated':r['updated'],'note':'Plan corrigé'},[('correction.pdf',PDF+b'\nversion2','application/pdf')]);self.assertEqual(code,200,current)
        self.assertEqual([v['number'] for v in current['versions']],[2,1])
        self.assertEqual(self.multipart('files/'+r['id']+'/version',{'updated':r['updated'],'note':'Ancien formulaire'},[('stale.pdf',PDF,'application/pdf')])[0],409)
        self.assertEqual(self.pb.request('PATCH','collections/documents_file_versions/records/'+r['current']['id'],dict(note='Corruption'),self.pb.admin_token)[0],400)
        self.assertEqual(self.pb.request('DELETE','collections/documents_file_versions/records/'+r['current']['id'],token=self.pb.admin_token)[0],400)
        self.assertEqual(self.pb.request('GET','collections/documents_file_versions/records/'+r['current']['id'],token=self.token)[0],403)
        code,archived=self.call('POST','files/'+r['id']+'/archive',dict(updated=current['updated'],archived=True));self.assertEqual(code,200,archived)
        self.assertEqual(self.call('GET','files')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','files?state=archived')[1]['totalItems'],1)
        self.assertEqual(self.multipart('files/'+r['id']+'/version',{'updated':archived['updated'],'note':'Interdit'},[('a.pdf',PDF,'application/pdf')])[0],400)
        with urlopen(request) as response:self.assertEqual(response.read(),PDF)
    def test_acl_parent_source_intersection_and_filtered_counts(self):
        owner=self.people['writer']['user']['id'];reader=self.people['reader']['user']['id']
        code,folder=self.call('POST','folders',dict(name='Privé',space='internal',parent='',visibility='restricted',readers=[],active=True));self.assertEqual(code,200,folder)
        r=self.upload(folder=folder['id'])
        self.assertEqual(self.call('GET','files',who='reader')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','choices',who='reader')[1]['folders'],[])
        self.assertEqual(self.call('GET','files/'+r['id'],who='manager')[0],403)
        self.assertEqual(self.call('GET','files/'+r['id']+'/versions/'+r['current']['id']+'/file',who='reader')[0],403)
        self.assertEqual(self.call('POST','folders',dict(id=folder['id'],updated=folder['updated'],name='Privé',space='internal',parent='',visibility='restricted',readers=[],active=False))[0],409)
        company=self.pb.create('contacts_companies',dict(name='Client confidentiel',active=True))
        linked=self.upload(links=[dict(entity='contacts_companies',id=company['id'])],visibility='restricted',readers=[reader])
        self.assertEqual(self.call('GET','files/'+linked['id'],who='reader')[0],200)
        self.pb.request('PATCH','collections/contacts_companies',dict(viewRule='@request.auth.id = "'+owner+'"'),self.pb.admin_token)
        self.assertEqual(self.call('GET','files/'+linked['id'],who='reader')[0],403)
        self.assertEqual(self.call('GET','files?q=confidentiel',who='reader')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','files',who='reader')[1]['groups'],{})
        code,feed=self.pb.request('GET','horizon/activity/feed?module=documents',token=self.people['reader']['token']);self.assertEqual(code,200,feed);self.assertEqual(feed['totalItems'],0)
        code,saved=self.call('POST','files/'+linked['id']+'/save',dict(updated=linked['updated'],input=dict(self.input,name='Liens corrigés',visibility='restricted',readers=[reader],links=[])));self.assertEqual(code,200,saved)
        audit=self.pb.request('GET','collections/core_audit/records?'+urlencode({'filter':'entity_id = "'+linked['id']+'"','sort':'-created,-id'}),token=self.pb.admin_token)[1]['items'][0]
        self.assertEqual(audit['before']['links'][0]['id'],company['id']);self.assertEqual(audit['after']['links'],[])

    def test_multiple_upload_metadata_taxonomy_search_and_invalid_input(self):
        code,category=self.call('POST','categories',dict(name='Documentation',active=True),who='manager');self.assertEqual(code,200,category)
        self.assertEqual(self.call('POST','categories',dict(name='Interdit',active=True))[0],403)
        code,result=self.multipart('upload',{'input':json.dumps(dict(self.input,category=category['id']))},[('one.pdf',PDF,'application/pdf'),('two.txt',b'Notice technique','text/plain')]);self.assertEqual(code,200,result);self.assertEqual(len(result['items']),2)
        first=result['items'][0]
        self.assertEqual(self.call('GET','files?category='+category['id']+'&kind=text&group=category')[1]['groups'],{category['id']:1})
        self.assertEqual(self.call('GET','files?q=Technique')[1]['totalItems'],2)
        self.assertEqual(self.call('GET','files?group=affair')[1]['groups'],{'affair:none':2})
        code,saved=self.call('POST','files/'+first['id']+'/save',dict(updated=first['updated'],input=dict(self.input,name='Document renommé',category=category['id'])));self.assertEqual(code,200,saved);self.assertEqual(saved['current']['id'],first['current']['id'])
        self.assertEqual(self.call('POST','files/'+first['id']+'/save',dict(updated=saved['updated'],input=dict(self.input,name='Intrusion',locked=True)))[0],400)
        self.assertEqual(self.multipart('upload',{'input':json.dumps(self.input)},[('danger.html',b'<script>alert(1)</script>','text/html')])[0],400)
        for q in [dict(space='invalid'),dict(page=0),dict(sort='password'),dict(kind='executable'),dict(state='all')]:self.assertEqual(self.call('GET','files?'+urlencode(q))[0],400,q)
        self.assertEqual(self.pb.request('GET','horizon/ged/files')[0],401)
        buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as archive:
            archive.writestr('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
            archive.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Horizon</w:t></w:r></w:p></w:body></w:document>')
        code,office=self.multipart('upload',{'input':json.dumps(self.input)},[('notice.docx',buffer.getvalue(),'application/vnd.openxmlformats-officedocument.wordprocessingml.document')])
        self.assertEqual(code,200,office)
        self.assertEqual(self.call('GET','files?kind=office')[1]['totalItems'],1)



    def test_business_attachments_search_and_source_revocation(self):
        role=self.people['writer']['user']['role']
        code,updated=self.pb.request('PATCH','collections/core_roles/records/'+role,dict(permissions=['documents.read','documents.write','contacts.read','contacts.write']),self.pb.admin_token);self.assertEqual(code,200,updated)
        company=self.pb.create('contacts_companies',dict(name='Client réseau Étoile',active=True))
        boundary='ged-business-attachment'
        fields=dict(source_module='contacts',source_entity='contacts_companies',source_record_id=company['id'],type='note',body='Pièce client')
        parts=[f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode() for key,value in fields.items()]
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="Plan_reseau-final.pdf"\r\nContent-Type: application/pdf\r\n\r\n'.encode()+PDF+f'\r\n--{boundary}--\r\n'.encode())
        req=Request(self.pb.url+'/api/collections/core_activity_events/records',data=b''.join(parts),headers=dict(Authorization=self.token,**{'Content-Type':'multipart/form-data; boundary='+boundary}),method='POST')
        try:
            with urlopen(req) as response:event=json.load(response)
        except HTTPError as error:
            self.fail(str(error.code)+': '+error.read().decode())
        code,result=self.call('GET','files?'+urlencode(dict(space='customers',context_id=company['id'],q='PLAN reseau final etoile')),who='reader');self.assertEqual(code,200,result);self.assertEqual(result['totalItems'],1)
        row=result['items'][0];self.assertTrue(row['origin']);self.assertTrue(row['locked']);self.assertEqual(row['space'],'customers')
        self.assertEqual(self.call('GET','files?space=affairs',who='reader')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','files?space=customers&context_id='+company['id']+'&group=company',who='reader')[1]['groups'],{company['id']:1})
        self.assertEqual(self.call('GET','files/'+row['id'],who='reader')[0],200)
        path='files/'+row['id']+'/versions/'+row['current']['id']+'/file'
        with urlopen(Request(self.pb.url+'/api/horizon/ged/'+path,headers={'Authorization':self.people['reader']['token']})) as response:self.assertEqual(response.read(),PDF)
        self.assertEqual(self.call('GET',path.replace(row['current']['id'],'0'*64),who='reader')[0],404)
        self.assertEqual(self.call('POST','files/'+row['id']+'/archive',dict(updated=row['updated'],archived=True))[0],400)
        self.assertEqual(self.pb.request('GET','collections/documents_files/records',token=self.pb.admin_token)[1]['totalItems'],0)
        self.pb.request('PATCH','collections/contacts_companies',dict(viewRule='@request.auth.id = "'+self.people['writer']['user']['id']+'"'),self.pb.admin_token)
        self.assertEqual(self.call('GET','files',who='reader')[1]['totalItems'],0)
        self.assertEqual(self.call('GET',path,who='reader')[0],403)
        self.assertEqual(self.call('GET','files/'+row['id'],who='reader')[0],403)
        self.assertEqual(self.pb.request('GET','collections/core_activity_events/records/'+event['id'],token=self.pb.admin_token)[1]['attachments'],event['attachments'])

    def test_idle_and_selected_client_never_scan_unrelated_documents(self):
        import sqlite3,time
        role=self.people['writer']['user']['role']
        self.pb.request('PATCH','collections/core_roles/records/'+role,dict(permissions=['documents.read','documents.write','contacts.read','contacts.write']),self.pb.admin_token)
        a=self.pb.create('contacts_companies',dict(name='Client choisi',active=True));b=self.pb.create('contacts_companies',dict(name='Autre dossier volumineux',active=True))
        manual=self.upload(links=[dict(entity='contacts_companies',id=a['id'])])
        # Pure test data: 1100 unrelated protected-file references, never downloaded.
        with sqlite3.connect(self.pb.data/'data.db') as db:
            db.execute("""WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<1100)
              INSERT INTO core_activity_events (id,source_module,source_entity,source_record_id,type,body,attachments,metadata,created)
              SELECT printf('%015d',x),'contacts','contacts_companies',?,'document','Pièce hors sélection','["old.pdf"]','{}','2026-10-17 00:00:00.000Z' FROM n""",(b['id'],))
        self.assertEqual(self.call('GET','files?space=affairs')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','files?space=all')[1]['totalItems'],0)
        with sqlite3.connect(self.pb.data/'data.db') as db:
            plan=db.execute('EXPLAIN QUERY PLAN SELECT document FROM documents_links WHERE source_entity = ? AND source_record_id = ?',('contacts_companies',a['id'])).fetchall()
            self.assertTrue(any('idx_ged_context_documents_links' in str(row) for row in plan),plan)
        started=time.perf_counter();code,selected=self.call('GET','files?space=customers&context_id='+a['id']);elapsed=time.perf_counter()-started
        self.assertEqual(code,200,selected);self.assertEqual([r['id'] for r in selected['items']],[manual['id']])
        print(f'GED client choisi / 1100 références hors contexte : {elapsed*1000:.1f} ms',flush=True)
        self.assertEqual(self.call('GET','files?space=customers&context_id=invalid')[0],400)
        code,context=self.call('GET','context?entity=contacts_companies&id='+a['id']);self.assertEqual(code,200,context);self.assertEqual(context['label'],a['name'])
        self.pb.request('PATCH','collections/contacts_companies',dict(viewRule='@request.auth.id = "'+self.people['writer']['user']['id']+'"'),self.pb.admin_token)
        self.assertEqual(self.call('GET','files?space=customers&context_id='+a['id'],who='reader')[0],403)
        self.assertEqual(self.call('GET','context?entity=contacts_companies&id='+a['id'],who='reader')[0],403)

    def test_search_category_folder_accents_and_all_spaces(self):
        code,cat=self.call('POST','categories',dict(name='Études techniques',active=True),who='manager');self.assertEqual(code,200,cat)
        code,folder=self.call('POST','folders',dict(name='Plans été',space='internal',parent='',visibility='team',readers=[],active=True));self.assertEqual(code,200,folder)
        self.upload(name='Fiche-réseau',space='internal',folder=folder['id'],category=cat['id'])
        code,rows=self.call('GET','files?'+urlencode(dict(q='fiche RESEAU ete etudes')));self.assertEqual(code,200,rows);self.assertEqual(rows['totalItems'],1)
        self.assertEqual(self.call('GET','files?space=affairs')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','files?space=internal')[1]['totalItems'],1)

    def test_pagination_folder_inheritance_locking_and_atomic_upload(self):
        records=[]
        for n in range(21): records.append(self.upload(name=f'Fichier {n:02}'))
        first=self.call('GET','files?sort=name')[1];second=self.call('GET','files?sort=name&page=2')[1]
        self.assertEqual(first['totalItems'],21);self.assertEqual(first['totalPages'],2);self.assertEqual(len(first['items']),20);self.assertEqual(len(second['items']),1)
        self.assertFalse({r['id'] for r in first['items']} & {r['id'] for r in second['items']})
        self.assertEqual(first['items'][0]['name'],'Fichier 00')
        a=self.pb.create('contacts_companies',dict(name='Homonyme',active=True));b=self.pb.create('contacts_companies',dict(name='Homonyme',active=True))
        self.upload(links=[dict(entity='contacts_companies',id=a['id'])]);self.upload(links=[dict(entity='contacts_companies',id=b['id'])])
        groups=self.call('GET','files?group=company')[1]['groups'];self.assertEqual(groups[a['id']],1);self.assertEqual(groups[b['id']],1)

        code,parent=self.call('POST','folders',dict(name='Parent privé',space='internal',parent='',visibility='restricted',readers=[],active=True));self.assertEqual(code,200,parent)
        code,child=self.call('POST','folders',dict(name='Enfant équipe',space='internal',parent=parent['id'],visibility='team',readers=[],active=True));self.assertEqual(code,200,child)
        hidden=self.upload(folder=child['id'])
        self.assertEqual(self.call('GET','files/'+hidden['id'],who='reader')[0],403)
        r=records[0]
        self.pb.request('PATCH','collections/documents_files/records/'+r['id'],dict(locked=True),self.pb.admin_token)
        locked=self.call('GET','files/'+r['id'])[1]
        self.assertEqual(self.multipart('files/'+r['id']+'/version',{'updated':locked['updated'],'note':'Ne pas écraser'},[('officiel.pdf',PDF,'application/pdf')])[0],400)
        before=self.call('GET','files')[1]['totalItems']
        code,result=self.multipart('upload',{'input':json.dumps(self.input)},[('ok.pdf',PDF,'application/pdf'),('faux.pdf',b'<html>Interdit</html>','text/html')])
        self.assertEqual(code,400,result);self.assertEqual(self.call('GET','files')[1]['totalItems'],before)
        self.assertEqual(self.call('POST','folders',dict(name='parent privé',space='internal',parent='',visibility='team',readers=[],active=True))[0],409)

class GedSourceTests(unittest.TestCase):
    def enable(self,pb,user):
        role=pb.request('GET','collections/core_roles/records/'+user['role'],token=pb.admin_token)[1]
        code,result=pb.request('PATCH','collections/core_roles/records/'+role['id'],dict(permissions=list(set(role['permissions']+['documents.read']))),pb.admin_token);self.assertEqual(code,200,result)
    def files(self,pb,token,query=''):
        code,result=pb.request('GET','horizon/ged/files'+query,token=token);self.assertEqual(code,200,result);return result['items']
    def download(self,pb,token,row,expected):
        path='horizon/ged/files/'+row['id']+'/versions/'+row['current']['id']+'/file'
        with urlopen(Request(pb.url+'/api/'+path,headers={'Authorization':token})) as response:self.assertEqual(response.read(),expected)
    def upload(self,pb,token,path,fields,field):
        from check_employee_photos import PNG
        boundary='ged-source-files'
        parts=[f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode() for key,value in fields.items()]
        parts += [f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="source.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+PNG+b'\r\n',f'--{boundary}--\r\n'.encode()]
        with urlopen(Request(pb.url+'/api/'+path,data=b''.join(parts),headers={'Authorization':token,'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')) as response:return json.load(response)
    def test_expenses_receipts_keep_employee_and_manager_scope(self):
        from check_expenses import ExpensesTests
        from check_employee_photos import PNG
        f=ExpensesTests();f.setUp();self.addCleanup(f.pb.close)
        for person in f.people.values():self.enable(f.pb,person['user'])
        report=f.report();code,report=f.line(report);self.assertEqual(code,200,report)
        rows=self.files(f.pb,f.token);self.assertEqual(len(rows),1);self.download(f.pb,f.token,rows[0],PNG)
        self.assertEqual(self.files(f.pb,f.people['manager']['token']),[]);self.assertEqual(self.files(f.pb,f.people['other']['token']),[])
        code,report=f.transition(report,'submit');self.assertEqual(code,200,report)
        self.assertEqual(len(self.files(f.pb,f.people['manager']['token'])),1)
    def test_leave_attachments_keep_private_scope(self):
        from check_leave import LeaveTests
        from check_employee_photos import PNG
        f=LeaveTests();f.setUp();self.addCleanup(f.pb.close)
        for person in f.people.values():self.enable(f.pb,person['user'])
        data=dict(type=f.sick,start_date='2026-10-19',end_date='2026-10-19',start_half='am',end_half='pm',reason='Justificatif',manager='')
        report=self.upload(f.pb,f.token,'horizon/leave/requests',dict(input=json.dumps(data),creation_key='ged-leave-files-test',removed='[]'),'attachments')
        rows=self.files(f.pb,f.token);self.assertEqual(len(rows),1);self.download(f.pb,f.token,rows[0],PNG)
        self.assertEqual(self.files(f.pb,f.people['manager']['token']),[]);self.assertEqual(self.files(f.pb,f.people['other']['token']),[])
        code,report=f.transition(report,'submit');self.assertEqual(code,200,report)
        self.assertEqual(len(self.files(f.pb,f.people['manager']['token'])),1)
    def test_billing_original_is_projected_without_mutation(self):
        from check_billing import BillingTests
        from check_employee_photos import PNG
        f=BillingTests();f.setUp();self.addCleanup(f.pb.close);self.enable(f.pb,f.user)
        f.input['lines'][0]['analytic_allocations']=[dict(analytic_account=f.opp['analytic_account'],percentage=100)]
        code,invoice=f.save();self.assertEqual(code,200,invoice)
        invoice=self.upload(f.pb,f.token,'horizon/billing/files/customer/'+invoice['id'],dict(updated=invoice['updated']),'attachments')
        search_code,search=f.pb.request('GET','horizon/ged/search?kind=billing_invoices',token=f.token);self.assertEqual(search_code,200,search);self.assertIn(invoice['id'],[r['value'] for r in search['items']])
        query='?space=customers&context_id='+f.company['id']
        rows=self.files(f.pb,f.token,query);self.assertEqual(len(rows),1);self.assertEqual(rows[0]['theme'],'invoices');self.assertEqual(rows[0]['category_name'],'Factures clients');self.assertEqual(rows[0]['group_key'],'invoices:billing_invoices:'+invoice['id']);self.assertTrue(rows[0]['group_label'].startswith('Factures clients · '));self.download(f.pb,f.token,rows[0],PNG)
        by_affair=self.files(f.pb,f.token,'?space=affairs&context_id='+f.opp['id']);self.assertEqual(len(by_affair),1);self.assertEqual(by_affair[0]['id'],rows[0]['id'])
        self.assertEqual(f.get('record/customer/'+invoice['id'])['attachments'],invoice['attachments'])
        # Historical JSON may retain an order reference after a test-data cleanup.
        code,stored=f.pb.request('PATCH','collections/billing_invoices/records/'+invoice['id'],dict(source_orders=['missingorder001']),f.pb.admin_token);self.assertEqual(code,200,stored)
        code,result=f.pb.request('GET','horizon/ged/files'+query,token=f.token)
        self.assertEqual(code,200,result)
        self.assertEqual(len(result['items']),1)
        self.assertIn('rattachement historique',result['items'][0]['origin']['warning'])
        detail=f.pb.request('GET','horizon/ged/files/'+result['items'][0]['id'],token=f.token);self.assertEqual(detail[0],200,detail[1]);self.assertIn('warning',detail[1]['origin'])
        self.download(f.pb,f.token,result['items'][0],PNG)
        self.assertEqual(f.pb.request('GET','collections/billing_invoices/records/'+invoice['id'],token=f.pb.admin_token)[1]['source_orders'],['missingorder001'])
        code,healthy=f.save();self.assertEqual(code,200,healthy)
        self.upload(f.pb,f.token,'horizon/billing/files/customer/'+healthy['id'],dict(updated=healthy['updated']),'attachments')
        remaining=self.files(f.pb,f.token,query);self.assertEqual(len(remaining),2)
        self.assertEqual(sum('warning' in r['origin'] for r in remaining),1)



class GedUpgradeTests(unittest.TestCase):
    def test_additive_upgrade_preserves_files_roles_and_reapplies_cleanly(self):
        import shutil,subprocess
        from pathlib import Path
        from check_auth import ROOT
        pb=LocalPocketBase();self.addCleanup(pb.close)
        previous=Path(pb.temp.name)/'previous';previous.mkdir()
        for p in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if p.name<'1791840021':shutil.copy(p,previous)
        args=pb.args[:];pb.args=[a for a in args if not a.startswith('--migrationsDir=')]+[f'--migrationsDir={previous}'];pb.start()
        company=pb.create('contacts_companies',dict(name='Client historique conservé',active=True))
        from check_employee_photos import PNG
        boundary='legacy-ged-logo'
        data=f'--{boundary}\r\nContent-Disposition: form-data; name="logo"; filename="historique.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+PNG+f'\r\n--{boundary}--\r\n'.encode()
        request=Request(pb.url+'/api/collections/contacts_companies/records/'+company['id'],data=data,headers={'Authorization':pb.admin_token,'Content-Type':'multipart/form-data; boundary='+boundary},method='PATCH')
        with urlopen(request) as response:company=json.load(response)
        self.assertTrue(company['logo'])

        role=pb.create('core_roles',dict(name='ged_upgrade_admin',label='Admin',active=True,permissions=['settings.references','documents.template.manage']))
        admin=pb.create_user('ged-upgrade-admin@local.invalid',role['id'],'admin')
        shared=pb.create('core_roles',dict(name='ged_shared_role',label='Shared',active=True,permissions=['contacts.read']))
        pb.create_user('ged-shared-admin@local.invalid',shared['id'],'admin');normal=pb.create_user('ged-shared-user@local.invalid',shared['id'])
        pb.process.terminate();pb.process.wait(timeout=10)
        for _ in range(2):
            result=subprocess.run(args+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        pb.args=args;pb.launch_and_authenticate(args)
        self.assertEqual(pb.request('GET','collections/contacts_companies/records/'+company['id'],token=pb.admin_token)[1]['name'],company['name'])
        rights=pb.request('GET','collections/core_roles/records/'+role['id'],token=pb.admin_token)[1]['permissions'];self.assertIn('documents.read',rights);self.assertIn('documents.template.manage',rights)
        unchanged=pb.request('GET','collections/core_roles/records/'+shared['id'],token=pb.admin_token)[1]['permissions'];self.assertIn('contacts.read',unchanged);self.assertFalse(any(right.startswith('documents.') for right in unchanged)) # Later Contacts migrations have their own grants; GED must not broaden this shared role.
        self.assertEqual(pb.request('GET','collections/core_users/records/'+normal['id'],token=pb.admin_token)[1]['role'],shared['id'])
        self.assertEqual(pb.request('GET','collections/documents_categories/records',token=pb.admin_token)[1]['totalItems'],8)
        preserved=pb.request('GET','collections/contacts_companies/records/'+company['id'],token=pb.admin_token)[1];self.assertEqual(preserved['logo'],company['logo'])
        token=pb.request('POST','files/token',{},pb.admin_token)[1]['token']
        with urlopen(pb.url+'/api/files/contacts_companies/'+company['id']+'/'+company['logo']+'?token='+token) as response:self.assertEqual(response.read(),PNG)


if __name__=='__main__':unittest.main(verbosity=2)

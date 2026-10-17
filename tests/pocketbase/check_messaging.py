"""Outgoing e-mails against disposable PocketBase and a local fake Microsoft transport."""
import base64
import json
import threading
import unittest
import hashlib
import shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse, parse_qs, urlencode
from urllib.request import Request, urlopen
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from check_auth import LocalPocketBase, ROOT

DOC = {'type': 'doc', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': '<Bonjour> & merci'}]}]}

class MessagingTests(unittest.TestCase):
    def setUp(self):
        self.graph = None
        self.graph_reads = []
        self.sent = []
        self.http_status = 202
        self.identity_address = 'commercial@example.invalid'
        self.grants = []
        self.codes = {}
        self.token_status = 200
        self.scope = 'User.Read Mail.Send'
        self.lost_response = False
        self.send_started = threading.Event()
        self.release_send = threading.Event()
        self.hold_send = False
        owner = self
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args): pass
            def do_GET(self):
                if self.path != '/me' and owner.graph is not None:
                    owner.graph_reads.append(self.path)
                    status, payload = owner.graph(self.path)
                    self.send_response(status); self.send_header('Content-Type', 'application/json'); self.send_header('Retry-After', '120'); self.end_headers(); self.wfile.write(json.dumps(payload).encode()); return
                self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps(dict(id='local-microsoft-account',mail=owner.identity_address,userPrincipalName=owner.identity_address)).encode())
            def do_POST(self):
                body = self.rfile.read(int(self.headers['Content-Length']))
                if self.path == '/forms/chromium/convert/html':
                    self.send_response(200); self.send_header('Content-Type','application/pdf'); self.end_headers(); self.wfile.write(b'%PDF-1.7\nsource snapshot\n%%EOF'); return
                if self.path == '/token':
                    grant = parse_qs(body.decode()); owner.grants.append(grant)
                    if grant.get('grant_type') == ['authorization_code']:
                        expected = owner.codes.get(grant.get('code', [''])[0])
                        actual = base64.urlsafe_b64encode(hashlib.sha256(grant.get('code_verifier',[''])[0].encode()).digest()).decode().rstrip('=')
                        if expected != actual: self.send_response(400); self.end_headers(); self.wfile.write(b'{"error":"invalid_grant"}'); return
                    payload = dict(access_token='local-fictional-token',refresh_token='local-fictional-refresh-'+str(len(owner.grants)),scope=owner.scope,token_type='Bearer',expires_in=3600) if owner.token_status == 200 else dict(error='invalid_grant')
                    self.send_response(owner.token_status); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps(payload).encode()); return
                owner.sent.append(json.loads(body))
                owner.send_started.set()
                if owner.hold_send: owner.release_send.wait(timeout=3)
                if owner.lost_response: self.close_connection=True; return
                self.send_response(owner.http_status); self.send_header('request-id','local-request'); self.send_header('Retry-After','60'); self.end_headers()
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True); self.thread.start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)
        self.pb = LocalPocketBase(); self.addCleanup(self.pb.close)
        self.pb.environment.update(HORIZON_MAIL_TENANT_ID='00000000-0000-0000-0000-000000000001', HORIZON_MAIL_CLIENT_ID='00000000-0000-0000-0000-000000000002', HORIZON_MAIL_CLIENT_SECRET='fictional-local-only', HORIZON_MAIL_ENCRYPTION_KEY='local-fictional-encryption-key-3', HORIZON_MAIL_REDIRECT_URI='http://127.0.0.1:4174/messaging/oauth/callback', HORIZON_TEST_MODE='1', HORIZON_MAIL_TEST_ORIGIN=f'http://127.0.0.1:{self.server.server_port}')
        self.pb.environment['HORIZON_GOTENBERG_URL']=f'http://127.0.0.1:{self.server.server_port}'
        hooks=Path(self.pb.temp.name)/'hooks';shutil.copytree(ROOT/'pocketbase/pb_hooks',hooks)
        (hooks/'mail-fixture.pb.js').write_text("""routerAdd('POST', '/api/mail-fixture', (e) => {
          const b=e.requestInfo().body
          if (b.action === 'immediate') { e.app.store().set('mail-fixture-pause',false); return e.json(200,{ok:true}) }
          if (b.action === 'fail-claim') { e.app.store().set('mail-fixture-fail-claim',b.fail); return e.json(200,{ok:true}) }
          if (b.action === 'process') {
            e.app.store().set('mail-fixture-pause',false)
            try {
              for (const j of e.app.findRecordsByFilter('messaging_outbox','status = "pending" && next_attempt_at > "2098-01-01"','',100,0)) { j.set('next_attempt_at','2020-01-01 00:00:00.000Z'); e.app.save(j) }
              require(`${__hooks}/lib/messaging-worker.js`)(e.app)
              return e.json(200,{ok:true})
            } finally { e.app.store().set('mail-fixture-pause',true) }
          }
          if (!['messaging_oauth_connections','messaging_oauth_states','messaging_outbox','messaging_email_threads'].includes(b.table)) throw new BadRequestError('Fixture table')
          const r=e.app.findRecordById(b.table,b.id)
          for (const [k,v] of Object.entries(b.input)) r.set(k,v)
          e.app.save(r)
          return e.json(200,{ok:true})
        }, $apis.requireSuperuserAuth())
        routerAdd('GET','/api/mail-fixture-encryption',(e)=>{
          const r=e.app.findAllRecords('messaging_oauth_connections')[0]
          return e.json(200,{encrypted:!r.getString('access_cipher').includes('local-fictional-token') && !r.getString('refresh_cipher').includes('local-fictional-refresh'),access_cipher:r.getString('access_cipher'),refresh_cipher:r.getString('refresh_cipher')})
        },$apis.requireSuperuserAuth())
        // Worker-only scenarios intentionally schedule the initial job in the far
        // future; no production test switch or alternate dispatcher is introduced.
        onRecordValidate((e)=>{
          if(e.app.store().get('mail-fixture-pause') !== false && e.record.getString('status')==='pending' && e.record.getInt('attempts')===0) e.record.set('next_attempt_at','2099-01-01 00:00:00.000Z')
          e.next()
        },'messaging_outbox')
        onRecordUpdate((e)=>{
          if(e.app.store().get('mail-fixture-fail-claim') && e.record.getString('status')==='processing') throw new Error('Local dispatch interruption')
          e.next()
        },'messaging_outbox')""")
        self.pb.args=[arg if not arg.startswith('--hooksDir=') else '--hooksDir='+str(hooks) for arg in self.pb.args]
        self.pb.start()
        self.role = self.pb.create('core_roles', dict(name='mail_admin',label='Mail Admin',active=True,permissions=['messaging.'+a for a in ['read','write','send','settings']]))
        self.user = self.pb.create_user('mail-admin@local.invalid',self.role['id'],'admin')
        self.token = self.pb.login('mail-admin@local.invalid')[1]['token']
        code,self.box = self.call('POST','settings',dict(kind='mailboxes',input=dict(name='Commercial',address='commercial@example.invalid',active=True,allowed_users=[self.user['id']])))
        self.assertEqual(code,200,self.box)
        self.connect()
    def alter(self,table,id,**fields):
        code,r=self.pb.request('POST','mail-fixture',dict(table=table,id=id,input=fields),self.pb.admin_token);self.assertEqual(code,200,r)
    def job(self):
        return self.pb.request('GET','collections/messaging_outbox/records',token=self.pb.admin_token)[1]['items'][0]
    def start_connection(self):
        code,r=self.call('POST','oauth/start',dict(mailbox=self.box['id'])); self.assertEqual(code,200,r)
        query=parse_qs(urlparse(r['url']).query); code='fixture-code-'+str(len(self.codes)); self.codes[code]=query['code_challenge'][0]
        self.assertEqual('https://graph.microsoft.com/Mail.Read' in query['scope'][0].split(),self.box.get('receive_enabled',False)); self.assertEqual(query['code_challenge_method'],['S256']); self.assertNotIn('client_credentials',r['url'])
        return dict(state=query['state'][0],code=code)
    def connect(self):
        self.oauth_callback=self.start_connection()
        code,result=self.call('POST','oauth/callback',self.oauth_callback); self.assertEqual(code,200,result)
    def connection(self):
        return self.pb.request('GET','collections/messaging_oauth_connections/records',token=self.pb.admin_token)[1]['items'][0]
    def call(self,method,path,data=None,token=None):
        return self.pb.request(method,'horizon/messaging/'+path,data,self.token if token is None else token)
    def draft(self,key='mail-local-fixture-key',**extra):
        data=dict(context='generic',source='',source_version='',mailbox=self.box['id'],subject='Objet test',to=['client@example.invalid'],cc=[],bcc=['confidentiel@example.invalid'],body_json=DOC,signature_snapshot={'type':'doc','content':[]},pdf_template='');data.update(extra)
        code,r=self.call('POST','messages',dict(creation_key=key,input=data,removed=[]));self.assertEqual(code,200,r);return r
    def transition(self,r,action,**extra):
        return self.call('POST','messages/'+r['id']+'/transition',dict(updated=r['updated'],action=action,**extra))
    def process(self):
        code,r=self.pb.request('POST','mail-fixture',dict(action='process'),self.pb.admin_token);self.assertEqual(code,200,r)
    def get(self,r): return self.call('GET','messages/'+r['id'])[1]
    def activity_email(self,message,entity,source,recipient):
        module='sales' if entity=='sales_quotes' else 'purchasing'
        query=urlencode(dict(entity=entity,id=source))
        code,feed=self.pb.request('GET','horizon/activity/events?'+query,token=self.token);self.assertEqual(code,200,feed)
        event=next(e for e in feed['items'] if e['metadata'].get('email_id')==message['id'])
        self.assertIn(recipient,event['body']);self.assertNotIn('par e-mail',event['body']);self.assertNotIn(self.box['address'],event['body'])
        self.assertEqual(event['metadata']['email'],{'to':[recipient],'from':message['from_address'],'subject':message['subject'],'text':message['text'],'attachments':message['attachments']})
        self.assertNotIn('confidentiel@example.invalid',json.dumps(event));self.assertNotIn('bcc',json.dumps(event));self.assertEqual(event['attachments'],[])
        code,documents=self.pb.request('GET','horizon/activity/events?'+query+'&category=documents',token=self.token);self.assertEqual(code,200,documents);self.assertIn(event['id'],[e['id'] for e in documents['items']])
        role=self.pb.create('core_roles',dict(name='mail_feed_reader',label='Source reader',active=True,permissions=[module+'.read']))
        user=self.pb.create_user('feed-reader@local.invalid',role['id'],'viewer');token=self.pb.login(user['email'])[1]['token']
        self.assertEqual(self.call('GET','messages/'+message['id'],token=token)[0],403)
        code,feed=self.pb.request('GET','horizon/activity/events?'+query,token=token);self.assertEqual(code,200,feed)
        self.assertEqual(next(e for e in feed['items'] if e['id']==event['id'])['metadata']['email']['to'],[recipient])
        code,global_feed=self.pb.request('GET','horizon/activity/feed?type=emails&module='+module+'&q='+recipient,token=token);self.assertEqual(code,200,global_feed)
        global_event=next(e for e in global_feed['items'] if e['id']==event['id'])
        self.assertEqual(global_event['metadata']['email'],event['metadata']['email'])
        self.assertNotIn('bcc',json.dumps(global_event));self.assertNotIn('confidentiel@example.invalid',json.dumps(global_event))

        path='horizon/activity/events/'+event['id']+'/email-attachment?'+urlencode(dict(filename=message['pdf_file']))
        req=Request(self.pb.url+'/api/'+path,headers={'Authorization':token})
        with urlopen(req) as response:
            self.assertEqual(response.read(),b'%PDF-1.7\nsource snapshot\n%%EOF');self.assertEqual(response.headers['Cache-Control'],'no-store');self.assertEqual(response.headers.get_content_type(),'application/pdf')
        from urllib.error import HTTPError
        def refused(path,auth,status):
            with self.assertRaises(HTTPError) as error:urlopen(Request(self.pb.url+'/api/'+path,headers={'Authorization':auth} if auth else {}))
            self.assertEqual(error.exception.code,status)
        refused(path,'',401)
        refused('horizon/activity/events/'+event['id']+'/email-attachment?filename=other.pdf',token,404)
        filetoken=self.pb.request('POST','files/token',{},token)[1]['token']
        refused('files/'+message['collectionId']+'/'+message['id']+'/'+message['pdf_file']+'?'+urlencode(dict(token=filetoken)), '',404)
        self.pb.request('PATCH','collections/core_roles/records/'+role['id'],dict(permissions=[]),self.pb.admin_token)
        refused(path,token,403)
        # Historical events gain the projection without rewriting the original.
        code,legacy=self.pb.request('PATCH','collections/core_activity_events/records/'+event['id'],dict(body='Devis envoyé par e-mail · ancien@example.invalid'),self.pb.admin_token);self.assertEqual(code,200,legacy)
        code,feed=self.pb.request('GET','horizon/activity/events?'+query,token=self.token);self.assertEqual(code,200,feed)
        projected=next(e for e in feed['items'] if e['id']==event['id']);self.assertIn(recipient,projected['body']);self.assertNotIn('ancien@example.invalid',projected['body'])
        self.assertEqual(self.pb.request('GET','collections/core_activity_events/records/'+event['id'],token=self.pb.admin_token)[1]['body'],legacy['body'])
        # Cross-source mail links must not expose a private generic message.
        generic=self.draft('mail-cross-source-key');code,generic=self.transition(generic,'enqueue');self.assertEqual(code,200,generic);self.process();self.assertEqual(self.get(generic)['status'],'sent')
        code,result=self.pb.request('PATCH','collections/core_activity_events/records/'+event['id'],dict(metadata={**event['metadata'],'email_id':generic['id']}),self.pb.admin_token);self.assertEqual(code,200,result)
        refused(path,self.token,404)
        code,feed=self.pb.request('GET','horizon/activity/events?'+query,token=self.token);self.assertEqual(code,200,feed)
        self.assertNotIn('email',next(e for e in feed['items'] if e['id']==event['id'])['metadata'])
        return event
    def test_send_snapshot_idempotency_and_privacy(self):
        r=self.draft();self.assertEqual(self.draft()['id'],r['id'])
        code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r)
        self.process();r=self.get(r);self.assertEqual(r['status'],'sent',r);self.assertTrue(r['sent_at'])
        self.assertEqual(len(self.sent),1);msg=self.sent[0]['message']
        self.assertEqual(msg['from']['emailAddress']['address'],self.box['address']);self.assertIn('&lt;Bonjour&gt; &amp; merci',msg['body']['content'])
        self.assertEqual(msg['bccRecipients'][0]['emailAddress']['address'],'confidentiel@example.invalid')
        self.assertEqual(self.transition(r,'enqueue')[0],200);self.process();self.assertEqual(len(self.sent),1)
        self.assertEqual(self.call('GET','messages/'+r['id'],token=self.pb.login()[1]['token'])[0],403)
        code,result=self.pb.request('PATCH','collections/messaging_email_messages/records/'+r['id'],{'subject':'Altered'},self.pb.admin_token);self.assertEqual(code,403,result)
        code,r=self.transition(r,'archive');self.assertEqual(code,200,r)
        self.assertEqual(self.call('GET','messages')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','messages?state=archived')[1]['totalItems'],1)
    def test_failed_uncertain_and_revoked_sender(self):
        r=self.draft();self.http_status=400;code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process();r=self.get(r);self.assertEqual(r['status'],'failed',r)
        self.process();self.assertEqual(len(self.sent),1)
        self.http_status=503;code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process();r=self.get(r);self.assertEqual(r['status'],'uncertain',r)
        self.assertEqual(self.transition(r,'enqueue')[0],400);self.process();self.assertEqual(len(self.sent),2)
        code,r=self.transition(r,'resolve',reason='Vérifié dans Microsoft 365 : aucun envoi reçu.');self.assertEqual(code,200,r);self.assertTrue(r['resolved_at']);self.assertEqual(r['status'],'uncertain')
        r=self.draft('mail-fixture-revoke');code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r)
        code,b=self.call('POST','settings',dict(kind='mailboxes',id=self.box['id'],updated=self.box['updated'],input=dict(name='Commercial',address=self.box['address'],active=True,allowed_users=[])));self.assertEqual(code,200,b)
        self.process();self.assertEqual(self.get(r)['status'],'failed');self.assertEqual(len(self.sent),2)
        self.assertEqual(self.call('GET','choices')[1]['mailboxes'],[])
    def test_attachment_bytes_and_protected_access(self):
        r=self.draft('mail-attachment-fixture')
        data={k:r[k] for k in ['mailbox','source_version','subject','to','cc','bcc','body_json','signature_snapshot','pdf_template']}; data.update(context='generic',source='')
        fields=dict(id=r['id'],updated=r['updated'],input=json.dumps(data),removed='[]')
        boundary='horizon-mail-fixture'; raw=b'%PDF-1.4\nlocal test attachment\n%%EOF'
        parts=[f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k,v in fields.items()]
        parts += [f'--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="justificatif.pdf"\r\nContent-Type: application/pdf\r\n\r\n'.encode()+raw+b'\r\n',f'--{boundary}--\r\n'.encode()]
        req=Request(self.pb.url+'/api/horizon/messaging/messages',data=b''.join(parts),headers={'Authorization':self.token,'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
        with urlopen(req) as response: r=json.load(response)
        self.assertEqual(len(r['attachments']),1)
        code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process();r=self.get(r);self.assertEqual(r['status'],'sent',r)
        self.assertEqual(base64.b64decode(self.sent[0]['message']['attachments'][0]['contentBytes']),raw)
        from urllib.error import HTTPError
        with self.assertRaises(HTTPError) as error: urlopen(self.pb.url+'/api/files/'+r['collectionId']+'/'+r['id']+'/'+r['attachments'][0])
        self.assertEqual(error.exception.code,404)
    def test_quote_pdf_and_source_lock_then_sent(self):
        rights=self.role['permissions']+['crm.read','crm.write','contacts.read','sales.read','sales.write','sales.quote.validate','documents.template.manage','settings.references']
        self.assertEqual(self.pb.request('PATCH','collections/core_roles/records/'+self.role['id'],dict(permissions=rights),self.pb.admin_token)[0],200)
        client=self.pb.create('contacts_companies',dict(name='Client e-mail',active=True,email='client@example.invalid'))
        stage=self.pb.request('GET','collections/crm_stages/records?filter=active%3Dtrue&sort=sort_order',token=self.pb.admin_token)[1]['items'][0]
        code,opp=self.pb.request('POST','horizon/crm/save',dict(creation_key='mail-opportunity-fixture',input=dict(title='Studio',company=client['id'],contact='',owner=self.user['id'],stage=stage['id'],estimated_value=100,estimated_cost=50,currency='EUR',probability=30,expected_date='2026-12-01',description='',status='open')),self.token);self.assertEqual(code,200,opp)
        code,quote=self.pb.request('POST','horizon/sales/quotes/save',dict(creation_key='mail-quote-fixture-key',input=dict(opportunity=opp['id'],title='Installation',quote_date='2026-10-16',valid_until='2026-11-16',notes='',lines=[dict(description='Service',quantity=1,unit='h',unit_price=100)])),self.token);self.assertEqual(code,200,quote)
        code,quote=self.pb.request('POST','horizon/sales/quotes/finalize',dict(id=quote['id'],updated=quote['updated']),self.token);self.assertEqual(code,200,quote)
        from check_documents import layout
        code,template=self.pb.request('POST','horizon/documents/templates/save',dict(name='Devis e-mail',content_json=layout()),self.token);self.assertEqual(code,200,template)
        code,template=self.pb.request('POST','horizon/documents/templates/publish',dict(id=template['id'],updated=template['updated']),self.token);self.assertEqual(code,200,template)
        code,choices=self.call('GET','choices?context=sales_quote&source='+quote['id']);self.assertEqual(code,200,choices);self.assertEqual(choices['source']['to'],['client@example.invalid'])
        r=self.draft('mail-source-pdf-key',context='sales_quote',source=quote['id'],source_version=choices['source']['version'],pdf_template=template['id'],to=choices['source']['to'])
        self.assertEqual(r['pdf_file'],r['attachments'][0]);self.assertTrue(r['pdf_file'].endswith('.pdf'))
        code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r)
        code,result=self.pb.request('POST','horizon/sales/quotes/reopen',dict(id=quote['id'],updated=quote['updated'],target='draft'),self.token);self.assertEqual(code,400,result);self.assertIn('e-mail lié',result['message'])
        self.process();r=self.get(r);self.assertEqual(r['status'],'sent',r)
        self.assertEqual(base64.b64decode(self.sent[0]['message']['attachments'][0]['contentBytes']),b'%PDF-1.7\nsource snapshot\n%%EOF')
        quote=self.pb.request('GET','collections/sales_quotes/records/'+quote['id'],token=self.pb.admin_token)[1];self.assertEqual(quote['status'],'sent');self.assertTrue(quote['sent_at'])
        self.activity_email(r,'sales_quotes',quote['id'],'client@example.invalid')
    def test_purchase_order_pdf_send_preserves_business_state(self):
        rights=self.role['permissions']+['contacts.read','purchasing.read','purchasing.write','purchasing.order.validate','inventory.read']
        self.assertEqual(self.pb.request('PATCH','collections/core_roles/records/'+self.role['id'],dict(permissions=rights),self.pb.admin_token)[0],200)
        supplier=self.pb.create('contacts_companies',dict(name='Fournisseur e-mail',email='supplier@example.invalid',active=True))
        self.pb.create('contacts_company_roles',dict(company=supplier['id'],role='supplier',active=True))
        data=dict(title='Commande service',supplier=supplier['id'],opportunity='',source_order='',document_date='2026-10-16',needed_date='',currency='EUR',exchange_rate=1,tax_rate=20,notes='',lines=[dict(description='Prestation',quantity=1,unit='h',unit_price=100,discount=0,purpose='consumption',allocations=[])])
        code,order=self.pb.request('POST','horizon/purchasing/orders/save',dict(creation_key='mail-po-fixture-key',input=data),self.token);self.assertEqual(code,200,order)
        code,order=self.pb.request('POST','horizon/purchasing/orders/transition',dict(id=order['id'],updated=order['updated'],action='validate'),self.token);self.assertEqual(code,200,order)
        code,choices=self.call('GET','choices?context=purchase_order&source='+order['id']);self.assertEqual(code,200,choices);self.assertEqual(choices['source']['to'],['supplier@example.invalid'])
        r=self.draft('mail-po-send-fixture',context='purchase_order',source=order['id'],source_version=choices['source']['version'],to=choices['source']['to'])
        self.assertTrue(r['pdf_file']);code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process();r=self.get(r);self.assertEqual(r['status'],'sent',r)
        order=self.pb.request('GET','collections/purchasing_orders/records/'+order['id'],token=self.pb.admin_token)[1];self.assertEqual(order['status'],'sent');self.assertTrue(order['sent_at'])
        self.activity_email(r,'purchasing_orders',order['id'],'supplier@example.invalid')
    def test_sender_change_after_queue_and_cancel(self):
        r=self.draft('mail-sender-change-key');code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r)
        code,b=self.call('POST','settings',dict(kind='mailboxes',id=self.box['id'],updated=self.box['updated'],input=dict(name='Commercial',address='nouvelle@example.invalid',active=True,allowed_users=[self.user['id']])));self.assertEqual(code,200,b)
        self.process();self.assertEqual(self.get(r)['status'],'failed');self.assertEqual(self.sent,[])
        self.box=b;self.identity_address=b['address'];self.connect()
        r=self.draft('mail-cancel-key');code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);code,r=self.transition(r,'cancel');self.assertEqual(code,200,r);self.process();self.assertEqual(self.sent,[])
        code,result=self.call('GET','messages?q=Objet&status=cancelled&sort=subject');self.assertEqual(code,200,result);self.assertEqual(result['totalItems'],1)
    def test_settings_variables_and_permissions(self):
        self.assertEqual(self.call('GET','settings',token=self.pb.login()[1]['token'])[0],403)
        code,r=self.call('POST','settings/preview',dict(subject='Devis {{piece.numero}}',body_json=DOC));self.assertEqual(code,200,r);self.assertEqual(r['subject'],'Devis DEV-EXEMPLE')
        self.assertEqual(self.call('POST','settings/preview',dict(subject='{{interdit.secret}}',body_json=DOC))[0],400)
        self.assertEqual(self.call('POST','messages',dict(creation_key='invalid-sender-fixture',input=dict(context='generic',source='',source_version='',mailbox=self.box['id'],subject='Header\nInjection',to=[],body_json=DOC,signature_snapshot=DOC,pdf_template='')))[0],400)

    def test_oauth_state_pkce_owner_expiry_identity_and_permissions(self):
        self.assertEqual(self.call('POST','oauth/callback',self.oauth_callback)[0],400)
        self.assertEqual(self.call('POST','oauth/start',dict(mailbox=self.box['id']),token=self.pb.login()[1]['token'])[0],403)
        callback=self.start_connection()
        other=self.pb.create_user('second-mail-admin@local.invalid',self.role['id'],'admin');other_token=self.pb.login(other['email'])[1]['token']
        self.assertEqual(self.call('POST','oauth/callback',callback,token=other_token)[0],400)
        self.assertEqual(self.call('POST','oauth/callback',callback)[0],200)
        callback=self.start_connection();self.identity_address='wrong@example.invalid'
        self.assertEqual(self.call('POST','oauth/callback',callback)[0],400)
        self.assertEqual(self.connection()['account_address'],self.box['address'])
        self.identity_address=self.box['address'];callback=self.start_connection()
        states=self.pb.request('GET','collections/messaging_oauth_states/records',token=self.pb.admin_token)[1]['items']
        state=next(s for s in states if not s['consumed']);self.alter('messaging_oauth_states',state['id'],expires_at='2020-01-01 00:00:00.000Z')
        self.assertEqual(self.call('POST','oauth/callback',callback)[0],400)
        self.assertTrue(all(g['grant_type']==['authorization_code'] for g in self.grants))
    def test_oauth_tokens_private_encrypted_and_disconnect_invalidates_queue(self):
        for table in ['messaging_oauth_connections','messaging_oauth_states']:
            self.assertEqual(self.pb.request('GET','collections/'+table+'/records',token=self.token)[0],403)
        r=self.connection();self.assertNotEqual(r['access_cipher'],'local-fictional-token')
        encryption=self.pb.request('GET','mail-fixture-encryption',token=self.pb.admin_token)[1];self.assertTrue(encryption['encrypted'])
        settings=self.call('GET','settings')[1];self.assertNotIn('local-fictional-token',json.dumps(settings));self.assertEqual(settings['mailboxes'][0]['connection']['status'],'connected')
        self.assertEqual(self.pb.request('PATCH','collections/messaging_oauth_connections/records/'+r['id'],dict(status='disconnected'),self.pb.admin_token)[0],403)
        draft=self.draft();code,draft=self.transition(draft,'enqueue');self.assertEqual(code,200,draft)
        self.assertEqual(self.call('POST','oauth/disconnect',dict(mailbox=self.box['id']))[0],200)
        self.process();self.assertEqual(self.sent,[]);self.assertEqual(self.get(draft)['status'],'failed')
        self.assertEqual(self.call('GET','settings')[1]['mailboxes'][0]['connection']['status'],'disconnected')
        self.assertEqual(self.transition(self.get(draft),'enqueue')[0],400)
    def test_refresh_rotation_and_invalid_grant(self):
        conn=self.connection();self.alter('messaging_oauth_connections',conn['id'],expires_at='2020-01-01 00:00:00.000Z')
        before=self.pb.request('GET','mail-fixture-encryption',token=self.pb.admin_token)[1]
        r=self.draft();code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process();self.assertEqual(self.get(r)['status'],'sent')
        self.assertEqual(self.grants[-1]['grant_type'],['refresh_token'])
        self.assertEqual(self.grants[-1]['refresh_token'],['local-fictional-refresh-1'])
        after=self.pb.request('GET','mail-fixture-encryption',token=self.pb.admin_token)[1];self.assertNotEqual(before['refresh_cipher'],after['refresh_cipher'])
        self.alter('messaging_oauth_connections',conn['id'],expires_at='2020-01-01 00:00:00.000Z');self.token_status=400
        r=self.draft('mail-invalid-grant-fixture');code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process();self.assertEqual(self.get(r)['status'],'failed');self.assertEqual(len(self.sent),1)
        self.assertEqual(self.connection()['status'],'reconnect')
    def test_rate_limit_retry_bounded_and_concurrent_claim(self):
        r=self.draft();self.http_status=429;code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r)
        self.process();self.assertEqual(self.get(r)['status'],'pending');self.assertEqual(len(self.sent),1)
        self.process();self.assertEqual(len(self.sent),1)
        job=self.job();self.alter('messaging_outbox',job['id'],next_attempt_at='2020-01-01 00:00:00.000Z')
        self.http_status=202
        with ThreadPoolExecutor(max_workers=2) as pool: list(pool.map(lambda _: self.process(),range(2)))
        self.assertEqual(len(self.sent),2);self.assertEqual(self.get(r)['status'],'sent')
        # A second message exhausts the retry budget without an automatic sixth send.
        r=self.draft('mail-bounded-retry-key');code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.http_status=429
        job=next(j for j in self.pb.request('GET','collections/messaging_outbox/records',token=self.pb.admin_token)[1]['items'] if j['message']==r['id'])
        self.alter('messaging_outbox',job['id'],attempts=4,next_attempt_at='2020-01-01 00:00:00.000Z');self.process();self.assertEqual(self.get(r)['status'],'failed')
    def test_reconnection_generation_and_interrupted_processing(self):
        r=self.draft();code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.connect();self.process()
        self.assertEqual(self.get(r)['status'],'failed');self.assertEqual(self.sent,[])
        r=self.get(r);code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r)
        job=self.job();self.alter('messaging_outbox',job['id'],status='processing',claimed_at='2020-01-01 00:00:00.000Z')
        self.process();self.assertEqual(self.get(r)['status'],'uncertain');self.assertEqual(self.sent,[])
    def test_stale_refresh_requires_reconnection_without_token_reuse(self):
        conn=self.connection();self.alter('messaging_oauth_connections',conn['id'],status='refreshing',refresh_claim='lost-refresh',refresh_claimed_at='2020-01-01 00:00:00.000Z')
        r=self.draft();code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process()
        self.assertEqual(self.get(r)['status'],'failed');self.assertEqual(self.sent,[]);self.assertEqual(len(self.grants),1);self.assertEqual(self.connection()['status'],'reconnect')

    def test_lost_send_response_not_retried_and_401_reconnects(self):
        self.lost_response=True;r=self.draft();code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process()
        self.assertEqual(self.get(r)['status'],'uncertain');self.process();self.assertEqual(len(self.sent),1)
        self.lost_response=False;self.http_status=401;r=self.draft('mail-401-fixture-key');code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.process()
        self.assertEqual(self.get(r)['status'],'failed');self.assertEqual(self.connection()['status'],'reconnect');self.process();self.assertEqual(len(self.sent),2)
    def test_oauth_scope_pkce_and_rights_rechecked(self):
        callback=self.start_connection();callback['code']='bad-code';self.assertEqual(self.call('POST','oauth/callback',callback)[0],400)
        callback=self.start_connection();self.scope='User.Read';self.assertEqual(self.call('POST','oauth/callback',callback)[0],400);self.scope='User.Read Mail.Send'
        callback=self.start_connection()
        self.pb.request('PATCH','collections/core_roles/records/'+self.role['id'],dict(permissions=['messaging.read']),self.pb.admin_token)
        self.assertEqual(self.call('POST','oauth/callback',callback)[0],403);self.assertEqual(len(self.sent),0)
    def test_pending_connection_cannot_override_disconnect(self):
        callback=self.start_connection();self.assertEqual(self.call('POST','oauth/disconnect',dict(mailbox=self.box['id']))[0],200)
        self.assertEqual(self.call('POST','oauth/callback',callback)[0],400);self.assertEqual(self.connection()['status'],'disconnected')

    def immediate(self):
        self.assertEqual(self.pb.request('POST','mail-fixture',dict(action='immediate'),self.pb.admin_token)[0],200)
    def test_immediate_send_after_commit_with_normal_send_permissions(self):
        r=self.draft();self.immediate()
        # Calling the fake Graph server can read a different request's committed
        # message; concurrent saves would fail if an SQLite transaction held the network.
        self.hold_send=True
        self.pb.request('PATCH','collections/core_roles/records/'+self.role['id'],dict(permissions=['messaging.read','messaging.write','messaging.send']),self.pb.admin_token)
        self.assertEqual(self.call('POST','process',{})[0],403)
        with ThreadPoolExecutor(max_workers=2) as pool:
            send=pool.submit(self.transition,r,'enqueue')
            try:
                self.assertTrue(self.send_started.wait(timeout=3))
                stored=self.get(r);self.assertEqual(stored['status'],'processing')
                self.draft('mail-during-delivery-key')
                # Same worker as the cron, while the immediate send is in progress.
                self.process()
            finally:self.release_send.set()
            code,r=send.result(timeout=5)
        self.assertEqual(code,200,r);self.assertEqual(r['status'],'sent');self.assertEqual(len(self.sent),1)
        self.assertEqual(self.transition(r,'enqueue')[1]['status'],'sent');self.process();self.assertEqual(len(self.sent),1)
    def test_immediate_target_leaves_backlog_to_cron_and_respects_retry_after(self):
        older=self.draft('mail-backlog-fixture');code,older=self.transition(older,'enqueue');self.assertEqual(code,200,older)
        # Make the older message due without running a worker.
        self.pb.request('POST','mail-fixture',dict(action='immediate'),self.pb.admin_token)
        old_job=self.job();self.alter('messaging_outbox',old_job['id'],next_attempt_at='2020-01-01 00:00:00.000Z')
        fresh=self.draft('mail-immediate-fixture');code,fresh=self.transition(fresh,'enqueue');self.assertEqual(code,200,fresh);self.assertEqual(fresh['status'],'sent');self.assertEqual(self.get(older)['status'],'pending');self.assertEqual(len(self.sent),1)
        self.process();self.assertEqual(self.get(older)['status'],'sent');self.assertEqual(len(self.sent),2)
        self.immediate();self.http_status=429;r=self.draft('mail-immediate-rate-limit');code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.assertEqual(r['status'],'pending');self.assertEqual(len(self.sent),3)
        self.transition(r,'enqueue');self.process();self.assertEqual(len(self.sent),3)
    def test_failed_immediate_dispatch_keeps_durable_job_for_cron(self):
        r=self.draft();self.immediate()
        self.pb.request('POST','mail-fixture',dict(action='fail-claim',fail=True),self.pb.admin_token)
        code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.assertEqual(r['status'],'pending');self.assertEqual(self.sent,[]);self.assertEqual(self.job()['attempts'],0)
        self.pb.request('POST','mail-fixture',dict(action='fail-claim',fail=False),self.pb.admin_token)
        self.process();self.assertEqual(self.get(r)['status'],'sent');self.assertEqual(len(self.sent),1)
    def test_immediate_lost_response_never_retries_automatically(self):
        r=self.draft();self.immediate();self.lost_response=True
        code,r=self.transition(r,'enqueue');self.assertEqual(code,200,r);self.assertEqual(r['status'],'uncertain');self.process();self.assertEqual(len(self.sent),1)

    def reply_setup(self, purchasing=False):
        if purchasing: self.test_purchase_order_pdf_send_preserves_business_state()
        else: self.test_quote_pdf_and_source_lock_then_sent()
        thread=self.pb.request('GET','collections/messaging_email_threads/records',token=self.pb.admin_token)[1]['items'][0]
        message=self.get(dict(id=thread['message']))
        box=self.call('GET','settings')[1]['mailboxes'][0]
        code,self.box=self.call('POST','settings',dict(kind='mailboxes',id=box['id'],updated=box['updated'],input=dict(name=box['name'],address=box['address'],active=True,allowed_users=box['allowed_users'],receive_enabled=True)));self.assertEqual(code,200,self.box)
        self.scope='User.Read Mail.Send Mail.Read';self.connect()
        origin=f'http://127.0.0.1:{self.server.server_port}'
        sent=dict(id='sent-id',internetMessageId='<root@example.invalid>',conversationId='conversation-1',internetMessageHeaders=[dict(name='X-Horizon-Message',value=message['id'])],from_email=1,isDraft=False)
        sent['from']=dict(emailAddress=dict(address=self.box['address']))
        received=dict(id='reply-id',internetMessageId='<reply@example.invalid>',conversationId='conversation-1',internetMessageHeaders=[dict(name='In-Reply-To',value=sent['internetMessageId'])],subject='Re: Votre devis',receivedDateTime='2026-10-16T12:00:00Z',isDraft=False,hasAttachments=True,body=dict(contentType='text',content='Bonjour, accord pour la proposition. <script>alert(1)</script>'))
        received['from']=dict(emailAddress=dict(address='client@example.invalid',name='Camille Client'))
        self.reply_items=[sent,received];self.reply_detail=received;self.reply_status=200;self.reply_next='';self.reply_files=[dict(id='pdf-1',name='accord.pdf',size=24,contentType='application/pdf',isInline=False,**{'@odata.type':'#microsoft.graph.fileAttachment'})]
        self.reply_bytes=b'%PDF-1.7\naccord client\n%%EOF'
        def graph(path):
            parsed=urlparse(path);q=parse_qs(parsed.query)
            if parsed.path=='/me/mailFolders/sentitems/messages':return 200,dict(value=[sent])
            if parsed.path=='/me/messages':return self.reply_status,dict(value=self.reply_items,**({'@odata.nextLink':self.reply_next} if self.reply_next else {}))
            if parsed.path in ['/me/messages/reply-id','/me/messages/reply-two']:return 200,self.reply_detail
            if parsed.path=='/me/messages/reply-id/attachments':return 200,dict(value=self.reply_files)
            if parsed.path=='/me/messages/reply-id/attachments/pdf-1':return 200,dict(contentBytes=base64.b64encode(self.reply_bytes).decode())
            return 404,dict(error='local fixture missing route')
        self.graph=graph
        return thread,message,origin
    def reply_sync(self):
        code,r=self.call('POST','replies/sync',dict(mailbox=self.box['id']));self.assertEqual(code,200,r);return r
    def reply_thread(self):
        return self.pb.request('GET','collections/messaging_email_threads/records',token=self.pb.admin_token)[1]['items'][0]
    def reply_due(self):
        t=self.reply_thread();self.alter('messaging_email_threads',t['id'],next_attempt_at='2020-01-01 00:00:00.000Z')
    def test_ged_sent_quote_and_received_files_are_federated_without_copy(self):
        _,message,_=self.reply_setup();self.reply_sync();self.assertEqual(self.reply_sync()['received'],1)
        rights=self.pb.request('GET','collections/core_roles/records/'+self.role['id'],token=self.pb.admin_token)[1]['permissions']
        self.pb.request('PATCH','collections/core_roles/records/'+self.role['id'],dict(permissions=rights+['documents.read']),self.pb.admin_token)
        route='horizon/ged/files'
        quote=self.pb.request('GET','collections/sales_quotes/records/'+message['source_id'],token=self.pb.admin_token)[1]
        context='space=affairs&context_id='+quote['opportunity']
        # The shared send fixture deliberately corrupts its event's email link to
        # prove cross-source privacy. Such a link must remain absent from GED.
        code,initial=self.pb.request('GET',route+'?'+context,token=self.token);self.assertEqual(code,200,initial);self.assertEqual(initial['totalItems'],1)
        events=self.pb.request('GET','collections/core_activity_events/records?'+urlencode(dict(filter='source_record_id = "'+message['source_id']+'"',perPage=100)),token=self.pb.admin_token)[1]['items']
        sent_event=next(e for e in events if e['metadata'].get('email_id') and not e['metadata'].get('email_reply_id'))
        code,restored=self.pb.request('PATCH','collections/core_activity_events/records/'+sent_event['id'],dict(metadata={**sent_event['metadata'],'email_id':message['id']}),self.pb.admin_token);self.assertEqual(code,200,restored)
        code,result=self.pb.request('GET',route+'?'+context+'&'+urlencode(dict(q='Studio',group='theme')),token=self.token);self.assertEqual(code,200,result)
        self.assertEqual(result['totalItems'],2,result);self.assertEqual(result['groups'],{'quotes':2})
        sent=next(row for row in result['items'] if 'envoyée' in row['origin']['label']);received=next(row for row in result['items'] if 'reçue' in row['origin']['label'])
        self.assertTrue(any(link['entity']=='crm_opportunities' for link in sent['links']));self.assertTrue(any(link['entity']=='contacts_companies' for link in sent['links']))
        for row,expected in [(sent,b'%PDF-1.7\nsource snapshot\n%%EOF'),(received,self.reply_bytes)]:
            path=route+'/'+row['id']+'/versions/'+row['current']['id']+'/file'
            with urlopen(Request(self.pb.url+'/api/'+path,headers={'Authorization':self.token})) as response:
                self.assertEqual(response.read(),expected);self.assertEqual(response.headers['Cache-Control'],'no-store')
            self.assertEqual(self.pb.request('GET',route+'/'+row['id'],token=self.token)[0],200)
        self.assertNotIn('bcc',json.dumps(result));self.assertNotIn('confidentiel@example.invalid',json.dumps(result))
        self.assertEqual(self.pb.request('GET','collections/documents_files/records',token=self.pb.admin_token)[1]['totalItems'],0)
        role=self.pb.create('core_roles',dict(name='ged_sales_only',label='GED sales',active=True,permissions=['documents.read','sales.read','contacts.read']))
        user=self.pb.create_user('ged-sales@local.invalid',role['id'],'viewer');token=self.pb.login(user['email'])[1]['token']
        code,projected=self.pb.request('GET',route+'?space=customers&context_id='+quote['company'],token=token);self.assertEqual(code,200,projected);self.assertEqual(projected['totalItems'],2)
        self.assertTrue(all(link['entity'] in ['sales_quotes','contacts_companies'] for row in projected['items'] for link in row['links']))
        path=route+'/'+sent['id']+'/versions/'+sent['current']['id']+'/file'
        self.pb.request('PATCH','collections/core_roles/records/'+role['id'],dict(permissions=['documents.read','contacts.read']),self.pb.admin_token)
        self.assertEqual(self.pb.request('GET',route+'?space=customers&context_id='+quote['company'],token=token)[1]['totalItems'],0)
        self.assertEqual(self.pb.request('GET',path,token=token)[0],403)
        self.assertEqual(self.pb.request('GET',route+'/'+sent['id'],token=token)[0],403)

    def test_reply_import_idempotent_source_permissions_and_files(self):
        thread,message,_=self.reply_setup()
        self.assertEqual(self.reply_sync()['received'],0)
        self.assertEqual(self.reply_sync()['received'],1)
        self.reply_due();self.assertEqual(self.reply_sync()['received'],0)
        replies=self.pb.request('GET','collections/messaging_email_replies/records',token=self.pb.admin_token)[1]['items'];self.assertEqual(len(replies),1)
        reply=replies[0];self.assertEqual(reply['message'],message['id']);self.assertEqual(len(reply['attachments']),1)
        query=urlencode(dict(entity='sales_quotes',id=message['source_id']))
        role=self.pb.create('core_roles',dict(name='reply_reader',label='Reader',active=True,permissions=['sales.read']))
        viewer=self.pb.create_user('reply-reader@local.invalid',role['id'],'viewer');token=self.pb.login(viewer['email'])[1]['token']
        code,feed=self.pb.request('GET','horizon/activity/events?'+query,token=token);self.assertEqual(code,200,feed)
        event=next(e for e in feed['items'] if e['metadata'].get('email_reply_id')==reply['id'])
        self.assertEqual(event['metadata']['author']['name'],'Camille Client');self.assertIn('accord pour',event['body']);self.assertEqual(event['metadata']['email']['direction'],'received');self.assertNotIn('bcc',json.dumps(event))
        code,global_feed=self.pb.request('GET','horizon/activity/feed?type=emails&module=sales&q=Camille',token=token);self.assertEqual(code,200,global_feed)
        global_event=next(e for e in global_feed['items'] if e['id']==event['id'])
        self.assertEqual(global_event['metadata']['email'],event['metadata']['email'])
        self.assertEqual(global_event['source']['id'],message['source_id'])

        path='horizon/activity/events/'+event['id']+'/email-attachment?'+urlencode(dict(filename=reply['attachments'][0]))
        with urlopen(Request(self.pb.url+'/api/'+path,headers={'Authorization':token})) as response:self.assertEqual(response.read(),self.reply_bytes)
        self.assertEqual(self.pb.request('GET','collections/messaging_email_replies/records/'+reply['id'],token=token)[0],403)
        self.assertEqual(self.pb.request('PATCH','collections/messaging_email_replies/records/'+reply['id'],dict(subject='changed'),self.pb.admin_token)[0],403)
        notes=self.pb.request('GET','collections/core_notifications/records',token=self.pb.admin_token)[1]['items'];self.assertEqual(len([n for n in notes if n['activity_event']==event['id']]),1)
        self.assertEqual(self.call('POST','replies/sync',dict(mailbox=self.box['id']),token=token)[0],403)
        self.pb.request('PATCH','collections/core_roles/records/'+role['id'],dict(permissions=[]),self.pb.admin_token)
        from urllib.error import HTTPError
        with self.assertRaises(HTTPError) as error:urlopen(Request(self.pb.url+'/api/'+path,headers={'Authorization':token}))
        self.assertEqual(error.exception.code,403)
    def test_reply_opt_in_mail_read_and_existing_send_connection(self):
        self.assertFalse(self.call('GET','settings')[1]['mailboxes'][0]['receive_enabled'])
        self.assertEqual(self.call('POST','replies/sync',dict(mailbox=self.box['id']))[0],400)
        _,message,_=self.reply_setup(purchasing=True)
        self.assertIn('Mail.Read',self.grants[-1]['scope'][0] if 'scope' in self.grants[-1] else self.scope)
        self.reply_sync();self.assertEqual(self.reply_sync()['received'],1)
        self.assertEqual(self.pb.request('GET','collections/purchasing_orders/records/'+message['source_id'],token=self.pb.admin_token)[1]['status'],'sent')
        self.call('POST','oauth/disconnect',dict(mailbox=self.box['id']));self.assertNotEqual(self.call('POST','replies/sync',dict(mailbox=self.box['id']))[0],200)
    def test_reply_unrelated_mail_and_spoofed_subject_not_imported(self):
        self.reply_setup();self.reply_items[1]['internetMessageHeaders']=[dict(name='In-Reply-To',value='<unknown-parent@example.invalid>'),dict(name='References',value='<root@example.invalid>')]
        self.reply_sync();self.assertEqual(self.reply_sync()['received'],0)
        self.assertFalse(any('/reply-id' in path for path in self.graph_reads))
        self.assertEqual(self.pb.request('GET','collections/messaging_email_replies/records',token=self.pb.admin_token)[1]['totalItems'],0)
    def test_reply_pagination_retry_after_and_untrusted_nextlink(self):
        _,_,origin=self.reply_setup();self.reply_sync()
        self.reply_status=429;self.reply_sync();t=self.reply_thread();self.assertIn('429',t['last_error']);self.assertFalse(t['claim'])
        before=len(self.graph_reads);self.reply_sync();self.assertEqual(len(self.graph_reads),before)
        self.reply_due();self.reply_status=200;self.reply_next='https://evil.example.invalid/me/messages?token=steal'
        self.assertEqual(self.reply_sync()['received'],1)
        self.assertEqual(self.reply_sync()['received'],0);self.assertIn('Pagination Microsoft refusée',self.reply_thread()['last_error']);self.assertFalse(any('evil' in path for path in self.graph_reads))
    def test_reply_discovery_paginates_with_canonical_user_and_folder_ids(self):
        _,_,origin=self.reply_setup();previous=self.graph
        path="/users('local-microsoft-account')/mailFolders('AAMkAGUwNc4LTMzAAA%3D')/messages/"
        query='?%24skiptoken=opaque%2f%2B%3D'
        def graph(url):
            if urlparse(url).path=='/me/mailFolders/sentitems/messages':return 200,{'value':[],'@odata.nextLink':origin+path+query}
            if urlparse(url).path==path:return 200,{'value':[self.reply_items[0]]}
            return previous(url)
        self.graph=graph
        self.assertEqual(self.reply_sync()['received'],0);self.assertEqual(self.reply_thread()['phase'],'discovery')
        self.assertEqual(self.reply_sync()['received'],0);self.assertEqual(self.reply_thread()['phase'],'conversation')
        self.assertIn(path+query,self.graph_reads)
        self.assertEqual(self.reply_sync()['received'],1);self.assertEqual(self.reply_thread()['last_error'],'')
    def test_reply_canonical_pagination_stays_in_connected_mailbox(self):
        _,_,origin=self.reply_setup();self.reply_sync();previous=self.graph
        paths=['/me/messages/', '/me/MailFolders/AAMkAGUwNc4LTMzAAA%3D/Messages', '/users/local-microsoft-account/messages', "/users('local-microsoft-account')/messages/", '/users/commercial%40example.invalid/messages']
        def graph(url):
            if urlparse(url).path in paths:return 200,{'value':self.reply_items}
            return previous(url)
        self.graph=graph
        for index,path in enumerate(paths):
            t=self.reply_thread();self.alter('messaging_email_threads',t['id'],next_link=origin+path+'?%24skiptoken=same%2f%2B%3D',next_attempt_at='2020-01-01 00:00:00.000Z')
            self.assertEqual(self.reply_sync()['received'],1 if index==0 else 0)
            self.assertIn(path+'?%24skiptoken=same%2f%2B%3D',self.graph_reads);self.assertEqual(self.reply_thread()['last_error'],'')
        before=len(self.graph_reads);t=self.reply_thread();self.alter('messaging_email_threads',t['id'],next_link=origin+'/users/another-account/messages?%24skiptoken=private',next_attempt_at='2020-01-01 00:00:00.000Z')
        self.assertEqual(self.reply_sync()['received'],0);self.assertEqual(len(self.graph_reads),before);self.assertIn('[P2:mailbox]',self.reply_thread()['last_error']);self.assertNotIn('another-account',self.reply_thread()['last_error'])
    def test_reply_failure_reports_stage_without_disclosing_private_response(self):
        self.reply_setup();self.reply_sync()
        self.reply_detail['body']['contentType']='html'
        self.assertEqual(self.reply_sync()['received'],0)
        self.assertEqual(self.reply_thread()['last_error'],'Réponse Microsoft incohérente ou corps texte indisponible.')
        self.assertNotIn('script',self.reply_thread()['last_error'])
        self.assertFalse(self.reply_thread()['claim'])
        self.reply_due();self.reply_detail['body']['contentType']='text'
        self.assertEqual(self.reply_sync()['received'],1);self.assertEqual(self.reply_thread()['last_error'],'')
    def test_reply_internal_error_names_the_stage_and_never_exposes_payload(self):
        self.reply_setup();self.reply_sync()
        valid=self.reply_items[1]
        self.reply_items[1]={**valid,'internetMessageHeaders':dict(private='NEVER-LOG-THIS-PRIVATE-CONTENT')}
        self.assertEqual(self.reply_sync()['received'],0)
        error=self.reply_thread()['last_error'];self.assertIn('Lecture de la conversation interrompue',error);self.assertNotIn('NEVER-LOG',error);self.assertNotIn('connexion Microsoft',error)
        self.reply_due();self.reply_items[1]=valid
        self.assertEqual(self.reply_sync()['received'],1);self.assertEqual(self.reply_thread()['last_error'],'')
    def test_reply_attachment_limits_preserve_text_and_warn(self):
        self.reply_setup();self.reply_files += [dict(id='bad',name='script.html',size=40,contentType='text/html',isInline=False,**{'@odata.type':'#microsoft.graph.fileAttachment'}),dict(id='large',name='archive.pdf',size=2097153,contentType='application/pdf',isInline=False,**{'@odata.type':'#microsoft.graph.fileAttachment'})]
        self.reply_sync();self.assertEqual(self.reply_sync()['received'],1)
        r=self.pb.request('GET','collections/messaging_email_replies/records',token=self.pb.admin_token)[1]['items'][0]
        self.assertEqual(len(r['attachments']),1);self.assertEqual(len(r['warnings']),2);self.assertIn('accord pour',r['body_text'])
    def test_reply_concurrent_claim_and_stale_resume(self):
        self.reply_setup();self.reply_sync()
        with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:self.reply_sync(),range(2)))
        self.assertEqual(sum(r['received'] for r in results),1)
        t=self.reply_thread();self.alter('messaging_email_threads',t['id'],claim='crashed-fixture',claimed_at='2020-01-01 00:00:00.000Z',next_attempt_at='2020-01-01 00:00:00.000Z')
        self.assertEqual(self.reply_sync()['received'],0);self.assertFalse(self.reply_thread()['claim'])

    def test_reply_trusted_pagination_and_descendant_resume(self):
        _,message,origin=self.reply_setup();self.reply_sync()
        self.reply_next=origin+'/me/messages?'+urlencode({'$skiptoken':'page-two'})
        self.assertEqual(self.reply_sync()['received'],1)
        first=self.reply_detail
        second={**first,'id':'reply-two','internetMessageId':'<reply-two@example.invalid>','hasAttachments':False,'internetMessageHeaders':[dict(name='In-Reply-To',value='<reply@example.invalid>')]}
        self.reply_items=[second];self.reply_detail=second;self.reply_next=''
        self.assertEqual(self.reply_sync()['received'],1)
        self.assertTrue(any('page-two' in path for path in self.graph_reads))
        records=self.pb.request('GET','collections/messaging_email_replies/records',token=self.pb.admin_token)[1]['items'];self.assertEqual(len(records),2);self.assertTrue(all(r['message']==message['id'] for r in records))
        self.reply_due();self.assertEqual(self.reply_sync()['received'],0)
    def test_reply_missing_read_consent_preserves_working_connection(self):
        self.reply_setup();previous=self.connection();self.scope='User.Read Mail.Send'
        callback=self.start_connection();self.assertEqual(self.call('POST','oauth/callback',callback)[0],400)
        self.assertEqual(self.connection()['generation'],previous['generation']);self.assertEqual(self.connection()['status'],'connected')
        # A mailbox waiting for read consent must not starve enabled mailboxes.
        self.alter('messaging_oauth_connections',previous['id'],granted_scopes=['User.Read','Mail.Send'])
        before=len(self.graph_reads);self.reply_sync_without_consent=self.call('POST','replies/sync',dict(mailbox=self.box['id']))
        self.assertEqual(self.reply_sync_without_consent[0],400);self.assertEqual(len(self.graph_reads),before)
        self.alter('messaging_oauth_connections',previous['id'],granted_scopes=None)
        self.assertEqual(self.call('GET','choices')[0],200)
        draft=self.draft('legacy-connection-null-scopes');code,draft=self.transition(draft,'enqueue');self.assertEqual(code,200,draft);self.process();self.assertEqual(self.get(draft)['status'],'sent')


class MessagingUpgradeTests(unittest.TestCase):
    def test_installed_0018_preserved_and_old_jobs_never_replayed(self):
        import subprocess
        pb=LocalPocketBase();self.addCleanup(pb.close)
        previous=Path(pb.temp.name)/'previous';previous.mkdir();empty=Path(pb.temp.name)/'empty-hooks';empty.mkdir();shutil.copytree(ROOT/'pocketbase/pb_hooks/lib',empty/'lib')
        for path in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if path.name<'1791840019':shutil.copy(path,previous)
        original=pb.args[:];pb.args=[a for a in original if not a.startswith(('--migrationsDir=','--hooksDir='))]+[f'--migrationsDir={previous}',f'--hooksDir={empty}'];pb.start()
        box=pb.create('messaging_mailboxes',dict(name='Existing',address='old@example.invalid',active=True,allowed_users=[pb.user['id']]))
        old={}
        for status in ['pending','processing','sent','draft']:
            r=pb.create('messaging_email_messages',dict(owner=pb.user['id'],mailbox=box['id'],from_address=box['address'],subject='Historical '+status,body_json=DOC,html='<p>Historique</p>',text='Historique',to=['recipient@example.invalid'],cc=[],bcc=[],status=status,source_context='generic',creation_key='historical-key-'+status))
            if status!='draft':pb.create('messaging_outbox',dict(message=r['id'],status='complete' if status=='sent' else status,next_attempt_at='2020-01-01 00:00:00.000Z',attempts=1))
            if status=='sent':
                raw=b'%PDF-1.4\nhistorical protected attachment\n%%EOF';boundary='migration-mail-file'
                body=(f'--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="historical.pdf"\r\nContent-Type: application/pdf\r\n\r\n'.encode()+raw+f'\r\n--{boundary}--\r\n'.encode())
                req=Request(pb.url+'/api/collections/messaging_email_messages/records/'+r['id'],data=body,headers={'Authorization':pb.admin_token,'Content-Type':'multipart/form-data; boundary='+boundary},method='PATCH')
                with urlopen(req) as response:r=json.load(response)
            old[status]=r
        company=pb.create('contacts_companies',dict(name='Conserver société',active=True))
        pb.process.terminate();pb.process.wait(timeout=10)
        # Exercise a genuinely installed 0019 before applying the additive reply migration.
        shutil.copy(ROOT/'pocketbase/pb_migrations/1791840019_messaging_oauth.js',previous)
        result=subprocess.run(pb.args+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        pb.launch_and_authenticate(pb.args)
        connection=pb.create('messaging_oauth_connections',dict(mailbox=box['id'],tenant_id='fixture-tenant',client_id='fixture-client',account_id='fixture-account',account_address=box['address'],connected_by=pb.user['id'],status='connected',generation='existing-generation',access_cipher='existing-encrypted-access',refresh_cipher='existing-encrypted-refresh'))
        business=pb.create('messaging_email_messages',dict(owner=pb.user['id'],mailbox=box['id'],from_address=box['address'],subject='Existing commercial mail',body_json=DOC,html='<p>Business</p>',text='Business',to=['recipient@example.invalid'],cc=[],bcc=[],status='sent',source_context='sales_quote',source_id='aaaaaaaaaaaaaaa',creation_key='historical-business-backfill'))
        pb.process.terminate();pb.process.wait(timeout=10)
        for _ in range(2):
            result=subprocess.run(original+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        pb.args=original;pb.launch_and_authenticate(original)
        current_box=pb.request('GET','collections/messaging_mailboxes/records/'+box['id'],token=pb.admin_token)[1];self.assertFalse(current_box.pop('receive_enabled'));self.assertEqual(current_box,box)
        self.assertEqual(pb.request('GET','collections/contacts_companies/records/'+company['id'],token=pb.admin_token)[1],company)
        for status,r in old.items():
            current=pb.request('GET','collections/messaging_email_messages/records/'+r['id'],token=pb.admin_token)[1]
            self.assertEqual(current['status'],dict(pending='failed',processing='uncertain').get(status,status))
            if status in ['sent','draft']:self.assertEqual(current,r)
            else:
                for field in ['subject','body_json','html','text','to','owner','mailbox','creation_key']:self.assertEqual(current[field],r[field])
        file_token=pb.request('POST','files/token',{},pb.admin_token)[1]['token'];r=old['sent']
        with urlopen(pb.url+'/api/files/'+r['collectionId']+'/'+r['id']+'/'+r['attachments'][0]+'?'+urlencode({'token':file_token})) as response:self.assertEqual(response.read(),raw)
        current=pb.request('GET','collections/messaging_oauth_connections/records/'+connection['id'],token=pb.admin_token)[1];self.assertIn(current.pop('granted_scopes'),[None,[]]);self.assertEqual(current,connection)
        threads=pb.request('GET','collections/messaging_email_threads/records',token=pb.admin_token)[1]['items'];self.assertEqual(len(threads),1);self.assertEqual(threads[0]['message'],business['id'])
        import sqlite3
        with sqlite3.connect(pb.data/'data.db') as db:self.assertEqual(db.execute('SELECT access_cipher,refresh_cipher FROM messaging_oauth_connections WHERE id=?',(connection['id'],)).fetchone(),('existing-encrypted-access','existing-encrypted-refresh'))
        self.assertEqual(pb.request('GET','collections/messaging_email_templates/records',token=pb.admin_token)[1]['totalItems'],3)
        self.assertEqual(hashlib.sha256((ROOT/'pocketbase/pb_migrations/1791840018_messaging_email.js').read_bytes()).hexdigest(),'3288190d3ecafbda9c2fd962b13be55753085bebe118ce21d1762ae50af743b1')

if __name__ == '__main__': unittest.main(verbosity=2)

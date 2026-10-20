"""Personal mail signatures use Messaging ownership and real local PocketBase."""
import unittest
from check_auth import LocalPocketBase
DOC={'type':'doc','content':[{'type':'paragraph','content':[{'type':'text','text':'Cordialement {{utilisateur.nom}}'}]}]}
class PersonalSignatureTests(unittest.TestCase):
    def setUp(self):
        self.pb=LocalPocketBase().start(); self.addCleanup(self.pb.close)
        role=self.pb.create('core_roles',dict(name='signature',label='Signature',active=True,permissions=['messaging.read','messaging.write','messaging.settings']))
        self.user=self.pb.create_user('signature@local.invalid',role['id']); self.other=self.pb.create_user('signature-other@local.invalid',role['id']); self.admin=self.pb.create_user('signature-admin@local.invalid',role['id'],'admin')
        self.token=self.pb.login(self.user['email'])[1]['token']; self.second=self.pb.login(self.other['email'])[1]['token']; self.admin_token=self.pb.login(self.admin['email'])[1]['token']
        self.input=dict(name='Signature personnelle',body_json=DOC,active=True,is_default=True)
        code,self.company=self.pb.request('POST','horizon/messaging/settings',dict(kind='signatures',input={**self.input,'name':'Société','user':''}),self.admin_token); self.assertEqual(code,200,self.company)
    def save(self,input=None,record=None,token=None,**extra):
        return self.pb.request('POST','horizon/messaging/personal-signatures',dict(input=self.input if input is None else input,**({'id':record['id'],'updated':record['updated']} if record else {}),**extra),token or self.token)
    def read(self,token=None): return self.pb.request('GET','horizon/messaging/personal-signatures',token=token or self.token)
    def test_ownership_defaults_and_administration_remain_separate(self):
        self.assertEqual(self.pb.request('GET','horizon/messaging/personal-signatures')[0],401)
        self.assertEqual(self.read()[1]['items'],[])
        status,first=self.save(); self.assertEqual(status,200,first); self.assertEqual(first['user'],self.user['id'])
        status,second=self.save({**self.input,'name':'Nouvelle'}); self.assertEqual(status,200,second)
        records=self.read()[1]['items']; self.assertEqual(len(records),2); self.assertEqual([r['id'] for r in records if r['is_default']],[second['id']])
        self.assertEqual(self.read(self.second)[1]['items'],[])
        self.assertEqual(self.save(record=second,token=self.second)[0],403)
        self.assertEqual(self.save(record=self.company)[0],403)
        self.assertEqual(self.save(input={**self.input,'user':self.other['id']})[0],400)
        self.assertEqual(self.save(user=self.other['id'])[0],400)
        company=self.pb.request('GET','collections/messaging_email_signatures/records/'+self.company['id'],token=self.pb.admin_token)[1]; self.assertTrue(company['is_default']); self.assertEqual(company['user'],'')
        self.assertEqual(self.pb.request('POST','horizon/messaging/settings',dict(kind='signatures',input={**self.input,'user':''}),self.token)[0],403)
        self.assertEqual(self.pb.request('PATCH','collections/messaging_email_signatures/records/'+second['id'],dict(user=''),self.token)[0],403)
    def test_validation_concurrency_and_draft_snapshot(self):
        for input in [{**self.input,'name':''},{**self.input,'active':'true'},{**self.input,'body_json':{'type':'doc','content':[{'type':'script','text':'unsafe'}]}},{**self.input,'body_json':{'type':'doc','content':[{'type':'text','text':'{{secret}}'}]}}]: self.assertEqual(self.save(input)[0],400)
        status,signature=self.save(); self.assertEqual(status,200,signature)
        status,box=self.pb.request('POST','horizon/messaging/settings',dict(kind='mailboxes',input=dict(name='Compte',address='signature@example.invalid',active=True,allowed_users=[self.user['id']])),self.admin_token); self.assertEqual(status,200,box)
        code,rendered=self.pb.request('POST','horizon/messaging/render',dict(context='generic',source='',template='',mailbox=box['id'],signature=signature['id']),self.token); self.assertEqual(code,200,rendered)
        self.assertIn(self.user['name'],str(rendered['signature_snapshot']))
        code,draft=self.pb.request('POST','horizon/messaging/messages',dict(creation_key='personal-signature-draft',removed=[],input=dict(mailbox=box['id'],context='generic',source='',source_version='',subject='Objet',to=['client@example.invalid'],cc=[],bcc=[],body_json=DOC,signature_snapshot=rendered['signature_snapshot'],pdf_template='')),self.token); self.assertEqual(code,200,draft)
        status,changed=self.save({**self.input,'name':'Modifiée'},signature); self.assertEqual(status,200,changed)
        self.assertEqual(self.save(record=signature)[0],409)
        code,after=self.pb.request('GET','horizon/messaging/messages/'+draft['id'],token=self.token); self.assertEqual(code,200,after); self.assertEqual(after['signature_snapshot'],rendered['signature_snapshot'])
        status,choices=self.pb.request('GET','horizon/messaging/choices',token=self.token); self.assertEqual(status,200,choices); self.assertIn(signature['id'],[r['id'] for r in choices['signatures']])
    def test_disabled_roles_viewers_and_accounts_denied(self):
        self.assertEqual(self.read(self.pb.login()[1]['token'])[0],403)
        role=self.pb.create('core_roles',dict(name='signature_viewer',label='Lecteur',active=True,permissions=['messaging.read','messaging.write']))
        viewer=self.pb.create_user('signature-viewer@local.invalid',role['id'],'viewer'); token=self.pb.login(viewer['email'])[1]['token']
        self.assertEqual(self.read(token)[0],200); self.assertEqual(self.save(token=token)[0],403)
        self.pb.request('PATCH','collections/core_users/records/'+self.user['id'],dict(active=False),self.pb.admin_token)
        self.assertIn(self.save()[0],[401,403]); self.assertIn(self.read()[0],[401,403])
if __name__=='__main__': unittest.main()

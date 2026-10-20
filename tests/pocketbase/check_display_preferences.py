"""Personal display preferences on disposable PocketBase, never the NAS."""
import unittest
from check_auth import LocalPocketBase

class DisplayPreferenceTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.addCleanup(self.pb.close)
        self.token = self.pb.login()[1]['token']
        self.second = self.pb.login('other@local.invalid')[1]['token']
        self.path = 'horizon/account/display-preferences'
        self.preference = dict(showCounters=False, highlightNonZero=True)

    def save(self, revision=0, preference=None, token=None, **extra):
        return self.pb.request('POST',self.path,dict(revision=revision,preference=self.preference if preference is None else preference,**extra),token or self.token)

    def test_defaults_persistence_isolation_and_locked_api(self):
        self.assertEqual(self.pb.request('GET',self.path)[0],401)
        status,defaults=self.pb.request('GET',self.path,token=self.token)
        self.assertEqual(status,200,defaults)
        self.assertEqual(defaults,dict(revision=0,preference=dict(showCounters=True,highlightNonZero=True,theme='default',searchWidth=None,sidebarWidth=None,density='default')))
        status,saved=self.save(); self.assertEqual(status,200,saved)
        self.assertEqual(saved,dict(revision=1,preference={**defaults['preference'],**self.preference}))
        # A new authenticated session / browser reads the same preference.
        self.assertEqual(self.pb.request('GET',self.path,token=self.pb.login()[1]['token'])[1],saved)
        self.assertEqual(self.pb.request('GET',self.path,token=self.second)[1],defaults)
        records=self.pb.request('GET','collections/core_display_preferences/records',token=self.pb.admin_token)[1]['items']
        self.assertEqual(len(records),1)
        path='collections/core_display_preferences/records/'+records[0]['id']
        for method,body in [('GET',None),('PATCH',dict(preference=self.preference)),('DELETE',None)]:
            self.assertNotIn(self.pb.request(method,path,body,self.token)[0],[200,204])
        self.assertNotEqual(self.pb.request('POST','collections/core_display_preferences/records',{},self.token)[0],200)

    def test_validation_conflict_and_atomicity(self):
        for preference in [dict(showCounters='false',highlightNonZero=True),dict(showCounters=True),dict(showCounters=True,highlightNonZero=True,admin=True),[],None]:
            if preference is None:
                code,_=self.pb.request('POST',self.path,dict(revision=0,preference=None),self.token)
            else: code,_=self.save(preference=preference)
            self.assertEqual(code,400,preference)
        for revision in [-1,0.5,'0',True]: self.assertEqual(self.save(revision=revision)[0],400)
        self.assertEqual(self.save(user=self.pb.user['id'])[0],400)
        status,saved=self.save(); self.assertEqual(status,200,saved)
        self.assertEqual(self.save()[0],409)
        self.assertEqual(self.pb.request('GET',self.path,token=self.token)[1],saved)
        self.assertEqual(self.save(1,dict(showCounters=True,highlightNonZero=False))[0],200)
        audit=self.pb.request('GET','collections/core_audit/records?filter=action="display_preferences_update"',token=self.pb.admin_token)[1]['items']
        self.assertEqual(len(audit),2)

    def test_comfort_legacy_defaults_partial_client_and_limits(self):
        legacy=self.pb.create('core_display_preferences',dict(user=self.pb.user['id'],preference=self.preference,revision=7))
        status,current=self.pb.request('GET',self.path,token=self.token); self.assertEqual(status,200,current)
        self.assertEqual(current['revision'],7); self.assertEqual(current['preference']['theme'],'default'); self.assertIsNone(current['preference']['searchWidth'])
        override={**self.preference, 'theme':'dark','searchWidth':650,'sidebarWidth':240,'density':'compact'}
        status,saved=self.save(7,override); self.assertEqual(status,200,saved)
        self.assertEqual(self.save(8)[1]['preference'],override) # Older frontend keeps stored overrides.
        for extra in [dict(theme='unknown'),dict(density='huge'),dict(searchWidth=399),dict(searchWidth=1201),dict(searchWidth=600.5),dict(sidebarWidth=179),dict(sidebarWidth=361),dict(sidebarWidth='240')]:
            self.assertEqual(self.save(9,{**self.preference,**extra})[0],400,extra)
        self.assertEqual(self.pb.request('GET',self.path,token=self.token)[1]['revision'],9)
        status,saved=self.save(9,{**self.preference,'theme':'default','searchWidth':None,'sidebarWidth':None,'density':'default'})
        self.assertEqual(status,200,saved); self.assertIsNone(saved['preference']['searchWidth'])
        self.assertEqual(self.pb.request('GET','collections/core_display_preferences/records/'+legacy['id'],token=self.pb.admin_token)[1]['revision'],10)

    def test_inactive_account_and_role_denied(self):
        self.pb.request('PATCH','collections/core_users/records/'+self.pb.user['id'],dict(active=False),self.pb.admin_token)
        self.assertIn(self.pb.request('GET',self.path,token=self.token)[0],[401,403])
        self.assertIn(self.save()[0],[401,403])
        self.pb.request('PATCH','collections/core_users/records/'+self.pb.user['id'],dict(active=True),self.pb.admin_token)
        self.pb.request('PATCH','collections/core_roles/records/'+self.pb.user['role'],dict(active=False),self.pb.admin_token)
        self.assertIn(self.pb.request('GET',self.path,token=self.token)[0],[401,403])
        self.assertIn(self.save()[0],[401,403])

if __name__=='__main__': unittest.main()

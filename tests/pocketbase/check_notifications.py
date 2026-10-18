"""Recipient permissions on disposable PocketBase only."""
import unittest
from check_auth import LocalPocketBase

class NotificationTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase()
        self.addCleanup(self.pb.close)
        self.pb.start()
        self.first = self.pb.login()[1]
        self.second = self.pb.login('other@local.invalid')[1]

    def test_private_inbox_and_server_owned_read_timestamp(self):
        message = self.pb.create('core_notifications', {'user': self.first['record']['id'], 'title': 'Une alerte', 'body': 'Privée', 'source_module': 'contacts'})
        route = f'collections/core_notifications/records/{message["id"]}'
        for token in ['', self.second['token']]:
            self.assertEqual(self.pb.request('GET', route, token=token)[0], 404)
            self.assertNotEqual(self.pb.request('PATCH', route, {'read_at': '2026-01-01 00:00:00.000Z'}, token)[0], 200)
        self.assertEqual(self.pb.request('GET', 'collections/core_notifications/records', token=self.second['token'])[1]['totalItems'], 0)
        token = self.first['token']
        self.assertEqual(self.pb.request('GET', route, token=token)[0], 200)
        for payload in [{'title': 'Réécrite'}, {'body': 'Réécrit'}, {'user': self.second['record']['id']}, {'source_module': 'billing'}]:
            self.assertNotEqual(self.pb.request('PATCH', route, payload, token)[0], 200)
        self.assertEqual(self.pb.request('POST', 'collections/core_notifications/records', {'user': self.first['record']['id'], 'title': 'Fraude'}, token)[0], 403)
        self.assertEqual(self.pb.request('DELETE', route, token=token)[0], 403)
        status, saved = self.pb.request('PATCH', route, {'read_at': '2026-01-01 00:00:00.000Z'}, token)
        self.assertEqual(status, 200, saved)
        self.assertTrue(saved['read_at'])
        self.assertNotEqual(saved['read_at'], '2026-01-01 00:00:00.000Z')
        _, again = self.pb.request('PATCH', route, {'read_at': ''}, token)
        self.assertEqual(again['read_at'], saved['read_at'])
        self.assertEqual(again['title'], 'Une alerte')

    def test_targeted_inbox_count_privacy_read_and_dismiss(self):
        import time
        token=self.first['token'];owner=self.first['record']['id']
        visible=self.pb.create('core_notifications',dict(user=owner,title='Visible'))
        self.pb.create('core_notifications',dict(user=self.second['record']['id'],title='Autre compte'))
        # Missing source and missing module permission must be removed before
        # projection and unread counting, even if the alert is owned.
        self.pb.create('core_notifications',dict(user=owner,type='activity',source_module='sales',source_entity='sales_quotes',source_record_id='aaaaaaaaaaaaaaa',title='Source disparue'))
        # Representative unrelated source volume, inserted only in this disposable
        # fixture. Inbox must read owned alerts rather than join these catalogues.
        import sqlite3
        with sqlite3.connect(self.pb.data/'data.db') as db:
            db.executemany('INSERT INTO contacts_companies (id,name) VALUES (?,?)',[(f'{i:015d}',f'PERF-{i}') for i in range(1000)])
            db.executemany('INSERT INTO sales_quotes (id,quote_number,quote_sequence,creation_key) VALUES (?,?,?,?)',[(f'{i:015d}',f'PERF-{i}',i+1,f'perf-{i}') for i in range(1000)])
            db.executemany('INSERT INTO purchasing_orders (id,order_number,creation_key) VALUES (?,?,?)',[(f'{i:015d}',f'PERF-{i}',f'perf-{i}') for i in range(1000)])
        path='horizon/notifications/inbox'
        started=time.monotonic();code,inbox=self.pb.request('GET',path,token=token)
        self.assertEqual(code,200,inbox);self.assertLess(time.monotonic()-started,2)
        self.assertEqual(inbox['unread'],1);self.assertEqual([r['id'] for r in inbox['items']],[visible['id']])
        self.assertNotIn('user',inbox['items'][0]);self.assertEqual(self.pb.request('GET',path)[0],401)
        read='horizon/notifications/'+visible['id']+'/read'
        self.assertEqual(self.pb.request('POST',read,{},self.second['token'])[0],404)
        self.assertEqual(self.pb.request('POST',read,{},token)[0],200)
        first_read=self.pb.request('GET',path,token=token)[1];self.assertEqual(first_read['unread'],0);self.assertTrue(first_read['items'][0]['read_at'])
        self.assertEqual(self.pb.request('POST',read,{},token)[0],200)
        self.assertEqual(self.pb.request('GET',path,token=token)[1],first_read)
        self.assertEqual(self.pb.request('POST','horizon/notifications/'+visible['id']+'/dismiss',{},token)[0],200)
        self.assertEqual(self.pb.request('GET',path,token=token)[1],dict(unread=0,items=[]))

    def preferences(self, token=None):
        code, result = self.pb.request('GET', 'horizon/notifications/preferences', token=token or self.first['token'])
        self.assertEqual(code, 200, result)
        return result

    def test_personal_preferences_validation_privacy_and_concurrency(self):
        token=self.first['token']; baseline=self.preferences()
        self.assertEqual(len(baseline['items']),10);self.assertTrue(all(i['in_app'] for i in baseline['items']))
        for bad in [{**baseline,'user':self.second['record']['id']},{**baseline,'items':baseline['items'][:-1]},{**baseline,'items':[{**i,'email':True} for i in baseline['items']]}]:
            self.assertEqual(self.pb.request('POST','horizon/notifications/preferences',bad,token)[0],400)
        changed={**baseline,'items':[{**i,'in_app':False} if i['event_type']=='mentions' else i for i in baseline['items']]}
        code,saved=self.pb.request('POST','horizon/notifications/preferences',changed,token);self.assertEqual(code,200,saved)
        self.assertNotEqual(saved['version'],baseline['version'])
        self.assertEqual(self.pb.request('POST','horizon/notifications/preferences',baseline,token)[0],409)
        self.assertTrue(all(i['in_app'] for i in self.preferences(self.second['token'])['items']))
        rows=self.pb.request('GET','collections/core_notification_preferences/records',token=token)[1]['items'];self.assertEqual(len(rows),10)
        self.assertFalse(any(r['email'] for r in rows))
        self.assertEqual(self.pb.request('GET','collections/core_notification_preferences/records',token=self.second['token'])[1]['totalItems'],0)
        self.assertNotEqual(self.pb.request('PATCH','collections/core_notification_preferences/records/'+rows[0]['id'],{'in_app':True},token)[0],200)
        self.assertEqual(self.pb.request('GET','horizon/notifications/preferences')[0],401)

    def test_dismiss_own_alert_idempotently_and_only_read_bulk(self):
        token=self.first['token'];owner=self.first['record']['id']
        first=self.pb.create('core_notifications',dict(user=owner,title='Alerte 1'))
        second=self.pb.create('core_notifications',dict(user=owner,title='Alerte 2'))
        third=self.pb.create('core_notifications',dict(user=self.second['record']['id'],title='Autre compte'))
        path='horizon/notifications/'+first['id']+'/dismiss'
        self.assertEqual(self.pb.request('POST',path,{},self.second['token'])[0],404)
        self.assertEqual(self.pb.request('POST',path,{})[0],401)
        self.assertNotEqual(self.pb.request('PATCH','collections/core_notifications/records/'+first['id'],{'dismissed_at':'2026-01-01T00:00:00.000Z'},token)[0],200)
        self.assertEqual(self.pb.request('POST',path,{},token)[0],200)
        saved=self.pb.request('GET','collections/core_notifications/records/'+first['id'],token=token)[1]
        self.assertTrue(saved['dismissed_at']);self.assertTrue(saved['read_at'])
        self.assertEqual(self.pb.request('POST',path,{},token)[0],200)
        self.assertEqual(self.pb.request('GET','collections/core_notifications/records/'+first['id'],token=token)[1],saved)
        self.assertEqual(self.pb.request('POST','horizon/notifications/dismiss-read',{},token)[1]['dismissed'],0)
        self.pb.request('PATCH','collections/core_notifications/records/'+second['id'],{'read_at':'2026-01-01T00:00:00.000Z'},token)
        self.assertEqual(self.pb.request('POST','horizon/notifications/dismiss-read',{},token)[1]['dismissed'],1)
        self.assertFalse(self.pb.request('GET','collections/core_notifications/records/'+third['id'],token=self.second['token'])[1]['dismissed_at'])
        self.assertEqual(self.pb.request('DELETE','collections/core_notifications/records/'+first['id'],token=token)[0],403)

    def test_disabled_mention_preserves_event_and_task_preference(self):
        from check_activity import ActivityTests
        f=ActivityTests();f.setUp();self.addCleanup(f.pb.close)
        code,prefs=f.pb.request('GET','horizon/notifications/preferences',token=f.reader);self.assertEqual(code,200,prefs)
        prefs['items']=[{**i,'in_app':False} if i['event_type']=='mentions' else i for i in prefs['items']]
        self.assertEqual(f.pb.request('POST','horizon/notifications/preferences',prefs,f.reader)[0],200)
        code,event=f.post(body='Mention silencieuse',mentions=[f.pb.user['id']]);self.assertEqual(code,200,event)
        alerts=f.pb.request('GET','collections/core_notifications/records',token=f.reader)[1];self.assertEqual(alerts['totalItems'],0)
        mentions=f.pb.request('GET','collections/core_activity_mentions/records',token=f.pb.admin_token)[1]['items'];self.assertEqual(len(mentions),1);self.assertFalse(mentions[0]['notified_at'])
        code,event=f.post(type='task',body='Tâche et mention',mentions=[f.pb.user['id']],metadata={'task':{'title':'À faire','assigned_to':f.pb.user['id'],'due_date':'','priority':'normal'}});self.assertEqual(code,200,event)
        alerts=f.pb.request('GET','collections/core_notifications/records',token=f.reader)[1];self.assertEqual(alerts['totalItems'],1);self.assertEqual(alerts['items'][0]['event_type'],'tasks')

    def test_leave_and_expense_preferences_do_not_block_validation(self):
        from check_leave import LeaveTests
        from check_expenses import ExpensesTests
        for cls,prefix,decision in [(LeaveTests,'leave','approve'),(ExpensesTests,'expense','validate')]:
            f=cls();f.setUp();self.addCleanup(f.pb.close)
            for person in ['owner','manager']:
                token=f.people[person]['token'];code,prefs=f.pb.request('GET','horizon/notifications/preferences',token=token);self.assertEqual(code,200,prefs)
                prefs['items']=[{**i,'in_app':False} if i['event_type'].startswith(prefix+'_') else i for i in prefs['items']]
                self.assertEqual(f.pb.request('POST','horizon/notifications/preferences',prefs,token)[0],200)
            if prefix=='leave':
                self.assertEqual(f.allocate()[0],200);record=f.draft()
            else:
                record=f.report();code,record=f.line(record);self.assertEqual(code,200,record)
            code,record=f.transition(record,'submit');self.assertEqual(code,200,record)
            code,record=f.transition(record,decision,'manager');self.assertEqual(code,200,record)
            self.assertEqual(record['status'],'approved' if prefix=='leave' else 'validated')
            for person in ['owner','manager']:
                code,alerts=f.pb.request('GET','collections/core_notifications/records',token=f.people[person]['token']);self.assertEqual(code,200,alerts);self.assertEqual(alerts['totalItems'],0)

class NotificationUpgradeTests(unittest.TestCase):
    def test_upgrade_preserves_existing_alerts_and_ux_settings(self):
        import shutil, subprocess
        from pathlib import Path
        from check_auth import ROOT
        pb=LocalPocketBase();self.addCleanup(pb.close)
        previous=Path(pb.temp.name)/'previous';previous.mkdir()
        for path in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if path.name<'1791840023':shutil.copy(path,previous)
        current_args=pb.args[:];pb.args=[a for a in current_args if not a.startswith('--migrationsDir=')]+[f'--migrationsDir={previous}'];pb.start()
        user=pb.login()[1];message=pb.create('core_notifications',dict(user=user['record']['id'],title='Historique conservé',body='Message existant'))
        code,read=pb.request('PATCH','collections/core_notifications/records/'+message['id'],dict(read_at='2026-01-01T00:00:00Z'),user['token']);self.assertEqual(code,200,read)
        settings=pb.request('GET','horizon/settings/ux',token=user['token'])[1]
        config={**settings['config'],'sidebar_width':260}
        self.assertEqual(pb.request('PATCH','collections/settings_ux/records/'+settings['id'],dict(config=config),pb.admin_token)[0],200)
        pb.process.terminate();pb.process.wait(timeout=10)
        for _ in range(2):
            result=subprocess.run(current_args+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        pb.args=current_args;pb.launch_and_authenticate(current_args);token=pb.login()[1]['token']
        after=pb.request('GET','collections/core_notifications/records/'+message['id'],token=token)[1]
        for key in ['title','body','created','read_at','user']:self.assertEqual(after[key],read[key])
        self.assertFalse(after['dismissed_at'])
        self.assertEqual(pb.request('GET','horizon/settings/ux',token=token)[1]['config'],{**config,'search_width':840})
        prefs=pb.request('GET','horizon/notifications/preferences',token=token)[1];self.assertTrue(all(i['in_app'] for i in prefs['items']))

if __name__ == '__main__':
    unittest.main()

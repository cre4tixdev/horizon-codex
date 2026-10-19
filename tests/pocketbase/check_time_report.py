"""TimeReport: real minutes, atomic weekly workflow, permissions and historical rates."""
import unittest
from concurrent.futures import ThreadPoolExecutor
from check_auth import LocalPocketBase

class TimeTests(unittest.TestCase):
    def setUp(self):
        self.pb=LocalPocketBase().start();self.addCleanup(self.pb.close);self.people={}
        self.team=self.pb.create('core_teams',dict(code='time-be',name='Études',active=True,time_work_type='be'))
        for key,actions,scope in [('owner',['read','write','submit'],'self'),('manager',['read','validate'],'reports'),('other',['read','write','submit'],'self'),('hr',['read','write','submit','validate','settings','costs'],'all')]:
            role=self.pb.create('core_roles',dict(name='time_'+key,label=key,active=True,permissions=['time.'+a for a in actions]))
            emp=self.pb.create('hr_employees',dict(first_name=key,last_name='Time',status='active',employment_type='employee',team=self.team['id'],time_reporting_enabled=True,is_manager=key=='manager'))
            user=self.pb.create_user(key+'-time@local.invalid',role['id'])
            status,r=self.pb.request('PATCH','collections/core_users/records/'+user['id'],dict(employee=emp['id'],time_scope=scope),self.pb.admin_token);self.assertEqual(status,200,r)
            self.people[key]=dict(user=user,employee=emp,token=self.pb.login(key+'-time@local.invalid')[1]['token'])
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],dict(manager=self.people['manager']['employee']['id']),self.pb.admin_token)
        hr=self.people['hr'];role=hr['user']['role']
        self.pb.request('PATCH','collections/core_roles/records/'+role,dict(permissions=['time.'+a for a in ['read','write','submit','validate','settings','costs']]+['inventory.read','inventory.write']),self.pb.admin_token)
        code,choices=self.pb.request('GET','horizon/inventory/choices',token=hr['token']);self.assertEqual(code,200,choices)
        product=dict(sku='TIME-BE',name='BE Plans',description='',kind='service',manufacturer='CVS',category=next(r['id'] for r in choices['categories'] if r['code']=='services'),base_unit=next(r['id'] for r in choices['units'] if r['code']=='h'),sale_currency='EUR',sale_enabled=True,purchase_enabled=False,stock_policy='none',replenishment_policy='manual',tracking='none',manufacturer_ref='',barcode='',variant_group='',reference_cost=0,offers=[])
        code,self.product=self.pb.request('POST','horizon/inventory/products/save',dict(creation_key='time-test-service-creation',input=product),hr['token']);self.assertEqual(code,200,self.product)
        code,activity=self.call('POST','settings',dict(area='activities',input=dict(product=self.product['id'],active=True,work_types=['be'],valid_from='',valid_to='')),'hr');self.assertEqual(code,200,activity)
        accounts=self.pb.request('GET','collections/accounting_analytic_accounts/records?perPage=100',token=self.pb.admin_token)[1]['items']
        self.account=next(r for r in accounts if r.get('fixed_key')=='time_internal')
    def call(self,method,path,body=None,who='owner'):return self.pb.request(method,'horizon/time/'+path,body,self.people[who]['token'])
    def line(self,minutes=120):return dict(id='',product=self.product['id'],analytic_account='',sales_order_line='',context='internal',days=[dict(minutes=minutes if i==0 else 0,description='Plans' if i==0 else '') for i in range(7)])
    def draft(self,day='2026-10-05',minutes=120):
        code,r=self.call('POST','week',dict(week_start=day,revision=0,lines=[self.line(minutes)]));self.assertEqual(code,200,r);return r
    def transition(self,r,action,who='owner',**extra):return self.call('POST','sheets/'+r['id']+'/transition',dict(revision=r['revision'],action=action,manager=self.people['manager']['user']['id'],**({'reason':''}|extra)),who)
    def correction(self,r,who='manager',reason='Durée corrigée après vérification',minutes=180):
        line={key:r['lines'][0][key] for key in ['id','product','analytic_account','sales_order_line','context','days']}
        line['days']=[dict(minutes=minutes if i==0 else 0,description='Plans corrigés' if i==0 else '') for i in range(7)]
        return self.call('POST','sheets/'+r['id']+'/correct',dict(week_start=r['week_start'],revision=r['revision'],lines=[line],reason=reason),who)
    def test_manager_can_correct_submitted_sheet_without_personal_write_right(self):
        r=self.draft(); self.assertEqual(self.correction(r)[0],403)
        code,r=self.transition(r,'submit'); self.assertEqual(code,200,r)
        original=r.copy(); self.assertIn('correct',self.call('GET','sheets/'+r['id'],who='manager')[1]['actions'])
        self.assertEqual(self.correction(r,who='owner')[0],403); self.assertEqual(self.correction(r,who='other')[0],403)
        self.assertEqual(self.correction(r,reason='')[0],400); self.assertEqual(self.correction(r,minutes=0)[0],400)
        self.assertEqual(self.correction(r,minutes=1441)[0],400)
        # Manager neither enters personal hours nor has time.write; these are review corrections.
        manager=self.people['manager']['employee']; self.pb.request('PATCH','collections/hr_employees/records/'+manager['id'],dict(time_reporting_enabled=False,team=''),self.pb.admin_token)
        code,changed=self.correction(r); self.assertEqual(code,200,changed); self.assertEqual(changed['status'],'submitted'); self.assertEqual(changed['total_minutes'],180)
        for key in ['employee','user','manager','week_start']: self.assertEqual(changed[key],original[key])
        self.assertEqual(changed['revision'],r['revision']+1); self.assertEqual(self.correction(r)[0],409)
        self.assertEqual(self.transition(r,'validate','manager')[0],409)
        code,owner=self.call('GET','sheets/'+r['id']); self.assertEqual(code,200,owner); self.assertEqual(owner['total_minutes'],180); self.assertNotIn('edit',owner['actions'])
        audits=self.pb.request('GET','collections/core_audit/records?filter=entity_id="'+r['id']+'"&sort=-created,-id',token=self.pb.admin_token)[1]['items']
        change=next(row for row in audits if row['user']==self.people['manager']['user']['id']); self.assertEqual(change['before']['entries'][0]['duration_minutes'],120); self.assertEqual(change['after']['entries'][0]['duration_minutes'],180)
        feed=self.call('GET','sheets/'+r['id'])[1]; self.assertEqual(feed['total_minutes'],180)
        events=self.pb.request('GET','horizon/activity/events?entity=time_sheets&id='+r['id'],token=self.people['owner']['token'])[1]['items']; self.assertTrue(any('Durée corrigée après vérification' in event['body'] for event in events))
        notes=self.pb.request('GET','collections/core_notifications/records',token=self.pb.admin_token)[1]['items']; self.assertTrue(any(row['user']==self.people['owner']['user']['id'] and 'corrigée' in row['title'] for row in notes))
        code,validated=self.transition(changed,'validate','manager'); self.assertEqual(code,200,validated); self.assertEqual(validated['total_minutes'],180); self.assertEqual(self.correction(validated)[0],403)
        entries=self.pb.request('GET','collections/time_entries/records',token=self.pb.admin_token)[1]['items']; self.assertTrue(all(e['status']=='validated' for e in entries)); self.assertTrue(all(e['employee']==r['employee'] for e in entries))
    def test_manager_correction_revoked_scope_source_and_identity_are_guarded(self):
        r=self.draft(); _,r=self.transition(r,'submit')
        manager=self.people['manager']['user']
        self.pb.request('PATCH','collections/core_roles/records/'+manager['role'],dict(permissions=['time.read']),self.pb.admin_token)
        self.assertEqual(self.correction(r)[0],403)
        self.pb.request('PATCH','collections/core_roles/records/'+manager['role'],dict(permissions=['time.read','time.validate']),self.pb.admin_token)
        self.pb.request('PATCH','collections/core_users/records/'+manager['id'],dict(time_scope='self'),self.pb.admin_token); self.assertEqual(self.correction(r)[0],403)
        self.pb.request('PATCH','collections/core_users/records/'+manager['id'],dict(time_scope='reports'),self.pb.admin_token)
        import sqlite3
        with sqlite3.connect(self.pb.data/'data.db') as db: db.execute('UPDATE time_sheets SET source_provider="onsite",work_type="production" WHERE id=?',(r['id'],))
        self.assertEqual(self.correction(r)[0],403)
        with sqlite3.connect(self.pb.data/'data.db') as db: db.execute('UPDATE time_sheets SET source_provider="horizon",work_type="be" WHERE id=?',(r['id'],))
        self.assertEqual(self.correction(r,who='hr')[0],200)

    def test_manager_correction_lines_atomicity_and_self_review(self):
        import sqlite3
        r=self.draft(); _,r=self.transition(r,'submit'); original=r.copy()
        # The same employee through another login cannot review their own hours.
        manager=self.people['manager']['user']; owner=self.people['owner']['user']; own_employee=self.people['owner']['employee']['id']
        self.assertEqual(self.pb.request('PATCH','collections/core_users/records/'+owner['id'],dict(employee=''),self.pb.admin_token)[0],200)
        self.assertEqual(self.pb.request('PATCH','collections/core_users/records/'+manager['id'],dict(employee=own_employee),self.pb.admin_token)[0],200)
        self.assertEqual(self.correction(r)[0],403)
        self.pb.request('PATCH','collections/core_users/records/'+manager['id'],dict(employee=self.people['manager']['employee']['id']),self.pb.admin_token)
        owner=self.people['owner']['user']; self.pb.request('PATCH','collections/core_roles/records/'+owner['role'],dict(permissions=['time.read','time.validate']),self.pb.admin_token)
        self.pb.request('PATCH','collections/core_users/records/'+owner['id'],dict(employee='',time_scope='all'),self.pb.admin_token)
        self.assertEqual(self.correction(r,who='owner')[0],403)
        # Notification failure must roll back all corrected data, revision and audit.
        tables=['time_sheets','time_sheet_lines','time_entries','core_audit','core_activity_events','core_notifications']
        with sqlite3.connect(self.pb.data/'data.db') as db:
            before={t:db.execute('SELECT * FROM '+t+' ORDER BY id').fetchall() for t in tables}
            db.execute("CREATE TRIGGER fail_time_notice BEFORE INSERT ON core_notifications WHEN NEW.title='Votre feuille de temps a été corrigée' BEGIN SELECT RAISE(ABORT, 'test notification rollback'); END")
        self.assertGreaterEqual(self.correction(r)[0],400)
        with sqlite3.connect(self.pb.data/'data.db') as db:
            for t in tables: self.assertEqual(db.execute('SELECT * FROM '+t+' ORDER BY id').fetchall(),before[t],t)
            db.execute('DROP TRIGGER fail_time_notice')
        # Add a second activity, reorder, then remove the old line using the shared saver.
        keys=['sku','name','description','kind','manufacturer','category','base_unit','sale_currency','sale_enabled','purchase_enabled','stock_policy','replenishment_policy','tracking','manufacturer_ref','barcode','variant_group','reference_cost']
        product={key:self.product[key] for key in keys}; product.update(sku='TIME-BE-SECOND',name='BE Support',offers=[])
        code,second=self.pb.request('POST','horizon/inventory/products/save',dict(creation_key='time-second-activity',input=product),self.people['hr']['token']); self.assertEqual(code,200,second)
        code,activity=self.call('POST','settings',dict(area='activities',input=dict(product=second['id'],active=True,work_types=['be'],valid_from='',valid_to='')),'hr'); self.assertEqual(code,200,activity)
        first={key:r['lines'][0][key] for key in ['id','product','analytic_account','sales_order_line','context','days']}
        added=self.line(60); added.update(product=second['id'])
        body=dict(week_start=r['week_start'],revision=r['revision'],lines=[added,first],reason='Imputation et ordre corrigés')
        code,r=self.call('POST','sheets/'+r['id']+'/correct',body,'manager'); self.assertEqual(code,200,r); self.assertEqual(r['lines'][0]['product'],second['id']); self.assertEqual(r['total_minutes'],180)
        body.update(revision=r['revision'],lines=[{key:r['lines'][0][key] for key in ['id','product','analytic_account','sales_order_line','context','days']}])
        code,r=self.call('POST','sheets/'+r['id']+'/correct',body,'manager'); self.assertEqual(code,200,r); self.assertEqual(len(r['lines']),1); self.assertEqual(r['total_minutes'],60); self.assertEqual(r['status'],'submitted')
        entries=self.pb.request('GET','collections/time_entries/records',token=self.pb.admin_token)[1]['items']; self.assertEqual(len(entries),1); self.assertEqual(entries[0]['status'],'submitted'); self.assertEqual(entries[0]['employee'],original['employee'])

    def test_future_entry_is_refused_without_mutating_history(self):
        from datetime import timedelta
        from zoneinfo import ZoneInfo
        from datetime import datetime
        today=datetime.now(ZoneInfo('Europe/Paris')).date();tomorrow=today+timedelta(days=1);start=tomorrow-timedelta(days=tomorrow.weekday())
        code,week=self.call('GET','week?date='+tomorrow.isoformat());self.assertEqual(code,200,week);self.assertEqual(week['today'],today.isoformat())
        line=self.line(0);line['days'][tomorrow.weekday()]=dict(minutes=60,description='Anticipé')
        code,error=self.call('POST','week',dict(week_start=start.isoformat(),revision=0,lines=[line]));self.assertEqual(code,400,error)
        line['days'][tomorrow.weekday()]=dict(minutes=0,description='Anticipé')
        self.assertEqual(self.call('POST','week',dict(week_start=start.isoformat(),revision=0,lines=[line]))[0],400)
        if start>today:
            self.assertNotIn('edit',week['actions']);self.assertEqual(self.call('POST','week',dict(week_start=start.isoformat(),revision=0,lines=[]))[0],400)
        self.assertEqual(self.call('GET','choices')[1]['has_history'],False)
        realised=self.line(0);realised['days'][today.weekday()]=dict(minutes=60,description='Réalisé aujourd’hui')
        current_start=today-timedelta(days=today.weekday())
        code,current=self.call('POST','week',dict(week_start=current_start.isoformat(),revision=0,lines=[realised]));self.assertEqual(code,200,current);self.assertEqual(current['total_minutes'],60)

        # Already stored historical data is readable, but cannot be approved in advance.
        draft=current if start==current_start else self.draft('2026-01-05')
        import sqlite3
        with sqlite3.connect(self.pb.data/'data.db') as db:
            db.execute('UPDATE time_sheets SET week_start=?,status=?,manager=? WHERE id=?',(start.isoformat(),'submitted',self.people['manager']['user']['id'],draft['id']))
            db.execute('UPDATE time_entries SET date=?,status=? WHERE sheet=?',(tomorrow.isoformat(),'submitted',draft['id']))
        code,result=self.transition(draft,'validate','manager');self.assertEqual(code,400,result)
        code,history=self.call('GET','sheets/'+draft['id'],who='manager');self.assertEqual(code,200,history);self.assertEqual(history['status'],'submitted')
        with sqlite3.connect(self.pb.data/'data.db') as db:self.assertEqual(db.execute('SELECT date,duration_minutes FROM time_entries WHERE sheet=?',(draft['id'],)).fetchone(),(tomorrow.isoformat(),draft['total_minutes']))

    def test_employee_eligibility_and_history_remain_independent_of_manager_rights(self):
        r=self.draft();code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        manager=self.people['manager']['employee']
        self.pb.request('PATCH','collections/hr_employees/records/'+manager['id'],dict(time_reporting_enabled=False,team=''),self.pb.admin_token)
        code,reviewed=self.transition(r,'validate','manager');self.assertEqual(code,200,reviewed)
        owner=self.people['owner']['employee']
        self.pb.request('PATCH','collections/hr_employees/records/'+owner['id'],dict(time_reporting_enabled=False),self.pb.admin_token)
        code,choices=self.call('GET','choices');self.assertEqual(code,200,choices);self.assertFalse(choices['can_enter'])
        self.assertEqual(self.call('GET','sheets/'+r['id'])[1]['status'],'validated')
        self.assertEqual(self.call('POST','week',dict(week_start='2026-10-12',revision=0,lines=[self.line()]))[0],403)
        self.pb.request('PATCH','collections/hr_employees/records/'+owner['id'],dict(time_reporting_enabled=True),self.pb.admin_token)
        for work_type,active in [('none',True),('production',True),('be',False)]:
            self.pb.request('PATCH','collections/core_teams/records/'+self.team['id'],dict(time_work_type=work_type,active=active),self.pb.admin_token)
            self.assertFalse(self.call('GET','choices')[1]['can_enter'])
            self.assertEqual(self.call('POST','week',dict(week_start='2026-10-12',revision=0,lines=[self.line()]))[0],403)
        self.pb.request('PATCH','collections/core_teams/records/'+self.team['id'],dict(time_work_type='be',active=True),self.pb.admin_token)
        draft=self.draft('2026-10-12');self.assertIn('edit',draft['actions'])
        self.pb.request('PATCH','collections/hr_employees/records/'+owner['id'],dict(time_reporting_enabled=False),self.pb.admin_token)
        self.assertNotIn('edit',self.call('GET','sheets/'+draft['id'])[1]['actions'])
        self.assertEqual(self.transition(draft,'submit')[0],403)

    def test_hr_activation_requires_organisation_rights_and_classified_team(self):
        hr=self.people['hr'];role=hr['user']['role']
        rights=['hr.read','hr.write','time.read','time.write']
        self.pb.request('PATCH','collections/core_roles/records/'+role,dict(permissions=rights),self.pb.admin_token)
        self.pb.request('PATCH','collections/core_users/records/'+hr['user']['id'],dict(hr_scope='all'),self.pb.admin_token)
        owner=self.people['owner']['employee']
        body=dict(id=owner['id'],updated=owner['updated'],input=dict(first_name=owner['first_name'],last_name=owner['last_name'],professional_email='',professional_phone='',job_title='',employment_type='employee',team=self.team['id'],manager=self.people['manager']['employee']['id'],is_manager=False,is_direction=False,external_company='',start_date='',end_date='',status='active',time_reporting_enabled=False))
        current=self.pb.request('GET','collections/hr_employees/records/'+owner['id'],token=self.pb.admin_token)[1];body['updated']=current['updated']
        self.assertEqual(self.pb.request('POST','horizon/hr/employees/save',body,hr['token'])[0],403)
        self.pb.request('PATCH','collections/core_roles/records/'+role,dict(permissions=rights+['hr.organisation.manage']),self.pb.admin_token)
        code,r=self.pb.request('POST','horizon/hr/employees/save',body,hr['token']);self.assertEqual(code,200,r);self.assertFalse(r['time_reporting_enabled'])
        other=self.pb.create('core_teams',dict(code='time-other',name='Administration',active=True,time_work_type='none'))
        body['updated']=r['updated'];body['input'].update(team=other['id'],time_reporting_enabled=True)
        self.assertEqual(self.pb.request('POST','horizon/hr/employees/save',body,hr['token'])[0],400)
        body['input']['team']=self.team['id'];code,r=self.pb.request('POST','horizon/hr/employees/save',body,hr['token']);self.assertEqual(code,200,r);self.assertTrue(r['time_reporting_enabled'])

    def test_internal_account_automatic_and_purchase_accounts_excluded(self):
        accounts=self.pb.request('GET','collections/accounting_analytic_accounts/records?perPage=100',token=self.pb.admin_token)[1]['items']
        purchase=next(a for a in accounts if a.get('fixed_key')=='internal_asset')
        line=self.line();line['analytic_account']=purchase['id']
        code,r=self.call('POST','week',dict(week_start='2026-10-05',revision=0,lines=[line]));self.assertEqual(code,200,r)
        self.assertEqual(r['lines'][0]['analytic_account'],self.account['id'])
        entry=self.pb.request('GET','collections/time_entries/records',token=self.pb.admin_token)[1]['items'][0];self.assertEqual(entry['analytic_account'],self.account['id'])
        code,choices=self.call('GET','accounts');self.assertEqual(code,200,choices);self.assertNotIn(purchase['id'],[a['id'] for a in choices]);self.assertNotIn(self.account['id'],[a['id'] for a in choices])
        body={k:line[k] for k in ['product','analytic_account','sales_order_line','context']}
        code,options=self.call('POST','favorites',body);self.assertEqual(code,200,options);self.assertEqual(options['favorites'][0]['analytic_account'],self.account['id'])

    def test_workflow_scope_notifications_and_historical_cost(self):
        self.assertEqual(self.call('POST','settings',dict(area='resources',input=dict(employee=self.people['owner']['employee']['id'],valid_from='2026-01-01',weekly_pattern=[480,480,480,480,480,0,0],hourly_cost=40)),'hr')[0],200)
        r=self.draft();self.assertEqual(r['days'][0]['capacity_minutes'],480);self.assertEqual(r['total_minutes'],120)
        self.assertEqual(self.call('GET','sheets/'+r['id'],who='other')[0],403)
        self.assertEqual(self.call('GET','sheets/'+r['id'],who='manager')[0],403)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r);self.assertEqual(r['status'],'submitted')
        self.assertEqual(self.call('GET','sheets/'+r['id'],who='manager')[0],200)
        self.assertEqual(self.transition(r,'validate')[0],403)
        self.assertEqual(self.call('POST','week',dict(week_start=r['week_start'],revision=r['revision'],lines=[self.line(180)]))[0],403)
        code,r=self.transition(r,'validate','manager');self.assertEqual(code,200,r);self.assertEqual(r['status'],'validated')
        entry=self.pb.request('GET','collections/time_entries/records',token=self.pb.admin_token)[1]['items'][0]
        # Only the disposable superuser can inspect stored snapshots; business DTOs never expose rates.
        self.assertEqual(entry['cost_snapshot']['amount'],80)
        self.assertNotIn('cost_snapshot',r['lines'][0]);self.assertEqual(self.pb.request('GET','collections/time_entries/records/'+entry['id'],token=self.people['owner']['token'])[0],403)
        self.assertEqual(self.pb.request('PATCH','collections/time_entries/records/'+entry['id'],dict(duration_minutes=5),self.pb.admin_token)[0],403)
        code,month=self.call('GET','sheets?month=2026-10');self.assertEqual(code,200,month);self.assertEqual(month['total_minutes'],120)
        notes=self.pb.request('GET','collections/core_notifications/records?perPage=100',token=self.pb.admin_token)[1]['items'];self.assertTrue(any(n.get('event_type')=='time_requests' for n in notes));self.assertTrue(any(n.get('event_type')=='time_updates' for n in notes))
        code,settings=self.call('POST','settings',dict(area='resources',input=dict(employee=self.people['owner']['employee']['id'],valid_from='2026-10-06',weekly_pattern=[420,420,420,420,420,0,0],hourly_cost=60)),'hr');self.assertEqual(code,200,settings)
        snapshot=self.pb.request('GET','collections/time_entries/records/'+entry['id'],token=self.pb.admin_token)[1]['cost_snapshot'];self.assertEqual(snapshot,entry['cost_snapshot'])
        next_week=self.draft('2026-10-12');code,next_week=self.transition(next_week,'submit');self.assertEqual(code,200,next_week);code,next_week=self.transition(next_week,'validate','manager');self.assertEqual(code,200,next_week)
        import sqlite3,json
        with sqlite3.connect(self.pb.data/'data.db') as db:
            cost=json.loads(db.execute('SELECT cost_snapshot FROM time_entries WHERE sheet=?',(next_week['id'],)).fetchone()[0]);self.assertEqual(cost['amount'],120)
        code,new=self.transition(r,'reopen_validated','manager',reason='Correction demandée');self.assertEqual(code,200,new);self.assertEqual(new['status'],'draft')
    def test_concurrent_edit_validation_and_zero_line(self):
        r=self.draft();line=r['lines'][0];body=dict(week_start=r['week_start'],revision=r['revision'],lines=[{k:line[k] for k in ['id','product','analytic_account','sales_order_line','context','days']}])
        with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:self.call('POST','week',body),range(2)))
        self.assertEqual(sorted(x[0] for x in results),[200,409],results)
        current=self.call('GET','week?date=2026-10-05')[1]
        body['revision']=current['revision'];body['lines'][0]['days']=[dict(minutes=0,description='') for _ in range(7)]
        code,r=self.call('POST','week',body);self.assertEqual(code,200,r);self.assertEqual(len(r['lines']),1);self.assertEqual(r['total_minutes'],0)
        self.assertEqual(self.transition(r,'submit')[0],400)
        body['revision']=r['revision'];body['lines'][0]['days'][0]['minutes']=1441;self.assertEqual(self.call('POST','week',body)[0],400)
        body['lines'][0]['days'][0]['minutes']=1.5;self.assertEqual(self.call('POST','week',body)[0],400)
        body['lines'][0]['days'][0]['minutes']=5;body['lines'][0]['employee']=self.people['other']['employee']['id'];self.assertEqual(self.call('POST','week',body)[0],400)
    def test_choices_settings_favorites_holidays_and_revoke(self):
        code,choices=self.call('GET','choices');self.assertEqual(code,200,choices);self.assertEqual(choices['managers'][0]['id'],self.people['manager']['user']['id']);self.assertNotIn('resources',choices)
        self.assertEqual(self.call('GET','settings')[0],403)
        code,r=self.call('GET','week?date=2026-11-11');self.assertEqual(code,200,r);self.assertEqual(r['days'][2]['holiday'],'11 novembre');self.assertIsNone(r['days'][2]['capacity_minutes'])
        line=self.line();body={k:line[k] for k in ['product','analytic_account','sales_order_line','context']}
        code,choices=self.call('POST','favorites',body);self.assertEqual(code,200,choices);fid=choices['favorites'][0]['id'];self.assertEqual(self.call('POST','favorites',dict(id=fid),'other')[0],403);self.assertEqual(self.call('POST','favorites',dict(id=fid))[0],200)
        role=self.people['owner']['user']['role'];self.pb.request('PATCH','collections/core_roles/records/'+role,dict(permissions=[]),self.pb.admin_token);self.assertEqual(self.call('GET','choices')[0],403)
    def test_cross_month_and_rejection(self):
        r=self.draft('2026-09-28');line=r['lines'][0];line['days'][3]['minutes']=90
        code,r=self.call('POST','week',dict(week_start=r['week_start'],revision=r['revision'],lines=[{k:line[k] for k in ['id','product','analytic_account','sales_order_line','context','days']}]));self.assertEqual(code,200,r)
        self.assertEqual(self.call('GET','sheets?month=2026-09')[1]['total_minutes'],120);self.assertEqual(self.call('GET','sheets?month=2026-10')[1]['total_minutes'],90)
        self.assertEqual(self.call('GET','overview?area=own&view=month&date=2026-09-01')[1]['items'][0]['total_minutes'],120)
        self.assertEqual(self.call('GET','overview?area=own&view=month&date=2026-10-01')[1]['items'][0]['total_minutes'],90)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        self.assertEqual(self.transition(r,'reject','manager')[0],400)
        code,r=self.transition(r,'reject','manager',reason='Détailler les travaux');self.assertEqual(code,200,r)
        self.assertEqual(self.transition(r,'reopen')[0],200)

    def test_visual_overview_periods_privacy_capacities_and_eligibility(self):
        self.assertEqual(self.call('POST','settings',dict(area='resources',input=dict(employee=self.people['owner']['employee']['id'],valid_from='2026-01-01',weekly_pattern=[480,480,480,480,480,0,0],hourly_cost=None)),'hr')[0],200)
        draft=self.draft('2026-01-05',120)
        def overview(view='month',who='owner',date='2026-01-05',extra=''):
            code,result=self.call('GET',f'overview?area={"own" if who=="owner" else "review"}&view={view}&date={date}'+extra,who=who);self.assertEqual(code,200,result);return result
        own=overview();self.assertEqual(own['items'][0]['total_minutes'],120)
        self.assertEqual(len(own['items'][0]['days']),31);self.assertEqual(next(day for day in own['items'][0]['days'] if day['date']=='2026-01-05')['minutes'],120);self.assertEqual(len(own['periods']),5);self.assertEqual(own['items'][0]['cells'][1]['status'],'draft')
        manager=overview(who='manager');self.assertEqual(len(manager['items']),1)
        self.assertEqual(manager['items'][0]['days'],[]);cell=manager['items'][0]['cells'][1];self.assertEqual(cell['status'],'missing');self.assertIsNone(cell['minutes']);self.assertEqual(cell['sheets'],[])
        self.assertNotIn(draft['id'],str(manager));self.assertEqual(manager['items'][0]['total_minutes'],0);self.assertEqual(manager['summary']['minutes'],0);self.assertEqual(manager['summary']['submitted'],0)
        self.assertEqual(self.call('GET','employees/'+self.people['owner']['employee']['id']+'/photo',who='manager')[0],204)
        self.assertEqual(self.call('GET','employees/'+self.people['other']['employee']['id']+'/photo',who='manager')[0],403)
        self.assertEqual(self.call('GET','employees/'+self.people['owner']['employee']['id']+'/photo',who='other')[0],403)
        from check_employee_photos import upload, PNG
        from urllib.request import Request, urlopen
        code,photo=upload(self.pb,'collections/hr_employees/records/'+self.people['owner']['employee']['id'],self.pb.admin_token,{},method='PATCH');self.assertEqual(code,200,photo)
        with urlopen(Request(self.pb.url+'/api/horizon/time/employees/'+photo['id']+'/photo',headers={'Authorization':self.people['manager']['token']})) as response:
            self.assertEqual(response.read(),PNG);self.assertEqual(response.headers['Cache-Control'],'no-store')
        self.assertTrue(overview(who='manager')['items'][0]['has_photo'])

        self.assertEqual(overview(who='manager',extra='&q=nobody')['totalItems'],0)
        self.assertEqual(self.call('GET','overview?area=review&view=month&date=2026-01-05',who='other')[0],403)
        week=overview('week');self.assertEqual(len(week['periods']),7);self.assertEqual(week['items'][0]['cells'][0]['minutes'],120);self.assertEqual(week['items'][0]['cells'][5]['status'],'off')
        year=overview('year');self.assertEqual(len(year['periods']),12);self.assertEqual(year['items'][0]['cells'][0]['minutes'],120);self.assertEqual(year['items'][0]['cells'][-1]['status'],'future')
        code,submitted=self.transition(draft,'submit');self.assertEqual(code,200,submitted)
        manager=overview(who='manager');self.assertEqual(manager['items'][0]['cells'][1]['status'],'submitted');self.assertEqual(manager['items'][0]['cells'][1]['minutes'],120)
        code,validated=self.transition(submitted,'validate','manager');self.assertEqual(code,200,validated)
        cell=overview(who='manager')['items'][0]['cells'][1];self.assertEqual(cell['status'],'validated');self.assertEqual(cell['validated_weeks'],1)
        self.assertEqual(overview(who='manager')['summary']['validated'],1)
        filtered=overview(who='manager',extra='&status=submitted&q=nobody');self.assertEqual(filtered['items'],[]);self.assertEqual(filtered['summary'],overview(who='manager')['summary'])
        cell=overview('year',who='manager')['items'][0]['cells'][0];self.assertEqual(cell['status'],'mixed');self.assertEqual(cell['validated_weeks'],1);self.assertGreater(cell['total_weeks'],1)
        annual=overview('year',who='manager');self.assertLess(annual['summary']['missing'],sum(cell['missing_weeks'] for row in annual['items'] for cell in row['cells']))
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],dict(time_reporting_enabled=False),self.pb.admin_token)
        self.assertFalse(self.call('GET','choices')[1]['tracks_time']);self.assertTrue(self.call('GET','choices')[1]['has_history'])
        self.assertEqual(overview()['items'][0]['total_minutes'],120)
        self.pb.request('PATCH','collections/core_teams/records/'+self.team['id'],dict(time_work_type='production'),self.pb.admin_token)
        production=overview(who='hr');self.assertTrue(any(row['work_type']=='production' and row['cells'][0]['status']=='unavailable' for row in production['items']))
        self.assertEqual(self.call('GET','overview?view=decade&date=2026-01-05')[0],400)
        self.assertEqual(self.call('GET','overview?view=year&date=2026-02-30')[0],400)
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],dict(first_name='Zoe',last_name='Alpha'),self.pb.admin_token)
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['other']['employee']['id'],dict(first_name='Aaron',last_name='Zulu'),self.pb.admin_token)
        self.assertEqual(overview(who='hr')['items'][0]['employee'],self.people['owner']['employee']['id'])
        for index in range(31): self.pb.create('hr_employees',dict(first_name='Page',last_name=f'Contact{index:02}',status='active',employment_type='employee',team=self.team['id'],time_reporting_enabled=True))
        first=overview(who='hr');second=overview(who='hr',extra='&page=2')
        self.assertEqual(len(first['items']),30);self.assertGreater(second['totalItems'],30);self.assertEqual(second['page'],2)
        self.assertFalse(set(row['employee'] for row in first['items'])&set(row['employee'] for row in second['items']))


    def test_overview_counts_missing_weeks_and_keeps_drafts_private(self):
        self.assertEqual(self.call('POST','settings',dict(area='resources',input=dict(employee=self.people['owner']['employee']['id'],valid_from='2026-01-01',weekly_pattern=[480,480,480,480,480,0,0],hourly_cost=None)),'hr')[0],200)
        draft=self.draft('2026-01-05',minutes=120)
        code,own=self.call('GET','sheets?month=2026-01');self.assertEqual(code,200,own)
        self.assertEqual(own['summary']['minutes'],120);self.assertEqual(own['summary']['draft'],1)
        self.assertGreater(own['summary']['missing'],0)
        self.assertTrue(all(row['week_start']<='2026-01-31' for row in own['items']))
        code,filtered=self.call('GET','sheets?month=2026-01&status=validated&q=nobody&page=99');self.assertEqual(code,200,filtered)
        self.assertEqual(filtered['items'],[]);self.assertEqual(filtered['summary'],own['summary'])
        code,manager=self.call('GET','sheets?area=review&month=2026-01',who='manager');self.assertEqual(code,200,manager)
        hidden=next(row for row in manager['items'] if row['week_start']=='2026-01-05')
        self.assertEqual(hidden['id'],'');self.assertEqual(hidden['status'],'missing');self.assertEqual(hidden['month_minutes'],0)
        self.assertEqual(manager['summary']['minutes'],0);self.assertEqual(manager['summary']['draft'],0)
        self.assertEqual(manager['summary']['missing'],own['summary']['missing']+1)
        self.assertEqual(self.call('GET','sheets/'+draft['id'],who='manager')[0],403)
        code,submitted=self.transition(draft,'submit');self.assertEqual(code,200,submitted)
        manager=self.call('GET','sheets?area=review&month=2026-01',who='manager')[1]
        self.assertEqual(manager['summary']['submitted'],1);self.assertEqual(manager['summary']['minutes'],120)
        self.assertEqual(manager['summary']['missing'],own['summary']['missing'])
        future=self.call('GET','sheets?month=2099-01')[1];self.assertEqual(future['summary']['missing'],0);self.assertEqual(future['items'],[])
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],dict(time_reporting_enabled=False),self.pb.admin_token)
        disabled=self.call('GET','sheets?month=2026-01')[1];self.assertEqual(disabled['summary']['missing'],0);self.assertEqual(disabled['summary']['minutes'],120)
        self.pb.request('PATCH','collections/core_users/records/'+self.people['manager']['user']['id'],dict(employee=''),self.pb.admin_token)
        code,unlinked=self.call('GET','sheets?month=2026-01',who='manager');self.assertEqual(code,200,unlinked);self.assertEqual(unlinked['items'],[])

    def test_manager_missing_weeks_leave_privacy_and_period_scope(self):
        self.assertEqual(self.call('POST','settings',dict(area='resources',input=dict(employee=self.people['owner']['employee']['id'],valid_from='2026-01-01',weekly_pattern=[480,480,480,480,480,0,0],hourly_cost=None)),'hr')[0],200)
        code,month=self.call('GET','sheets?area=review&month=2026-01&status=missing',who='manager');self.assertEqual(code,200,month);self.assertGreater(month['totalItems'],0);self.assertTrue(all(r['employee']==self.people['owner']['employee']['id'] for r in month['items']))
        self.assertEqual(self.call('GET','sheets?area=review&month=2026-01',who='other')[0],403)
        self.pb.request('PATCH','collections/core_users/records/'+self.people['manager']['user']['id'],dict(employee=''),self.pb.admin_token)
        code,empty=self.call('GET','sheets?area=review&month=2026-01&status=missing',who='manager');self.assertEqual(code,200,empty);self.assertEqual(empty['totalItems'],0)
        self.assertEqual(self.call('POST','settings',dict(area='resources',input=dict(employee=self.people['owner']['employee']['id'],valid_from='2025-01-01',weekly_pattern=[480]*7,hourly_cost=1)),'hr')[0],400)
        roles=self.people['hr']['user']['role'];self.pb.request('PATCH','collections/core_roles/records/'+roles,dict(permissions=['time.read','time.settings']),self.pb.admin_token)
        code,settings=self.call('GET','settings',who='hr');self.assertEqual(code,200,settings);self.assertFalse(settings['can_costs']);self.assertNotIn('hourly_cost',settings['resources'][0])
        self.assertEqual(self.call('POST','settings',dict(area='resources',input=dict(employee=self.people['owner']['employee']['id'],valid_from='2027-01-01',weekly_pattern=[480]*7,hourly_cost=1)),'hr')[0],403)
    def test_analytic_identity_and_activity_period_guards(self):
        self.assertEqual(self.call('GET','accounts')[0],200)
        line=self.line();line['context']='presales';self.assertEqual(self.call('POST','week',dict(week_start='2026-10-05',revision=0,lines=[line]))[0],400)
        current=self.call('GET','settings',who='hr')[1]['activities'][0]
        current.pop('label');current['valid_to']='2026-10-04'
        self.assertEqual(self.call('POST','settings',dict(area='activities',input=current),'hr')[0],200)
        self.assertEqual(self.call('POST','week',dict(week_start='2026-10-05',revision=0,lines=[self.line()]))[0],400)
        self.assertEqual(self.call('POST','week',dict(week_start='2026-10-05',revision=0,lines=[self.line(0)]))[0],200)

    def test_affair_presales_order_line_and_analytic_realization(self):
        import uuid
        hr=self.people['hr'];role=hr['user']['role'];rights=self.pb.request('GET','collections/core_roles/records/'+role,token=self.pb.admin_token)[1]['permissions']
        self.pb.request('PATCH','collections/core_roles/records/'+role,dict(permissions=rights+['crm.read','crm.write','contacts.read','sales.read','sales.write','sales.quote.validate','sales.order.confirm','analysis.read','analysis.financial']),self.pb.admin_token)
        company=self.pb.create('contacts_companies',dict(name='Client des temps',active=True));stage=self.pb.request('GET','collections/crm_stages/records?filter=active%3Dtrue&sort=sort_order',token=self.pb.admin_token)[1]['items'][0]
        def business(path,body=None):return self.pb.request('POST' if body else 'GET','horizon/'+path,body,hr['token'])
        code,opp=business('crm/save',dict(creation_key=str(uuid.uuid4()),input=dict(title='Affaire Temps',company=company['id'],contact='',owner=hr['user']['id'],stage=stage['id'],type='direct',estimated_value=1000,estimated_cost=0,currency='EUR',probability=0,expected_date='',description='',status='open',market_types=[])));self.assertEqual(code,200,opp)
        root=opp['analytic_account']
        line=self.line();line.update(context='presales',analytic_account=root)
        code,r=self.call('POST','week',dict(week_start='2026-10-05',revision=0,lines=[line]));self.assertEqual(code,200,r);self.assertEqual(r['lines'][0]['account_code'],opp['opportunity_number'])
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r);code,r=self.transition(r,'validate','manager');self.assertEqual(code,200,r)
        code,report=business('analysis/report?opportunity='+opp['id']);self.assertEqual(code,200,report);self.assertEqual(report['totals']['hours']['be']['actual_minutes'],120);self.assertFalse(report['coverage']['time_production']);self.assertIsNone(report['totals']['financial']['actual_labor_cost'])
        q=dict(opportunity=opp['id'],title='Service BE vendu',quote_date='2026-10-08',valid_until='2026-11-08',notes='',lines=[dict(product=self.product['id'],description='BE Plans',quantity=4,unit='h',unit_price=100,unit_cost=20)])
        code,quote=business('sales/quotes/save',dict(creation_key=str(uuid.uuid4()),input=q));self.assertEqual(code,200,quote)
        code,quote=business('sales/quotes/finalize',dict(id=quote['id'],updated=quote['updated']));self.assertEqual(code,200,quote)
        code,quote=business('sales/quotes/confirm',dict(id=quote['id'],updated=quote['updated'],awaiting_customer_order=True));self.assertEqual(code,200,quote)
        order=self.pb.request('GET','collections/sales_orders/records/'+quote['order']['id'],token=self.pb.admin_token)[1];sold=self.pb.request('GET','collections/sales_order_lines/records?filter=order="'+order['id']+'"',token=self.pb.admin_token)[1]['items'][0]
        code,options=self.call('GET','sold-services?account='+order['analytic_child']+'&product='+self.product['id']);self.assertEqual(code,200,options);self.assertEqual(options[0]['id'],sold['id'])
        line=self.line();line.update(context='affair',analytic_account=order['analytic_child'],sales_order_line=sold['id'])
        code,r=self.call('POST','week',dict(week_start='2026-10-12',revision=0,lines=[line]));self.assertEqual(code,200,r)
        line['analytic_account']=root;self.assertEqual(self.call('POST','week',dict(week_start='2026-11-02',revision=0,lines=[line]))[0],400)

class TimeMigrationTests(unittest.TestCase):
    def test_eligibility_upgrade_is_opt_in_and_preserves_employee_and_team(self):
        from pathlib import Path
        import subprocess
        pb=LocalPocketBase();self.addCleanup(pb.close);current=list(pb.args)
        directory=Path(pb.temp.name)/'before_eligibility';directory.mkdir()
        for migration in (Path(__file__).resolve().parents[2]/'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791840032':(directory/migration.name).symlink_to(migration)
        pb.args=[arg if not arg.startswith('--migrationsDir=') else '--migrationsDir='+str(directory) for arg in pb.args];pb.start()
        team=pb.create('core_teams',dict(code='be-history',name='Bureau d’études',active=True))
        employee=pb.create('hr_employees',dict(first_name='Avant',last_name='Migration',status='active',employment_type='employee',team=team['id']))
        role=pb.create('core_roles',dict(name='schema_check',label='Schema check',active=True,permissions=['settings.references','hr.read']))
        pb.create_user('schema-check@local.invalid',role['id'],'admin');token=pb.login('schema-check@local.invalid')[1]['token']
        body=dict(id=team['id'],updated=team['updated'],name=team['name'],active=True,managers=[],time_work_type='be')
        status,rejected=pb.request('POST','horizon/hr/teams/save',body,token);self.assertEqual(status,503,rejected);self.assertIn('1791840032',rejected['message'])
        self.assertEqual(pb.request('GET','collections/core_teams/records/'+team['id'],token=pb.admin_token)[1],team)
        pb.process.terminate();pb.process.wait(timeout=10);pb.args=current
        for _ in range(2):subprocess.run(pb.args+['migrate','up'],check=True,stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        for table,record,field,default in [('core_teams',team,'time_work_type','none'),('hr_employees',employee,'time_reporting_enabled',False)]:
            actual=pb.request('GET','collections/'+table+'/records/'+record['id'],token=pb.admin_token)[1]
            self.assertEqual(actual.pop(field),default);self.assertEqual(actual,record)
        status,saved=pb.request('POST','horizon/hr/teams/save',body,token);self.assertEqual(status,200,saved);self.assertEqual(saved['time_work_type'],'be')
        status,directory=pb.request('GET','horizon/hr/directory',token=token);self.assertEqual(status,200,directory);self.assertEqual(next(t for t in directory['teams'] if t['id']==team['id'])['time_work_type'],'be')

    def test_internal_account_upgrade_preserves_existing_history_and_code_collision(self):
        from pathlib import Path
        import subprocess,sqlite3,json
        pb=LocalPocketBase();self.addCleanup(pb.close);current=list(pb.args)
        directory=Path(pb.temp.name)/'before_internal_time';directory.mkdir()
        for migration in (Path(__file__).resolve().parents[2]/'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791840031':(directory/migration.name).symlink_to(migration)
        pb.args=[arg if not arg.startswith('--migrationsDir=') else '--migrationsDir='+str(directory) for arg in pb.args];pb.start()
        old_accounts=pb.request('GET','collections/accounting_analytic_accounts/records?perPage=100',token=pb.admin_token)[1]['items']
        purchase=next(a for a in old_accounts if a.get('fixed_key')=='internal_asset')
        pb.process.terminate();pb.process.wait(timeout=10)
        with sqlite3.connect(pb.data/'data.db') as db:
            db.execute("INSERT INTO accounting_analytic_accounts (id,code,label,active,status) VALUES ('occupiedtime001','99301','Existant',1,'open')")
            db.execute("INSERT INTO time_sheets (id,status,revision,week_start) VALUES ('historysheet001','validated',7,'2026-10-05')")
            db.execute("INSERT INTO time_sheet_lines (id,sheet,context,analytic_account,identity_snapshot) VALUES ('historyline0001','historysheet001','internal',?,?)",(purchase['id'],json.dumps({'account':{'code':purchase['code'],'label':purchase['label']}})))
            db.execute("INSERT INTO time_entries (id,sheet,sheet_line,status,analytic_account,duration_minutes,cost_snapshot) VALUES ('historyentry001','historysheet001','historyline0001','validated',?,120,?)",(purchase['id'],json.dumps({'amount':80,'currency':'EUR'})))
            before={table:db.execute('SELECT * FROM '+table).fetchall() for table in ['time_sheets','time_sheet_lines','time_entries']}
        pb.args=current
        for _ in range(2):subprocess.run(pb.args+['migrate','up'],check=True,stdout=subprocess.DEVNULL)
        with sqlite3.connect(pb.data/'data.db') as db:
            for table,rows in before.items():self.assertEqual(db.execute('SELECT * FROM '+table).fetchall(),rows)
            self.assertEqual(db.execute("SELECT code,label FROM accounting_analytic_accounts WHERE fixed_key='time_internal'").fetchall(),[('99302','Temps internes')])
            self.assertEqual(db.execute("SELECT count(*) FROM accounting_analytic_accounts WHERE fixed_key LIKE 'internal_%'").fetchone()[0],5)

    def test_upgrade_shared_roles_data_preservation_and_repeat(self):
        from pathlib import Path
        import subprocess
        pb=LocalPocketBase();self.addCleanup(pb.close);current=list(pb.args)
        directory=Path(pb.temp.name)/'previous';directory.mkdir()
        for migration in (Path(__file__).resolve().parents[2]/'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791840030':(directory/migration.name).symlink_to(migration)
        pb.args=[arg if not arg.startswith('--migrationsDir=') else '--migrationsDir='+str(directory) for arg in pb.args];pb.start()
        role=pb.create('core_roles',dict(name='before_time',label='Rôle partagé',active=True,permissions=['contacts.read']))
        admin=pb.create_user('before-time-admin@local.invalid',role['id'],'admin');other=pb.create_user('before-time-other@local.invalid',role['id'])
        company=pb.create('contacts_companies',dict(name='Société conservée',active=True))
        pb.process.terminate();pb.process.wait(timeout=10);pb.args=current
        for _ in range(2):subprocess.run(pb.args+['migrate','up'],check=True,stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        def get(table,id):return pb.request('GET','collections/'+table+'/records/'+id,token=pb.admin_token)[1]
        self.assertEqual(get('contacts_companies',company['id']),company)
        a,b=get('core_users',admin['id']),get('core_users',other['id']);self.assertEqual(a['time_scope'],'all');self.assertEqual(b['time_scope'],'none');self.assertEqual(b['role'],role['id']);self.assertNotEqual(a['role'],role['id']);self.assertEqual(get('core_roles',role['id'])['permissions'],['contacts.read']);self.assertIn('time.settings',get('core_roles',a['role'])['permissions'])
        for table in ['time_sheets','time_entries','time_sheet_lines','core_cost_profiles','core_resource_profiles','time_activities']:
            self.assertEqual(pb.request('GET','collections/'+table+'/records',token=pb.admin_token)[1]['totalItems'],0)

if __name__=='__main__':unittest.main()

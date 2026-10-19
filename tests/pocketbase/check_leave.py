"""Leave allocations, civil half-days, permissions and atomic workflows. Disposable DB only."""
import unittest
import json
from concurrent.futures import ThreadPoolExecutor
from check_auth import LocalPocketBase

class LeaveTests(unittest.TestCase):
    def setUp(self):
        self.pb=LocalPocketBase().start();self.addCleanup(self.pb.close)
        self.people={}
        for key,rights,scope in [('owner',['read','write','submit'],'self'),('manager',['read','validate'],'reports'),('other',['read','write','submit'],'self'),('hr',['read','allocate','settings','validate'],'all')]:
            role=self.pb.create('core_roles',{'name':'leave_'+key,'label':key,'active':True,'permissions':['leave.'+r for r in rights]})
            employee=self.pb.create('hr_employees',{'first_name':key,'last_name':'Leave','status':'active','employment_type':'employee','is_manager':key=='manager'})
            user=self.pb.create_user(key+'-leave@local.invalid',role['id'])
            self.pb.request('PATCH','collections/core_users/records/'+user['id'],{'employee':employee['id'],'leave_scope':scope},self.pb.admin_token)
            self.people[key]=dict(user=user,employee=employee,token=self.pb.login(key+'-leave@local.invalid')[1]['token'])
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],{'manager':self.people['manager']['employee']['id']},self.pb.admin_token)
        self.token=self.people['owner']['token']
        code,self.choices=self.call('GET','choices');self.assertEqual(code,200,self.choices)
        self.paid=next(t for t in self.choices['types'] if t['code']=='paid')['id']
        self.sick=next(t for t in self.choices['types'] if t['code']=='sick')['id']
    def call(self,method,path,body=None,who='owner'):return self.pb.request(method,'horizon/leave/'+path,body,self.people[who]['token'])
    def allocate(self,days=10,key='allocation-fixture-key',year=2026):
        return self.call('POST','allocations',dict(employee=self.people['owner']['employee']['id'],type=self.paid,year=year,days=days,reason='Droits initiaux',creation_key=key),'hr')
    def draft(self,key='leave-fixture-request',**extra):
        data=dict(type=self.paid,start_date='2026-10-19',end_date='2026-10-20',start_half='am',end_half='pm',reason='Repos',manager='');data.update(extra)
        code,r=self.call('POST','requests',dict(input=data,creation_key=key,removed=[]));self.assertEqual(code,200,r);return r
    def transition(self,r,action,who='owner',**extra):return self.call('POST','requests/'+r['id']+'/transition',dict(updated=r['updated'],action=action,**extra),who)
    def balance(self):return self.call('GET','requests?year=2026')[1]['balances'][0]
    def settings(self,**changes):
        choices=self.call('GET','choices',who='hr')[1];p=choices['policy']
        body={k:p[k] for k in ['updated','weekdays','holidays','holiday_calendar','working_holidays']}
        body['types']=[dict(id=t['id'],receipt_required=t['receipt_required']) for t in choices['types']];body.update(changes)
        return self.call('POST','settings',body,'hr')
    def test_automatic_holidays_exceptions_and_frozen_snapshots(self):
        self.assertEqual(self.choices['policy']['holiday_calendar'],'metropole')
        self.assertEqual(self.allocate()[0],200)
        r=self.draft('national-holidays-fixture',start_date='2026-11-09',end_date='2026-11-13');self.assertEqual(r['duration'],4)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        self.assertEqual(r['policy_snapshot']['holiday_calendar'],'metropole')
        self.assertEqual(self.balance()['pending'],4)
        code,c=self.settings(holiday_calendar='none');self.assertEqual(code,200,c)
        code,r=self.transition(r,'approve','manager');self.assertEqual(code,200,r);self.assertEqual(r['duration'],4)
        self.assertEqual(self.balance()['used'],4)
        fresh=self.draft('manual-holidays-fixture',type=self.sick,start_date='2026-11-09',end_date='2026-11-13');self.assertEqual(fresh['duration'],5)
        self.assertEqual(self.settings(holiday_calendar='metropole',working_holidays=['2026-05-25'])[0],200)
        fresh=self.draft('worked-holidays-fixture',type=self.sick,start_date='2026-05-25',end_date='2026-05-25');self.assertEqual(fresh['duration'],1)
        self.assertEqual(self.settings(holidays=['2026-05-25'])[0],400)
        self.assertEqual(self.settings(working_holidays=['2026-02-30'])[0],400)
        self.assertEqual(self.settings(working_holidays=[],holidays=['2026-11-10'])[0],200)
        fresh=self.draft('extra-holidays-fixture',type=self.sick,start_date='2026-11-09',end_date='2026-11-13');self.assertEqual(fresh['duration'],3)
        fresh=self.draft('new-year-holidays-fixture',type=self.sick,start_date='2026-12-31',end_date='2027-01-04');self.assertEqual(fresh['breakdown'],{'2026':1,'2027':1})
    def test_direction_declaration_notifications_cancellation_and_security(self):
        r=self.draft();self.assertEqual(self.transition(r,'declare')[0],403)
        eid=self.people['owner']['employee']['id']
        def employee(**data):
            code,result=self.pb.request('PATCH','collections/hr_employees/records/'+eid,data,self.pb.admin_token);self.assertEqual(code,200,result)
        employee(is_direction=True)
        # Even a direction must keep its approval circuit when a manager is assigned.
        self.assertEqual(self.transition(r,'declare')[0],403)
        employee(manager='')
        choices=self.call('GET','choices')[1];self.assertTrue(choices['direct_declaration'])
        current=self.call('GET','requests/'+r['id'])[1];self.assertIn('declare',current['actions']);self.assertNotIn('submit',current['actions'])
        self.assertEqual(self.transition(current,'submit')[0],403)
        # Provision, receipts and active HR recipients remain mandatory.
        self.assertEqual(self.transition(current,'declare')[0],400)
        self.assertEqual(self.allocate()[0],200)
        code,r=self.transition(current,'declare');self.assertEqual(code,200,r);self.assertEqual(r['status'],'approved');self.assertEqual(r['manager'],'')
        self.assertEqual(r['validated_by'],self.people['owner']['user']['id']);self.assertEqual(r['policy_snapshot']['approval_mode'],'direct_declaration')
        self.assertEqual(self.balance()['used'],2);self.assertEqual(self.balance()['pending'],0)
        notes=self.pb.request('GET','collections/core_notifications/records',token=self.people['hr']['token'])[1]['items']
        self.assertEqual(len([n for n in notes if n['source_record_id']==r['id']]),1)
        self.assertEqual(self.transition(r,'declare')[0],403)
        duplicate=self.draft('direction-overlap-fixture');self.assertEqual(self.transition(duplicate,'declare')[0],400)
        self.assertEqual(self.transition(r,'cancel_declaration',who='other',reason='Non')[0],403)
        self.assertEqual(self.transition(r,'cancel_declaration')[0],400)
        # Persisted declaration mode survives HR changes and allows restitution.
        employee(is_direction=False)
        code,r=self.transition(r,'cancel_declaration',reason='Déplacement annulé');self.assertEqual(code,200,r);self.assertEqual(r['status'],'cancelled');self.assertEqual(self.balance()['used'],0)
        notes=self.pb.request('GET','collections/core_notifications/records',token=self.people['hr']['token'])[1]['items'];self.assertEqual(len([n for n in notes if n['source_record_id']==r['id']]),2)
        self.assertEqual(self.call('GET','requests/'+r['id'],who='other')[0],403)
        # HR-controlled direction designation cannot be forged in a request body.
        r=self.draft('direction-forgery-fixture')
        self.assertNotIn('declare',r['actions'])
        body=dict(updated=r['updated'],action='declare',direct_declaration=True)
        self.assertEqual(self.call('POST','requests/'+r['id']+'/transition',body)[0],400)
    def test_direction_requires_receipt_and_available_hr(self):
        eid=self.people['owner']['employee']['id']
        self.pb.request('PATCH','collections/hr_employees/records/'+eid,dict(is_direction=True,manager=''),self.pb.admin_token)
        choices=self.call('GET','choices',who='hr')[1];types=[dict(id=t['id'],receipt_required=t['id']==self.sick) for t in choices['types']]
        self.assertEqual(self.settings(types=types)[0],200)
        r=self.draft('direction-receipt-fixture',type=self.sick)
        self.assertEqual(self.transition(r,'declare')[0],400)
        self.assertEqual(self.settings(types=[dict(id=t['id'],receipt_required=False) for t in choices['types']])[0],200)
        # No silent transition when there is nobody authorized to receive the HR notice.
        users=self.pb.request('GET','collections/core_users/records',token=self.pb.admin_token)[1]['items']
        for user in users:
            if user.get('leave_scope')=='all':self.pb.request('PATCH','collections/core_users/records/'+user['id'],{'leave_scope':'none'},self.pb.admin_token)
        code,result=self.transition(r,'declare');self.assertEqual(code,400,result);self.assertIn('RH',result['message'])
        self.assertEqual(self.call('GET','requests/'+r['id'])[1]['status'],'draft')
    def test_allocation_workflow_notifications_cancellation_and_history(self):
        self.assertEqual(self.allocate()[0],200)
        self.assertEqual(self.allocate()[0],200)
        r=self.draft();self.assertEqual(r['duration'],2);self.assertEqual(self.draft()['id'],r['id'])
        self.assertEqual(self.call('GET','requests/'+r['id'],who='manager')[0],403)
        self.assertEqual(self.call('GET','requests/'+r['id'],who='other')[0],403)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r);self.assertEqual(r['status'],'submitted')
        self.assertEqual(self.balance()['pending'],2);self.assertEqual(self.balance()['available'],8)
        self.assertEqual(self.transition(r,'approve')[0],403)
        self.assertEqual(self.transition(r,'approve','hr')[0],403)
        self.assertEqual(self.call('GET','requests?area=review&year=2026',who='manager')[1]['totalItems'],1)
        notes=self.pb.request('GET','collections/core_notifications/records',token=self.people['manager']['token'])[1]['items'];self.assertEqual(notes[0]['source_record_id'],r['id'])
        stale=r;code,r=self.transition(r,'approve','manager');self.assertEqual(code,200,r)
        self.assertEqual(self.transition(stale,'approve','manager')[0],409)
        self.assertEqual(self.balance()['used'],2);self.assertEqual(self.balance()['pending'],0)
        self.assertEqual(self.transition(r,'request_cancel')[0],400)
        code,r=self.transition(r,'request_cancel',reason='Dates modifiées');self.assertEqual(code,200,r);self.assertEqual(self.balance()['used'],2)
        code,r=self.transition(r,'deny_cancel','manager',reason='À revoir');self.assertEqual(code,200,r);self.assertEqual(r['status'],'approved')
        code,r=self.transition(r,'request_cancel',reason='Annulation définitive');self.assertEqual(code,200,r)
        code,r=self.transition(r,'approve_cancel','manager');self.assertEqual(code,200,r);self.assertEqual(self.balance()['used'],0)
        code,r=self.transition(r,'archive');self.assertEqual(code,200,r)
        self.assertEqual(self.call('GET','requests?year=2026')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','requests?year=2026&state=archived')[1]['totalItems'],1)
        events=self.pb.request('GET','horizon/activity/events?entity=leave_requests&id='+r['id'],token=self.token)
        self.assertEqual(events[0],200,events);self.assertGreaterEqual(events[1]['totalItems'],7)
        self.assertEqual(self.call('GET','requests/'+r['id'],who='other')[0],403)
    def test_dates_overlap_provision_and_cross_year_snapshots(self):
        code,self.choices=self.settings(holiday_calendar='none');self.assertEqual(code,200,self.choices)
        self.assertEqual(self.allocate(1)[0],200)
        r=self.draft();self.assertEqual(self.transition(r,'submit')[0],400)
        r=self.draft('half-day-fixture',end_date='2026-10-19',start_half='pm');self.assertEqual(r['duration'],.5)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        second=self.draft('another-half-day',end_date='2026-10-19',end_half='am');code,second=self.transition(second,'submit');self.assertEqual(code,200,second)
        duplicate=self.draft('overlap-day-key',end_date='2026-10-19');self.assertEqual(self.transition(duplicate,'submit')[0],400)
        self.assertEqual(self.allocate(-.5,'negative-fixture-key')[0],400)
        self.assertEqual(self.call('POST','preview',dict(start_date='2026-02-30',end_date='2026-03-01',start_half='am',end_half='pm'))[0],400)
        self.assertEqual(self.call('POST','preview',dict(start_date='2026-10-24',end_date='2026-10-25',start_half='am',end_half='pm'))[0],400)
        code,r=self.transition(r,'withdraw');self.assertEqual(code,200,r);self.assertEqual(self.balance()['pending'],.5)
        self.assertEqual(self.allocate(5,'new-year-fixture',2027)[0],200)
        r=self.draft('cross-year-fixture',start_date='2026-12-31',end_date='2027-01-01');self.assertEqual(r['breakdown'],{'2026':1,'2027':1})
        # One 2026 half-day still reserved; release it before submitting cross-year.
        self.assertEqual(self.transition(second,'withdraw')[0],200)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        p=self.choices['policy'];types=[dict(id=t['id'],receipt_required=False) for t in self.choices['types']]
        code,c=self.call('POST','settings',dict(updated=p['updated'],weekdays=[1,2,3,4,5],holidays=['2027-01-01'],types=types),'hr');self.assertEqual(code,200,c)
        code,r=self.transition(r,'approve','manager');self.assertEqual(code,200,r);self.assertEqual(r['duration'],2)
        fresh=self.draft('new-policy-fixture',type=self.sick,start_date='2026-12-31',end_date='2027-01-01');self.assertEqual(fresh['duration'],1)
    def test_own_leaves_in_general_calendar_without_private_data(self):
        path='horizon/calendar/events?from=2026-10-01T00:00:00.000Z&to=2026-11-01T00:00:00.000Z'
        def schedule(who='owner',extra=''):
            code,data=self.pb.request('GET',path+extra,token=self.people[who]['token']);self.assertEqual(code,200,data);return [v for v in data['items'] if v['kind']=='leave']
        self.assertEqual(self.allocate()[0],200)
        r=self.draft('general-calendar-fixture',start_half='pm',end_half='am',reason='PRIVATE LEAVE REASON')
        self.assertEqual(schedule(),[])
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        items=schedule();self.assertEqual(len(items),2)
        self.assertEqual(items[0]['start'],'2026-10-19T00:00:00.000Z');self.assertIn('Après-midi',items[0]['title']);self.assertIn('Matin',items[1]['title'])
        self.assertEqual(items[0]['href'],'/leave/'+r['id']);self.assertEqual(items[0]['tone'],'amber')
        self.assertNotIn('PRIVATE',json.dumps(items));self.assertNotIn('attachments',json.dumps(items));self.assertNotIn(self.paid,json.dumps(items))
        for who in ['other','manager','hr']:self.assertEqual(schedule(who),[])
        for extra in ['&scope=tenders','&owner='+self.people['other']['user']['id'],'&q=inexistant','&state=archived','&status=draft']:self.assertEqual(schedule(extra=extra),[])
        self.assertEqual(len(schedule(extra='&owner='+self.people['owner']['user']['id'])),2)
        code,r=self.transition(r,'approve','manager');self.assertEqual(code,200,r);self.assertEqual(schedule()[0]['tone'],'blue')
        code,r=self.transition(r,'request_cancel',reason='Dates déplacées');self.assertEqual(code,200,r);self.assertIn('Annulation demandée',schedule()[0]['title'])
        code,r=self.transition(r,'approve_cancel','manager');self.assertEqual(code,200,r);self.assertEqual(schedule(),[])
        r=self.draft('general-calendar-rejected',type=self.sick);code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        code,r=self.transition(r,'reject','manager',reason='Refus');self.assertEqual(code,200,r);self.assertEqual(schedule(),[])
        r=self.draft('general-calendar-permissions',type=self.sick);code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        role=self.people['owner']['user']['role'];self.pb.request('PATCH','collections/core_roles/records/'+role,{'permissions':[]},self.pb.admin_token)
        self.assertEqual(schedule(),[])
    def test_permissions_immutable_allocations_and_calendar_redaction(self):
        self.assertEqual(self.allocate()[0],200)
        alloc=self.call('GET','allocations?year=2026','',who='hr')[1]['items'][0]
        self.assertEqual(self.pb.request('PATCH','collections/leave_allocations/records/'+alloc['id'],{'days':99},self.pb.admin_token)[0],400)
        self.assertEqual(self.call('GET','allocations')[0],403)
        self.assertEqual(self.pb.request('PATCH','collections/leave_types/records/'+self.paid,{'tracked':False},self.pb.admin_token)[0],400)
        self.assertEqual(self.call('GET','requests?area=review')[0],403)
        self.assertEqual(self.pb.request('GET','collections/leave_requests/records',token=self.token)[0],403)
        r=self.draft(type=self.sick,reason='PRIVATE MEDICAL INFORMATION');code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        # Share team; calendar allows colleagues to see absence only.
        team=self.pb.create('core_teams',{'code':'LEAVE','name':'Leave fixture team','active':True})
        for key in ['owner','other']:self.pb.request('PATCH','collections/hr_employees/records/'+self.people[key]['employee']['id'],{'team':team['id']},self.pb.admin_token)
        code,c=self.call('GET','calendar?from=2026-10-01&to=2026-10-31',who='other');self.assertEqual(code,200,c);self.assertEqual(len(c['items']),1)
        item=c['items'][0];self.assertEqual(item['href'],'');self.assertEqual(item['id'],'');self.assertNotIn('PRIVATE',json.dumps(item));self.assertNotIn(self.sick,json.dumps(item))
        self.assertEqual(self.call('GET','requests/'+r['id'],who='other')[0],403)
        code,a=self.call('GET','calendar?from=2026-10-01&to=2026-10-31',who='manager');self.assertEqual(code,200,a);self.assertEqual(a['items'][0]['id'],r['id']);self.assertEqual(a['items'][0]['type_label'],next(t['label'] for t in self.choices['types'] if t['id']==self.sick))
        self.assertEqual(self.pb.request('PATCH','collections/leave_requests/records/'+r['id'],{'status':'approved'},self.token)[0],403)
    def test_resource_calendar_scope_roster_halves_and_totals(self):
        team=self.pb.create('core_teams',dict(code='leave-timeline',name='Bureau études',active=True))
        for key in ['owner','other']: self.pb.request('PATCH','collections/hr_employees/records/'+self.people[key]['employee']['id'],dict(team=team['id']),self.pb.admin_token)
        self.assertEqual(self.allocate()[0],200)
        r=self.draft('timeline-halves',start_date='2026-11-09',end_date='2026-11-13',start_half='pm',end_half='am',reason='PRIVATE MEDICAL DETAIL')
        _,r=self.transition(r,'submit'); self.assertEqual(r['duration'],3)
        code,draft=self.call('POST','requests',dict(creation_key='other-private-draft',input=dict(type=self.sick,start_date='2026-11-16',end_date='2026-11-17',start_half='am',end_half='pm',reason='PRIVATE DRAFT',manager=''),removed=[]),who='other'); self.assertEqual(code,200,draft)
        path='calendar?from=2026-11-01&to=2026-11-30'
        code,c=self.call('GET',path,who='other'); self.assertEqual(code,200,c)
        self.assertEqual(c['scope'],'team'); self.assertFalse(c['can_company']); self.assertEqual(len(c['employees']),1)
        self.assertEqual(c['items'][0]['id'],''); self.assertEqual(c['items'][0]['href'],''); self.assertNotIn('PRIVATE',json.dumps(c)); self.assertNotIn('type_label',json.dumps(c))
        days={d['date']:d for d in c['days']}; self.assertEqual(days['2026-11-09']['pending'],.5); self.assertEqual(days['2026-11-10']['pending'],1); self.assertEqual(days['2026-11-11']['pending'],0); self.assertEqual(days['2026-11-13']['pending'],.5); self.assertTrue(days['2026-11-11']['holiday']); self.assertTrue(days['2026-11-14']['weekend'])
        self.assertEqual(self.call('GET',path+'&scope=company',who='other')[0],403)
        code,c=self.call('GET',path+'&scope=company',who='hr'); self.assertEqual(code,200,c); self.assertEqual(c['totalItems'],1); self.assertEqual(c['scope'],'company'); self.assertTrue(c['can_company'])
        self.assertEqual(self.call('GET',path+'&scope=wrong')[0],400); self.assertEqual(self.call('GET',path+'&page=0')[0],400)
        _,r=self.transition(r,'approve','manager'); code,c=self.call('GET',path,who='other'); self.assertEqual(code,200,c); days={d['date']:d for d in c['days']}; self.assertEqual(days['2026-11-09']['absent'],.5); self.assertEqual(days['2026-11-09']['pending'],0)
        code,c=self.call('GET',path+'&q=OWNER',who='other'); self.assertEqual(code,200,c); self.assertEqual(len(c['employees']),1)
        code,empty=self.call('GET','calendar?from=2027-01-01&to=2027-01-31&scope=company',who='hr'); self.assertEqual(code,200,empty); self.assertEqual(empty['totalItems'],0); self.assertEqual(empty['employees'],[]); self.assertEqual(empty['items'],[])
        # Revoke the global scope; the same authenticated token cannot retain company access.
        self.pb.request('PATCH','collections/core_users/records/'+self.people['hr']['user']['id'],dict(leave_scope='self'),self.pb.admin_token)
        self.assertEqual(self.call('GET',path+'&scope=company',who='hr')[0],403)

    def test_calendar_photos_follow_calendar_scope_and_pagination(self):
        from check_employee_photos import upload,PNG
        from urllib.request import Request,urlopen
        owner=self.people['owner']['employee']; manager=self.people['manager']; photo='horizon/leave/employees/'+owner['id']+'/photo'
        code,record=upload(self.pb,'collections/hr_employees/records/'+owner['id'],self.pb.admin_token,{},method='PATCH'); self.assertEqual(code,200,record)
        with urlopen(Request(self.pb.url+'/api/'+photo,headers={'Authorization':manager['token']})) as response:
            self.assertEqual(response.status,200); self.assertEqual(response.read(),PNG); self.assertEqual(response.headers['Cache-Control'],'no-store')
        self.assertEqual(self.pb.request('GET',photo,token=self.people['other']['token'])[0],403)
        self.assertEqual(self.pb.request('GET',photo)[0],401)
        with urlopen(Request(self.pb.url+'/api/horizon/leave/employees/'+manager['employee']['id']+'/photo',headers={'Authorization':manager['token']})) as response: self.assertEqual(response.status,204)
        r=self.draft('calendar-photo-request',type=self.sick); code,r=self.transition(r,'submit'); self.assertEqual(code,200,r)
        code,c=self.call('GET','calendar?from=2026-10-01&to=2026-10-31',who='manager'); self.assertEqual(code,200,c); self.assertTrue(next(e for e in c['employees'] if e['id']==owner['id'])['has_photo'])
        import sqlite3
        with sqlite3.connect(self.pb.data/'data.db') as db:
            for i in range(52):
                db.execute('INSERT INTO hr_employees (id,first_name,last_name,status,employment_type) VALUES (?,?,?,?,?)',(f'leavepage{i:06d}','Extra',f'ZZ {i:02d}','active','employee'))
                db.execute('INSERT INTO leave_requests (id,employee,user,type,start_date,end_date,start_half,end_half,duration,status,policy_snapshot,creation_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',(f'pageleave{i:06d}',f'leavepage{i:06d}',self.people['owner']['user']['id'],self.sick,'2026-10-19','2026-10-20','am','pm',2,'approved',json.dumps(self.choices['policy']),f'calendar-page-{i}'))
        code,c=self.call('GET','calendar?from=2026-10-01&to=2026-10-31&scope=company',who='hr'); self.assertEqual(code,200,c); self.assertEqual(c['totalItems'],53); self.assertEqual(c['totalPages'],2); self.assertEqual(len(c['employees']),50)
        code,c=self.call('GET','calendar?from=2026-10-01&to=2026-10-31&scope=company&page=2',who='hr'); self.assertEqual(code,200,c); self.assertEqual(len(c['employees']),3); self.assertEqual(next(d for d in c['days'] if d['date']=='2026-10-19')['absent'],52)
        self.pb.request('PATCH','collections/hr_employees/records/'+owner['id'],dict(manager=''),self.pb.admin_token)
        self.assertEqual(self.pb.request('GET',photo,token=manager['token'])[0],403)

    def test_protected_files_and_rejected_request_recovery(self):
        from check_employee_photos import PNG
        from urllib.request import Request,urlopen
        from urllib.error import HTTPError
        boundary='leave-files-fixture'
        data=dict(type=self.sick,start_date='2026-10-19',end_date='2026-10-19',start_half='am',end_half='pm',reason='Justificatif',manager='')
        fields={'input':json.dumps(data),'creation_key':'protected-file-fixture','removed':'[]'}
        parts=[f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k,v in fields.items()]
        parts += [f'--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="certificat.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+PNG+b'\r\n',f'--{boundary}--\r\n'.encode()]
        req=Request(self.pb.url+'/api/horizon/leave/requests',data=b''.join(parts),headers={'Authorization':self.token,'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
        with urlopen(req) as res:r=json.loads(res.read())
        self.assertEqual(len(r['attachments']),1)
        path='files/'+r['collectionId']+'/'+r['id']+'/'+r['attachments'][0]
        def file_code(who):
            ft=self.pb.request('POST','files/token',{},self.people[who]['token'])[1]['token']
            try:
                with urlopen(self.pb.url+'/api/'+path+'?token='+ft) as res:return res.status
            except HTTPError as err:return err.code
        self.assertEqual(file_code('owner'),200);self.assertEqual(file_code('manager'),404);self.assertEqual(file_code('other'),404)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r);self.assertEqual(file_code('manager'),200)
        self.assertEqual(self.transition(r,'reject','manager')[0],400)
        code,r=self.transition(r,'reject','manager',reason='Document à préciser');self.assertEqual(code,200,r)
        code,r=self.transition(r,'reopen');self.assertEqual(code,200,r);self.assertEqual(r['status'],'draft');self.assertEqual(file_code('manager'),404)
        # Own native account updates cannot grant a global leave scope.
        self.assertEqual(self.pb.request('PATCH','collections/core_users/records/'+self.people['owner']['user']['id'],{'leave_scope':'all'},self.token)[0],403)
        # Absent manager requires an explicit authorized fallback; no auto-approval.
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],{'manager':''},self.pb.admin_token)
        self.assertEqual(self.transition(r,'submit')[0],400)
        data['manager']=self.people['hr']['user']['id']
        code,r=self.call('POST','requests',dict(id=r['id'],updated=r['updated'],input=data,removed=[]));self.assertEqual(code,200,r)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        self.pb.request('PATCH','collections/core_roles/records/'+self.people['hr']['user']['role'],{'active':False},self.pb.admin_token)
        self.assertEqual(self.transition(r,'approve','hr')[0],403)

    def test_activity_mentions_and_permission_grants(self):
        r=self.draft(type=self.sick)
        body=dict(source_module='leave',source_entity='leave_requests',source_record_id=r['id'],type='note',body='Une précision',mentions=[],metadata={})
        code,event=self.pb.request('POST','collections/core_activity_events/records',body,self.token);self.assertEqual(code,200,event)
        self.assertIn(self.pb.request('POST','collections/core_activity_events/records',body,self.people['other']['token'])[0],[400,403])
        for route in ['horizon/activity/feed?period=all', 'horizon/dashboard/activity']:
            code, own = self.pb.request('GET',route,token=self.token);self.assertEqual(code,200,own)
            self.assertIn(event['id'],[i['id'] for i in own['items']])
            code, hidden = self.pb.request('GET',route,token=self.people['other']['token']);self.assertEqual(code,200,hidden)
            self.assertNotIn(event['id'],[i['id'] for i in hidden['items']])
            if 'totalItems' in hidden:self.assertEqual(hidden['totalItems'],0)

        self.assertEqual(self.pb.request('POST','collections/core_activity_events/records',dict(body,mentions=[self.people['manager']['user']['id']]),self.token)[0],403)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        code,event=self.pb.request('POST','collections/core_activity_events/records',dict(body,mentions=[self.people['owner']['user']['id']]),self.people['manager']['token']);self.assertEqual(code,200,event)
        users=self.pb.request('GET','horizon/activity/users?module=leave&id='+r['id'],token=self.people['manager']['token'])[1]['items']
        self.assertIn(self.people['owner']['user']['id'],[u['id'] for u in users]);self.assertNotIn(self.people['other']['user']['id'],[u['id'] for u in users])
        code,event=self.pb.request('POST','collections/core_activity_events/records',body,self.people['hr']['token']);self.assertEqual(code,200,event)
        role=self.pb.create('core_roles',dict(name='leave_access_admin',label='Admin',active=True,permissions=['settings.users']))
        self.pb.create_user('leave-admin@local.invalid',role['id'],'admin');admin=self.pb.login('leave-admin@local.invalid')[1]['token']
        input=dict(name='Invalid RH',email='invalid-leave@local.invalid',active=True,erp_profile='user',employee='',password='Local-Horizon-test-only-2026!',grants={'leave':{'actions':['read','allocate'],'scope':'self'}})
        code,result=self.pb.request('POST','horizon/access/users/save',dict(input=input),admin);self.assertEqual(code,400,result)
        input['grants']['leave']={'actions':['read','validate'],'scope':'self'}
        self.assertEqual(self.pb.request('POST','horizon/access/users/save',dict(input=input),admin)[0],400)

    def test_concurrent_reservations_do_not_overspend(self):
        self.assertEqual(self.allocate(2)[0],200)
        a=self.draft('concurrent-first-key');b=self.draft('concurrent-second-key',start_date='2026-11-02',end_date='2026-11-03')
        with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda r:self.transition(r,'submit'),[a,b]))
        self.assertEqual(sorted(code for code,_ in results),[200,400],results)
        self.assertEqual(self.balance()['pending'],2);self.assertEqual(self.balance()['available'],0)

class LeaveUpgradeTests(unittest.TestCase):
    def test_holiday_migration_preserves_settings_and_existing_requests(self):
        from pathlib import Path
        import shutil,subprocess
        from check_auth import ROOT
        pb=LocalPocketBase();self.addCleanup(pb.close)
        previous=Path(pb.temp.name)/'pre_holidays';previous.mkdir()
        for path in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if path.name<'1791840017':shutil.copy(path,previous)
        original=pb.args[:];pb.args=[arg for arg in original if not arg.startswith('--migrationsDir=')]+[f'--migrationsDir={previous}'];pb.start()
        policy=pb.request('GET','collections/leave_settings/records',token=pb.admin_token)[1]['items'][0]
        code,policy=pb.request('PATCH','collections/leave_settings/records/'+policy['id'],dict(holidays=['2026-12-24'],weekdays=[1,2,3,4,5]),pb.admin_token);self.assertEqual(code,200,policy)
        employee=pb.create('hr_employees',dict(first_name='Ancien',last_name='Congé',employment_type='employee',status='active'))
        typ=pb.request('GET','collections/leave_types/records',token=pb.admin_token)[1]['items'][0]
        old=pb.create('leave_requests',dict(employee=employee['id'],user=pb.user['id'],type=typ['id'],start_date='2026-12-25',end_date='2026-12-25',start_half='am',end_half='pm',status='submitted',duration=1,breakdown={'2026':1},policy_snapshot={'weekdays':[1,2,3,4,5],'holidays':['2026-12-24']}))
        pb.process.terminate();pb.process.wait(timeout=10)
        for _ in range(2):
            result=subprocess.run(original+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        pb.args=original;pb.launch_and_authenticate(original)
        current=pb.request('GET','collections/leave_settings/records/'+policy['id'],token=pb.admin_token)[1]
        self.assertEqual(current['holidays'],['2026-12-24']);self.assertEqual(current['weekdays'],policy['weekdays']);self.assertEqual(current['holiday_calendar'],'metropole');self.assertEqual(current['working_holidays'],[])
        current=pb.request('GET','collections/leave_requests/records/'+old['id'],token=pb.admin_token)[1];self.assertEqual(current,old)
    def test_upgrade_preserves_existing_data_and_grants_only_admins(self):
        from pathlib import Path
        import shutil,subprocess
        from check_auth import ROOT
        pb=LocalPocketBase();self.addCleanup(pb.close)
        previous=Path(pb.temp.name)/'pre_leave';previous.mkdir()
        for path in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if path.name<'1791840016':shutil.copy(path,previous)
        original=pb.args[:];pb.args=[arg for arg in original if not arg.startswith('--migrationsDir=')]+[f'--migrationsDir={previous}'];pb.start()
        employee=pb.create('hr_employees',dict(first_name='Employé',last_name='Historique',employment_type='employee',status='active'))
        company=pb.create('contacts_companies',dict(name='Société historique',active=True))
        role=pb.create('core_roles',dict(name='leave_upgrade_admin',label='Admin',active=True,permissions=['contacts.read','settings.users']))
        admin=pb.create_user('leave-upgrade-admin@local.invalid',role['id'],'admin')
        pb.process.terminate();pb.process.wait(timeout=10)
        for _ in range(2):
            result=subprocess.run(original+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        pb.args=original;pb.launch_and_authenticate(original)
        for table,record in [('hr_employees',employee),('contacts_companies',company)]:
            current=pb.request('GET','collections/'+table+'/records/'+record['id'],token=pb.admin_token)[1]
            # Later additive migrations may add fields; every historical value must remain identical.
            self.assertEqual({key:current[key] for key in record},record)
            if table=='contacts_companies':self.assertEqual(current['merged_into'],'');self.assertEqual(current['merged_at'],'')
        current=pb.request('GET','collections/core_users/records/'+admin['id'],token=pb.admin_token)[1];self.assertEqual(current['leave_scope'],'all')
        ordinary=pb.request('GET','collections/core_users/records/'+pb.user['id'],token=pb.admin_token)[1];self.assertEqual(ordinary['leave_scope'],'none')
        current_role=pb.request('GET','collections/core_roles/records/'+role['id'],token=pb.admin_token)[1]
        self.assertTrue(set(['contacts.read','settings.users','leave.read','leave.allocate']).issubset(current_role['permissions']))
        self.assertEqual(pb.request('GET','collections/leave_allocations/records',token=pb.admin_token)[1]['totalItems'],0)
        self.assertEqual(pb.request('GET','collections/leave_requests/records',token=pb.admin_token)[1]['totalItems'],0)
        self.assertEqual(pb.request('GET','collections/leave_types/records',token=pb.admin_token)[1]['totalItems'],5)

if __name__=='__main__':unittest.main()

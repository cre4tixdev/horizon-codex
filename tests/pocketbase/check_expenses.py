"""Monthly expenses workflows and protected files against disposable PocketBase."""
import json
import shutil
import subprocess
from pathlib import Path
import unittest
from check_auth import LocalPocketBase, ROOT
from check_employee_photos import PNG
from urllib.request import Request, urlopen
from urllib.error import HTTPError

class ExpensesTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start(); self.addCleanup(self.pb.close)
        self.people = {}
        for key, rights, scope in [('owner', ['read','write','submit'], 'self'), ('manager', ['read','validate'], 'reports'), ('other', ['read','write','submit'], 'self'), ('finance', ['read','validate','reimburse','write'], 'all')]:
            role = self.pb.create('core_roles', {'name':'expenses_'+key,'label':key,'active':True,'permissions':['expenses.'+r for r in rights]+['contacts.read','crm.read']})
            employee = self.pb.create('hr_employees', {'first_name':key,'last_name':'Fixture','status':'active','employment_type':'employee','is_manager':key=='manager'})
            user = self.pb.create_user(key+'-expenses@local.invalid', role['id'])
            self.pb.request('PATCH','collections/core_users/records/'+user['id'],{'employee':employee['id'],'expenses_scope':scope},self.pb.admin_token)
            token = self.pb.login(key+'-expenses@local.invalid')[1]['token']
            self.people[key] = dict(user=user, employee=employee, token=token)
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],{'manager':self.people['manager']['employee']['id']},self.pb.admin_token)
        self.token = self.people['owner']['token']
        self.categories = self.call('GET','choices')[1]['categories']
        self.input = dict(date='2026-10-05',category=self.categories[1]['id'],description='Parking chantier',company='',contact='',opportunity='',internal=True,guests=[],internal_guests='',route='',vehicle='',payment_method='personal',amount=12.50,tax_amount=2.00)
    def call(self,method,path,body=None,token=None): return self.pb.request(method,'horizon/expenses/'+path,body,token or self.token)
    def report(self,key='create-report-fixture',**extra):
        code,r=self.call('POST','reports',dict(month='2026-10',notes='',validator='',creation_key=key,**extra));self.assertEqual(code,200,r);return r
    def line(self,r,files=True,**changes):
        data=dict(self.input,**changes)
        if not files: return self.call('POST','reports/'+r['id']+'/lines',dict(updated=r['updated'],input=data))
        boundary='expenses-fixture'; fields={'updated':r['updated'],'input':json.dumps(data)}
        parts=[f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k,v in fields.items()]
        parts += [f'--{boundary}\r\nContent-Disposition: form-data; name="receipt"; filename="ticket.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+PNG+b'\r\n',f'--{boundary}--\r\n'.encode()]
        req=Request(self.pb.url+'/api/horizon/expenses/reports/'+r['id']+'/lines',data=b''.join(parts),headers={'Authorization':self.token,'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
        try:
            with urlopen(req) as res:return res.status,json.loads(res.read())
        except HTTPError as err:return err.code,json.loads(err.read())
    def transition(self,r,action,who='owner',**extra):return self.call('POST','reports/'+r['id']+'/transition',dict(updated=r['updated'],action=action,**extra),self.people[who]['token'])
    def test_internal_participants_directory_validation_and_snapshot(self):
        choices = self.call('GET','choices')[1]
        owner = self.people['owner']['employee']
        self.assertIn({'id':owner['id'], 'label':'owner Fixture'}, choices['employees'])
        self.assertTrue(all(set(employee) == {'id','label'} for employee in choices['employees']))
        inactive = self.pb.create('hr_employees', {'first_name':'Inactif','last_name':'Participant','status':'inactive','employment_type':'employee'})
        self.assertNotIn(inactive['id'], [employee['id'] for employee in self.call('GET','choices')[1]['employees']])
        report = self.report()
        for ids in [[owner['id'],owner['id']], [inactive['id']], [owner['id']] * 31]:
            self.assertEqual(self.line(report,files=False,internal_participants=ids)[0],400)
        participant = self.people['other']['employee']
        meal = next(category for category in self.categories if category['mode']=='meal')
        status, report = self.line(report, category=meal['id'], internal_participants=[participant['id']], guests=[], internal_guests='')
        self.assertEqual(status,200,report)
        self.assertEqual(report['lines'][0]['internal_participants'],[participant['id']])
        self.pb.request('PATCH','collections/hr_employees/records/'+participant['id'],{'first_name':'Nom avant validation','status':'inactive'},self.pb.admin_token)
        status, report = self.transition(report,'submit'); self.assertEqual(status,200,report)
        status, report = self.transition(report,'validate','manager'); self.assertEqual(status,200,report)
        self.pb.request('PATCH','collections/hr_employees/records/'+participant['id'],{'first_name':'Nom modifié après validation','status':'inactive'},self.pb.admin_token)
        record = self.call('GET','reports/'+report['id'])[1]
        self.assertEqual(record['lines'][0]['internal_participants_names'],[{'id':participant['id'],'label':'Nom avant validation Fixture'}])
        self.assertEqual(record['lines'][0]['snapshot']['internal_participants_names'],record['lines'][0]['internal_participants_names'])

    def test_tax_rate_choice_calculation_and_historical_snapshot(self):
        choices = self.call('GET', 'choices')[1]
        self.assertIn({'code': 'VAT20', 'label': 'TVA 20 %', 'rate': 20}, choices['tax_codes'])
        self.assertEqual(set(choices['tax_codes'][0]), {'code', 'label', 'rate'})
        report = self.report()
        for changes in [{'tax_code':'UNKNOWN','tax_rate':20,'amount':120,'tax_amount':20}, {'tax_code':'VAT20','tax_rate':10,'amount':120,'tax_amount':20}, {'tax_code':'VAT20','tax_rate':20,'amount':120,'tax_amount':21}, {'tax_code':'','tax_rate':20}]:
            self.assertEqual(self.line(report, files=False, **changes)[0], 400)
        status, report = self.line(report, tax_code='VAT20', tax_rate=20, amount=120, tax_amount=20)
        self.assertEqual(status, 200, report)
        self.assertEqual(report['lines'][0]['tax_rate'], 20)
        settings = self.pb.request('GET', 'collections/settings_billing/records', token=self.pb.admin_token)[1]['items'][0]
        self.pb.request('PATCH', 'collections/settings_billing/records/' + settings['id'], {'tax_codes':[{'code':'VAT20','label':'Taux modifié','rate':10,'mention':''}]}, self.pb.admin_token)
        self.assertEqual(self.line(report, files=False, tax_code='VAT20', tax_rate=20, amount=120, tax_amount=20)[0], 400)
        status, report = self.transition(report, 'submit'); self.assertEqual(status, 200, report)
        status, report = self.transition(report, 'validate', 'manager'); self.assertEqual(status, 200, report)
        line = report['lines'][0]
        self.assertEqual((line['amount'], line['tax_amount'], line['tax_code'], line['tax_rate']), (120,20,'VAT20',20))
        self.assertEqual(line['snapshot']['tax_rate'], 20)
        self.assertEqual(self.line(report, files=False, tax_code='VAT20', tax_rate=10, amount=110, tax_amount=10)[0], 403)

    def test_team_overview_roster_private_drafts_and_scopes(self):
        note = self.report()
        self.pb.request('PATCH', 'collections/expenses_reports/records/' + note['id'], {'total': 999.99}, self.pb.admin_token)
        manager = self.people['manager']['token']
        self.assertEqual(self.call('GET', 'overview?month=2026-10', token=self.token)[0], 403)
        status, data = self.call('GET', 'overview?month=2026-10', token=manager)
        self.assertEqual(status, 200, data)
        self.assertEqual([row['employee'] for row in data['items']], [self.people['owner']['employee']['id']])
        self.assertEqual(data['items'][0]['cells'][0], {'month': '2026-10', 'status': 'missing', 'total': 0, 'reports': []})
        self.assertNotIn(note['id'], json.dumps(data))
        self.assertEqual(self.call('GET', 'reports/' + note['id'], token=manager)[0], 403)
        self.pb.request('PATCH', 'collections/expenses_reports/records/' + note['id'], {'status': 'submitted', 'submitted_at': '2026-10-06 12:00:00Z', 'validator': self.people['manager']['user']['id'], 'total': 12.34}, self.pb.admin_token)
        data = self.call('GET', 'overview?view=year&month=2026-10', token=manager)[1]
        self.assertEqual(len(data['periods']), 12)
        self.assertEqual(data['items'][0]['cells'][9]['reports'][0]['id'], note['id'])
        self.assertEqual(data['summary']['submitted'], 1)
        self.assertEqual(data['items'][0]['total'], 12.34)
        # Reassignment removes metadata and money; the current roster still has a non-received cell.
        self.pb.request('PATCH', 'collections/expenses_reports/records/' + note['id'], {'validator': self.people['finance']['user']['id']}, self.pb.admin_token)
        data = self.call('GET', 'overview?month=2026-10', token=manager)[1]
        self.assertNotIn(note['id'], json.dumps(data)); self.assertEqual(data['items'][0]['total'], 0)
        global_data = self.call('GET', 'overview?month=2026-10', token=self.people['finance']['token'])[1]
        self.assertEqual(global_data['summary']['submitted'], 1)
        self.assertEqual(global_data['summary']['total'], 12.34)
        self.assertEqual(self.call('GET', 'choices', token=manager)[1]['can_team'], True)
        self.assertEqual(self.call('GET', 'choices')[1]['can_team'], False)

    def test_team_overview_complements_archives_and_pagination(self):
        owner = self.people['owner']; manager = self.people['manager']['token']
        team = self.pb.create('core_teams', {'code': 'FRAIS', 'name': 'Équipe Frais', 'active': True})
        self.pb.request('PATCH', 'collections/hr_employees/records/' + owner['employee']['id'], {'team': team['id']}, self.pb.admin_token)
        primary = self.report()
        self.pb.request('PATCH', 'collections/expenses_reports/records/' + primary['id'], {'status': 'validated', 'validator': self.people['manager']['user']['id'], 'submitted_at': '2026-10-01 12:00:00Z', 'total': 0.1}, self.pb.admin_token)
        complement = self.pb.create('expenses_reports', {'user': owner['user']['id'], 'employee': owner['employee']['id'], 'month': '2026-10', 'title': 'Complément', 'status': 'submitted', 'supplement_of': primary['id'], 'validator': self.people['manager']['user']['id'], 'submitted_at': '2026-10-01 12:00:00Z', 'total': 0.2, 'currency': 'EUR'})
        self.pb.create('hr_employees', {'first_name': 'Autre', 'last_name': 'Collaborateur', 'manager': self.people['manager']['employee']['id'], 'team': team['id'], 'status': 'active', 'employment_type': 'employee', 'start_date': '2026-11-01'})
        status, data = self.call('GET', 'overview?view=quarter&month=2026-11&q=equipe&perPage=1', token=manager)
        self.assertEqual(status, 200, data); self.assertEqual(data['periods'], ['2026-10', '2026-11', '2026-12']); self.assertEqual(data['totalItems'], 2); self.assertEqual(data['totalPages'], 2)
        page2 = self.call('GET', 'overview?view=quarter&month=2026-11&q=equipe&perPage=1&page=2', token=manager)[1]
        self.assertNotEqual(data['items'][0]['employee'], page2['items'][0]['employee'])
        rows = data['items'] + page2['items']; row = next(row for row in rows if row['employee'] == owner['employee']['id'])
        self.assertEqual(row['cells'][0]['status'], 'mixed'); self.assertEqual(row['total'], 0.3)
        self.assertEqual(len(row['cells'][0]['reports']), 2)
        self.assertEqual(sum(report['supplement'] for report in row['cells'][0]['reports']), 1)
        filtered = self.call('GET', 'overview?month=2026-10&status=submitted', token=manager)[1]
        self.assertEqual(filtered['totalItems'], 1)
        self.assertEqual(filtered['summary']['validated'], 1)
        for record in [primary, complement]: self.pb.request('PATCH', 'collections/expenses_reports/records/' + record['id'], {'status': 'cancelled', 'archived_at': '2026-10-07 12:00:00Z'}, self.pb.admin_token)
        data = self.call('GET', 'overview?month=2026-10&state=archived', token=manager)[1]
        self.assertEqual(data['totalItems'], 1); self.assertEqual(data['items'][0]['total'], 0)
        self.assertEqual(data['items'][0]['cells'][0]['status'], 'cancelled')
        # Previously assigned historical notes survive employee deactivation.
        self.pb.request('PATCH', 'collections/hr_employees/records/' + owner['employee']['id'], {'status': 'inactive'}, self.pb.admin_token)
        self.assertEqual(self.call('GET', 'overview?month=2026-10&state=archived', token=manager)[1]['totalItems'], 1)
        for query in ['view=week', 'month=2026-13', 'month=1999-01', 'status=secret', 'perPage=101', 'owner=foreign', 'sort=validator']:
            self.assertEqual(self.call('GET', 'overview?' + query, token=manager)[0], 400, query)

    def test_month_workflow_notifications_and_receipt_permissions(self):
        r=self.report();self.assertEqual(self.report()['id'],r['id'])
        self.assertEqual(self.call('GET','reports/'+r['id'],token=self.people['manager']['token'])[0],403)
        self.assertEqual(self.call('GET','reports?area=review',token=self.people['manager']['token'])[1]['totalItems'],0)
        self.assertEqual(self.call('POST','reports',dict(month='2026-10',notes='',validator='',creation_key='second-note-for-month'))[0],409)
        self.assertEqual(self.line(r,files=False,date='2026-09-30')[0],400)
        code,r=self.line(r,files=False);self.assertEqual(code,200,r)
        self.assertEqual(self.transition(r,'submit')[0],400)
        # Updating a saved line with its protected receipt.
        line=r['lines'][0];vehicle=self.pb.create('expenses_vehicles', {'brand':'Renault','model':'Clio','registration':'AB123CD','employee':self.people['owner']['employee']['id'],'active':True});self.input.update(vehicle_record=vehicle['id'],description='Carburant véhicule',category=next(c['id'] for c in self.categories if c['mode']=='fuel'),vehicle='AB-123-CD')
        code,r=self.line(r);self.assertEqual(code,200,r)
        # Remove the first line without a receipt.
        code,r=self.call('POST','reports/'+r['id']+'/remove',dict(updated=r['updated'],line_id=line['id']));self.assertEqual(code,200,r)
        self.assertEqual(self.call('GET','reports/'+r['id'],token=self.people['other']['token'])[0],403)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r);self.assertEqual(r['status'],'submitted');self.assertEqual(r['validator'],self.people['manager']['user']['id'])
        self.assertEqual(self.line(r)[0],403)
        self.assertEqual(self.transition(r,'validate')[0],403)
        self.assertEqual(self.transition(r,'validate','finance')[0],403)
        self.assertEqual(self.transition(r,'return','manager')[0],400)
        notes=self.pb.request('GET','collections/core_notifications/records',token=self.people['manager']['token'])[1]['items'];self.assertEqual(notes[0]['source_record_id'],r['id'])
        l=r['lines'][0];path='files/'+l['collectionId']+'/'+l['id']+'/'+l['receipt'][0]
        for who,expected in [('owner',200),('manager',200),('other',404)]:
            token=self.people[who]['token'];ft=self.pb.request('POST','files/token',{},token)[1]['token']
            req=Request(self.pb.url+'/api/'+path+'?token='+ft)
            try:
                with urlopen(req) as res:code=res.status
            except HTTPError as err:code=err.code
            self.assertEqual(code,expected)
        code,r=self.transition(r,'return','manager',reason='Ligne 1 : préciser le déplacement');self.assertEqual(code,200,r);self.assertEqual(r['status'],'returned')
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        stale=r
        code,r=self.transition(r,'validate','manager');self.assertEqual(code,200,r);self.assertEqual(r['total'],12.5);self.assertEqual(r['reimbursable_total'],12.5);self.assertTrue(r['lines'][0]['snapshot'])
        self.assertEqual(self.transition(stale,'validate','manager')[0],409)
        self.assertEqual(self.call('POST','reports/'+r['id']+'/remove',dict(updated=r['updated'],line_id=l['id']))[0],403)
        code,r=self.transition(r,'reimburse','finance',date='2026-10-06',reference='VIR-42');self.assertEqual(code,200,r)
        code,r=self.transition(r,'archive');self.assertEqual(code,200,r)
        self.assertEqual(self.call('GET','reports')[1]['totalItems'],0)
        self.assertEqual(self.call('GET','reports?state=archived')[1]['totalItems'],1)
        supplement=self.report('supplement-month-fixture',supplement_of=r['id']);self.assertEqual(supplement['supplement_of'],r['id'])
    def test_no_self_approval_or_foreign_mutation_and_tax_validation(self):
        r=self.report()
        for extra in [dict(amount=10,tax_amount=11),dict(amount=1.001),dict(category=self.categories[0]['id'],guests=[]),dict(internal=True,company='invalid')]:
            if extra.get('category'):continue
            self.assertEqual(self.line(r,files=False,**extra)[0],400)
        code,r=self.line(r,payment_method='company');self.assertEqual(code,200,r)
        self.assertEqual(r['reimbursable_total'],0)
        self.assertEqual(self.call('POST','reports/'+r['id']+'/lines',dict(updated=r['updated'],input=self.input),self.people['other']['token'])[0],403)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        self.assertEqual(self.pb.request('PATCH','collections/expenses_reports/records/'+r['id'],{'status':'validated'},self.token)[0],403)
        self.assertEqual(self.call('GET','reports?area=review',token=self.people['other']['token'])[0],403)
        self.pb.request('PATCH','collections/core_roles/records/'+self.people['manager']['user']['role'],{'active':False},self.pb.admin_token)
        self.assertEqual(self.transition(r,'validate','manager')[0],403)

    def test_fallback_reassignment_immutability_and_historical_labels(self):
        r=self.report();code,r=self.line(r);self.assertEqual(code,200,r)
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],{'manager':''},self.pb.admin_token)
        self.assertEqual(self.transition(r,'submit')[0],400)
        code,r=self.call('POST','reports',dict(id=r['id'],updated=r['updated'],month=r['month'],notes='Déplacement',validator=self.people['finance']['user']['id'],supplement_of='',creation_key=''))
        self.assertEqual(code,200,r)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r);self.assertEqual(r['validator'],self.people['finance']['user']['id'])
        self.assertEqual(self.transition(r,'reassign','finance',validator=self.people['owner']['user']['id'],reason='Changement')[0],403)
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],{'manager':self.people['manager']['employee']['id']},self.pb.admin_token)
        code,r=self.transition(r,'reassign','finance',validator=self.people['manager']['user']['id'],reason='Responsable rétabli');self.assertEqual(code,200,r)
        code,r=self.transition(r,'validate','manager');self.assertEqual(code,200,r)
        original=r['lines'][0]['category_label']; category=r['lines'][0]['category']
        self.pb.request('PATCH','collections/expenses_categories/records/'+category,{'label':'Libellé modifié'},self.pb.admin_token)
        self.pb.request('PATCH','collections/hr_employees/records/'+self.people['owner']['employee']['id'],{'last_name':'Autre nom'},self.pb.admin_token)
        code,current=self.call('GET','reports/'+r['id']);self.assertEqual(code,200,current)
        self.assertEqual(current['lines'][0]['category_label'],original);self.assertEqual(current['employee_name'],r['employee_name']);self.assertEqual(current['exchange_rate'],1)
        self.assertEqual(self.call('POST','reports/'+r['id']+'/lines',dict(id=r['lines'][0]['id'],updated=r['updated'],input=self.input,removed=r['lines'][0]['receipt']))[0],403)
        self.assertEqual(self.transition(r,'reimburse','finance',date='2099-10-01',reference='future')[0],400)

    def test_line_order_monthly_key_and_submission_completeness(self):
        r=self.report()
        self.assertEqual(self.call('POST','reports',dict(month='2026-11',notes='',validator='',creation_key='create-report-fixture'))[0],409)
        code,r=self.line(r,category=self.categories[0]['id']);self.assertEqual(code,200,r)
        self.assertEqual(self.transition(r,'submit')[0],400)  # restaurant needs participants
        code,r=self.line(r,category=next(c['id'] for c in self.categories if c['mode']=='travel'),route='');self.assertEqual(code,200,r)
        ids=[l['id'] for l in r['lines']]
        self.assertEqual(self.call('POST','reports/'+r['id']+'/order',dict(updated=r['updated'],ids=[ids[0],ids[0]]))[0],400)
        code,r=self.call('POST','reports/'+r['id']+'/order',dict(updated=r['updated'],ids=list(reversed(ids))));self.assertEqual(code,200,r);self.assertEqual([l['id'] for l in r['lines']],list(reversed(ids)))
        code,r=self.transition(r,'cancel');self.assertEqual(code,200,r)
        code,r=self.transition(r,'reopen');self.assertEqual(code,200,r);self.assertEqual(r['status'],'draft')
        self.assertEqual(self.call('GET','reports?status=draft,returned&sort=employee')[0],200)
        self.assertEqual(self.call('GET','reports?status=deleted')[0],400)
        self.assertEqual(self.call('GET','reports?sort=unsafe')[0],400)

    def test_vehicle_settings_assignment_uniqueness_and_history(self):
        role = self.pb.create('core_roles', {'name':'vehicle_admin','label':'Véhicules','active':True,'permissions':['settings.references']})
        self.pb.create_user('vehicle-admin@local.invalid', role['id'])
        admin = self.pb.login('vehicle-admin@local.invalid')[1]['token']
        data = dict(brand='Renault', model='Clio', registration='ab-123 cd', employee=self.people['owner']['employee']['id'], active=True)
        code, vehicle = self.call('POST','vehicles',data,admin); self.assertEqual(code,200,vehicle)
        self.assertEqual(vehicle['registration'],'AB123CD')
        self.assertEqual(self.call('POST','vehicles',dict(data,registration='AB123CD'),admin)[0],400)
        self.assertEqual(self.call('GET','vehicles')[0],403)
        self.assertEqual(self.call('POST','vehicles',data)[0],403)
        self.assertEqual(self.pb.request('GET','collections/expenses_vehicles/records',token=self.token)[0],403)
        self.assertEqual(self.pb.request('POST','collections/expenses_vehicles/records',data,self.token)[0],403)
        code, listing = self.call('GET','vehicles',token=admin); self.assertEqual(code,200,listing)
        self.assertEqual(listing['items'][0]['employee_name'],'owner Fixture')
        self.assertEqual([v['id'] for v in self.call('GET','choices')[1]['vehicles']],[vehicle['id']])
        self.assertEqual(self.call('GET','choices',token=self.people['other']['token'])[1]['vehicles'],[])
        fuel = next(c['id'] for c in self.categories if c['mode']=='fuel')
        r=self.report();self.assertEqual(self.line(r,category=fuel,vehicle='Texte libre')[0],400)
        foreign=self.pb.create('expenses_vehicles',dict(data,registration='EF456GH',employee=self.people['other']['employee']['id']))
        self.assertEqual(self.line(r,category=fuel,vehicle_record=foreign['id'])[0],403)
        code,r=self.line(r,category=fuel,vehicle_record=vehicle['id'],vehicle='Libellé falsifié');self.assertEqual(code,200,r)
        label=r['lines'][0]['vehicle'];self.assertEqual(label,'Renault Clio · AB123CD')
        # Reassignment must not invalidate or rewrite a vehicle already recorded for this expense.
        code,changed=self.call('POST','vehicles',dict(data,id=vehicle['id'],updated=vehicle['updated'],model='Captur',employee=self.people['other']['employee']['id'],active=False),admin);self.assertEqual(code,200,changed)
        self.assertEqual(self.call('POST','vehicles',dict(data,id=vehicle['id'],updated=vehicle['updated']),admin)[0],409)
        self.assertEqual(self.call('GET','choices')[1]['vehicles'],[])
        self.assertEqual(self.line(r,category=fuel,vehicle_record=vehicle['id'])[0],403)
        code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        code,r=self.transition(r,'validate','manager');self.assertEqual(code,200,r)
        self.assertEqual(r['lines'][0]['vehicle'],label);self.assertEqual(r['lines'][0]['snapshot']['vehicle'],label)
        self.assertEqual(self.pb.request('DELETE','collections/expenses_vehicles/records/'+vehicle['id'],token=self.pb.admin_token)[0],400)

    def test_opportunity_number_is_projected_and_frozen_at_validation(self):
        owner = self.people['owner']['user']
        rights = ['expenses.read', 'expenses.write', 'expenses.submit', 'contacts.read', 'crm.read', 'crm.write']
        code, _ = self.pb.request('PATCH', 'collections/core_roles/records/'+owner['role'], {'permissions':rights}, self.pb.admin_token)
        self.assertEqual(code, 200)
        company = self.pb.create('contacts_companies', {'name':'Client frais affaire', 'active':True})
        stage = self.pb.request('GET', 'collections/crm_stages/records', token=self.token)[1]['items'][0]
        code, opportunity = self.pb.request('POST', 'horizon/crm/save', {'creation_key':'expenses-opportunity-number', 'input':{'title':'Affaire déplacement', 'company':company['id'], 'contact':'', 'owner':owner['id'], 'stage':stage['id'], 'type':'direct', 'estimated_value':1000, 'estimated_cost':0, 'currency':'EUR', 'probability':0, 'expected_date':'', 'description':'', 'status':'open', 'market_types':[]}}, self.token)
        self.assertEqual(code, 200, opportunity)
        choices = self.call('GET','choices')[1]
        option = next(item for item in choices['opportunities'] if item['id']==opportunity['id'])
        self.assertEqual(option['number'], opportunity['opportunity_number'])
        r = self.report()
        code, r = self.line(r, internal=False, opportunity=opportunity['id'])
        self.assertEqual(code, 200, r)
        self.assertEqual(r['lines'][0]['opportunity_number'], opportunity['opportunity_number'])
        self.assertEqual(r['lines'][0]['analytic_account'], opportunity['analytic_account'])
        code, r = self.transition(r, 'submit'); self.assertEqual(code, 200, r)
        code, r = self.transition(r, 'validate', 'manager'); self.assertEqual(code, 200, r)
        snapshot = r['lines'][0]['snapshot']
        self.assertEqual(snapshot['opportunity_number'], opportunity['opportunity_number'])
        # Existing validated JSON, rather than the current CRM projection, is authoritative.
        code, _ = self.pb.request('PATCH', 'collections/crm_opportunities/records/'+opportunity['id'], {'opportunity_number':'99999', 'title':'Affaire renommée'}, self.pb.admin_token)
        self.assertEqual(code, 200)
        code, current = self.call('GET','reports/'+r['id'])
        self.assertEqual(code, 200, current)
        self.assertEqual(current['lines'][0]['opportunity_number'], opportunity['opportunity_number'])
        self.assertEqual(current['lines'][0]['opportunity_name'], opportunity['title'])
        self.assertEqual(current['lines'][0]['snapshot'], snapshot)

    def test_changing_month_preserves_dates_receipts_and_rejects_collisions(self):
        r=self.report();code,r=self.line(r);self.assertEqual(code,200,r)
        receipt=r['lines'][0]['receipt']; date=r['lines'][0]['date']
        code,r=self.call('POST','reports',dict(id=r['id'],updated=r['updated'],month='2026-11',notes='Mois corrigé',validator='',supplement_of='',creation_key=''));self.assertEqual(code,200,r)
        self.assertEqual(r['month'],'2026-11');self.assertIn('novembre',r['title']);self.assertEqual(r['lines'][0]['date'],date);self.assertEqual(r['lines'][0]['receipt'],receipt)
        self.assertEqual(self.transition(r,'submit')[0],400)
        code,occupied=self.call('POST','reports',dict(month='2026-10',notes='',validator='',creation_key='other-month-fixture'));self.assertEqual(code,200,occupied)
        self.assertEqual(self.call('POST','reports',dict(id=r['id'],updated=r['updated'],month='2026-10',notes='',validator='',supplement_of='',creation_key=''))[0],409)
        current=self.call('GET','reports/'+r['id'])[1];self.assertEqual(current['month'],'2026-11');self.assertEqual(current['lines'][0]['receipt'],receipt)

    def test_shared_activity_scope_comments_mentions_and_tasks(self):
        r=self.report();self.assertEqual(self.pb.request('GET','horizon/activity/events?entity=expenses_reports&id='+r['id'],token=self.people['manager']['token'])[0],403)
        body=dict(source_module='expenses',source_entity='expenses_reports',source_record_id=r['id'],type='note',body='Justificatif en cours',mentions=[],metadata={})
        code,event=self.pb.request('POST','collections/core_activity_events/records',body,self.token);self.assertEqual(code,200,event)
        feed=self.pb.request('GET','horizon/activity/events?entity=expenses_reports&id='+r['id'],token=self.token)[1];self.assertTrue(any(e['body']=='Justificatif en cours' for e in feed['items']));self.assertTrue(all(e['metadata'].get('author') for e in feed['items']))
        self.assertIn(self.pb.request('POST','collections/core_activity_events/records',dict(body,body='Tentative étrangère'),self.people['other']['token'])[0],[400,403])
        self.assertEqual(self.pb.request('GET','horizon/activity/events?entity=expenses_reports&id='+r['id'],token=self.people['other']['token'])[0],403)
        for route in ['horizon/activity/feed?period=all', 'horizon/dashboard/activity']:
            code, own = self.pb.request('GET',route,token=self.token);self.assertEqual(code,200,own)
            self.assertIn(event['id'],[i['id'] for i in own['items']])
            code, hidden = self.pb.request('GET',route,token=self.people['other']['token']);self.assertEqual(code,200,hidden)
            self.assertNotIn(event['id'],[i['id'] for i in hidden['items']])
            if 'totalItems' in hidden:self.assertEqual(hidden['totalItems'],0)

        self.assertEqual(self.pb.request('POST','collections/core_activity_events/records',dict(body,mentions=[self.people['other']['user']['id']]),self.token)[0],403)
        code,r=self.line(r);self.assertEqual(code,200,r);code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        code,event=self.pb.request('POST','collections/core_activity_events/records',dict(body,body='Vérification manager',mentions=[self.people['owner']['user']['id']]),self.people['manager']['token']);self.assertEqual(code,200,event)
        users=self.pb.request('GET','horizon/activity/users?module=expenses&id='+r['id'],token=self.people['manager']['token'])[1]['items'];self.assertIn(self.people['owner']['user']['id'],[u['id'] for u in users]);self.assertNotIn(self.people['other']['user']['id'],[u['id'] for u in users])
        task=dict(body,type='task',body='Contrôler le justificatif',metadata={'task':dict(title='Contrôle',assigned_to=self.people['owner']['user']['id'],due_date='',priority='normal')})
        code,event=self.pb.request('POST','collections/core_activity_events/records',task,self.people['manager']['token']);self.assertEqual(code,200,event)
        tasks=self.pb.request('GET','horizon/activity/tasks?entity=expenses_reports&id='+r['id'],token=self.token)[1]['items'];self.assertEqual(len(tasks),1)
        self.assertEqual(self.pb.request('PATCH','collections/core_tasks/records/'+tasks[0]['id'],{'status':'done'},self.token)[0],200)
        code,r=self.transition(r,'validate','manager');self.assertEqual(code,200,r)
        self.assertEqual(self.pb.request('POST','collections/core_activity_events/records',dict(body,body='Note après validation'),self.token)[0],200)
        self.assertEqual(self.line(r)[0],403)

    def test_shared_feed_files_follow_the_expense_source_scope(self):
        r=self.report();boundary='expense-feed-file'
        values=dict(source_module='expenses',source_entity='expenses_reports',source_record_id=r['id'],type='note',body='Document du fil',mentions='[]',metadata='{}')
        parts=[f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k,v in values.items()]
        parts += [f'--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="preuve.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+PNG+b'\r\n',f'--{boundary}--\r\n'.encode()]
        req=Request(self.pb.url+'/api/collections/core_activity_events/records',data=b''.join(parts),headers={'Authorization':self.token,'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
        with urlopen(req) as res:event=json.loads(res.read())
        def file_status(who):
            ft=self.pb.request('POST','files/token',{},self.people[who]['token'])[1]['token']
            try:
                with urlopen(self.pb.url+'/api/files/'+event['collectionId']+'/'+event['id']+'/'+event['attachments'][0]+'?token='+ft) as res:return res.status
            except HTTPError as error:return error.code
        self.assertEqual(file_status('owner'),200);self.assertEqual(file_status('manager'),404);self.assertEqual(file_status('other'),404)
        code,r=self.line(r);self.assertEqual(code,200,r);code,r=self.transition(r,'submit');self.assertEqual(code,200,r)
        self.assertEqual(file_status('manager'),200);self.assertEqual(file_status('other'),404)
        self.assertEqual(self.pb.request('GET','horizon/activity/events/'+event['id']+'/avatar',token=self.people['other']['token'])[0],403)

class ExpensesMigrationTests(unittest.TestCase):
    def test_upgrade_preserves_existing_data_and_is_repeatable(self):
        pb=LocalPocketBase();self.addCleanup(pb.close)
        previous=Path(pb.temp.name)/'previous_migrations';previous.mkdir()
        for path in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if path.name<'1791840009':shutil.copy(path,previous)
        original=pb.args[:];pb.args=[arg for arg in pb.args if not arg.startswith('--migrationsDir=')]+[f'--migrationsDir={previous}'];pb.start()
        employee=pb.create('hr_employees',dict(first_name='Existant',last_name='À conserver',employment_type='employee',status='active'))
        company=pb.create('contacts_companies',dict(name='Société historique',active=True))
        admin_role=pb.create('core_roles',dict(name='expenses_upgrade_admin',label='Admin',active=True,permissions=['settings.users','contacts.read']))
        admin=pb.create_user('expenses-upgrade-admin@local.invalid',admin_role['id'],'admin')
        status,admin=pb.request('PATCH','collections/core_users/records/'+admin['id'],dict(employee=employee['id']),pb.admin_token);self.assertEqual(status,200)
        reader=pb.user.copy()
        pb.process.terminate();pb.process.wait(timeout=10)
        for _ in range(2):
            result=subprocess.run(original+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stderr+result.stdout)
        pb.args=original;pb.launch_and_authenticate(original)
        current=pb.request('GET','collections/core_users/records/'+admin['id'],token=pb.admin_token)[1]
        for key in ['id','name','email','employee','role','active']:self.assertEqual(current[key],admin[key])
        self.assertEqual(current['expenses_scope'],'all')
        current_reader=pb.request('GET','collections/core_users/records/'+reader['id'],token=pb.admin_token)[1];self.assertEqual(current_reader['role'],reader['role']);self.assertEqual(current_reader['expenses_scope'],'none')
        self.assertEqual(pb.request('GET','collections/hr_employees/records/'+employee['id'],token=pb.admin_token)[1]['last_name'],employee['last_name'])
        self.assertEqual(pb.request('GET','collections/contacts_companies/records/'+company['id'],token=pb.admin_token)[1]['name'],company['name'])
        self.assertEqual(pb.request('GET','collections/expenses_categories/records',token=pb.admin_token)[1]['totalItems'],8)
        rights=pb.request('GET','collections/core_roles/records/'+admin_role['id'],token=pb.admin_token)[1]['permissions'];self.assertIn('contacts.read',rights);self.assertIn('expenses.validate',rights)

class ExpenseVehiclesUpgradeTests(unittest.TestCase):
    def test_upgrade_preserves_free_text_and_snapshots_without_guessing_assignments(self):
        pb=LocalPocketBase();self.addCleanup(pb.close)
        previous=Path(pb.temp.name)/'previous_migrations';previous.mkdir()
        for path in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if path.name<'1791840011':shutil.copy(path,previous)
        original=pb.args[:];pb.args=[arg for arg in pb.args if not arg.startswith('--migrationsDir=')]+[f'--migrationsDir={previous}'];pb.start()
        employee=pb.create('hr_employees',dict(first_name='Conducteur',last_name='Historique',employment_type='employee',status='active'))
        report=pb.create('expenses_reports',dict(user=pb.user['id'],employee=employee['id'],month='2026-10',title='Historique',status='validated',currency='EUR',total=10,tax=0,reimbursable_total=10))
        fuel=next(c for c in pb.request('GET','collections/expenses_categories/records',token=pb.admin_token)[1]['items'] if c['mode']=='fuel')
        line=pb.create('expenses_lines',dict(report=report['id'],position=1,date='2026-10-01',category=fuel['id'],description='Carburant historique',vehicle='AB-123-CD ancien véhicule',payment_method='personal',amount=10,currency='EUR',snapshot={'vehicle':'AB-123-CD ancien véhicule','historical':True}))
        pb.process.terminate();pb.process.wait(timeout=10)
        for _ in range(2):
            result=subprocess.run(original+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        pb.args=original;pb.launch_and_authenticate(original)
        current=pb.request('GET','collections/expenses_lines/records/'+line['id'],token=pb.admin_token)[1]
        for key in ['id','report','position','date','description','vehicle','snapshot','updated']:self.assertEqual(current[key],line[key])
        self.assertEqual(current['vehicle_record'],'')
        self.assertEqual(pb.request('GET','collections/expenses_vehicles/records',token=pb.admin_token)[1]['totalItems'],0)
        self.assertEqual(pb.request('GET','collections/expenses_reports/records/'+report['id'],token=pb.admin_token)[1]['updated'],report['updated'])

class ExpensesActivityUpgradeTests(unittest.TestCase):
    def test_activity_upgrade_preserves_notes_events_and_dates(self):
        pb=LocalPocketBase();self.addCleanup(pb.close);previous=Path(pb.temp.name)/'old_expenses';previous.mkdir()
        for path in (ROOT/'pocketbase/pb_migrations').glob('*.js'):
            if path.name<'1791840010':shutil.copy(path,previous)
        original=pb.args[:];pb.args=[arg for arg in pb.args if not arg.startswith('--migrationsDir=')]+[f'--migrationsDir={previous}'];pb.start()
        role=pb.create('core_roles',dict(name='expense_activity_upgrade',label='Expense',active=True,permissions=['expenses.read','expenses.write']))
        employee=pb.create('hr_employees',dict(first_name='Note',last_name='Ancienne',employment_type='employee',status='active'))
        user=pb.create_user('expenses-activity-upgrade@local.invalid',role['id']);pb.request('PATCH','collections/core_users/records/'+user['id'],dict(employee=employee['id'],expenses_scope='self'),pb.admin_token)
        token=pb.login('expenses-activity-upgrade@local.invalid')[1]['token']
        code,r=pb.request('POST','horizon/expenses/reports',dict(month='2026-10',notes='À conserver',validator='',creation_key='legacy-note-upgrade'),token);self.assertEqual(code,200,r)
        events=pb.request('GET','collections/core_activity_events/records?filter=source_record_id="'+r['id']+'"',token=pb.admin_token)[1]['items'];event=events[0]
        code,event=pb.request('PATCH','collections/core_activity_events/records/'+event['id'],dict(metadata={'legacy':'preserved'}),pb.admin_token);self.assertEqual(code,200,event)
        pb.process.terminate();pb.process.wait(timeout=10)
        for _ in range(2):
            result=subprocess.run(original+['migrate','up'],env=pb.environment,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        pb.args=original;pb.launch_and_authenticate(original)
        current=pb.request('GET','collections/core_activity_events/records/'+event['id'],token=pb.admin_token)[1]
        for key in ['id','body','created','source_record_id']:self.assertEqual(current[key],event[key])
        self.assertEqual(current['metadata']['legacy'],'preserved');self.assertTrue(current['metadata']['author']['name'])
        current_report=pb.request('GET','horizon/expenses/reports/'+r['id'],token=token)[1];self.assertEqual(current_report['updated'],r['updated']);self.assertEqual(current_report['month'],r['month']);self.assertEqual(current_report['notes'],r['notes'])

if __name__=='__main__':unittest.main()

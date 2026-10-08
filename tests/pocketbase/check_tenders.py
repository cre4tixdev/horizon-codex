"""AO transactions, immutability, shared calendar and source permissions."""
import unittest
import json
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import check_crm
from concurrent.futures import ThreadPoolExecutor

class TenderTests(unittest.TestCase):
    setUp = check_crm.CrmTests.setUp

    def create(self, key='tender-creation-local-0001', standalone=False, **overrides):
        stage = self.pb.request('GET', 'collections/crm_tender_statuses/records?sort=sort_order', token=self.token)[1]['items'][0]
        if not standalone: stage = next(item for item in self.pb.request('GET', 'collections/crm_tender_statuses/records?sort=sort_order', token=self.token)[1]['items'] if item['code'] == 'preparing')
        self.tender_input = {'reference': 'AO-2026-STUDIO', 'consultation_url': 'https://example.org/consultation', 'status': stage['id'], 'publication_date': '2026-10-01T00:00:00.000Z', 'submission_deadline': '2026-10-20T12:30:00.000Z', 'timezone': 'Europe/Paris', 'expected_result_date': '2026-11-10T00:00:00.000Z', 'visit_required': True, 'tags': []}
        status, result = self.pb.request('POST', 'horizon/crm/save', {'creation_key': key, 'input': {**self.input, 'type': 'tender'}, 'tender': {**self.tender_input, **overrides}}, self.token)
        if status == 200 and not standalone and result['tender']['opportunity']:
            return 200, {**self.pb.request('GET', f'collections/crm_opportunities/records/{result["tender"]["opportunity"]}', token=self.token)[1], 'tender': result['tender']}
        return status, result

    def test_appointment_kind_colors_are_fixed_and_admin_only(self):
        path = 'collections/crm_appointment_kinds/records'
        status, result = self.pb.request('GET', path, token=self.reader_token)
        self.assertEqual(status, 200)
        self.assertEqual({item['code'] for item in result['items']}, {'visit', 'hearing'})
        visit = next(item for item in result['items'] if item['code'] == 'visit')
        role = self.pb.create('core_roles', {'name': 'color_admin', 'label': 'Couleurs', 'active': True, 'permissions': ['settings.references']})
        self.pb.create_user('color-admin@local.invalid', role['id'], 'admin')
        token = self.pb.login('color-admin@local.invalid')[1]['token']
        record_path = f"{path}/{visit['id']}"
        self.assertEqual(self.pb.request('PATCH', record_path, {'color': '#1256AB'}, self.reader_token)[0], 404)
        self.assertEqual(self.pb.request('PATCH', record_path, {'color': '#1256AB'}, token)[0], 200)
        self.assertEqual(self.pb.request('PATCH', record_path, {'label': 'Autre'}, token)[0], 400)
        self.assertEqual(self.pb.request('PATCH', record_path, {'active': False}, token)[0], 400)
        self.assertEqual(self.pb.request('PATCH', record_path, {'color': 'invalid'}, token)[0], 400)
        self.assertEqual(self.pb.request('POST', path, visit, token)[0], 403)
        self.assertEqual(self.pb.request('DELETE', record_path, token=token)[0], 403)
        self.assertEqual(self.pb.request('GET', record_path, token=self.contacts_token)[0], 404)

    def test_atomic_create_retry_and_edit_conflict(self):
        self.assertEqual(self.create(status='invalid')[0], 400)
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', 'collections/accounting_analytic_accounts/records', token=self.token)[1]['totalItems'], 0)
        status, record = self.create()
        self.assertEqual(status, 200, record)
        self.assertEqual(record['opportunity_number'], '00001')
        self.assertEqual(record['type'], 'tender')
        self.assertEqual(record['tender']['opportunity'], record['id'])
        self.assertEqual(self.create()[1]['id'], record['id'])
        self.assertEqual(self.create(reference='Changed retry')[0], 409)
        status, result = self.pb.request('POST', 'horizon/crm/save', {'id': record['id'], 'updated': record['updated'], 'input': {**self.input, 'type': 'direct'}}, self.token)
        self.assertEqual(status, 409, result)
        payload = {'id': record['id'], 'updated': record['updated'], 'input': {**self.input, 'type': 'tender'}, 'tender': {**self.tender_input, 'reference': 'AO revised'}, 'tender_updated': record['tender']['updated']}
        status, updated = self.pb.request('POST', 'horizon/crm/save', payload, self.token)
        self.assertEqual(status, 200, updated)
        self.assertEqual(updated['tender']['reference'], 'AO revised')
        self.assertEqual(self.pb.request('POST', 'horizon/crm/save', payload, self.token)[0], 409)

    def test_standalone_analysis_no_go_and_atomic_promotion(self):
        status, record = self.create(standalone=True)
        self.assertEqual(status, 200, record)
        self.assertEqual(record['tender']['opportunity'], '')
        self.assertEqual(record['opportunity_number'], '')
        self.assertEqual(record['analytic_account'], '')
        self.assertEqual(self.create(standalone=True)[1]['id'], record['id'])
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', 'collections/accounting_analytic_accounts/records', token=self.token)[1]['totalItems'], 0)
        self.assertEqual(self.create(key='second-analysis-tender-0001', standalone=True)[0], 200)
        stages = {item['code']: item['id'] for item in self.pb.request('GET', 'collections/crm_tender_statuses/records', token=self.token)[1]['items']}
        move = {'tender': record['id'], 'updated': record['updated'], 'status': stages['no_go']}
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/stage', move, self.reader_token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/stage', move, self.token)[0], 200)
        current = self.pb.request('GET', f'horizon/crm/tenders/{record["id"]}', token=self.token)[1]
        self.assertEqual(current['tender']['opportunity'], '')
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/tenders?sort=title', token=self.token)[1]['totalItems'], 2)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/tenders?preparation_status=' + stages['no_go'], token=self.token)[1]['totalItems'], 1)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/tenders', token=self.contacts_token)[0], 403)
        move = {'tender': record['id'], 'updated': current['updated'], 'status': stages['preparing']}
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.pb.request('POST', 'horizon/crm/tenders/stage', move, self.token), range(2)))
        self.assertEqual(sorted(code for code, _ in results), [200, 409])
        promoted = self.pb.request('GET', f'horizon/crm/tenders/{record["id"]}', token=self.token)[1]
        self.assertTrue(promoted['tender']['opportunity'])
        self.assertEqual(promoted['opportunity_number'], '00001')
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 1)
        self.assertEqual(self.pb.request('GET', 'collections/accounting_analytic_accounts/records', token=self.token)[1]['totalItems'], 1)
        for code in ['no_go', 'todo', 'preparing']:
            self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/stage', {'tender': record['id'], 'updated': promoted['updated'], 'status': stages[code]}, self.token)[0], 200)
            promoted = self.pb.request('GET', f'horizon/crm/tenders/{record["id"]}', token=self.token)[1]
            self.assertEqual(promoted['opportunity_number'], '00001')
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 1)

    def test_standalone_sorting_and_rich_description_retry(self):
        description = {'type': 'doc', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Analyse AO'}]}]}
        stages = self.pb.request('GET', 'collections/crm_tender_statuses/records', token=self.token)[1]['items']
        stage = next(item['id'] for item in stages if item['code'] == 'todo')
        payload = {'creation_key': 'rich-analysis-tender-0001', 'input': {**self.input, 'type': 'tender', 'title': 'Zulu', 'description_content': description}, 'tender': {'reference': 'AO-Z', 'consultation_url': '', 'status': stage, 'publication_date': '', 'submission_deadline': '2026-12-20T12:00:00.000Z', 'timezone': 'Europe/Paris', 'expected_result_date': '', 'visit_required': False, 'tags': []}}
        status, first = self.pb.request('POST', 'horizon/crm/tenders/save', payload, self.token)
        self.assertEqual(status, 200, first)
        retry = {**payload, 'input': {**payload['input'], 'description_content': {'content': description['content'], 'type': 'doc'}}}
        status, repeated = self.pb.request('POST', 'horizon/crm/tenders/save', retry, self.token)
        self.assertEqual(status, 200, repeated)
        self.assertEqual(repeated['id'], first['id'])
        second = {**payload, 'creation_key': 'rich-analysis-tender-0002', 'input': {**payload['input'], 'title': 'Alpha'}, 'tender': {**payload['tender'], 'reference': 'AO-A', 'submission_deadline': '2026-10-20T12:00:00.000Z'}}
        status, other = self.pb.request('POST', 'horizon/crm/tenders/save', second, self.token)
        self.assertEqual(status, 200, other)
        for sort in ['title', 'submission_deadline', 'reference']:
            result = self.pb.request('GET', 'horizon/crm/tenders?sort=' + sort, token=self.token)[1]
            self.assertEqual([item['id'] for item in result['items']], [other['id'], first['id']])
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 0)

    def test_standalone_dates_activity_and_linked_edits(self):
        status, record = self.create(standalone=True)
        self.assertEqual(status, 200, record)
        appointment = {'kind': 'visit', 'start': '2026-10-15T08:00:00.000Z', 'end': '', 'timezone': 'Europe/Paris', 'location': 'Paris', 'notes': '', 'participants': [], 'status': 'planned'}
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/appointments', {'tender': record['id'], 'input': appointment}, self.token)[0], 200)
        note = {'source_module': 'crm', 'source_entity': 'crm_tenders', 'source_record_id': record['id'], 'type': 'note', 'body': 'Analyse sans affaire', 'mentions': []}
        status, message = self.pb.request('POST', 'collections/core_activity_events/records', note, self.token)
        self.assertEqual(status, 200, message)
        self.assertEqual(self.pb.request('GET', 'collections/core_activity_events/records/' + message['id'], token=self.contacts_token)[0], 404)
        query = urlencode({'from': '2026-10-10T00:00:00.000Z', 'to': '2026-10-17T00:00:00.000Z'})
        calendar = self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.token)[1]
        self.assertEqual(calendar['periods'][0]['id'], record['id'])
        self.assertEqual(calendar['items'][0]['kind'], 'visit')
        self.assertEqual(self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.contacts_token)[1], {'items': [], 'periods': []})
        payload = {'id': record['id'], 'updated': record['updated'], 'input': {**self.input, 'type': 'tender', 'title': 'AO révisé'}, 'tender': self.tender_input}
        status, saved = self.pb.request('POST', 'horizon/crm/tenders/save', payload, self.token)
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['title'], 'AO révisé')
        stage = next(item['id'] for item in self.pb.request('GET', 'collections/crm_tender_statuses/records', token=self.token)[1]['items'] if item['code'] == 'preparing')
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/stage', {'tender': saved['id'], 'updated': saved['updated'], 'status': stage}, self.token)[0], 200)
        saved = self.pb.request('GET', 'horizon/crm/tenders/' + record['id'], token=self.token)[1]
        payload = {'id': saved['id'], 'updated': saved['updated'], 'linked_updated': saved['linked_updated'], 'input': {**self.input, 'type': 'tender', 'title': 'Affaire révisée', 'estimated_value': 14000}, 'tender': {**self.tender_input, 'status': stage}}
        status, revised = self.pb.request('POST', 'horizon/crm/tenders/save', payload, self.token)
        self.assertEqual(status, 200, revised)
        self.assertEqual(revised['estimated_value'], 14000)
        self.assertEqual(self.pb.request('GET', 'collections/crm_tenders/records/' + record['id'], token=self.token)[1]['estimated_value'], 12000)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/save', payload, self.token)[0], 409)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/tenders?q=Affaire', token=self.token)[1]['totalItems'], 1)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/tenders/summary', token=self.token)[1]['items'][0]['amount'], 14000)

    def test_promotion_failure_rolls_back_decision_number_and_account(self):
        _, record = self.create(standalone=True)
        stage = next(item['id'] for item in self.pb.request('GET', 'collections/crm_tender_statuses/records', token=self.token)[1]['items'] if item['code'] == 'preparing')
        collision = self.pb.create('accounting_analytic_accounts', {'code': '00001', 'label': 'Collision', 'company': self.company['id'], 'status': 'open', 'active': True})
        decision = {'tender': record['id'], 'status': stage, 'updated': record['updated']}
        self.assertNotEqual(self.pb.request('POST', 'horizon/crm/tenders/stage', decision, self.token)[0], 200)
        current = self.pb.request('GET', 'horizon/crm/tenders/' + record['id'], token=self.token)[1]
        self.assertEqual(current['tender']['status'], record['tender']['status'])
        self.assertEqual(current['tender']['opportunity'], '')
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 0)
        self.pb.request('DELETE', 'collections/accounting_analytic_accounts/records/' + collision['id'], token=self.pb.admin_token)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/stage', decision, self.token)[0], 200)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/tenders/' + record['id'], token=self.token)[1]['opportunity_number'], '00001')

    def test_no_go_creation_and_archiving_preserve_unpromoted_history(self):
        stage = next(item['id'] for item in self.pb.request('GET', 'collections/crm_tender_statuses/records', token=self.token)[1]['items'] if item['code'] == 'no_go')
        status, record = self.create(standalone=True, status=stage)
        self.assertEqual(status, 200, record)
        self.assertEqual(record['tender']['opportunity'], '')
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/archive', {'id': record['id'], 'updated': 'stale', 'active': False}, self.token)[0], 409)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/archive', {'id': record['id'], 'updated': record['updated'], 'active': False}, self.token)[0], 200)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/tenders', token=self.token)[1]['totalItems'], 0)
        archived = self.pb.request('GET', 'horizon/crm/tenders?state=archived', token=self.token)[1]['items'][0]
        self.assertEqual(archived['tender']['reference'], record['tender']['reference'])
        self.assertEqual(self.pb.request('POST', 'collections/core_activity_events/records', {'source_module': 'crm', 'source_entity': 'crm_tenders', 'source_record_id': record['id'], 'type': 'note', 'body': 'Refus'}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/archive', {'id': record['id'], 'updated': archived['updated'], 'active': True}, self.token)[0], 200)
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 0)

    def test_conversion_archives_and_restores_same_dossier(self):
        status, record = self.create()
        self.assertEqual(status, 200, record)
        tender = record['tender']
        event = self.upload(record['id'])
        appointment_input = {'kind': 'visit', 'start': '2026-10-15T08:00:00.000Z', 'end': '', 'timezone': 'Europe/Paris', 'location': 'Paris', 'notes': '', 'participants': [], 'status': 'planned'}
        appointment = self.pb.request('POST', 'horizon/crm/tenders/appointments', {'tender': tender['id'], 'input': appointment_input}, self.token)[1]
        deposit_input = {'submitted_at': '2026-10-01T14:00:00.000Z', 'timezone': 'Europe/Paris', 'notes': 'Historique', 'documents': [{'event_id': event['id'], 'filename': event['attachments'][0]}]}
        deposit = self.pb.request('POST', 'horizon/crm/tenders/submit', {'tender': tender['id'], 'creation_key': 'conversion-deposit-0001', 'input': deposit_input}, self.token)[1]
        # Submitting may update preparation: use its current revision.
        tender = self.pb.request('GET', f'collections/crm_tenders/records/{tender["id"]}', token=self.token)[1]
        payload = {'id': record['id'], 'updated': record['updated'], 'input': {**self.input, 'type': 'direct'}, 'tender_updated': tender['updated']}
        self.assertEqual(self.pb.request('POST', 'horizon/crm/save', payload, self.reader_token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/save', {**payload, 'tender_updated': 'stale'}, self.token)[0], 409)
        self.assertEqual(self.pb.request('GET', f'collections/crm_opportunities/records/{record["id"]}', token=self.token)[1]['type'], 'tender')
        status, direct = self.pb.request('POST', 'horizon/crm/save', payload, self.token)
        self.assertEqual(status, 200, direct)
        self.assertTrue(direct['active'])
        self.assertTrue(direct['tender']['archived_at'])
        self.assertEqual(direct['tender']['id'], tender['id'])
        query = urlencode({'from': '2026-10-01T00:00:00.000Z', 'to': '2026-12-01T00:00:00.000Z'})
        self.assertEqual(self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.token)[1]['items'], [])
        self.assertEqual(self.pb.request('GET', 'horizon/calendar/events?' + query + '&state=archived', token=self.token)[1]['items'], [])
        self.assertEqual(self.pb.request('GET', 'horizon/crm/summary?type=tender', token=self.token)[1]['items'], [])
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/appointments', {'tender': tender['id'], 'input': appointment_input}, self.token)[0], 400)
        self.assertEqual(self.pb.request('POST', 'horizon/activity/attachments/delete', {'event_id': event['id'], 'filename': event['attachments'][0]}, self.token)[0], 409)
        for key in ['id', 'opportunity_number', 'analytic_account', 'stage']:
            self.assertEqual(direct[key], record[key])
        status, restored = self.pb.request('POST', 'horizon/crm/save', {'id': direct['id'], 'updated': direct['updated'], 'input': {**self.input, 'type': 'tender'}, 'tender': self.tender_input, 'tender_updated': direct['tender']['updated']}, self.token)
        self.assertEqual(status, 200, restored)
        self.assertEqual(restored['tender']['id'], tender['id'])
        self.assertFalse(restored['tender']['archived_at'])
        self.assertEqual(self.pb.request('GET', 'collections/crm_tenders/records', token=self.token)[1]['totalItems'], 1)
        self.assertEqual(self.pb.request('GET', f'collections/crm_tender_appointments/records/{appointment["id"]}', token=self.token)[0], 200)
        self.assertEqual(self.pb.request('GET', f'collections/crm_tender_submissions/records/{deposit["id"]}', token=self.token)[0], 200)
        self.assertTrue(self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.token)[1]['items'])

    def test_direct_conversion_creates_only_one_tender_atomically(self):
        status, record = self.pb.request('POST', 'horizon/crm/save', {'creation_key': 'direct-conversion-0001', 'input': self.input}, self.token)
        self.assertEqual(status, 200, record)
        self.create(key='reference-for-conversion-0001')
        payload = {'id': record['id'], 'updated': record['updated'], 'input': {**self.input, 'type': 'tender'}, 'tender': {**self.tender_input, 'status': 'invalid'}}
        self.assertEqual(self.pb.request('POST', 'horizon/crm/save', payload, self.token)[0], 400)
        self.assertEqual(self.pb.request('GET', f'collections/crm_opportunities/records/{record["id"]}', token=self.token)[1]['type'], 'direct')
        payload['tender'] = self.tender_input
        status, result = self.pb.request('POST', 'horizon/crm/save', payload, self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(result['opportunity_number'], record['opportunity_number'])
        self.assertEqual(result['analytic_account'], record['analytic_account'])
        self.assertEqual(self.pb.request('POST', 'horizon/crm/save', payload, self.token)[0], 409)

    def test_upgrade_preserves_existing_tender(self):
        pb = check_crm.LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for migration in (check_crm.ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791417600_tender_conversion.js':
                shutil.copy(migration, previous)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        company = pb.create('contacts_companies', {'name': 'AO historique', 'active': True})
        stage = pb.request('GET', 'collections/crm_stages/records?sort=sort_order', token=pb.admin_token)[1]['items'][0]
        preparation = pb.request('GET', 'collections/crm_tender_statuses/records?sort=sort_order', token=pb.admin_token)[1]['items'][0]
        account = pb.create('accounting_analytic_accounts', {'code': '11450', 'label': 'Historique', 'company': company['id'], 'status': 'open', 'active': True})
        opportunity = pb.create('crm_opportunities', {**self.input, 'company': company['id'], 'owner': pb.user['id'], 'contact': '', 'stage': stage['id'], 'type': 'tender', 'opportunity_number': '11450', 'analytic_account': account['id'], 'active': True})
        tender = pb.create('crm_tenders', {'opportunity': opportunity['id'], 'status': preparation['id'], 'reference': 'Ancien AO', 'timezone': 'Europe/Paris', 'submission_deadline': '2026-10-20 12:30:00.000Z'})
        pb.process.terminate()
        pb.process.wait(timeout=5)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={check_crm.ROOT / "pocketbase/pb_migrations"}']
        for _ in range(2):
            subprocess.run(pb.args + ['migrate', 'up'], env=pb.environment, check=True, stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        current = pb.request('GET', f'collections/crm_tenders/records/{tender["id"]}', token=pb.admin_token)[1]
        self.assertEqual(current['archived_at'], '')
        for key in ['id', 'opportunity', 'reference', 'status', 'submission_deadline']:
            self.assertEqual(current[key], tender[key])
        self.assertEqual(pb.request('GET', f'collections/crm_opportunities/records/{opportunity["id"]}', token=pb.admin_token)[1]['opportunity_number'], '11450')

    def test_calendar_projects_dates_without_copies_and_filters_permissions(self):
        status, record = self.create()
        self.assertEqual(status, 200, record)
        tender = record['tender']
        payload = {'tender': tender['id'], 'input': {'kind': 'hearing', 'start': '2026-10-15T08:00:00.000Z', 'end': '2026-10-15T09:00:00.000Z', 'timezone': 'Europe/Paris', 'location': 'Paris', 'notes': 'Présentation', 'participants': [], 'status': 'planned'}}
        status, appointment = self.pb.request('POST', 'horizon/crm/tenders/appointments', payload, self.token)
        self.assertEqual(status, 200, appointment)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/appointments', payload, self.reader_token)[0], 403)
        query = urlencode({'from': '2026-10-01T00:00:00.000Z', 'to': '2026-11-01T00:00:00.000Z'})
        status, calendar = self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.reader_token)
        self.assertEqual(status, 200, calendar)
        self.assertEqual({item['kind'] for item in calendar['items']}, {'publication', 'submission', 'hearing'})
        self.assertTrue(all(item['source_record_id'] == record['tender']['id'] for item in calendar['items']))
        self.assertEqual(self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.contacts_token)[1]['items'], [])
        self.assertEqual(self.pb.request('GET', 'horizon/calendar/events?' + query)[0], 401)
        query_other = query + '&q=unmatched'
        self.assertEqual(self.pb.request('GET', 'horizon/calendar/events?' + query_other, token=self.token)[1]['items'], [])
        status, cancelled = self.pb.request('POST', 'horizon/crm/tenders/appointments', {**payload, 'id': appointment['id'], 'updated': appointment['updated'], 'input': {**payload['input'], 'status': 'cancelled'}}, self.token)
        self.assertEqual(status, 200, cancelled)
        self.assertNotIn('hearing', {item['kind'] for item in self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.token)[1]['items']})
        self.assertEqual(self.pb.request('POST', 'horizon/crm/archive', {'id': record['id'], 'active': False}, self.token)[0], 200)
        self.assertEqual(self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.token)[1]['items'], [])
        self.assertTrue(self.pb.request('GET', 'horizon/calendar/events?' + query + '&state=archived', token=self.token)[1]['items'])
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/appointments', payload, self.token)[0], 400)

    def test_calendar_includes_midnight_on_first_day_without_another_date(self):
        status, record = self.create(submission_deadline='', expected_result_date='')
        self.assertEqual(status, 200, record)
        query = urlencode({'from': '2026-10-01T00:00:00.000Z', 'to': '2026-10-02T00:00:00.000Z'})
        status, calendar = self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.token)
        self.assertEqual(status, 200, calendar)
        self.assertEqual([item['kind'] for item in calendar['items']], ['publication'])

    def test_preparation_stage_does_not_change_commercial_stage(self):
        status, record = self.create()
        self.assertEqual(status, 200, record)
        tender = record['tender']
        stages = self.pb.request('GET', 'collections/crm_tender_statuses/records?sort=sort_order', token=self.token)[1]['items']
        payload = {'tender': tender['id'], 'status': stages[2]['id'], 'updated': tender['updated']}
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/stage', payload, self.reader_token)[0], 403)
        status, result = self.pb.request('POST', 'horizon/crm/tenders/stage', payload, self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(self.pb.request('GET', f'collections/crm_opportunities/records/{record["id"]}', token=self.token)[1]['stage'], record['stage'])
        summary = self.pb.request('GET', 'horizon/crm/summary?type=tender&preparation=true', token=self.token)[1]
        self.assertEqual(summary['items'][0]['stage'], stages[2]['id'])
        self.assertEqual(summary['items'][0]['amount'], 12000)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/summary?type=direct', token=self.token)[1]['items'], [])

    def upload(self, opportunity):
        boundary = 'horizon-tender-local-boundary'
        fields = {'source_module': 'crm', 'source_entity': 'crm_opportunities', 'source_record_id': opportunity, 'body': 'Réponse et preuve', 'type': 'note', 'mentions': '[]', 'metadata': '{}'}
        parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode() for name, value in fields.items()]
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="preuve.txt"\r\nContent-Type: text/plain\r\n\r\nPreuve du depot\r\n'.encode())
        parts.append(f'--{boundary}--\r\n'.encode())
        request = Request(self.pb.url + '/api/collections/core_activity_events/records', data=b''.join(parts), headers={'Authorization': self.token, 'Content-Type': f'multipart/form-data; boundary={boundary}'}, method='POST')
        with urlopen(request) as response:
            return json.load(response)

    def test_deposits_are_versioned_idempotent_and_protect_shared_files(self):
        status, record = self.create()
        self.assertEqual(status, 200, record)
        event = self.upload(record['id'])
        payload = {'tender': record['tender']['id'], 'creation_key': 'deposit-local-first-0001', 'input': {'submitted_at': '2026-10-01T14:00:00.000Z', 'timezone': 'Europe/Paris', 'notes': 'Dépôt plateforme', 'documents': [{'event_id': event['id'], 'filename': event['attachments'][0]}]}}
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/submit', payload, self.reader_token)[0], 403)
        status, deposited = self.pb.request('POST', 'horizon/crm/tenders/submit', payload, self.token)
        self.assertEqual(status, 200, deposited)
        self.assertEqual(deposited['version'], 1)
        self.assertEqual(deposited['submitted_by'], self.user['id'])
        self.assertNotIn('creation_key', deposited)
        retry_status, retry = self.pb.request('POST', 'horizon/crm/tenders/submit', payload, self.token)
        self.assertEqual(retry_status, 200, retry)
        self.assertEqual(retry['id'], deposited['id'])
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/submit', {**payload, 'creation_key': 'deposit-local-second-0002'}, self.token)[1]['version'], 2)
        with ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(lambda index: self.pb.request('POST', 'horizon/crm/tenders/submit', {**payload, 'creation_key': f'deposit-concurrent-000{index}'}, self.token), range(4)))
        self.assertTrue(all(status == 200 for status, _ in results), results)
        self.assertEqual(sorted(item['version'] for _, item in results), [3, 4, 5, 6])
        self.assertEqual(self.pb.request('POST', 'horizon/activity/attachments/delete', {'event_id': event['id'], 'filename': event['attachments'][0]}, self.token)[0], 409)
        self.assertEqual(self.pb.request('PATCH', f'collections/crm_tender_submissions/records/{deposited["id"]}', {'notes': 'forged'}, self.token)[0], 403)
        self.assertEqual(self.pb.request('DELETE', f'collections/crm_tender_submissions/records/{deposited["id"]}', token=self.token)[0], 403)
        status, final = self.pb.request('GET', f'collections/crm_tenders/records/{record["tender"]["id"]}', token=self.token)
        self.assertEqual(status, 200, final)
        self.assertEqual(final['submission_deadline'][:10], '2026-10-20')
        status, other = self.create(key='tender-creation-other-0002')
        self.assertEqual(status, 200, other)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/tenders/submit', {**payload, 'tender': other['tender']['id'], 'creation_key': 'deposit-local-foreign-0003'}, self.token)[0], 400)


    def test_ao_settings_are_reserved_to_admin_or_superuser_and_audited(self):
        role = self.pb.create('core_roles', {'name': 'ao_settings', 'label': 'AO paramètres', 'active': True, 'permissions': ['crm.read', 'settings.references']})
        user = self.pb.create_user('ao-settings@local.invalid', role['id'], 'user')
        token = self.pb.login('ao-settings@local.invalid')[1]['token']
        payload = {'code': 'urgent', 'label': 'Urgent', 'tone': 'violet', 'color': '#123456', 'active': True, 'sort_order': 0}
        self.assertEqual(self.pb.request('POST', 'collections/crm_tender_tags/records', payload, token)[0], 400)
        self.pb.request('PATCH', f'collections/core_users/records/{user["id"]}', {'erp_profile': 'superuser'}, self.pb.admin_token)
        status, tag = self.pb.request('POST', 'collections/crm_tender_tags/records', payload, token)
        self.assertEqual(status, 200, tag)
        query = urlencode({'filter': f'entity_id="{tag["id"]}"'})
        audits = self.pb.request('GET', 'collections/core_audit/records?' + query, token=self.pb.admin_token)[1]['items']
        self.assertEqual(audits[0]['user'], user['id'])
        status, record = self.create(tags=[tag['id']])
        self.assertEqual(status, 200, record)
        summary = self.pb.request('GET', 'horizon/crm/summary?type=tender&preparation=true&tag=' + tag['id'], token=self.token)[1]
        self.assertEqual(summary['items'][0]['amount'], 12000)
        for filter_name, filter_value in [('tag', tag['id']), ('preparation_status', record['tender']['status'])]:
            single_query = urlencode({'from': '2026-10-01T00:00:00.000Z', 'to': '2026-11-01T00:00:00.000Z', filter_name: filter_value})
            self.assertTrue(self.pb.request('GET', 'horizon/calendar/events?' + single_query, token=self.token)[1]['items'], filter_name)
        query = urlencode({'from': '2026-10-01T00:00:00.000Z', 'to': '2026-11-01T00:00:00.000Z', 'tag': tag['id'], 'preparation_status': record['tender']['status']})
        calendar_status, calendar = self.pb.request('GET', 'horizon/calendar/events?' + query, token=self.token)
        self.assertEqual(calendar_status, 200, calendar)
        self.assertTrue(calendar['items'], {'calendar': calendar, 'tender': record['tender']})
        self.assertEqual(self.pb.request('PATCH', f'collections/crm_tender_tags/records/{tag["id"]}', {'code': 'changed'}, token)[0], 400)
        self.assertEqual(self.pb.request('PATCH', f'collections/crm_tender_tags/records/{tag["id"]}', {'active': False}, token)[0], 200)
        self.assertEqual(self.create(key='tender-with-inactive-tag-01', tags=[tag['id']])[0], 400)

if __name__ == '__main__':
    unittest.main()

"""CRM transaction, numbering, permissions and shared activity on a disposable DB."""
import unittest
import shutil
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from check_auth import LocalPocketBase
from check_auth import ROOT


class CrmTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start()
        self.addCleanup(self.pb.close)
        role = self.pb.create('core_roles', {'name': 'crm', 'label': 'CRM', 'active': True, 'permissions': ['crm.read', 'crm.write', 'contacts.read']})
        self.user = self.pb.create_user('crm@local.invalid', role['id'])
        self.token = self.pb.login('crm@local.invalid')[1]['token']
        reader_role = self.pb.create('core_roles', {'name': 'crm_read', 'label': 'CRM lecture', 'active': True, 'permissions': ['crm.read']})
        self.reader = self.pb.create_user('crm-read@local.invalid', reader_role['id'])
        self.reader_token = self.pb.login('crm-read@local.invalid')[1]['token']
        self.contacts_token = self.pb.login()[1]['token']
        self.company = self.pb.create('contacts_companies', {'name': 'Client CRM', 'active': True})
        self.person = self.pb.create('contacts_people', {'first_name': 'Marie', 'last_name': 'Client', 'company': self.company['id'], 'active': True})
        self.stages = self.pb.request('GET', 'collections/crm_stages/records?filter=active%3Dtrue&sort=sort_order', token=self.token)[1]['items']
        self.input = {'title': 'Projet studio', 'company': self.company['id'], 'contact': self.person['id'], 'owner': self.user['id'], 'stage': self.stages[0]['id'], 'estimated_value': 12000, 'estimated_cost': 7000, 'currency': 'EUR', 'probability': 30, 'expected_date': '2026-12-01', 'description': 'Un projet de studio', 'status': 'open'}

    def save(self, key='creation-key-first-0001', **changes):
        return self.pb.request('POST', 'horizon/crm/save', {'creation_key': key, 'input': {**self.input, **changes}}, self.token)

    def test_creation_is_atomic_numbered_idempotent_and_audited(self):
        status, record = self.save()
        self.assertEqual(status, 200, record)
        self.assertEqual(record['opportunity_number'], '00001')
        self.assertEqual(record['estimated_margin'], 5000)
        self.assertNotIn('creation_key', record)
        account = self.pb.request('GET', f'collections/accounting_analytic_accounts/records/{record["analytic_account"]}', token=self.token)[1]
        self.assertEqual((account['code'], account['opportunity'], account['company']), ('00001', record['id'], self.company['id']))
        self.assertEqual(self.save()[1]['id'], record['id'])
        self.assertEqual(self.save(title='Changed retry')[0], 409)
        self.assertEqual(self.save(key='creation-key-second-0002')[1]['opportunity_number'], '00002')
        self.assertEqual(self.pb.request('GET', 'collections/core_activity_events/records?filter=source_module="crm"', token=self.contacts_token)[1]['items'], [])
        events = self.pb.request('GET', 'collections/core_activity_events/records?filter=source_module="crm"', token=self.reader_token)[1]['items']
        self.assertEqual(len(events), 2)
        self.assertEqual(events[0]['metadata']['action'], 'create')
        self.assertEqual(self.pb.request('PATCH', f'collections/crm_opportunities/records/{record["id"]}', {'opportunity_number': 'forged'}, self.token)[0], 403)

    def test_rollback_prevents_number_gap_and_orphan_account(self):
        self.assertEqual(self.save(currency='XXX')[0], 400)
        self.assertEqual(self.save(estimated_value=-1)[0], 400)
        foreign = self.pb.create('contacts_companies', {'name': 'Foreign', 'active': True})
        self.assertEqual(self.save(company=foreign['id'])[0], 400)
        self.assertEqual(self.pb.request('GET', 'collections/accounting_analytic_accounts/records', token=self.token)[1]['totalItems'], 0)
        collision = self.pb.create('accounting_analytic_accounts', {'code': '00001', 'label': 'Collision de recette', 'company': self.company['id'], 'status': 'open', 'active': True})
        self.assertNotEqual(self.save()[0], 200)
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.token)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', 'collections/accounting_analytic_accounts/records', token=self.token)[1]['totalItems'], 1)
        self.pb.request('DELETE', f'collections/accounting_analytic_accounts/records/{collision["id"]}', token=self.pb.admin_token)
        self.assertEqual(self.save()[1]['opportunity_number'], '00001')

    def test_stage_configuration_requires_settings_permission(self):
        stage = self.stages[0]
        path = f'collections/crm_stages/records/{stage["id"]}'
        self.assertEqual(self.pb.request('PATCH', path, {'label': 'Refus'}, self.token)[0], 404)
        role = self.pb.create('core_roles', {'name': 'settings', 'label': 'Paramètres', 'active': True, 'permissions': ['settings.references']})
        self.pb.create_user('settings@local.invalid', role['id'])
        token = self.pb.login('settings@local.invalid')[1]['token']
        self.assertEqual(self.pb.request('GET', 'collections/crm_stages/records', token=token)[1]['totalItems'], 9)
        self.assertEqual(self.pb.request('PATCH', path, {'label': 'Découverte', 'tone': 'pink'}, token)[0], 200)
        self.assertEqual(self.pb.request('PATCH', path, {'code': 'changed'}, token)[0], 400)

    def test_crm_settings_and_colors_are_shared_and_permission_checked(self):
        settings = self.pb.request('GET', 'collections/settings_crm/records', token=self.reader_token)[1]['items'][0]
        path = f'collections/settings_crm/records/{settings["id"]}'
        self.assertEqual(settings['default_view'], 'kanban')
        self.assertEqual(self.pb.request('PATCH', path, {'default_view': 'list'}, self.token)[0], 404)
        role = self.pb.create('core_roles', {'name': 'crm_settings', 'label': 'Paramètres CRM', 'active': True, 'permissions': ['settings.references']})
        self.pb.create_user('crm-settings@local.invalid', role['id'])
        token = self.pb.login('crm-settings@local.invalid')[1]['token']
        self.assertEqual(self.pb.request('PATCH', path, {'default_view': 'list'}, token)[0], 200)
        self.assertEqual(self.pb.request('GET', path, token=self.reader_token)[1]['default_view'], 'list')
        self.assertEqual(self.pb.request('PATCH', path, {'default_view': 'last'}, self.token)[0], 404)
        self.assertEqual(self.pb.request('PATCH', path, {'default_view': 'last'}, token)[0], 200)
        self.assertEqual(self.pb.request('GET', path, token=self.reader_token)[1]['default_view'], 'last')
        self.assertEqual(self.pb.request('PATCH', path, {'default_view': 'other'}, token)[0], 400)
        self.assertEqual(self.pb.request('DELETE', path, token=token)[0], 403)
        stage = f'collections/crm_stages/records/{self.stages[0]["id"]}'
        self.assertEqual(self.pb.request('PATCH', stage, {'tone': 'amber'}, token)[0], 200)
        self.assertEqual(self.pb.request('PATCH', stage, {'tone': 'unicorn'}, token)[0], 400)
        market = self.pb.request('GET', 'collections/crm_market_types/records', token=token)[1]['items'][0]
        market_path = f'collections/crm_market_types/records/{market["id"]}'
        self.assertEqual(self.pb.request('PATCH', market_path, {'tone': 'green'}, token)[0], 200)
        self.assertEqual(self.pb.request('PATCH', market_path, {'tone': 'unicorn'}, token)[0], 400)

    def test_parallel_creation_unique_numbers(self):
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda index: self.save(key=f'concurrent-creation-{index:04}'), range(8)))
        for status, body in results:
            self.assertEqual(status, 200, body)
        self.assertEqual(len({body['opportunity_number'] for _, body in results}), 8)
        self.assertEqual(len({body['analytic_account'] for _, body in results}), 8)

    def test_fixed_stages_and_custom_colors_are_enforced(self):
        role = self.pb.create('core_roles', {'name': 'fixed_settings', 'label': 'Paramètres', 'active': True, 'permissions': ['settings.references']})
        self.pb.create_user('fixed-settings@local.invalid', role['id'])
        token = self.pb.login('fixed-settings@local.invalid')[1]['token']
        self.assertEqual(len(self.stages), 6)
        self.assertEqual(self.pb.request('POST', 'collections/crm_stages/records', {'code': 'extra', 'label': 'Autre', 'active': True, 'tone': 'blue', 'status': 'open'}, token)[0], 403)
        path = f'collections/crm_stages/records/{self.stages[0]["id"]}'
        for input in [{'active': False}, {'status': 'won'}, {'color': 'red'}, {'color': '#12345G'}]:
            self.assertEqual(self.pb.request('PATCH', path, input, token)[0], 400)
        self.assertEqual(self.pb.request('PATCH', path, {'color': '#127A8B', 'label': 'Découverte'}, token)[0], 200)
        self.assertEqual(self.pb.request('GET', path, token=self.token)[1]['color'], '#127A8B')
        self.assertEqual(self.pb.request('DELETE', path, token=token)[0], 403)

    def test_sequence_settings_are_atomic_audited_and_cannot_rewind(self):
        role = self.pb.create('core_roles', {'name': 'sequence_settings', 'label': 'Séquences', 'active': True, 'permissions': ['settings.references']})
        self.pb.create_user('sequence-settings@local.invalid', role['id'])
        token = self.pb.login('sequence-settings@local.invalid')[1]['token']
        list_path = 'collections/settings_numbering_sequences/records'
        self.assertEqual(self.pb.request('GET', list_path, token=self.token)[1]['items'], [])
        record = self.pb.request('GET', list_path, token=token)[1]['items'][0]
        input = {'start_value': 100, 'next_value': 100, 'prefix': 'CRM-', 'suffix': '', 'padding': 5}
        def change(snapshot, values, actor=token):
            return self.pb.request('POST', 'horizon/settings/sequences/save', {'id': snapshot['id'], 'updated': snapshot['updated'], 'expected_next_value': snapshot['next_value'], 'input': values}, actor)
        self.assertEqual(change(record, input, self.token)[0], 403)
        self.assertEqual(self.pb.request('PATCH', f'{list_path}/{record["id"]}', {'next_value': 500}, token)[0], 403)
        self.assertEqual(change(record, {**input, 'next_value': 99})[0], 400)
        self.assertEqual(change(record, {**input, 'active': False})[0], 400)
        status, configured = change(record, input)
        self.assertEqual(status, 200, configured)
        self.assertEqual(self.save()[1]['opportunity_number'], 'CRM-00100')
        current = self.pb.request('GET', f'{list_path}/{record["id"]}', token=token)[1]
        self.assertTrue(current['has_issued'])
        self.assertEqual(current['next_value'], 101)
        self.assertEqual(change(configured, {**input, 'next_value': 200})[0], 409)
        self.assertEqual(change(current, {**input, 'next_value': 100})[0], 400)
        self.assertEqual(change(current, {**input, 'start_value': 50, 'next_value': 101})[0], 400)
        self.assertEqual(change(current, {**input, 'next_value': 200})[0], 200)
        self.assertEqual(self.save(key='sequence-next-creation-0002')[1]['opportunity_number'], 'CRM-00200')
        audits = self.pb.request('GET', 'collections/core_audit/records?filter=entity="settings_numbering_sequences"', token=self.pb.admin_token)[1]['items']
        self.assertEqual(len(audits), 2)
        self.assertEqual(audits[0]['user'], audits[1]['user'])

    def test_market_types_and_structured_description_are_validated(self):
        markets = self.pb.request('GET', 'collections/crm_market_types/records?sort=sort_order', token=self.token)[1]['items']
        self.assertEqual([item['label'] for item in markets], ['Broadcast', 'Corporate', 'Institutionnel', 'Événementiel', 'Consulting', 'Export'])
        self.assertIn(self.pb.request('POST', 'collections/crm_market_types/records', {'code': 'other', 'label': 'Autre', 'active': True}, self.token)[0], [400, 403])
        document = {'type': 'doc', 'content': [{'type': 'orderedList', 'attrs': {'start': 1, 'type': None}, 'content': [{'type': 'listItem', 'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Besoin studio', 'marks': [{'type': 'bold'}]}]}]}]}]}
        status, record = self.save(market_types=[markets[0]['id'], markets[1]['id']], description_content=document, description='Texte forgé')
        self.assertEqual(status, 200, record)
        self.assertEqual(record['market_types'], [markets[0]['id'], markets[1]['id']])
        self.assertEqual(self.save(key='duplicate-market-0001', market_types=[markets[0]['id'], markets[0]['id']])[0], 400)
        self.assertEqual(self.save(key='invalid-market-0001', market_types=markets[0]['id'])[0], 400)
        self.assertEqual(record['description'], 'Besoin studio')
        self.assertEqual(record['description_content'], document)
        status, retry = self.save(market_types=[markets[0]['id'], markets[1]['id']], description_content=document, description='Texte forgé')
        self.assertEqual(status, 200, retry)
        self.assertEqual(retry['id'], record['id'])
        bad = {'type': 'doc', 'content': [{'type': 'image', 'attrs': {'src': 'https://example.com'}}]}
        self.assertEqual(self.save(key='bad-rich-text-0001', description_content=bad)[0], 400)
        self.assertEqual(self.save(key='bad-market-000001', market_types=['missing00000000'])[0], 400)
        update = {**self.input, 'market_types': [], 'description_content': document}
        status, saved = self.pb.request('POST', 'horizon/crm/save', {'id': record['id'], 'updated': record['updated'], 'input': update}, self.token)
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['market_types'], [])

    def test_stage_controls_state_and_closed_opportunities_can_move_again(self):
        self.assertEqual([stage['label'] for stage in self.stages], ['Nouveau', 'Qualifié', 'Gagné', 'Terminé', 'Perdue', 'Annulé'])
        status, record = self.save(stage=self.stages[2]['id'], status='open')
        self.assertEqual(status, 200, record)
        self.assertEqual(record['status'], 'won')
        for stage, expected in [(self.stages[3], 'completed'), (self.stages[4], 'lost'), (self.stages[5], 'cancelled'), (self.stages[0], 'open')]:
            payload = {'changes': [{'id': record['id'], 'stage': stage['id'], 'updated': record['updated']}]}
            self.assertEqual(self.pb.request('POST', 'horizon/crm/stages', payload, self.token)[0], 200)
            record = self.pb.request('GET', f'collections/crm_opportunities/records/{record["id"]}', token=self.token)[1]
            self.assertEqual(record['status'], expected)

    def test_summary_covers_all_results_and_keeps_currencies_separate(self):
        self.save(key='summary-eur-000001')
        self.save(key='summary-eur-000002', estimated_value=8000.25)
        self.save(key='summary-usd-000001', currency='USD', estimated_value=5000)
        self.save(key='summary-won-000001', stage=self.stages[2]['id'], estimated_value=10000)
        status, result = self.pb.request('GET', 'horizon/crm/summary?status=open', token=self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(sorted((item['currency'], item['count'], item['amount']) for item in result['items']), [('EUR', 2, 20000.25), ('USD', 1, 5000)])
        status, all_totals = self.pb.request('GET', 'horizon/crm/summary?q=&state=active&status=&company=&owner=&type=&preparation=&preparation_status=&tag=', token=self.token)
        self.assertEqual(status, 200, all_totals)
        self.assertAlmostEqual(sum(item['amount'] for item in all_totals['items'] if item['currency'] == 'EUR'), 30000.25)
        self.assertEqual(self.pb.request('GET', 'horizon/crm/summary', token=self.contacts_token)[0], 403)
        status, result = self.pb.request('GET', 'horizon/crm/summary?q=Absent', token=self.reader_token)
        self.assertEqual(status, 200, result)
        self.assertEqual(result['items'], [])
        self.assertEqual(self.pb.request('GET', 'horizon/crm/summary?status=forged', token=self.token)[0], 400)

    def test_pipeline_upgrade_preserves_existing_records_and_accounts(self):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for migration in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791244803_crm_pipeline.js':
                shutil.copy(migration, previous)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        company = pb.create('contacts_companies', {'name': 'Société historique', 'active': True})
        old_stage = pb.request('GET', 'collections/crm_stages/records?filter=code="proposal"', token=pb.admin_token)[1]['items'][0]
        account = pb.create('accounting_analytic_accounts', {'code': '11450', 'label': 'Historique', 'company': company['id'], 'status': 'open', 'active': True})
        record = pb.create('crm_opportunities', {**self.input, 'owner': pb.user['id'], 'company': company['id'], 'contact': '', 'opportunity_number': '11450', 'analytic_account': account['id'], 'stage': old_stage['id'], 'type': 'direct', 'active': True, 'status': 'won', 'description': 'Ancienne description'})
        pb.process.terminate(); pb.process.wait(timeout=5)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}']
        subprocess.run(pb.args + ['migrate', 'up'], env={**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}, check=True, stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        current = pb.request('GET', f'collections/crm_opportunities/records/{record["id"]}?expand=stage', token=pb.admin_token)[1]
        self.assertEqual((current['id'], current['opportunity_number'], current['analytic_account'], current['description']), (record['id'], '11450', account['id'], 'Ancienne description'))
        self.assertEqual((current['status'], current['expand']['stage']['label']), ('won', 'Gagné'))
        self.assertFalse(pb.request('GET', f'collections/crm_stages/records/{old_stage["id"]}', token=pb.admin_token)[1]['active'])

    def test_multiple_markets_upgrade_preserves_existing_classification(self):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for migration in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791331200_crm_settings.js':
                shutil.copy(migration, previous)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        company = pb.create('contacts_companies', {'name': 'Marché historique', 'active': True})
        stage = pb.request('GET', 'collections/crm_stages/records?filter=code="new"', token=pb.admin_token)[1]['items'][0]
        market = pb.request('GET', 'collections/crm_market_types/records', token=pb.admin_token)[1]['items'][0]
        account = pb.create('accounting_analytic_accounts', {'code': '11450', 'label': 'Historique', 'company': company['id'], 'status': 'open', 'active': True})
        record = pb.create('crm_opportunities', {**self.input, 'owner': pb.user['id'], 'company': company['id'], 'contact': '', 'opportunity_number': '11450', 'analytic_account': account['id'], 'stage': stage['id'], 'type': 'direct', 'active': True, 'market_type': market['id']})
        role = pb.create('core_roles', {'name': 'old_crm_settings', 'label': 'Paramètres historiques', 'active': True, 'permissions': ['settings.references']})
        pb.create_user('old-settings@local.invalid', role['id'])
        token = pb.login('old-settings@local.invalid')[1]['token']
        self.assertEqual(pb.request('PATCH', f'collections/crm_stages/records/{stage["id"]}', {'tone': 'pink'}, token)[0], 200)
        pb.process.terminate(); pb.process.wait(timeout=5)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}']
        subprocess.run(pb.args + ['migrate', 'up'], env={**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}, check=True, stdout=subprocess.DEVNULL)
        subprocess.run(pb.args + ['migrate', 'up'], env={**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}, check=True, stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        current = pb.request('GET', f'collections/crm_opportunities/records/{record["id"]}?expand=stage', token=pb.admin_token)[1]
        self.assertEqual(current['market_types'], [market['id']])
        self.assertNotIn('market_type', current)
        self.assertEqual(current['opportunity_number'], '11450')
        self.assertEqual(current['analytic_account'], account['id'])
        self.assertEqual(current['expand']['stage']['tone'], 'pink')

    def test_permissions_conflicts_and_batch_moves(self):
        _, record = self.save()
        for token in ['', self.contacts_token, self.reader_token]:
            self.assertIn(self.pb.request('POST', 'horizon/crm/save', {'creation_key': 'blocked-creation-0001', 'input': self.input}, token)[0], [401, 403])
        self.assertEqual(self.pb.request('GET', 'collections/crm_opportunities/records', token=self.contacts_token)[1]['items'], [])
        status, _ = self.pb.request('POST', 'horizon/crm/save', {'id': record['id'], 'updated': 'outdated', 'input': self.input}, self.token)
        self.assertEqual(status, 409)
        payload = {'changes': [{'id': record['id'], 'updated': record['updated'], 'stage': self.stages[1]['id']}, {'id': 'missing00000000', 'updated': '', 'stage': self.stages[1]['id']}]}
        self.assertNotEqual(self.pb.request('POST', 'horizon/crm/stages', payload, self.token)[0], 200)
        current = self.pb.request('GET', f'collections/crm_opportunities/records/{record["id"]}', token=self.token)[1]
        self.assertEqual(current['stage'], record['stage'])
        payload['changes'].pop()
        self.assertEqual(self.pb.request('POST', 'horizon/crm/stages', payload, self.token)[0], 200)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/delete', {'id': record['id']}, self.token)[0], 409)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/archive', {'id': record['id'], 'active': False}, self.token)[0], 200)
        self.assertEqual(self.save(key='another-creation-0002', company=self.company['id'])[0], 200)
        self.assertEqual(self.pb.request('POST', 'horizon/crm/save', {'id': record['id'], 'updated': record['updated'], 'input': self.input}, self.token)[0], 400)

    def test_sequence_and_fixed_pipeline_upgrade_preserves_history(self):
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        previous = Path(pb.temp.name) / 'previous_migrations'
        previous.mkdir()
        for migration in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791331201_numbering_settings.js':
                shutil.copy(migration, previous)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={previous}']
        pb.start()
        role = pb.create('core_roles', {'name': 'upgrade_settings', 'label': 'Paramètres', 'active': True, 'permissions': ['settings.references']})
        pb.create_user('upgrade-settings@local.invalid', role['id'])
        token = pb.login('upgrade-settings@local.invalid')[1]['token']
        status, stage = pb.request('POST', 'collections/crm_stages/records', {'code': 'custom_won', 'label': 'Historique gagné', 'active': True, 'tone': 'pink', 'status': 'won'}, token)
        self.assertEqual(status, 200, stage)
        company = pb.create('contacts_companies', {'name': 'Historique', 'active': True})
        account = pb.create('accounting_analytic_accounts', {'code': '00004', 'label': 'Historique', 'company': company['id'], 'status': 'open', 'active': True})
        record = pb.create('crm_opportunities', {**self.input, 'owner': pb.user['id'], 'company': company['id'], 'contact': '', 'opportunity_number': '00004', 'analytic_account': account['id'], 'stage': stage['id'], 'status': 'won', 'type': 'direct', 'active': True})
        sequence = pb.request('GET', 'collections/settings_numbering_sequences/records', token=pb.admin_token)[1]['items'][0]
        pb.request('PATCH', f'collections/settings_numbering_sequences/records/{sequence["id"]}', {'next_value': 5}, pb.admin_token)
        pb.process.terminate(); pb.process.wait(timeout=5)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}']
        subprocess.run(pb.args + ['migrate', 'up'], env={**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}, check=True, stdout=subprocess.DEVNULL)
        subprocess.run(pb.args + ['migrate', 'up'], env={**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}, check=True, stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        current = pb.request('GET', f'collections/crm_opportunities/records/{record["id"]}?expand=stage', token=pb.admin_token)[1]
        self.assertEqual((current['opportunity_number'], current['analytic_account'], current['status'], current['expand']['stage']['code']), ('00004', account['id'], 'won', 'won'))
        self.assertFalse(pb.request('GET', f'collections/crm_stages/records/{stage["id"]}', token=pb.admin_token)[1]['active'])
        self.assertEqual(pb.request('GET', 'collections/crm_stages/records?filter=active=true', token=pb.admin_token)[1]['totalItems'], 6)
        current_sequence = pb.request('GET', f'collections/settings_numbering_sequences/records/{sequence["id"]}', token=pb.admin_token)[1]
        self.assertEqual((current_sequence['start_value'], current_sequence['next_value'], current_sequence['has_issued']), (1, 5, True))

    def test_crm_comments_mentions_tasks_and_notifications_are_isolated(self):
        _, record = self.save()
        source = {'source_module': 'crm', 'source_entity': 'crm_opportunities', 'source_record_id': record['id']}
        note = {**source, 'type': 'task', 'body': 'Préparer une proposition', 'mentions': [self.reader['id']], 'metadata': {'task': {'title': 'Proposition', 'assigned_to': self.reader['id'], 'priority': 'normal', 'due_date': '2026-12-01'}}}
        status, result = self.pb.request('POST', 'collections/core_activity_events/records', note, self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(self.pb.request('GET', 'collections/core_tasks/records', token=self.contacts_token)[1]['items'], [])
        tasks = self.pb.request('GET', 'collections/core_tasks/records', token=self.reader_token)[1]['items']
        self.assertEqual(len(tasks), 1)
        notifications = self.pb.request('GET', 'collections/core_notifications/records', token=self.reader_token)[1]['items']
        self.assertEqual(len(notifications), 1)
        self.assertEqual(self.pb.request('PATCH', f'collections/core_tasks/records/{tasks[0]["id"]}', {'status': 'done'}, self.token)[0], 200)
        forged = {**note, 'source_module': 'contacts', 'type': 'note', 'metadata': {}}
        self.assertIn(self.pb.request('POST', 'collections/core_activity_events/records', forged, self.contacts_token)[0], [400, 403])
        self.assertEqual(self.pb.request('POST', 'horizon/crm/archive', {'id': record['id'], 'active': False}, self.token)[0], 200)
        self.assertEqual(self.pb.request('POST', 'collections/core_activity_events/records', note, self.token)[0], 400)
        self.pb.request('PATCH', f'collections/core_roles/records/{self.reader["role"]}', {'permissions': []}, self.pb.admin_token)
        for collection in ['core_activity_events', 'core_tasks', 'core_notifications']:
            self.assertEqual(self.pb.request('GET', f'collections/{collection}/records', token=self.reader_token)[1]['items'], [])


if __name__ == '__main__':
    unittest.main()

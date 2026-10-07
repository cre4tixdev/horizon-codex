"""Shared activity and tasks, only disposable local databases."""
import json
import unittest
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from check_auth import LocalPocketBase

class ActivityTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase()
        self.addCleanup(self.pb.close)
        self.pb.start()
        role = self.pb.create('core_roles', {'name': 'activity_writer', 'label': 'Writer', 'active': True, 'permissions': ['contacts.read', 'contacts.write']})
        self.writer = self.pb.create_user('writer@local.invalid', role['id'])
        self.token = self.pb.login('writer@local.invalid')[1]['token']
        self.reader = self.pb.login()[1]['token']
        self.other = self.pb.login('other@local.invalid')[1]['token']
        self.company = self.pb.create('contacts_companies', {'name': 'Fil de test', 'active': True})
        self.source = {'source_module': 'contacts', 'source_entity': 'contacts_companies', 'source_record_id': self.company['id']}

    def events(self, token=None):
        return self.pb.request('GET', 'collections/core_activity_events/records?' + urlencode({'filter': f'source_record_id = "{self.company["id"]}"', 'perPage': 100}), token=token or self.token)[1]['items']

    def post(self, **values):
        return self.pb.request('POST', 'collections/core_activity_events/records', {**self.source, 'type': 'note', 'body': 'Commentaire', **values}, self.token)

    def upload(self, body='Commentaire conservé'):
        boundary = 'horizondeleteattachmentboundary'
        fields = {**self.source, 'type': 'note', 'body': body}
        parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode() for key, value in fields.items()]
        for filename in ['premier.txt', 'second.txt']:
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="{filename}"\r\nContent-Type: text/plain\r\n\r\n{filename}\r\n'.encode())
        parts.append(f'--{boundary}--\r\n'.encode())
        request = Request(self.pb.url + '/api/collections/core_activity_events/records', data=b''.join(parts), headers={'Authorization': self.token, 'Content-Type': f'multipart/form-data; boundary={boundary}'}, method='POST')
        with urlopen(request) as response:
            return json.load(response)

    def test_attachment_deletion_is_authorized_scoped_and_audited(self):
        event = self.upload()
        first, second = event['attachments']
        route = 'horizon/activity/attachments/delete'
        payload = {'event_id': event['id'], 'filename': first}
        for token in ['', self.reader, self.other]:
            self.assertIn(self.pb.request('POST', route, payload, token)[0], [401, 403])
        self.assertEqual(self.pb.request('POST', route, {**payload, 'filename': '../secret.txt'}, self.token)[0], 404)
        self.assertEqual(self.pb.request('POST', route, {**payload, 'event_id': '../bad'}, self.token)[0], 400)
        status, saved = self.pb.request('POST', route, payload, self.token)
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['attachments'], [second])
        for field in ['body', 'author', 'created', 'mentions', 'metadata']:
            self.assertEqual(saved[field], event[field])
        token = self.pb.request('POST', 'files/token', token=self.reader)[1]['token']
        prefix = f'{self.pb.url}/api/files/{event["collectionId"]}/{event["id"]}/'
        with self.assertRaises(HTTPError):
            urlopen(prefix + first + '?token=' + token)
        with urlopen(prefix + second + '?token=' + token) as response:
            self.assertTrue(response.read())
        self.assertEqual(self.pb.request('POST', route, payload, self.token)[0], 404)
        removals = [item for item in self.events() if item['metadata'].get('action') == 'attachment_delete']
        self.assertEqual(len(removals), 1)
        self.assertEqual(removals[0]['author'], self.writer['id'])
        self.assertEqual(removals[0]['metadata']['origin_event'], event['id'])
        audits = self.pb.request('GET', 'collections/core_audit/records?perPage=500', token=self.pb.admin_token)[1]['items']
        audit = next(item for item in audits if item['metadata'].get('action') == 'attachment_delete')
        self.assertEqual(audit['user'], self.writer['id'])
        self.assertEqual(audit['before']['attachments'], event['attachments'])
        self.assertEqual(audit['after']['attachments'], [second])
        self.pb.request('PATCH', f'collections/contacts_companies/records/{self.company["id"]}', {'active': False}, self.token)
        self.assertEqual(self.pb.request('POST', route, {**payload, 'filename': second}, self.token)[0], 400)
        self.pb.request('PATCH', f'collections/contacts_companies/records/{self.company["id"]}', {'active': True}, self.token)
        status, saved = self.pb.request('POST', route, {**payload, 'filename': second}, self.token)
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['attachments'], [])
        self.assertEqual(saved['body'], event['body'])
        self.pb.request('DELETE', f'collections/contacts_companies/records/{self.company["id"]}', token=self.token)
        self.assertEqual(self.pb.request('POST', route, payload, self.token)[0], 404)

    def test_attachment_deletion_rolls_back_if_audit_fails(self):
        event = self.upload(body='')
        token = self.pb.request('POST', 'files/token', token=self.reader)[1]['token']
        self.pb.request('DELETE', 'collections/core_audit', token=self.pb.admin_token)
        status, _ = self.pb.request('POST', 'horizon/activity/attachments/delete', {'event_id': event['id'], 'filename': event['attachments'][0]}, self.token)
        self.assertNotEqual(status, 200)
        saved = self.pb.request('GET', f'collections/core_activity_events/records/{event["id"]}', token=self.reader)[1]
        self.assertEqual(saved['attachments'], event['attachments'])
        path = f'{self.pb.url}/api/files/{event["collectionId"]}/{event["id"]}/{event["attachments"][0]}?token={token}'
        with urlopen(path) as response:
            self.assertTrue(response.read())
        self.assertFalse(any(item['metadata'].get('action') == 'attachment_delete' for item in self.events()))

    def test_server_identity_immutability_and_permissions(self):
        status, event = self.post(author=self.pb.user['id'], metadata={'author': {'name': 'Faux'}, 'changes': [{'field': 'email', 'before': 'secret'}]}, created='2000-01-01 00:00:00.000Z')
        self.assertEqual(status, 200, event)
        self.assertEqual(event['author'], self.writer['id'])
        self.assertEqual(event['metadata']['author']['name'], self.writer['name'])
        self.assertNotIn('changes', event['metadata'])
        self.assertFalse(event['created'].startswith('2000'))
        route = f'collections/core_activity_events/records/{event["id"]}'
        for token in ['', self.other]:
            self.assertEqual(self.pb.request('GET', route, token=token)[0], 404)
        self.assertEqual(self.pb.request('GET', route, token=self.reader)[0], 200)
        for token in [self.reader, self.other]:
            self.assertNotEqual(self.pb.request('POST', 'collections/core_activity_events/records', {**self.source, 'type': 'note', 'body': 'Interdit'}, token)[0], 200)
            self.assertNotEqual(self.pb.request('GET', 'horizon/activity/users', token=token)[0], 200)
        self.assertEqual(self.pb.request('PATCH', route, {'body': 'Réécrit'}, self.token)[0], 403)
        self.assertEqual(self.pb.request('DELETE', route, token=self.token)[0], 403)
        self.assertNotEqual(self.post(type='change')[0], 200)
        self.assertNotEqual(self.post(source_entity='core_users', source_record_id=self.writer['id'])[0], 200)
        self.assertNotEqual(self.post(body='   ')[0], 200)

    def test_grouped_save_and_noop_do_not_create_noise(self):
        operation = {'X-Horizon-Operation': 'operation-test-group-2026'}
        company_route = f'collections/contacts_companies/records/{self.company["id"]}'
        self.assertEqual(self.pb.request('PATCH', company_route, {'email': 'new@local.invalid'}, self.token, operation)[0], 200)
        self.assertEqual(self.pb.request('POST', 'collections/contacts_addresses/records', {'company': self.company['id'], 'type': 'registered', 'line1': 'Rue', 'city': 'Paris', 'country': 'FR'}, self.token, operation)[0], 200)
        self.assertEqual(self.pb.request('POST', 'collections/contacts_company_roles/records', {'company': self.company['id'], 'role': 'customer', 'active': True}, self.token, operation)[0], 200)
        grouped = [item for item in self.events() if item['author'] == self.writer['id']]
        self.assertEqual(len(grouped), 1)
        self.assertEqual(grouped[0]['operation_id'], 'operation-test-group-2026')
        self.assertTrue(any(change['label'] == 'Adresse · Ville' for change in grouped[0]['metadata']['changes']))
        self.assertTrue(any(change['label'] == 'Relation Client' for change in grouped[0]['metadata']['changes']))
        count = len(self.events())
        self.assertEqual(self.pb.request('PATCH', company_route, {'email': 'new@local.invalid'}, self.token)[0], 200)
        self.assertEqual(len(self.events()), count)

    def test_role_withdrawal_does_not_archive_company_activity(self):
        status, role = self.pb.request('POST', 'collections/contacts_company_roles/records', {'company': self.company['id'], 'role': 'supplier', 'active': True}, self.token)
        self.assertEqual(status, 200, role)
        self.assertEqual(self.pb.request('PATCH', f'collections/contacts_company_roles/records/{role["id"]}', {'active': False}, self.token)[0], 200)
        withdrawal = next(item for item in self.events() if any(change['field'] == 'role_supplier' and change['after'] == 'Non' for change in item['metadata'].get('changes', [])))
        self.assertEqual(withdrawal['type'], 'change')
        self.assertEqual(withdrawal['metadata']['action'], 'update')
        self.assertEqual(withdrawal['body'], 'Fiche mise à jour')
        self.assertEqual(self.pb.request('PATCH', f'collections/contacts_companies/records/{self.company["id"]}', {'active': False}, self.token)[0], 200)
        archived = next(item for item in self.events() if item['body'] == 'Fiche archivée')
        self.assertEqual(archived['type'], 'status_change')
        self.assertTrue(any(change['field'] == 'active' for change in archived['metadata']['changes']))

    def test_mentions_are_validated_and_notify_once(self):
        before = len(self.events())
        self.assertNotEqual(self.post(mentions=[self.pb.other_user['id']])[0], 200)
        self.assertEqual(len(self.events()), before)
        status, event = self.post(mentions=[self.pb.user['id'], self.pb.user['id']])
        self.assertEqual(status, 200, event)
        notifications = self.pb.request('GET', 'collections/core_notifications/records', token=self.reader)[1]['items']
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0]['source_record_id'], self.company['id'])
        mentions = self.pb.request('GET', 'collections/core_activity_mentions/records', token=self.pb.admin_token)[1]['items']
        self.assertEqual(len(mentions), 1)
        self.assertEqual(self.pb.request('PATCH', f'collections/core_notifications/records/{notifications[0]["id"]}', {'read_at': '2026-01-01 00:00:00.000Z'}, self.reader)[0], 200)
        saved_mention = self.pb.request('GET', f'collections/core_activity_mentions/records/{mentions[0]["id"]}', token=self.pb.admin_token)[1]
        self.assertTrue(saved_mention['read_at'])
        users = self.pb.request('GET', 'horizon/activity/users', token=self.token)[1]['items']
        self.assertTrue(all(set(user) == {'id', 'name', 'initials'} for user in users))
        self.assertNotIn(self.pb.other_user['id'], [user['id'] for user in users])
        self.pb.request('PATCH', f'collections/core_roles/records/{self.pb.role["id"]}', {'permissions': []}, self.pb.admin_token)
        self.assertEqual(self.pb.request('GET', 'collections/core_notifications/records', token=self.reader)[1]['totalItems'], 0)
        self.assertEqual(self.pb.request('GET', f'collections/core_notifications/records/{notifications[0]["id"]}', token=self.reader)[0], 404)

    def test_note_to_task_completion_and_closed_source(self):
        _, note = self.post()
        status, event = self.post(type='task', metadata={'origin_event': note['id'], 'task': {'title': 'Appeler le client', 'assigned_to': self.pb.user['id'], 'priority': 'high', 'due_date': '2026-10-06'}})
        self.assertEqual(status, 200, event)
        tasks = self.pb.request('GET', 'collections/core_tasks/records', token=self.token)[1]['items']
        self.assertEqual(len(tasks), 1)
        task = tasks[0]
        self.assertEqual(task['activity_event'], event['id'])
        self.assertEqual(task['assigned_name'], self.pb.user['name'])
        route = f'collections/core_tasks/records/{task["id"]}'
        self.assertNotEqual(self.pb.request('PATCH', route, {'status': 'done'}, self.reader)[0], 200)
        self.assertNotEqual(self.pb.request('PATCH', route, {'title': 'Falsification'}, self.token)[0], 200)
        status, complete = self.pb.request('PATCH', route, {'status': 'done'}, self.token)
        self.assertEqual(status, 200, complete)
        self.assertTrue(complete['completed_at'])
        self.assertTrue(any(item['body'].startswith('Tâche mise à jour') for item in self.events()))
        self.pb.request('PATCH', f'collections/contacts_companies/records/{self.company["id"]}', {'active': False}, self.token)
        self.assertNotEqual(self.post()[0], 200)
        self.assertNotEqual(self.pb.request('PATCH', route, {'status': 'todo'}, self.token)[0], 200)
        self.assertTrue(len(self.events(self.reader)))

    def test_notification_failure_rolls_back_publication_and_mention(self):
        count = len(self.events())
        self.assertEqual(self.pb.request('DELETE', 'collections/core_notifications', token=self.pb.admin_token)[0], 204)
        self.assertNotEqual(self.post(mentions=[self.pb.user['id']])[0], 200)
        self.assertEqual(len(self.events()), count)
        self.assertEqual(self.pb.request('GET', 'collections/core_activity_mentions/records', token=self.pb.admin_token)[1]['totalItems'], 0)

    def test_feed_pagination_and_document_filter(self):
        for index in range(25):
            self.assertEqual(self.post(body=f'Commentaire {index}')[0], 200)
        filter_value = f'source_entity = "contacts_companies" && source_record_id = "{self.company["id"]}"'
        pages = []
        for page in [1, 2]:
            query = urlencode({'filter': filter_value, 'page': page, 'perPage': 20, 'sort': '-created,-id'})
            result = self.pb.request('GET', 'collections/core_activity_events/records?' + query, token=self.token)[1]
            self.assertEqual(result['totalItems'], 26)
            pages.append(result['items'])
        self.assertEqual([len(page) for page in pages], [20, 6])
        self.assertEqual(len({item['id'] for page in pages for item in page}), 26)
        query = urlencode({'filter': filter_value + ' && attachments:length > 0'})
        self.assertEqual(self.pb.request('GET', 'collections/core_activity_events/records?' + query, token=self.token)[1]['totalItems'], 0)

    def test_files_protected_and_history_does_not_block_unused_deletion(self):
        boundary = 'horizonactivityboundary'
        fields = {**self.source, 'type': 'note', 'body': 'Document interne'}
        parts = [f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode() for key, value in fields.items()]
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="note.txt"\r\nContent-Type: text/plain\r\n\r\nTexte interne\r\n--{boundary}--\r\n'.encode())
        request = Request(self.pb.url + '/api/collections/core_activity_events/records', data=b''.join(parts), headers={'Authorization': self.token, 'Content-Type': f'multipart/form-data; boundary={boundary}'}, method='POST')
        with urlopen(request) as response:
            event = json.load(response)
        self.assertEqual(len(event['attachments']), 1)
        path = f'files/{event["collectionId"]}/{event["id"]}/{event["attachments"][0]}'
        with self.assertRaises(HTTPError):
            urlopen(self.pb.url + '/api/' + path)
        token = self.pb.request('POST', 'files/token', token=self.reader)[1]['token']
        with urlopen(self.pb.url + '/api/' + path + '?token=' + token) as response:
            self.assertEqual(response.read(), b'Texte interne')
        self.assertEqual(self.pb.request('DELETE', f'collections/contacts_companies/records/{self.company["id"]}', token=self.token)[0], 204)
        self.assertEqual(self.pb.request('GET', f'collections/core_activity_events/records/{event["id"]}', token=self.reader)[0], 404)
        self.assertEqual(self.pb.request('GET', f'collections/core_activity_events/records/{event["id"]}', token=self.pb.admin_token)[0], 200)
        with self.assertRaises(HTTPError):
            urlopen(self.pb.url + '/api/' + path + '?token=' + token)

class ActivityMigrationTests(unittest.TestCase):
    def test_historical_audits_keep_date_and_actor_without_duplication(self):
        import shutil
        import subprocess
        from pathlib import Path
        from check_auth import ROOT
        pb = LocalPocketBase()
        self.addCleanup(pb.close)
        directory = Path(pb.temp.name) / 'before_activity'
        directory.mkdir()
        for path in (ROOT / 'pocketbase/pb_migrations').glob('*.js'):
            if path.name < '1791158406':
                shutil.copy(path, directory / path.name)
        pb.args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={directory}']
        pb.start()
        company = pb.create('contacts_companies', {'name': 'Avant le fil', 'active': True})
        audits = pb.request('GET', 'collections/core_audit/records?perPage=500', token=pb.admin_token)[1]['items']
        creation = next(item for item in audits if item['entity_id'] == company['id'])
        pb.process.terminate(); pb.process.wait(timeout=10)
        args = [arg for arg in pb.args if not arg.startswith('--migrationsDir=')] + [f'--migrationsDir={ROOT / "pocketbase/pb_migrations"}']
        subprocess.run(args + ['migrate', 'up'], env={**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}, check=True, stdout=subprocess.DEVNULL)
        subprocess.run(args + ['migrate', 'up'], env={**pb.environment, 'HORIZON_INITIAL_ADMIN_EMAIL': 'reader@local.invalid'}, check=True, stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(args)
        events = pb.request('GET', 'collections/core_activity_events/records', token=pb.admin_token)[1]['items']
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]['created'], creation['created'])
        self.assertEqual(events[0]['author'], creation['user'])
        self.assertEqual(events[0]['metadata']['audit_id'], creation['id'])
        self.assertEqual(events[0]['source_record_id'], company['id'])


if __name__ == '__main__':
    unittest.main()

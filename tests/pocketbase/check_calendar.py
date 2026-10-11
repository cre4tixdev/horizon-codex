"""Manual calendar: ownership, shared visibility, validation, retries and audit."""
import unittest
from check_auth import LocalPocketBase

class CalendarTests(unittest.TestCase):
    def setUp(self):
        self.pb = LocalPocketBase().start(); self.addCleanup(self.pb.close)
        role = self.pb.create('core_roles', {'name': 'calendar', 'label': 'Calendrier', 'active': True, 'permissions': ['calendar.read', 'calendar.write']})
        self.user = self.pb.create_user('calendar@local.invalid', role['id'])
        self.other = self.pb.create_user('calendar-other@local.invalid', role['id'])
        self.token = self.pb.login('calendar@local.invalid')[1]['token']
        self.other_token = self.pb.login('calendar-other@local.invalid')[1]['token']
        self.input = dict(title='Réunion chantier', description='Préparer les accès', start='2026-10-12T08:00:00.000Z', end='2026-10-12T09:00:00.000Z', all_day=False, timezone='Europe/Paris', location='Meudon', visibility='private', tone='violet', color='')
    def save(self, **changes):
        return self.pb.request('POST', 'horizon/calendar/manual/save', dict(input={**self.input, **changes}, creation_key='manual-key-1'), self.token)
    def events(self, token=None, extra=''):
        return self.pb.request('GET', 'horizon/calendar/events?from=2026-10-01T00:00:00.000Z&to=2026-11-01T00:00:00.000Z' + extra, token=token or self.token)
    def test_create_retry_private_and_team(self):
        status, record = self.save(); self.assertEqual(status, 200, record)
        self.assertEqual(self.save()[1]['id'], record['id'])
        self.assertEqual(self.save(title='Changed retry')[0], 409)
        self.assertEqual(self.events()[1]['items'][0]['source_module'], 'calendar')
        self.assertEqual(self.events(token=self.other_token)[1]['items'], [])
        path = 'horizon/calendar/manual/' + record['id']
        self.assertEqual(self.pb.request('GET', path, token=self.other_token)[0], 404)
        self.assertEqual(self.pb.request('GET', 'collections/calendar_events/records/' + record['id'], token=self.other_token)[0], 404)
        status, shared = self.pb.request('POST', 'horizon/calendar/manual/save', dict(id=record['id'], updated=record['updated'], input={**self.input, 'visibility': 'team'}), self.token)
        self.assertEqual(status, 200, shared)
        self.assertFalse(self.pb.request('GET', path, token=self.other_token)[1]['editable'])
        self.assertEqual(len(self.events(token=self.other_token)[1]['items']), 1)
        self.assertEqual(self.events(extra='&scope=tenders')[1]['items'], [])
        self.assertEqual(self.events(extra='&owner=' + self.other['id'])[1]['items'], [])
        self.assertEqual(self.pb.request('POST', 'horizon/calendar/manual/save', dict(id=record['id'], updated=shared['updated'], input=self.input), self.other_token)[0], 404)
    def test_validation_concurrency_remove_and_permissions(self):
        for changes in [dict(end='2026-10-12T07:00:00.000Z'), dict(start='2026-02-30T08:00:00.000Z'), dict(visibility='public'), dict(owner=self.other['id']), dict(color='red'), dict(timezone='nonsense')]:
            self.assertEqual(self.save(**changes)[0], 400, changes)
        status, record = self.save(); self.assertEqual(status, 200, record)
        self.assertEqual(self.pb.request('POST', 'horizon/calendar/manual/save', dict(id=record['id'], updated='stale', input=self.input), self.token)[0], 409)
        self.assertEqual(self.pb.request('PATCH', 'collections/calendar_events/records/' + record['id'], {'title': 'bypass'}, self.token)[0], 403)
        self.assertEqual(self.pb.request('POST', 'horizon/calendar/manual/remove', dict(id=record['id'], updated=record['updated']), self.other_token)[0], 404)
        status, result = self.pb.request('POST', 'horizon/calendar/manual/remove', dict(id=record['id'], updated=record['updated']), self.token)
        self.assertEqual(status, 200, result)
        self.assertEqual(self.events()[1]['items'], [])
        stored = self.pb.request('GET', 'collections/calendar_events/records/' + record['id'], token=self.pb.admin_token)[1]
        self.assertTrue(stored['archived'])
        self.assertEqual(self.pb.request('POST', 'horizon/calendar/manual/save', dict(input=self.input, creation_key='unauth'))[0], 401)
        self.pb.request('PATCH', 'collections/core_users/records/' + self.user['id'], {'erp_profile': 'viewer'}, self.pb.admin_token)
        self.assertEqual(self.save()[0], 403)
        self.pb.request('PATCH', 'collections/core_roles/records/' + self.user['role'], {'active': False}, self.pb.admin_token)
        self.assertEqual(self.events()[1]['items'], [])

if __name__ == '__main__': unittest.main(verbosity=2)

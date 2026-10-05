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

if __name__ == '__main__':
    unittest.main()

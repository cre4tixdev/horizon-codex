"""Verify stock PocketBase serve applies migrations even with automigrate=false."""
import os
import socket
import sqlite3
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError


class MigrationStartupTests(unittest.TestCase):
    def test_serve_applies_pending_migrations_once_with_automigrate_false(self):
        binary = os.environ.get('POCKETBASE_BINARY', 'pocketbase')
        self.assertIn('0.40.4', subprocess.check_output([binary, '--version'], text=True))
        with tempfile.TemporaryDirectory(prefix='horizon-migration-startup-') as directory:
            root = Path(directory)
            migrations = root / 'migrations'; migrations.mkdir()
            hooks = root / 'hooks'; hooks.mkdir()
            migration = migrations / '1791840000_startup_probe.js'
            migration.write_text("migrate((app) => { app.save(new Collection({type:'base',name:'startup_probe'})) }, (app) => { app.delete(app.findCollectionByNameOrId('startup_probe')) })")
            for _ in range(2):
                with socket.socket() as sock:
                    sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
                args = [binary, 'serve', f'--dir={root / "data"}', f'--hooksDir={hooks}', f'--migrationsDir={migrations}', '--automigrate=false', f'--http=127.0.0.1:{port}']
                with (root / 'server.log').open('a') as log:
                    process = subprocess.Popen(args, stdout=log, stderr=log)
                    try:
                        for attempt in range(100):
                            if process.poll() is not None: self.fail('Disposable server stopped before health check')
                            try:
                                with urlopen(f'http://127.0.0.1:{port}/api/health', timeout=1) as response:
                                    if response.status == 200: break
                            except (URLError, TimeoutError): time.sleep(.05)
                        else: self.fail('Disposable server did not start')
                        with sqlite3.connect(root / 'data/data.db') as db:
                            self.assertEqual(db.execute("SELECT count(*) FROM _collections WHERE name='startup_probe'").fetchone()[0], 1)
                            self.assertEqual(db.execute('SELECT count(*) FROM _migrations WHERE file=?', (migration.name,)).fetchone()[0], 1)
                    finally:
                        process.terminate(); process.wait(timeout=10)


if __name__ == '__main__': unittest.main(verbosity=2)

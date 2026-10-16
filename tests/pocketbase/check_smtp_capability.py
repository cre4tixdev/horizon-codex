"""PocketBase 0.40.4 SMTP capability probe. Disposable DB and loopback SMTP only.

The temporary hook and fictional credential exist only in the fixture directory.
No message is accepted. This pins the reason native JS mail hooks cannot send
Microsoft OAuth SMTP without an explicitly chosen transport extension.
"""
import shutil
import socketserver
import threading
import unittest
from pathlib import Path
from check_auth import LocalPocketBase, ROOT

class NativeSmtpCapabilityTests(unittest.TestCase):
    def test_native_client_does_not_implement_xoauth2(self):
        methods = []
        class Smtp(socketserver.StreamRequestHandler):
            def handle(self):
                self.connection.settimeout(5)
                self.wfile.write(b'220 localhost capability-fixture\r\n'); self.wfile.flush()
                while True:
                    line = self.rfile.readline()
                    if not line: return
                    verb = line.split(b' ', 1)[0].strip().upper()
                    if verb in (b'EHLO', b'HELO'):
                        self.wfile.write(b'250-localhost\r\n250 AUTH XOAUTH2 PLAIN\r\n')
                    elif verb == b'AUTH':
                        # Intentionally discard the credential payload; keep only mechanism.
                        methods.append(line.split(b' ', 2)[1].decode())
                        self.wfile.write(b'535 5.7.3 Capability fixture refuses all authentication\r\n')
                    elif verb == b'QUIT':
                        self.wfile.write(b'221 Bye\r\n'); self.wfile.flush(); return
                    else:
                        self.wfile.write(b'500 No messages accepted by fixture\r\n')
                    self.wfile.flush()
        server = socketserver.ThreadingTCPServer(('127.0.0.1', 0), Smtp)
        server.daemon_threads = True
        self.addCleanup(server.server_close); self.addCleanup(server.shutdown)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        pb = LocalPocketBase(); self.addCleanup(pb.close)
        hooks = Path(pb.temp.name) / 'hooks'
        shutil.copytree(ROOT / 'pocketbase/pb_hooks', hooks)
        (hooks / 'smtp-capability.pb.js').write_text('''routerAdd('POST', '/api/local-smtp-capability', (e) => {
  const client = e.app.newMailClient()
  client.authMethod = 'XOAUTH2'
  try {
    client.send(new MailerMessage({from: {address: 'sender@example.invalid'}, to: [{address: 'recipient@example.invalid'}], subject: 'Local capability probe', text: 'Never delivered'}))
  } catch { return e.json(200, {refused: true}) }
  return e.json(200, {refused: false})
}, $apis.requireSuperuserAuth())''')
        pb.args = [arg if not arg.startswith('--hooksDir=') else '--hooksDir='+str(hooks) for arg in pb.args]
        pb.start()
        status, result = pb.request('PATCH', 'settings', {'smtp': {'enabled': True, 'host': '127.0.0.1', 'port': server.server_address[1], 'username': 'local-fictional-account', 'password': 'local-fictional-not-a-token', 'tls': False, 'authMethod': 'PLAIN'}}, pb.admin_token)
        self.assertEqual(status, 200, result)
        status, result = pb.request('POST', 'local-smtp-capability', {}, pb.admin_token)
        self.assertEqual(status, 200, result)
        self.assertEqual(result, {'refused': True})
        self.assertEqual(methods, ['PLAIN'], 'Native SMTP silently falls back to PLAIN even with authMethod=XOAUTH2')

if __name__ == '__main__': unittest.main(verbosity=2)

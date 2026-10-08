"""Documents migration, permissions, immutable publication and binary HTTP transport.

The converter is a local test double. This does not assert Chromium pagination.
"""
import copy
import json
import os
import threading
import unittest
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
import check_sales

STYLE = dict(font='Inter', size=12, color='#091C3A', background='#FFFFFF', align='left', bold=False, italic=False, uppercase=False, border=False)
def block(kind, identifier):
    return dict(id=identifier, kind=kind, zone='body', x=0, y=12, width=650, height=24, style=STYLE.copy(), text='', content=None, field='company.name', image='', columns=[dict(field='description', label='Description', width=70), dict(field='line_total', label='Total', width=30)])
def layout():
    return dict(version=1, orientation='portrait', margin=12, headerHeight=80, footerHeight=30, headings=[STYLE.copy() for _ in range(3)], blocks=[block('field', 'client'), block('table', 'lines'), block('totals', 'total')])

class Converter(BaseHTTPRequestHandler):
    payloads = []
    def do_POST(self):
        self.__class__.payloads.append(self.rfile.read(int(self.headers['Content-Length'])))
        self.send_response(200)
        self.send_header('Content-Type', 'application/pdf')
        self.end_headers()
        self.wfile.write(b'%PDF-1.7\nlocal transport test\n%%EOF')
    def log_message(self, *_args):
        pass

class DocumentsTests(unittest.TestCase):
    save = check_sales.SalesTests.save
    quote_save = check_sales.SalesTests.quote_save
    def setUp(self):
        self.converter = ThreadingHTTPServer(('127.0.0.1', 0), Converter)
        thread = threading.Thread(target=self.converter.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self.converter.server_close)
        self.addCleanup(self.converter.shutdown)
        previous = os.environ.get('HORIZON_GOTENBERG_URL')
        os.environ['HORIZON_GOTENBERG_URL'] = f'http://127.0.0.1:{self.converter.server_port}'
        try:
            check_sales.SalesTests.setUp(self)
        finally:
            if previous is None: os.environ.pop('HORIZON_GOTENBERG_URL', None)
            else: os.environ['HORIZON_GOTENBERG_URL'] = previous
        role = self.pb.create('core_roles', dict(name='templates', label='Modèles', active=True, permissions=['settings.references', 'documents.template.manage', 'sales.read']))
        self.pb.create_user('templates@local.invalid', role['id'], profile='superuser')
        self.manager = self.pb.login('templates@local.invalid')[1]['token']
        self.quote_record = self.quote_save()[1]
        self.payload = dict(name='Devis Horizon', content_json=layout())
    def call(self, action, body, token=None):
        return self.pb.request('POST', 'horizon/documents/' + action, body, token or self.manager)
    def template(self):
        status, result = self.call('templates/save', self.payload)
        self.assertEqual(status, 200, result)
        return result
    def test_publication_snapshot_and_conflict(self):
        template = self.template()
        status, published = self.call('templates/publish', dict(id=template['id'], updated=template['updated']))
        self.assertEqual(status, 200, published)
        self.assertEqual(published['version'], 1)
        self.assertEqual(self.call('templates/publish', dict(id=published['id'], updated=published['updated']))[1]['version'], 1)
        self.assertEqual(self.call('templates/save', dict(self.payload, id=template['id'], updated='stale'))[0], 409)
        version = published['current_version']
        self.assertEqual(self.pb.request('PATCH', f'collections/documents_template_versions/records/{version}', {'name': 'Forged'}, self.pb.admin_token)[0], 400)
        self.assertEqual(self.pb.request('DELETE', f'collections/documents_template_versions/records/{version}', token=self.pb.admin_token)[0], 400)
        self.assertEqual(self.call('templates/archive', dict(id=published['id'], updated=published['updated']))[0], 200)
        self.assertEqual(self.pb.request('GET', 'horizon/documents/templates', token=self.token)[1]['items'], [])
    def test_profiles_and_unpublished_access(self):
        template = self.template()
        self.assertEqual(self.call('templates/save', self.payload, self.token)[0], 403)
        self.assertEqual(self.pb.request('GET', 'horizon/documents/templates', token=self.token)[1]['items'], [])
        body = dict(quote_id=self.quote_record['id'], template_id=template['id'], format='html')
        self.assertEqual(self.call('preview', body, self.token)[0], 400)
        self.assertEqual(self.call('preview', dict(body, content_json=layout()), self.token)[0], 403)
        self.pb.request('PATCH', f'collections/core_roles/records/{self.user["role"]}', {'permissions': ['sales.read', 'documents.template.manage', 'settings.references']}, self.pb.admin_token)
        self.assertEqual(self.call('templates/save', self.payload, self.token)[0], 403)
        self.assertIn(self.pb.request('GET', f'collections/documents_templates/records/{template["id"]}', token=self.token)[0], [403, 404])
    def test_real_quote_projection_escape_and_no_private_finance(self):
        self.pb.request('PATCH', f'collections/contacts_companies/records/{self.company["id"]}', {'name': '<script>alert(1)</script>'}, self.pb.admin_token)
        status, result = self.call('preview', dict(quote_id=self.quote_record['id'], content_json=layout(), format='html'))
        self.assertEqual(status, 200, result)
        self.assertIn('&lt;script&gt;', result['html'])
        self.assertIn('Intégration', result['html'])
        self.assertIn('300,76 €', result['html'])
        self.assertNotIn('<script>', result['html'])
        self.assertNotIn('unit_cost', result['html'])
        bad = layout(); bad['blocks'][0]['field'] = 'quote.cost_total'
        self.assertEqual(self.call('templates/save', dict(self.payload, content_json=bad))[0], 400)
    def test_table_headings_are_scoped_and_validated(self):
        status, quote = self.quote_save(key='quote-table-headings-0001', lines=[{'kind': 'section', 'description': 'Section source'}, {'description': 'Article', 'quantity': 1, 'unit_price': 10}])
        self.assertEqual(status, 200, quote)
        content = layout()
        first = content['blocks'][1]
        first['tableHeadings'] = [dict(STYLE, size=17, color='#F52F96') for _ in range(3)]
        second = copy.deepcopy(first)
        second['id'] = 'second-table'
        second['tableHeadings'] = [dict(STYLE, size=10, color='#091C3A') for _ in range(3)]
        content['blocks'].append(second)
        self.assertEqual(self.call('templates/save', dict(self.payload, content_json=content))[0], 200)
        status, preview = self.call('preview', dict(quote_id=quote['id'], content_json=content, format='html'))
        self.assertEqual(status, 200, preview)
        self.assertIn('font-size:17px;color:#F52F96', preview['html'])
        self.assertIn('font-size:10px;color:#091C3A', preview['html'])
        for bad in [dict(first, tableHeadings=first['tableHeadings'][:2]), dict(first, kind='field')]:
            invalid = layout(); invalid['blocks'][1] = bad
            self.assertEqual(self.call('templates/save', dict(self.payload, content_json=invalid))[0], 400)

    def test_layout_validation(self):
        for modify in [lambda value: value.update(script='bad'), lambda value: value['blocks'][0].update(image='https://private.invalid/logo'), lambda value: value['blocks'][0].update(x=1000), lambda value: value['blocks'][0].update(style=dict(STYLE, color='red;display:none'))]:
            bad = copy.deepcopy(layout()); modify(bad)
            self.assertEqual(self.call('templates/save', dict(self.payload, content_json=bad))[0], 400)
    def test_published_version_survives_draft_edits(self):
        content = layout(); content['blocks'][0].update(kind='text', text='Texte publié original')
        template = self.call('templates/save', dict(self.payload, content_json=content))[1]
        published = self.call('templates/publish', dict(id=template['id'], updated=template['updated']))[1]
        content['blocks'][0]['text'] = 'Texte du prochain brouillon'
        self.assertEqual(self.call('templates/save', dict(self.payload, content_json=content, id=template['id'], updated=published['updated']))[0], 200)
        status, preview = self.call('preview', dict(quote_id=self.quote_record['id'], template_id=template['id'], format='html'), self.token)
        self.assertEqual(status, 200, preview)
        self.assertIn('Texte publié original', preview['html'])
        self.assertNotIn('Texte du prochain brouillon', preview['html'])
    def test_address_fields_and_shared_flow_row(self):
        self.pb.create('contacts_addresses', dict(company=self.company['id'], type='billing', line1='12 rue du Test', postal_code='75001', city='Paris', country='FR', is_primary=True))
        content = layout()
        client = content['blocks'][0]
        client.update(field='company.address', width=300, style=dict(STYLE, font='Open Sans'))
        validity = block('field', 'validity')
        validity.update(field='quote.validity_days', text='Validité : ', sameLine=True, x=320, width=300)
        content['blocks'].insert(1, validity)
        content['blocks'][2]['tableSource'] = 'sales.quote_lines'
        status, result = self.call('preview', dict(quote_id=self.quote_record['id'], content_json=content, format='html'))
        self.assertEqual(status, 200, result)
        self.assertIn('12 rue du Test<br>75001 Paris<br>France', result['html'])
        self.assertIn('Validité : ', result['html'])
        self.assertIn('document-flow-row', result['html'])
        self.assertIn('grid-area:1/1', result['html'])
        self.assertNotIn('Adresse client ambiguë', ' '.join(result['warnings']))
        self.assertIn("font-family:'Open Sans'", result['html'])
        bad = copy.deepcopy(content); bad['blocks'][2]['tableSource'] = 'sales.quote_costs'
        self.assertEqual(self.call('templates/save', dict(self.payload, content_json=bad))[0], 400)

    def test_ambiguous_address_is_not_arbitrarily_selected(self):
        for city in ['Paris', 'Lyon']:
            self.pb.create('contacts_addresses', dict(company=self.company['id'], type='billing', line1='Rue '+city, city=city, country='FR'))
        content = layout(); content['blocks'][0]['field'] = 'company.address'
        status, result = self.call('preview', dict(quote_id=self.quote_record['id'], content_json=content, format='html'))
        self.assertEqual(status, 200, result)
        self.assertIn('Adresse client ambiguë', ' '.join(result['warnings']))
        self.assertNotIn('Rue Paris', result['html'])
        self.assertNotIn('Rue Lyon', result['html'])

    def test_html_style_attributes_and_fixed_header_are_intact(self):
        content = layout()
        header = block('text', 'header')
        header.update(zone='header', x=400, y=10, width=200, text='CVS', style=dict(STYLE, font='Open Sans', size=18, color='#7B3FC7', bold=True))
        content['blocks'].append(header)
        status, result = self.call('preview', dict(quote_id=self.quote_record['id'], content_json=content, format='html'))
        self.assertEqual(status, 200, result)
        captured = {}
        class Parser(HTMLParser):
            def handle_starttag(self, tag, attrs):
                attributes = dict(attrs)
                if attributes.get('data-block-id') == 'header': captured.update(attributes)
        Parser().feed(result['html'])
        self.assertEqual(set(captured), {'data-block-id', 'style'})
        self.assertIn("font-family:'Open Sans'", captured['style'])
        self.assertIn('position:absolute;left:400px;top:10px', captured['style'])
        self.assertIn('font-size:18px', captured['style'])
        self.assertIn('font-weight:600', captured['style'])
        self.assertIn('color:#7B3FC7', captured['style'])

    def test_anchors_and_rich_headings_use_the_model_style(self):
        content = layout()
        text = block('text', 'rich')
        text.update(width=200, anchorX='right', content=dict(type='doc', content=[dict(type='heading', attrs=dict(level=2), content=[dict(type='text', text='Titre visible', marks=[dict(type='italic')])])]))
        content['headings'][1] = dict(STYLE, font='Noto Serif', size=17, bold=True, background='#FCEAF3')
        content['blocks'].append(text)
        status, result = self.call('preview', dict(quote_id=self.quote_record['id'], content_json=content, format='html'))
        self.assertEqual(status, 200, result)
        self.assertIn('margin-left:503px', result['html'])
        self.assertIn('<h2 style="font-family:', result['html'])
        self.assertIn('<em>Titre visible</em>', result['html'])
        self.assertIn('background:#FCEAF3', result['html'])
        bad = copy.deepcopy(content); bad['blocks'][-1]['anchorX'] = 'bad'
        self.assertEqual(self.call('templates/save', dict(self.payload, content_json=bad))[0], 400)

    def test_generic_fields_and_image_dimensions(self):
        content = layout()
        total = content['blocks'][-1]
        total.update(kind='field', field='quote.total', text='Total TTC : ')
        image = block('image', 'picture')
        image.update(width=200, height=100, imageRatio=2, lockAspect=True, image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVZkAAAAASUVORK5CYII=')
        content['blocks'].append(image)
        status, saved = self.call('templates/save', dict(self.payload, content_json=content))
        self.assertEqual(status, 200, saved)
        self.assertEqual(saved['content_json']['blocks'][-1]['imageRatio'], 2)
        status, preview = self.call('preview', dict(quote_id=self.quote_record['id'], content_json=content, format='html'))
        self.assertEqual(status, 200, preview)
        self.assertIn('Total TTC : 300,76 €', preview['html'])
        self.assertIn('width:100%;height:100px', preview['html'])
        for metadata in [dict(imageRatio=0), dict(imageRatio=10001), dict(lockAspect='true')]:
            bad = copy.deepcopy(content); bad['blocks'][-1].update(metadata)
            self.assertEqual(self.call('templates/save', dict(self.payload, content_json=bad))[0], 400)

    def test_background_layers_keep_content_opaque_and_reject_remote_sources(self):
        content = layout()
        content['background'] = dict(color='#E8EDF4', image='', opacity=0.35, fit='contain')
        content['blocks'][0]['style'].update(background='#7B3FC7', backgroundOpacity=0.5)
        status, result = self.call('preview', dict(quote_id=self.quote_record['id'], content_json=content, format='html'))
        self.assertEqual(status, 200, result)
        captured = {}
        class Parser(HTMLParser):
            def handle_starttag(self, tag, attrs):
                attributes = dict(attrs)
                if attributes.get('data-block-id') == 'client': captured.update(attributes)
        Parser().feed(result['html'])
        self.assertIn('background:rgba(123,63,199,0.5);', captured['style'])
        self.assertNotIn('opacity:', captured['style'])
        self.assertIn('document-paper-background', result['html'])
        self.assertIn('opacity:0.35;background:#E8EDF4', result['html'])
        for patch in [dict(opacity=-0.01), dict(opacity=1.01), dict(fit='stretch'), dict(image='https://remote.invalid/image.png')]:
            bad = copy.deepcopy(content); bad['background'].update(patch)
            self.assertEqual(self.call('templates/save', dict(self.payload, content_json=bad))[0], 400)
        content['blocks'][0]['style']['backgroundOpacity'] = 1.1
        self.assertEqual(self.call('templates/save', dict(self.payload, content_json=content))[0], 400)

    def test_pdf_multipart_binary_transport(self):
        req = Request(self.pb.url + '/api/horizon/documents/preview', method='POST', headers={'Authorization': self.manager, 'Content-Type': 'application/json'}, data=json.dumps(dict(quote_id=self.quote_record['id'], content_json=layout(), format='pdf')).encode())
        with urlopen(req, timeout=10) as response:
            self.assertEqual(response.headers['Content-Type'], 'application/pdf')
            self.assertEqual(response.headers['Cache-Control'], 'no-store')
            self.assertTrue(response.read().startswith(b'%PDF-'))
        self.assertIn(b'index.html', Converter.payloads[-1])
        self.assertIn(b'header.html', Converter.payloads[-1])
        self.assertIn(b'footer.html', Converter.payloads[-1])
        self.assertIn(b'Int', Converter.payloads[-1])

if __name__ == '__main__': unittest.main()

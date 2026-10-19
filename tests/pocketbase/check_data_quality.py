"""Merge assistant: permissions, minimal candidates and product invariants on disposable PB."""
import unittest, uuid
from check_auth import LocalPocketBase
import check_catalog

class QualityTests(unittest.TestCase):
    def setUp(self):
        check_catalog.CatalogTests.setUp(self)
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],dict(permissions=['inventory.read','inventory.write','inventory.merge','contacts.read','contacts.write','contacts.merge']),self.pb.admin_token)
    create_product=check_catalog.CatalogTests.create_product
    def product_pair(self, offers=False):
        result=[]
        for index in range(2):
            status,record=self.create_product(key='quality-'+str(uuid.uuid4()),sku='MERGE-'+str(index),name='Produit similaire',offers=[self.offer] if offers else [])
            self.assertEqual(status,200,record);result.append(record)
        return result
    def get(self, table, id): return self.pb.request('GET','collections/'+table+'/records/'+id,token=self.pb.admin_token)[1]
    def preview(self, source,target):
        b=dict(kind='products',source=source['id'],target=target['id'])
        status,result=self.pb.request('POST','horizon/inventory/merge/preview',b,self.token);self.assertEqual(status,200,result);return b,result
    def apply(self,b,preview,choices=None): return self.pb.request('POST','horizon/inventory/merge/apply',dict(b,confirmed=True,fingerprint=preview['fingerprint'],choices=choices or {}),self.token)
    def candidates(self,kind='products',mode='duplicates',extra=''):
        return self.pb.request('GET','horizon/data-quality/candidates?kind='+kind+'&mode='+mode+extra,token=self.token)
    def test_candidates_identity_hints_accent_cross_name_and_pagination(self):
        self.pb.create('contacts_companies',dict(name='M6 fictif',legal_name='METROPOLE TELEVISION fictive',active=True))
        self.pb.create('contacts_companies',dict(name='Métropole Télévision fictive',active=True))
        status,result=self.candidates('companies');self.assertEqual(status,200,result);self.assertEqual(result['totalItems'],1);self.assertIn('Nom ou raison sociale identique',result['items'][0]['reasons'])
        for index in range(27): self.pb.create('contacts_companies',dict(name='Pagination fictive '+str(index),active=True))
        status,page=self.candidates('companies','manual','&page=2');self.assertEqual(status,200,page);self.assertEqual(page['totalPages'],2);self.assertEqual(len(page['items']),page['totalItems']-25)
        self.assertNotIn('notes',page['items'][0]['left']);self.assertNotIn('logo',page['items'][0]['left'])
        for company,email in [('', 'same@example.invalid'),('', 'SAME@example.invalid')]: self.pb.create('contacts_people',dict(first_name='Personne',last_name=str(uuid.uuid4()),email=email,company=company,active=True))
        status,result=self.candidates('people');self.assertEqual(status,200,result);self.assertEqual(result['totalItems'],1,result)
        self.assertIn('Même e-mail',result['items'][0]['reasons'])
        from urllib.parse import quote
        for _ in range(2):self.pb.create('contacts_companies',dict(name='東京',active=True))
        status,result=self.candidates('companies','duplicates','&q='+quote('東京'));self.assertEqual(status,200,result);self.assertEqual(result['totalItems'],1,result)
    def test_product_merge_offers_history_alias_external_and_replay(self):
        source,target=self.product_pair(offers=True)
        histories=self.pb.request('GET','collections/inventory_supplier_price_history/records?perPage=100',token=self.pb.admin_token)[1]['items']
        reference=self.pb.create('core_external_references',dict(provider='old-catalog',entity_type='inventory_products',external_id='original-123',horizon_record_id=source['id']))
        status,candidates=self.candidates();self.assertEqual(status,200,candidates);self.assertEqual(candidates['totalItems'],1,candidates)
        b,preview=self.preview(source,target);self.assertEqual(preview['blockers'],[],preview)
        self.assertEqual(self.get('inventory_products',source['id'])['active'],True)
        status,result=self.apply(b,preview,dict(name='source'));self.assertEqual(status,200,result)
        current=self.get('inventory_products',source['id']);self.assertEqual(current['merged_into'],target['id']);self.assertFalse(current['active']);self.assertEqual(current['sku'],source['sku']);self.assertEqual(current['barcode'],source['barcode'])
        for offer in source['offers']: self.assertEqual(self.get('inventory_product_suppliers',offer['id'])['product'],target['id']);self.assertFalse(self.get('inventory_product_suppliers',offer['id'])['is_preferred'])
        for history in histories:self.assertEqual(self.get('inventory_supplier_price_history',history['id']),history)
        status,aliases=self.pb.request('GET','horizon/inventory/products/'+target['id']+'/merged-sources',token=self.token);self.assertEqual(status,200,aliases);self.assertEqual(aliases['items'][0]['id'],source['id'])
        self.assertEqual(self.get('core_external_references',reference['id'])['horizon_record_id'],target['id'])
        self.assertEqual(self.apply(b,preview)[0],200)
        for term in [source['sku'],source['barcode']]:
            status,found=self.pb.request('GET','horizon/inventory/products?q='+term,token=self.token);self.assertEqual(status,200,found);self.assertEqual(found['totalItems'],1,found);self.assertEqual(found['items'][0]['id'],target['id'])
        status,empty=self.candidates();self.assertEqual(status,200,empty);self.assertEqual(empty['totalItems'],0)
        self.assertEqual(self.pb.request('POST','horizon/inventory/products/state',dict(id=source['id'],updated=current['updated'],active=True),self.token)[0],400)
        self.assertEqual(self.pb.request('PATCH','collections/inventory_products/records/'+source['id'],dict(name='No'),self.pb.admin_token)[0],400)
    def test_product_structural_conflict_concurrency_choices_and_permission(self):
        source,target=self.product_pair()
        self.pb.request('PATCH','collections/inventory_products/records/'+source['id'],dict(name='service'),self.pb.admin_token)
        b,preview=self.preview(source,target)
        name=next(field for field in preview['fields'] if field['key']=='name');self.assertEqual(name['source'],'service');self.assertEqual(name['source_label'],'')
        self.assertEqual(self.apply(b,preview,dict(sku='source'))[0],400)
        self.pb.request('PATCH','collections/inventory_products/records/'+target['id'],dict(description='Concurrent'),self.pb.admin_token)
        self.assertEqual(self.apply(b,preview)[0],409)
        self.pb.request('PATCH','collections/inventory_products/records/'+source['id'],dict(tracking='serial'),self.pb.admin_token)
        b,preview=self.preview(source,target);self.assertTrue(preview['blockers']);self.assertEqual(self.apply(b,preview)[0],409)
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],dict(permissions=['inventory.read','inventory.write']),self.pb.admin_token)
        self.assertEqual(self.candidates()[0],403);self.assertEqual(self.apply(b,preview)[0],403)
    def test_source_linked_product_is_blocked_and_target_is_allowed(self):
        source,target=self.product_pair()
        # An incoming reference from a future module must also block the source.
        collection=dict(name='test_product_usage',type='base',fields=[dict(name='product',type='relation',collectionId=source['collectionId'],maxSelect=1)])
        self.assertEqual(self.pb.request('POST','collections',collection,self.pb.admin_token)[0],200)
        link=self.pb.create('test_product_usage',dict(product=source['id']))
        b,preview=self.preview(source,target);self.assertTrue(preview['blockers']);self.assertEqual(self.apply(b,preview)[0],409)
        self.assertEqual(self.get('test_product_usage',link['id'])['product'],source['id'])
        b,preview=self.preview(target,source);self.assertEqual(preview['blockers'],[]);self.assertEqual(self.apply(b,preview)[0],200)
        self.assertEqual(self.get('test_product_usage',link['id'])['product'],source['id'])
    def test_actual_stock_remains_unchanged_when_merging_an_unused_duplicate(self):
        source,target=self.product_pair()
        role=self.get('core_roles',self.user['role'])
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],dict(permissions=role['permissions']+['inventory.stock.validate']),self.pb.admin_token)
        status,choices=self.pb.request('GET','horizon/inventory/operations/choices',token=self.token);self.assertEqual(status,200,choices)
        location=choices['locations'][0]
        data=dict(kind='IN',warehouse=location['warehouse'],destination_warehouse=location['warehouse'],title='Stock avant fusion',opportunity='',purchase_order='',sales_quote='',origin='',destination='',reason='Test stock réel',notes='',document_date='2026-10-18',planned_date='',inventory_mode='cycle',dropship=False,scrap=False,scope=[],lines=[dict(id='line-1',product=source['id'],quantity=4,from_location=location['id'],to_location=location['id'],source_line='',counted=None)])
        status,operation=self.pb.request('POST','horizon/inventory/operations/save',dict(input=data,creation_key=str(uuid.uuid4())),self.token);self.assertEqual(status,200,operation)
        status,operation=self.pb.request('POST','horizon/inventory/operations/transition',dict(id=operation['id'],updated=operation['updated'],action='validate'),self.token);self.assertEqual(status,200,operation)
        moves=self.pb.request('GET','collections/inventory_moves/records?perPage=100',token=self.pb.admin_token)[1]['items']
        b,preview=self.preview(source,target);self.assertTrue(preview['blockers']);self.assertEqual(self.apply(b,preview)[0],409)
        b,preview=self.preview(target,source);self.assertEqual(preview['blockers'],[]);self.assertEqual(self.apply(b,preview)[0],200)
        after=self.pb.request('GET','collections/inventory_moves/records?perPage=100',token=self.pb.admin_token)[1]['items'];self.assertEqual(after,moves)
        status,balance=self.pb.request('GET','horizon/inventory/stock?product='+source['id'],token=self.token);self.assertEqual(status,200,balance);self.assertEqual(sum(row['physical'] for row in balance['items']),4)

    def test_product_protected_photo_copied_and_source_file_preserved(self):
        from pathlib import Path
        import json
        from urllib.request import Request,urlopen
        source,target=self.product_pair()
        image=(Path(__file__).resolve().parents[1]/'fixtures/import-logo.png').read_bytes()
        boundary='horizon-merge-photo-local'
        payload=(f'--{boundary}\r\nContent-Disposition: form-data; name="primary_image"; filename="photo.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+image+f'\r\n--{boundary}--\r\n'.encode())
        req=Request(self.pb.url+'/api/collections/inventory_products/records/'+source['id'],data=payload,headers={'Authorization':self.pb.admin_token,'Content-Type':'multipart/form-data; boundary='+boundary},method='PATCH')
        with urlopen(req) as response:source_file=json.loads(response.read())['primary_image']
        b,preview=self.preview(source,target);self.assertEqual(self.apply(b,preview)[0],200)
        after=self.get('inventory_products',target['id']);self.assertTrue(after['primary_image']);self.assertEqual(self.get('inventory_products',source['id'])['primary_image'],source_file)
        status,token=self.pb.request('POST','files/token',{},self.token);self.assertEqual(status,200,token)
        for id,filename in [(source['id'],source_file),(target['id'],after['primary_image'])]:
            with urlopen(self.pb.url+'/api/files/'+source['collectionId']+'/'+id+'/'+filename+'?token='+token['token']) as response:self.assertEqual(response.read(),image)

    def test_wrong_domains_viewer_and_unknown_query_fields(self):
        self.assertEqual(self.candidates('invalid')[0],400)
        self.assertEqual(self.candidates('products',extra='&unexpected=true')[0],400)
        viewer=self.pb.create_user('quality-viewer@local.invalid',self.user['role'],'viewer')
        token=self.pb.login(viewer['email'])[1]['token'];self.assertEqual(self.pb.request('GET','horizon/data-quality/candidates?kind=products',token=token)[0],403)
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],dict(permissions=['contacts.read','contacts.write','contacts.merge']),self.pb.admin_token)
        self.assertEqual(self.candidates('products')[0],403);self.assertEqual(self.candidates('companies')[0],200)

class QualityMigrationTests(unittest.TestCase):
    def test_upgrade_products_preserves_fields_offers_and_prices(self):
        from pathlib import Path
        import subprocess
        pb=LocalPocketBase();self.addCleanup(pb.close);current=list(pb.args)
        directory=Path(pb.temp.name)/'previous';directory.mkdir()
        for migration in (Path(__file__).resolve().parents[2]/'pocketbase/pb_migrations').glob('*.js'):
            if migration.name < '1791840029': (directory/migration.name).symlink_to(migration)
        pb.args=[arg if not arg.startswith('--migrationsDir=') else '--migrationsDir='+str(directory) for arg in pb.args];pb.start()
        role=pb.create('core_roles',dict(name='quality_admin',label='Admin existant',active=True,permissions=['contacts.read','contacts.write','inventory.read','inventory.write']))
        user=pb.create_user('quality-admin@local.invalid',role['id'],'admin');shared=pb.create_user('quality-shared@local.invalid',role['id'],'user');token=pb.login(user['email'])[1]['token']
        supplier=pb.create('contacts_companies',dict(name='Fournisseur avant upgrade',active=True));pb.create('contacts_company_roles',dict(company=supplier['id'],role='supplier',active=True))
        choices=pb.request('GET','horizon/inventory/choices',token=token)[1]
        data=dict(sku='BEFORE-MERGE',name='Produit existant',description='Historique préservé',category=choices['categories'][0]['id'],base_unit=choices['units'][0]['id'],kind='equipment',sale_enabled=True,purchase_enabled=True,stock_policy='stocked',replenishment_policy='manual',tracking='none',manufacturer='Marque upgrade',manufacturer_ref='REF-MIGRATION',barcode='',variant_group='',reference_cost=12,sale_currency='EUR',offers=[dict(supplier=supplier['id'],supplier_sku='SUPPLIER-OLD',list_price=50,discount=10,purchase_quantity=1,currency='EUR',lead_time_days=2,valid_from='',valid_until='',is_preferred=True)])
        # Seed the legacy schema directly in this disposable superuser fixture.
        # Current catalogue services deliberately require the later family classification migration.
        product=pb.create('inventory_products',dict({key:value for key,value in data.items() if key!='offers'},sale_unit=data['base_unit'],composition_mode='none',active=True,creation_key=str(uuid.uuid4()),created_by=user['id']))
        offer=pb.create('inventory_product_suppliers',dict(data['offers'][0],product=product['id'],purchase_price=45,active=True))
        pb.create('inventory_supplier_price_history',dict(product_supplier=offer['id'],price=45,currency='EUR',snapshot=data['offers'][0],effective_at='2026-10-01 00:00:00.000Z',actor=user['id']))
        before={}
        for table in ['inventory_products','inventory_product_suppliers','inventory_supplier_price_history']:
            before[table]=pb.request('GET','collections/'+table+'/records?perPage=100',token=pb.admin_token)[1]['items']
        pb.process.terminate();pb.process.wait(timeout=10);pb.args=current
        for _ in range(2):subprocess.run(pb.args+['migrate','up'],check=True,stdout=subprocess.DEVNULL)
        pb.launch_and_authenticate(pb.args)
        for table,rows in before.items():
            after=pb.request('GET','collections/'+table+'/records?perPage=100',token=pb.admin_token)[1]['items'];self.assertEqual(len(after),len(rows))
            for previous,actual in zip(rows,after):
                for key,value in previous.items():self.assertEqual(actual[key],value,key)
                if table=='inventory_products':self.assertEqual(actual['merged_into'],'');self.assertEqual(actual['merged_at'],'')
        original=pb.request('GET','collections/core_roles/records/'+role['id'],token=pb.admin_token)[1];self.assertNotIn('inventory.merge',original['permissions'])
        updated=pb.request('GET','collections/core_users/records/'+user['id'],token=pb.admin_token)[1];self.assertNotEqual(updated['role'],role['id'])
        admin=pb.request('GET','collections/core_roles/records/'+updated['role'],token=pb.admin_token)[1];self.assertIn('inventory.merge',admin['permissions'])
        self.assertEqual(pb.request('GET','collections/core_users/records/'+shared['id'],token=pb.admin_token)[1]['role'],role['id'])

if __name__=='__main__':unittest.main()

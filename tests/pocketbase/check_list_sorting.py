"""Global, permission-filtered column sorting across paginated ERP lists."""
import unittest
import check_catalog

class ListSortingTests(unittest.TestCase):
    setUp = check_catalog.CatalogTests.setUp
    create_product = check_catalog.CatalogTests.create_product
    # Reuse fixture helpers without inheriting all catalogue scenarios.
    def test_list_routes_accept_both_column_directions(self):
        rights=['inventory.read','inventory.write','sales.read','sales.write','purchasing.read','purchasing.write','billing.read','contacts.read','crm.read']
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':rights},self.pb.admin_token)
        status,quote=check_catalog.CatalogTests.quote_save(self); self.assertEqual(status,200,quote)
        input=dict(title='Tri achat',opportunity=self.opp['id'],source_order='',supplier=self.supplier['id'],document_date='2026-10-10',needed_date='2026-10-17',currency='EUR',exchange_rate=1,tax_rate=20,notes='',lines=[dict(product='',description='Prestation',reference='',brand='',quantity=2,unit='u',unit_price=10,discount=0,supplier=self.supplier['id'],source_line='',request_line='',allocations=[])])
        for kind in ['requests','orders']:
            status,record=self.pb.request('POST','horizon/purchasing/'+kind+'/save',{'input':input,'creation_key':'sort-'+kind+'-fixture-001'},self.token); self.assertEqual(status,200,record)
        paths={
            'horizon/sales/quotes':['quote_number','quote_date','subtotal','title','kind','opportunity','company_name','status','customer_order_number'],
            'horizon/purchasing/overview':['number','title','document_date','needed_date','kind','supplier_name','affairs','amount','status'],
            'horizon/purchasing/orders':['number','title','document_date','needed_date','kind','supplier_name','affairs','amount','status'],
            'horizon/purchasing/requests':['number','title','document_date','needed_date','kind','supplier_name','affairs','amount','status'],
            'horizon/billing/documents':['number','company_name','invoice_date','due_date','total','balance','reference','status'],
            'horizon/billing/payments':['date','company_name','paid_amount','reference','method','direction','documents','status'],
            'horizon/inventory/operations':['number','title','document_date','planned_date','from_name','to_name','source_document','provenance','operation','warehouse_name','affairs','readiness','status'],
            'horizon/inventory/stock':['name','sku','brand','location_name','physical','reserved','available','incoming','unit','valuation'],
            'horizon/inventory/assets':['number','name','brand','reference','trace','status','assigned_name','warehouse_name','location_name'],
        }
        for path,fields in paths.items():
            for field in fields:
                for prefix in ['', '-']:
                    status,result=self.pb.request('GET',path+'?sort='+prefix+field,token=self.token)
                    self.assertEqual(status,200,(path,field,prefix,result))

    def test_page_size_applies_before_projection_and_is_bounded(self):
        rights=['inventory.read','inventory.write','sales.read','sales.write','purchasing.read','purchasing.write','billing.read','contacts.read','crm.read','expenses.read','leave.read']
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':rights},self.pb.admin_token)
        self.pb.request('PATCH','collections/core_users/records/'+self.user['id'],{'leave_scope':'self'},self.pb.admin_token)
        for i in range(61): self.pb.create('contacts_companies', {'name': f'Pagination {i:03}', 'active': True})
        for group in ['none', 'country']:
            path=f'horizon/contacts/groups?kind=companies&group={group}&q=Pagination&perPage=50'
            status,first=self.pb.request('GET',path,token=self.token); self.assertEqual(status,200,first)
            status,last=self.pb.request('GET',path+'&page=2',token=self.token); self.assertEqual(status,200,last)
            self.assertEqual(first['totalItems'],61); self.assertEqual(first['totalPages'],2)
            self.assertEqual(len(first['items']),50); self.assertEqual(len(last['items']),11)
            self.assertFalse(set(row['id'] for row in first['items']) & set(row['id'] for row in last['items']))
        paths=['horizon/sales/quotes','horizon/purchasing/overview','horizon/purchasing/orders','horizon/purchasing/requests','horizon/billing/documents','horizon/billing/payments','horizon/inventory/products','horizon/inventory/stock','horizon/inventory/operations','horizon/crm/list-index','horizon/crm/tenders','horizon/expenses/reports','horizon/leave/requests']
        for path in paths:
            status,result=self.pb.request('GET',path+'?perPage=50',token=self.token); self.assertEqual(status,200,(path,result))
            self.assertLessEqual(len(result['items']),50)
            for invalid in ['0','101','abc','1.5']:
                status,result=self.pb.request('GET',path+'?perPage='+invalid,token=self.token); self.assertEqual(status,400,(path,invalid,result))

    def test_relations_sort_with_permissions_and_navigation(self):
        company=self.pb.create('contacts_companies',{'name':'Autre société','active':True})
        person=self.pb.create('contacts_people',{'company':company['id'],'first_name':'Marie','last_name':'Tri','active':True})
        self.pb.create('contacts_company_roles',{'company':company['id'],'role':'customer','active':True})
        for kind,fields in [('companies',['phone','roles','status']),('people',['phone','company','roles','status','job_title'])]:
            for field in fields:
                for direction in ['asc','desc']:
                    status,result=self.pb.request('GET',f'horizon/contacts/groups?kind={kind}&group=none&sort={field}&direction={direction}',token=self.token)
                    self.assertEqual(status,200,(kind,field,result))
        status,restricted=self.pb.request('GET',f'horizon/contacts/groups?kind=people&group=none&sort=roles&company={company['id']}',token=self.token)
        self.assertEqual(status,200,restricted); self.assertEqual([row['id'] for row in restricted['items']],[person['id']])
        for context,sort in [('contacts.companies','roles:desc'),('contacts.people','job_title:asc')]:
            status,result=self.pb.request('POST','collections/core_saved_views/records',{'name':'Tri '+context,'context':context,'visibility':'personal','owner':self.user['id'],'params':{'sort':sort}},self.token)
            self.assertEqual(status,200,result); self.assertEqual(result['params']['sort'],sort)
        for field in ['type','company','stage','owner','market_types']:
            for prefix in ['', '-']:
                status,result=self.pb.request('GET','horizon/crm/list-index?sort='+prefix+field,token=self.token)
                self.assertEqual(status,200,result); self.assertIn(self.opp['id'],[item['id'] for item in result['items']])
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':['contacts.read']},self.pb.admin_token)
        self.assertEqual(self.pb.request('GET','horizon/crm/list-index?sort=company',token=self.token)[0],403)

    def test_stock_orders_rows_across_locations_before_pagination(self):
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':['inventory.read','inventory.write','inventory.stock.adjust','purchasing.read']},self.pb.admin_token)
        status,choices=self.pb.request('GET','horizon/inventory/stock/choices',token=self.token); self.assertEqual(status,200,choices)
        for index in range(16):
            status,item=self.create_product(key=f'stock-row-sort-{index:03d}',sku=f'STOCKSORT-{index:02d}',name=f'Stock {index:02d}',offers=[]); self.assertEqual(status,200,item)
            for place,quantity in [(choices['locations'][0]['id'],index+1),(choices['locations'][1]['id'],100-index)]:
                status,value=self.pb.request('POST','horizon/inventory/stock/adjust',{'product':item['id'],'location':place,'physical':quantity,'expected':0,'reason':'Tri des lignes','operation_key':f'stock-sort-{index:03d}-{place}'},self.token); self.assertEqual(status,200,value)
        values=[]
        for page in [1,2]:
            status,result=self.pb.request('GET',f'horizon/inventory/stock?q=STOCKSORT&availability=physical&sort=-physical&page={page}',token=self.token)
            self.assertEqual(status,200,result); self.assertEqual(result['totalItems'],32); self.assertEqual(result['totalPages'],2)
            values.extend(row['physical'] for row in result['items'])
        self.assertEqual(values,sorted(values,reverse=True)); self.assertEqual(len(values),32)
        self.assertEqual(values[:2],[100,99]); self.assertEqual(values[-2:],[2,1])

    def test_sort_before_pagination_with_stock_and_prices(self):
        created = []
        for index in range(27):
            status, item = self.create_product(key=f'sort-products-{index:05d}', sku=f'SORT-{index:02d}', name=f'Produit {26-index:02d}', reference_cost=index, offers=[])
            self.assertEqual(status, 200, item)
            created.append(item)
        for field in ['name', 'sku', 'manufacturer', 'category_label', 'unit_cost', 'unit_price', 'physical_quantity', 'available_quantity']:
            for prefix in ['', '-']:
                status, page = self.pb.request('GET', 'horizon/inventory/products?sort='+prefix+field+'&page=1', token=self.token)
                self.assertEqual(status, 200, page)
                self.assertEqual(page['totalItems'], 27)
                self.assertEqual(len(page['items']), 25)
        for sort, first, last in [('unit_cost',0,26), ('-unit_cost',26,0)]:
            _, one = self.pb.request('GET', 'horizon/inventory/products?sort='+sort, token=self.token)
            _, two = self.pb.request('GET', 'horizon/inventory/products?sort='+sort+'&page=2', token=self.token)
            rows=one['items']+two['items']
            self.assertEqual(rows[0]['pricing']['unit_cost'],first)
            self.assertEqual(rows[-1]['pricing']['unit_cost'],last)
            self.assertEqual(len({row['id'] for row in rows}),27)
        # The lookup remains unavailable without the catalogue permission.
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':[]},self.pb.admin_token)
        self.assertEqual(self.pb.request('GET','horizon/inventory/products?sort=-unit_cost',token=self.token)[0],403)



class ExpenseColumnSortingTests(unittest.TestCase):
    import check_expenses as fixtures
    setUp = fixtures.ExpensesTests.setUp
    call = fixtures.ExpensesTests.call
    report = fixtures.ExpensesTests.report
    def test_reviewer_and_status_use_visible_values(self):
        record=self.report()
        for field in ['validator','status']:
            for prefix in ['', '-']:
                status,result=self.call('GET','reports?sort='+prefix+field)
                self.assertEqual(status,200,result); self.assertEqual(result['items'][0]['id'],record['id'])

class TenderColumnSortingTests(unittest.TestCase):
    import check_tenders as fixtures
    setUp = fixtures.TenderTests.setUp
    create = fixtures.TenderTests.create
    def test_all_ao_columns_use_real_displayed_projections(self):
        status,record=self.create(standalone=True); self.assertEqual(status,200,record)
        for field in ['company','tags','visits','preparation','documents','owner']:
            for prefix in ['', '-']:
                status,result=self.pb.request('GET','horizon/crm/tenders?sort='+prefix+field,token=self.token)
                self.assertEqual(status,200,(field,result)); self.assertEqual(result['items'][0]['id'],record['id'])

if __name__ == '__main__': unittest.main()

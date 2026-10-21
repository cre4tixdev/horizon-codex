"""Quote content templates: migration, permissions, current pricing, snapshots and concurrency."""
import unittest
import check_catalog

class QuoteTemplateTests(unittest.TestCase):
    setUp = check_catalog.CatalogTests.setUp
    create_product = check_catalog.CatalogTests.create_product
    quote_save = check_catalog.CatalogTests.quote_save

    def admin(self):
        self.pb.request('PATCH','collections/core_users/records/'+self.user['id'],{'erp_profile':'admin'},self.pb.admin_token)
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':['inventory.read','inventory.write','sales.read','sales.write','crm.read','crm.write','contacts.read','settings.references']},self.pb.admin_token)

    def call(self, method, path='', data=None):
        return self.pb.request(method,'horizon/sales/quote-templates'+path,data,self.token)

    def model_input(self, lines=None):
        return {'label':'Installation type','description':'Préparation studio','currency':'EUR','content':{'title':'Installation audiovisuelle','notes':'Note commune','validity_days':45,'terms_id':'','discount':5,'discount_mode':'percent','lines':lines or [{'kind':'section','description':'Études','quantity':0,'unit':'','unit_price':0,'show_total':True}, {'description':'Prestation','quantity':2,'unit':'h','unit_price':100,'unit_cost':50,'price_source':'margin','margin_percent':100}]}}

    def test_management_permissions_allowlist_pagination_and_archive(self):
        self.assertEqual(self.pb.request('GET','horizon/sales/quote-templates')[0],401)
        data=self.model_input();payload={'creation_key':'quote-template-key-0001','input':data}
        self.assertEqual(self.call('POST','/save',payload)[0],403)
        self.admin()
        code,record=self.call('POST','/save',payload);self.assertEqual(code,200,record)
        self.assertEqual(len(record['content']['lines']),2)
        code,retry=self.call('POST','/save',payload);self.assertEqual(retry['id'],record['id'])
        self.assertEqual(self.pb.request('GET','collections/sales_quote_templates/records',token=self.token)[0],403)
        self.assertEqual(self.pb.request('POST','collections/sales_quote_templates/records',payload,self.token)[0],403)
        for field in ['company','contact','opportunity','owner','quote_number']:
            invalid=self.model_input();invalid['content'][field]='private'
            self.assertEqual(self.call('POST','/save',{'creation_key':'invalid-template-key1','input':invalid})[0],400)
        invalid=self.model_input();invalid['content']['lines'][1]['catalog_snapshot']={'private':'source'}
        self.assertEqual(self.call('POST','/save',{'creation_key':'invalid-template-key1','input':invalid})[0],400)
        code,saved=self.call('POST','/save',{'id':record['id'],'updated':record['updated'],'input':{**data,'label':'Modèle adapté'}});self.assertEqual(code,200,saved)
        self.assertEqual(self.call('POST','/save',{'id':record['id'],'updated':record['updated'],'input':data})[0],409)
        code,result=self.call('GET','?q=adapt%C3%A9&page=1');self.assertEqual(code,200,result);self.assertEqual(result['totalItems'],1)
        code,archived=self.call('POST','/state',{'id':record['id'],'updated':saved['updated'],'active':False});self.assertEqual(code,200,archived)
        self.assertEqual(self.call('GET')[1]['totalItems'],0);self.assertEqual(self.call('GET','?state=archived')[1]['totalItems'],1)
        self.pb.request('PATCH','collections/core_users/records/'+self.user['id'],{'erp_profile':'user'},self.pb.admin_token)
        self.assertEqual(self.call('GET','/'+record['id'])[0],404);self.assertEqual(self.call('GET','?state=archived')[0],403)
        self.admin();code,restored=self.call('POST','/state',{'id':record['id'],'updated':archived['updated'],'active':True});self.assertEqual(code,200,restored)
        # Pagination stays server-side; source content is not included in list DTOs.
        for index in range(26):
            self.assertEqual(self.call('POST','/save',{'creation_key':f'paginated-model-key-{index:04d}','input':{**data,'label':f'Modèle {index:02d}'}})[0],200)
        code,first=self.call('GET','?page=1');code,second=self.call('GET','?page=2')
        self.assertEqual(first['totalItems'],27);self.assertEqual(len(first['items']),25);self.assertEqual(len(second['items']),2)
        self.assertNotIn('content',first['items'][0]);self.assertFalse({r['id'] for r in first['items']} & {r['id'] for r in second['items']})
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':['settings.references']},self.pb.admin_token)
        self.assertEqual(self.call('GET')[0],403)
        audit=self.pb.request('GET','collections/core_audit/records?filter=entity="sales_quote_templates"',token=self.pb.admin_token)[1]
        self.assertGreaterEqual(audit['totalItems'],30)

    def test_prepare_current_catalog_rules_currency_and_concurrent_sources(self):
        self.admin()
        code,product=self.create_product(reference_cost=100,offers=[]);self.assertEqual(code,200,product)
        code,line=self.pb.request('POST','horizon/inventory/quote-line',{'product':product['id'],'currency':'EUR'},self.token);self.assertEqual(code,200,line)
        code,record=self.call('POST','/save',{'creation_key':'priced-template-key1','input':self.model_input([{**line,'quantity':2,'price_source':'margin','margin_percent':50},{**line,'quantity':1,'unit_price':250,'price_source':'manual','is_option':True}])});self.assertEqual(code,200,record)
        def change_cost(value, current):
            code,result=self.pb.request('POST','horizon/inventory/products/save',{'id':current['id'],'updated':current['updated'],'input':{**self.product,'reference_cost':value,'offers':[]}},self.token)
            self.assertEqual(code,200,result);return result
        product=change_cost(120,product)
        request={'id':record['id'],'opportunity':self.opp['id'],'quote_date':'2026-10-21'}
        code,preview=self.call('POST','/preview',request);self.assertEqual(code,200,preview)
        self.assertEqual(preview['issues'],[]);self.assertEqual(preview['input']['lines'][0]['unit_cost'],120)
        self.assertEqual(preview['input']['lines'][0]['unit_price'],180);self.assertEqual(preview['input']['lines'][1]['unit_price'],250)
        self.assertEqual(preview['input']['valid_until'],'2026-12-05');self.assertEqual(preview['subtotal'],342);self.assertEqual(preview['options_total'],250)
        self.assertNotIn('company',preview['input']);self.assertNotIn('owner',preview['input']);self.assertNotIn('contact',preview['input'])
        code,applied=self.call('POST','/preview',{**request,'token':preview['token']});self.assertEqual(code,200,applied)
        before=self.pb.request('GET','collections/sales_quotes/records',token=self.pb.admin_token)[1]['totalItems'];self.assertEqual(before,0)
        code,quote=self.quote_save(**preview['input']);self.assertEqual(code,200,quote)
        self.assertEqual(quote['company'],self.opp['company']);self.assertEqual(quote['analytic_account'],self.opp['analytic_account'])
        self.assertEqual(quote['lines'][0]['unit_cost'],120);self.assertEqual(quote['status'],'draft')
        product=change_cost(130,product)
        self.assertEqual(self.call('POST','/preview',{**request,'token':preview['token']})[0],409)
        self.assertEqual(self.quote_save(key='outdated-template-key',**preview['input'])[0],409)
        code,current=self.call('POST','/preview',request);self.assertEqual(code,200,current)
        changed=self.model_input(record['content']['lines']);changed['content']['title']='Titre revu'
        code,record=self.call('POST','/save',{'id':record['id'],'updated':record['updated'],'input':changed});self.assertEqual(code,200,record)
        self.assertEqual(self.call('POST','/preview',{**request,'token':current['token']})[0],409)
        code,terms_model=self.call('POST','/save',{'creation_key':'retired-terms-key-001','input':{**self.model_input(),'content':{**self.model_input()['content'],'terms_id':'retired-terms'}}});self.assertEqual(code,200,terms_model)
        code,terms_preview=self.call('POST','/preview',{**request,'id':terms_model['id']});self.assertEqual(code,200,terms_preview);self.assertIn('conditions de vente',terms_preview['issues'][0]['message'])
        # Archived product blocks use rather than silently using the stored cost.
        self.pb.request('PATCH','collections/inventory_products/records/'+product['id'],{'active':False},self.pb.admin_token)
        code,blocked=self.call('POST','/preview',request);self.assertEqual(code,200,blocked);self.assertEqual(len(blocked['issues']),2)
        self.assertIn('indisponible',blocked['issues'][0]['message'])
        self.assertEqual(self.call('POST','/preview',{**request,'quote_date':'2026-02-31'})[0],400)
        code,other=self.call('POST','/save',{'creation_key':'foreign-template-key','input':{**self.model_input(),'currency':'USD'}});self.assertEqual(code,200,other)
        self.assertEqual(self.call('POST','/preview',{**request,'id':other['id']})[0],400)
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':['sales.read','sales.write','crm.read']},self.pb.admin_token)
        self.assertEqual(self.call('POST','/preview',request)[0],403)

if __name__ == '__main__': unittest.main(verbosity=2)

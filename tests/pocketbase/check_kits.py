"""Kits: catalogue composition, draft pricing, operational quantities and historical print choice."""
import unittest
import check_catalog
import check_documents
import re

class KitTests(unittest.TestCase):
    setUp = check_catalog.CatalogTests.setUp
    create_product = check_catalog.CatalogTests.create_product
    quote_save = check_catalog.CatalogTests.quote_save
    def setup_kit(self):
        code,child=self.create_product(reference_cost=10,offers=[]);self.assertEqual(code,200,child)
        code,other=self.create_product(key='kit-second-component1',sku='KIT-COMP-SECOND',name='Écran de contrôle',reference_cost=25,offers=[]);self.assertEqual(code,200,other)
        self.child=child;self.other=other
        self.kit_input={**self.product,'sku':'KIT-REGIE','name':'Régie mobile','composition_mode':'kit','purchase_enabled':False,'stock_policy':'none','tracking':'none','offers':[],'reference_cost':0,'components':[{'product':child['id'],'quantity':2},{'product':other['id'],'quantity':1}],'kit_price_mode':'fixed','kit_sale_price':100,'kit_print_details':False}
        code,self.kit=self.create_product(key='kit-parent-product01',**self.kit_input);self.assertEqual(code,200,self.kit)
        return self.kit
    def quote_lines(self, quantity=2):
        code,value=self.pb.request('POST','horizon/inventory/quote-line',{'product':self.kit['id'],'offer':'','currency':'EUR'},self.token);self.assertEqual(code,200,value)
        children=value.pop('kit_lines');return [{**value,'kind':'item','quantity':quantity},*children]
    def test_catalogue_kits_prefix_cycles_and_permissions(self):
        kit=self.setup_kit();self.assertEqual(kit['composition_mode'],'kit');self.assertEqual(kit['pricing']['unit_cost'],45);self.assertEqual(kit['pricing']['unit_price'],100)
        self.assertEqual(len(kit['components']),2)
        code,kits=self.pb.request('GET','horizon/inventory/products?composition_mode=kit&sale_enabled=true',token=self.token);self.assertEqual(code,200,kits);self.assertEqual(kits['totalItems'],1);self.assertEqual([row['id'] for row in kits['items']],[kit['id']])
        code,simple=self.pb.request('GET','horizon/inventory/products?composition_mode=none&sale_enabled=true',token=self.token);self.assertEqual(code,200,simple);self.assertEqual(simple['totalItems'],2);self.assertNotIn(kit['id'],[row['id'] for row in simple['items']])
        self.assertEqual(self.pb.request('GET','horizon/inventory/products?composition_mode=kit&page=2&perPage=1',token=self.token)[1]['items'],[])
        self.assertEqual(self.pb.request('GET','horizon/inventory/products?composition_mode=assembly',token=self.token)[0],400)
        self.assertEqual(self.pb.request('GET','collections/inventory_product_components/records',token=self.token)[0],403)
        self.assertEqual(self.pb.request('POST','horizon/inventory/kits/settings',{'prefix':'ENS-','updated':''},self.token)[0],403)
        for changes in [{'components':[{'product':self.child['id'],'quantity':1},{'product':self.child['id'],'quantity':2}]},{'components':[{'product':kit['id'],'quantity':1}]},{'purchase_enabled':True},{'stock_policy':'stocked'},{'sku':'BAD-PREFIX'},{'components':[]}]:
            code,result=self.pb.request('POST','horizon/inventory/products/save',{'id':kit['id'],'updated':kit['updated'],'input':{**self.kit_input,**changes}},self.token);self.assertEqual(code,400,result)
        code,otherkit=self.create_product(key='nested-kit-parent001',**{**self.kit_input,'sku':'KIT-OTHER'});self.assertEqual(code,200,otherkit)
        code,result=self.pb.request('POST','horizon/inventory/products/save',{'id':kit['id'],'updated':kit['updated'],'input':{**self.kit_input,'components':[{'product':otherkit['id'],'quantity':1}]}},self.token);self.assertEqual(code,400,result)
        self.pb.request('PATCH','collections/core_users/records/'+self.user['id'],{'erp_profile':'admin'},self.pb.admin_token)
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':['inventory.read','inventory.write','sales.read','sales.write','crm.read','crm.write','settings.references']},self.pb.admin_token)
        code,settings=self.pb.request('GET','horizon/inventory/kits/settings',token=self.token);self.assertEqual(code,200,settings)
        code,changed=self.pb.request('POST','horizon/inventory/kits/settings',{'prefix':'ENS-','updated':settings['updated']},self.token);self.assertEqual(code,200,changed)
        self.assertEqual(self.pb.request('GET','horizon/inventory/products/'+kit['id'],token=self.token)[1]['sku'],'KIT-REGIE')
        code,saved=self.pb.request('POST','horizon/inventory/products/save',{'id':kit['id'],'updated':kit['updated'],'input':{**self.kit_input,'description':'Modifié'}},self.token);self.assertEqual(code,200,saved)
        self.assertEqual(self.create_product(key='new-prefix-kit-key01',**{**self.kit_input,'sku':'KIT-NOT-NEW'})[0],400)
        self.assertEqual(self.create_product(key='new-prefix-kit-key02',**{**self.kit_input,'sku':'ENS-NEW'})[0],200)
        content={'title':'Installation kit','notes':'','validity_days':30,'terms_id':'','discount':0,'discount_mode':'percent','lines':self.quote_lines()}
        code,model=self.pb.request('POST','horizon/sales/quote-templates/save',{'creation_key':'kit-template-key0001','input':{'label':'Kit réutilisable','description':'','currency':'EUR','content':content}},self.token);self.assertEqual(code,200,model)
        code,preview=self.pb.request('POST','horizon/sales/quote-templates/preview',{'id':model['id'],'opportunity':self.opp['id'],'quote_date':'2026-10-21'},self.token);self.assertEqual(code,200,preview);self.assertEqual(preview['issues'],[])
        self.assertEqual(preview['subtotal'],200);self.assertEqual(preview['input']['lines'][0]['unit_cost'],45);self.assertEqual(preview['input']['lines'][1]['kit_parent'],preview['input']['lines'][0]['kit_key'])
    def test_quote_kit_single_totals_edit_and_operational_children(self):
        self.setup_kit();lines=self.quote_lines()
        code,quote=self.quote_save(lines=lines);self.assertEqual(code,200,quote)
        self.assertEqual(quote['subtotal'],200);self.assertEqual(quote['cost_total'],90);self.assertEqual(quote['total'],240)
        self.assertEqual([r['quantity'] for r in quote['lines']],[2,4,2]);self.assertEqual([r['line_total'] for r in quote['lines']],[200,0,0])
        self.assertEqual(quote['lines'][0]['kit_key'],quote['lines'][1]['kit_parent'])
        role=self.pb.create('core_roles',{'name':'kit_print_role','label':'Kit PDF','active':True,'permissions':['settings.references','documents.template.manage','sales.read']})
        self.pb.create_user('kit-print@local.invalid',role['id'],profile='superuser')
        manager=self.pb.login('kit-print@local.invalid')[1]['token']
        code,hidden=self.pb.request('POST','horizon/documents/preview',{'quote_id':quote['id'],'content_json':check_documents.layout(),'format':'html'},manager);self.assertEqual(code,200,hidden)
        self.assertNotIn('Écran de contrôle',hidden['html']);self.assertNotIn('<tr class="kit-component">',hidden['html'])
        edited=[dict(row) for row in quote['lines']];edited[1]['kit_quantity']=3;edited[1]['unit_cost']=12;edited[0]['kit_print_details']=True
        code,saved=self.pb.request('POST','horizon/sales/quotes/save',{'id':quote['id'],'updated':quote['updated'],'input':{**self.quote,'lines':edited}},self.token);self.assertEqual(code,200,saved)
        self.assertEqual(saved['cost_total'],122);self.assertEqual(saved['subtotal'],200);self.assertEqual(saved['lines'][1]['quantity'],6)
        self.assertEqual(self.pb.request('GET','horizon/inventory/products/'+self.kit['id'],token=self.token)[1]['components'][0]['quantity'],2)
        code,shown=self.pb.request('POST','horizon/documents/preview',{'quote_id':saved['id'],'content_json':check_documents.layout(),'format':'html'},manager);self.assertEqual(code,200,shown)
        self.assertIn('Écran de contrôle',shown['html'])
        printed=re.findall(r'<tr class="kit-component">(.*?)</tr>',shown['html'],re.S);self.assertEqual(len(printed),2)
        for row in printed:
            self.assertNotIn('€',row);self.assertNotIn('↳',row);self.assertIn('font-style:italic;',row);self.assertIn('kit-description',row)
        self.assertNotIn('data-kit-last',printed[0]);self.assertIn('data-kit-last="true"',printed[1])
        self.assertIn('kit-description::before',shown['html']);self.assertIn('kit-description::after',shown['html'])
        code,product=self.pb.request('POST','horizon/inventory/products/save',{'id':self.child['id'],'updated':self.child['updated'],'input':{**self.product,'reference_cost':20,'offers':[]}},self.token);self.assertEqual(code,200,product)
        self.assertEqual(self.pb.request('GET','horizon/sales/quotes/'+saved['id'],token=self.token)[1]['cost_total'],122)
        code,refreshed=self.pb.request('POST','horizon/sales/quotes/cost-preview',{'id':saved['id'],'updated':saved['updated'],'opportunity':self.opp['id'],'lines':saved['lines'],'discount':0,'discount_mode':'percent','mode':'price','selected':[1]},self.token);self.assertEqual(code,200,refreshed)
        self.assertEqual(len(refreshed['rows']),2);self.assertEqual(refreshed['lines'][0]['unit_cost'],85);self.assertEqual(refreshed['lines'][0]['unit_price'],100)
        scoped={'id':saved['id'],'updated':saved['updated'],'opportunity':self.opp['id'],'lines':saved['lines']+self.quote_lines(),'discount':0,'discount_mode':'percent','mode':'price','scope':0}
        code,kit_refresh=self.pb.request('POST','horizon/sales/quotes/cost-preview',{**scoped,'selected':[1]},self.token);self.assertEqual(code,200,kit_refresh)
        self.assertEqual([row['index'] for row in kit_refresh['rows']],[1,2]);self.assertEqual(kit_refresh['lines'][0]['unit_cost'],85);self.assertEqual(kit_refresh['lines'][0]['unit_price'],100)
        self.assertEqual(kit_refresh['lines'][3]['unit_cost'],65)
        self.assertEqual(self.pb.request('POST','horizon/sales/quotes/cost-preview',{**scoped,'selected':[4]},self.token)[0],400)
        code,child_refresh=self.pb.request('POST','horizon/sales/quotes/cost-preview',{**scoped,'scope':1},self.token);self.assertEqual(code,200,child_refresh);self.assertEqual([row['index'] for row in child_refresh['rows']],[1])
        broken=[dict(row) for row in saved['lines']];broken[1]['kit_parent']='unknown-parent-group1'
        self.assertEqual(self.quote_save(key='broken-kit-quote0001',lines=broken)[0],400)
        # Confirm through the ordinary workflow: native component rows become operational sources.
        rights=['inventory.read','inventory.write','inventory.stock.reserve','sales.read','sales.write','sales.quote.validate','sales.order.confirm','crm.read','crm.write','contacts.read','purchasing.read','purchasing.write','billing.read','billing.write']
        self.pb.request('PATCH','collections/core_roles/records/'+self.user['role'],{'permissions':rights},self.pb.admin_token)
        code,final=self.pb.request('POST','horizon/sales/quotes/finalize',{'id':saved['id'],'updated':saved['updated']},self.token);self.assertEqual(code,200,final)
        code,confirmed=self.pb.request('POST','horizon/sales/quotes/confirm',{'id':final['id'],'updated':final['updated'],'customer_order_number':'1234','awaiting_customer_order':False},self.token);self.assertEqual(code,200,confirmed)
        order=confirmed['order']['id']
        rows=self.pb.request('GET','collections/sales_order_lines/records?filter=order="'+order+'"&sort=position',token=self.pb.admin_token)[1]['items']
        self.assertEqual([r['quantity'] for r in rows],[2,6,2]);self.assertEqual(rows[1]['kit_parent'],rows[0]['kit_key'])
        self.assertEqual(confirmed['subtotal'],200)
        code,needs=self.pb.request('GET','horizon/purchasing/needs/'+confirmed['id'],token=self.token);self.assertEqual(code,200,needs)
        self.assertEqual([r['sold_quantity'] for r in needs['lines']],[6,2]);self.assertNotIn(self.kit['id'],[r['product'] for r in needs['lines']])
        code,delivery=self.pb.request('GET','horizon/inventory/operations/source?kind=OUT&sales_quote='+confirmed['id'],token=self.token);self.assertEqual(code,200,delivery)
        self.assertEqual([r['quantity'] for r in delivery['lines']],[6,2]);self.assertNotIn(self.kit['id'],[r['product'] for r in delivery['lines']])
        code,invoice=self.pb.request('POST','horizon/billing/documents/prepare',{'kind':'customer','source_type':'order','source_ids':[confirmed['id']],'mode':'standard'},self.token);self.assertEqual(code,200,invoice)
        self.assertEqual(len(invoice['lines']),1);self.assertEqual(invoice['lines'][0]['product'],self.kit['id']);self.assertEqual(invoice['lines'][0]['quantity'],2)
        revision={**self.quote,'terms_id':confirmed['terms_id'],'discount':confirmed['discount'],'discount_mode':confirmed['discount_mode'],'owner':confirmed['owner'],'contact':confirmed['contact'],'lines':[dict(row) for row in confirmed['lines']]}
        revision['lines'][0]['quantity']=1
        payload={'id':confirmed['id'],'updated':confirmed['updated'],'input':revision,'customer_order_number':'1234'}
        code,plan=self.pb.request('POST','horizon/sales/orders/revision-preview',payload,self.token);self.assertEqual(code,200,plan);self.assertEqual(plan['blocks'],[])
        code,revised=self.pb.request('POST','horizon/sales/orders/revise',{**payload,'preview_token':plan['token']},self.token);self.assertEqual(code,200,revised)
        self.assertEqual(revised['subtotal'],100);self.assertEqual([row['quantity'] for row in revised['lines']],[1,3,1])
        code,delivery=self.pb.request('POST','horizon/inventory/operations/prepare-delivery',{'sales_quote':confirmed['id'],'warehouse':''},self.token);self.assertEqual(code,200,delivery)
        self.assertEqual([row['quantity'] for row in delivery['lines']],[3,1]);self.assertNotIn(self.kit['id'],[row['product'] for row in delivery['lines']])


if __name__=='__main__':unittest.main(verbosity=2)

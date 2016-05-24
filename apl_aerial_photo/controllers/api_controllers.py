from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import json

class data_json(http.Controller):
    @http.route('/apiv1/photo/count', type="json", auth="public", csrf=False)
    def api_v1_photo_count(self, *arg, **post):
        print 'GET json data (APL_IDS)'
        cr, uid, context = request.cr, request.uid, request.context
        photo_obj=request.registry['uis.ap.photo']
        #data = json.loads(request.jsonrequest)
        data=json.loads(json.dumps(request.jsonrequest))
        clean_ids=[]
        for s in data['apl_ids']:
            try:
                i=int(s)
                clean_ids.append(i)
                print i
            except ValueError:
                pass
        domain=[("near_apl_ids.apl_id","in",clean_ids)]
        domain=[]
        p_id=[]
        photo_ids=photo_obj.search(cr, uid, domain, context=context)
        
        count_data={
            "count":0
        }
        for ph in photo_obj.browse(cr, uid, photo_ids, context=context):
            for nai in ph.near_apl_ids:
                if nai.id in clean_ids:
                    p_id.append(ph.id)
        
        
        for ph in photo_obj.browse(cr,uid,p_id,context=context):
            count_data["count"]=count_data["count"]+1
            
        values = {
            #'partner_url': post.get('partner_url'),
            'count_data': json.dumps(count_data)
        }
        return values
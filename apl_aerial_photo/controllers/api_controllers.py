from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import json

class data_json(http.Controller):
    @http.route('/apiv1/photo/data', type="json", auth="public", csfr=False)
    def api_v1_photo_data(self, *arg, **post):
        print 'GET json data (PHOTO)'
        cr, uid, context=request.cr, request.uid, request.context
        photo_obj=request.registry['uis.ap.photo']
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
      
        photo_data={
            "count":0,
            "photos":[]
            
        }
        for ph in photo_obj.browse(cr, uid, photo_ids, context=context):
            for nai in ph.near_apl_ids:
                if nai.id in clean_ids:
                    p_id.append(ph.id)
        
        for ph in photo_obj.browse(cr,uid,p_id,context=context).sorted(key=lambda r:r.image_date):
            photo_data["count"]=photo_data["count"]+1
            pill_data={
                "count":0,
                "pillars":[]
            }
            for pil in ph.near_pillar_ids:
                pill_data["count"]=pill_data["count"]+1
                pill_data["pillars"].append({
                    'id':pil.id,
                    'num_by_vl':pil.num_by_vl
                    })
            photo_data["photos"].append({
                'id':ph.id,
                'lat':ph.latitude,
                'long':ph.longitude,
                'alt':ph.altitude,
                'thumbnail':'/web/image?model=uis.ap.photo&id='+str(ph.id)+'&field=thumbnail',
                'url_image':'/web/image?model=uis.ap.photo&id='+str(ph.id)+'&field=image',
                'rotation':ph.rotation,
                'pillar_data':pill_data
            })
            
        values ={
            'photo_data':json.dumps(photo_data)
        }
        return values
            
    @http.route('/apiv1/photo/count', type="json", auth="public", csrf=False)
    def api_v1_photo_count(self, *arg, **post):
        print 'GET json data (APL_IDS)'
        cr, uid, context = request.cr, request.uid, request.context
        photo_obj=request.registry['uis.ap.photo']
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
        print photo_ids
        
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
    
    @http.route('/apiv1/photo/photo_count_hash',type="json", auth="public", csfr=False)
    def api_v1_photo_count_hash(self, *arg, **post):
        print 'GET(POST) json data PHOTO_COUNT_HASH'
        cr, uid, context = request.cr, request.uid, request.context
        photo_obj=request.registry['uis.ap.photo']
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
        print photo_ids
        out=hash(str(photo_ids))
        hash_data={
            "photo_count_hash":out
        }
        values ={
            'res':json.dumps(hash_data)
        }
        return values
from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import json

class data_json(http.Controller):
    @http.route('/apiv1/data/scheme/pillardata', type="json", auth="public", csrf=False)
    def scheme_pillar_data(self, *arg, **post):
        print 'GET json data (SCHEME/PILLARDATA)'
        cr, uid, context = request.cr, request.uid, request.context
        apl_obj=request.registry['uis.papl.apl']
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
        domain=[("id","in",clean_ids)]
        apl_ids=apl_obj.search(cr, uid, domain, context=context)
        
        ps_data={
            "counter":0,
            "ps":[]
        }
        pillar_data={
            "counter":0,
            "counter_main":0,
            "pillars":[]
        }
        pillar_links={
            "counter":0,
            "links":[]
        }
        trans_data={
            "counter":0,
            "transformers":[]
        }
    
        for apl_id in apl_obj.browse(cr, uid, apl_ids, context=context):
            apl_pillar_ids=apl_id.pillar_id
            apl_pillar_ids=apl_pillar_ids.sorted(key=lambda r:r.num_by_vl)
            if apl_pillar_ids[0]:
                pillar_data["counter"]=pillar_data["counter"]+1;
                pillar_data["pillars"].append({
                        'id':apl_pillar_ids[0].id,
                        'sid':'P'+str(apl_pillar_ids[0].id),
                        'name':apl_pillar_ids[0].name,
                        'num_by_vl':apl_pillar_ids[0].num_by_vl,
                        'start_tap_id':0,
                        'start_tap':0,
                        'y_shift':0
                    })
                pp=apl_pillar_ids[0]
            tap_ids=apl_id.tap_ids
            s_tap_ids=tap_ids.sorted(key=lambda r:r.num_by_vl)
            for tap in s_tap_ids:
                print tap.name
                if tap.conn_pillar_id:
                    pillar_data["counter"]=pillar_data["counter"]+1
                    pillar_data["counter_main"]=pillar_data["counter_main"]+1
                    pillar_data["pillars"].append({
                        'id':tap.conn_pillar_id.id,
                        'sid':'P'+str(tap.conn_pillar_id.id),
                        'name':tap.conn_pillar_id.name,
                        'num_by_vl':tap.conn_pillar_id.num_by_vl,
                        'start_tap_id':tap.id,
                        'start_tap':tap.num_by_vl,
                        'y_shift':0
                    })
                    tap_pillar_ids=tap.pillar_ids
                    s_tap_pillar_ids=tap_pillar_ids.sorted(key=lambda r:r.num_by_vl, reverse=True)
                    if s_tap_pillar_ids[0]:
                        y_shift=-1
                        if (tap.num_by_vl//2)*2-tap.num_by_vl<0:
                            y_shift=1
                        pillar_data["counter"]=pillar_data["counter"]+1
                        pillar_data["pillars"].append({
                            'id':s_tap_pillar_ids[0].id,
                            'sid':'P'+str(s_tap_pillar_ids[0].id),
                            'name':s_tap_pillar_ids[0].name,
                            'num_by_vl':s_tap_pillar_ids[0].num_by_vl,
                            'start_tap_id':tap.id,
                            'start_tap':tap.num_by_vl,
                            'y_shift':y_shift
                        })
                        pillar_links["counter"]=pillar_links["counter"]+1
                        pillar_links["links"].append({
                            'source_id':'P'+str(tap.conn_pillar_id.id),
                            'target_id':'P'+str(s_tap_pillar_ids[0].id)
                        })
                    if pp:
                        pillar_links["counter"]=pillar_links["counter"]+1
                        pillar_links["links"].append({
                            'source_id':'P'+str(pp.id),
                            'target_id':'P'+str(tap.conn_pillar_id.id)
                        })
                    pp=tap.conn_pillar_id
            apl_pillar_ids=apl_pillar_ids.sorted(key=lambda r:r.num_by_vl, reverse=True)
            if apl_pillar_ids[0]:
                pillar_data["counter"]=pillar_data["counter"]+1;
                pillar_data["pillars"].append({
                        'id':apl_pillar_ids[0].id,
                        'sid':'P'+str(apl_pillar_ids[0].id),
                        'name':apl_pillar_ids[0].name,
                        'num_by_vl':apl_pillar_ids[0].num_by_vl,
                        'start_tap_id':0,
                        'start_tap':pillar_data["counter_main"]+1,
                        'y_shift':0
                    })
            if pp:
                pillar_links["counter"]=pillar_links["counter"]+1
                pillar_links["links"].append({
                    'source_id':'P'+str(pp.id),
                    'target_id':'P'+str(apl_pillar_ids[0].id)
                })
            for trans in apl_id.transformer_ids:
                y_shift=-2
                if (trans.tap_id.num_by_vl//2)*2-trans.tap_id.num_by_vl<0:
                            y_shift=2
                trans_data["counter"]=trans_data["counter"]+1
                trans_data["transformers"].append({
                    'id':trans.id,
                    'sid':'T'+str(trans.id),
                    'name':trans.name,
                    'tap':trans.tap_id.num_by_vl,
                    'y_shift':y_shift
                })
                if trans.pillar_id:
                    pillar_links["counter"]=pillar_links["counter"]+1
                    pillar_links["links"].append({
                        'source_id':'P'+str(trans.pillar_id.id),
                        'target_id':'T'+str(trans.id)
                    })
        values = {
            #'partner_url': post.get('partner_url'),
            'ps_data': json.dumps(ps_data),
            'pillar_data':json.dumps(pillar_data),
            'pillar_links':json.dumps(pillar_links),
            'trans_data':json.dumps(trans_data)
        }
        return values
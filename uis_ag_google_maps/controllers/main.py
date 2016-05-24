# -*- coding: utf-8 -*-

#import json
#from openerp import SUPERUSER_ID
#rom openerp.addons.web import http
#from openerp.addons.web.http import request
#from openerp.tools import html_escape as escape

from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import json

class pillar_google_map(http.Controller):
    '''
    This class generates on-the-fly partner maps that can be reused in every
    website page. To do so, just use an ``<iframe ...>`` whose ``src``
    attribute points to ``/google_map`` (this controller generates a complete
    HTML5 page).

    URL query parameters:
    - ``partner_ids``: a comma-separated list of ids (partners to be shown)
    - ``partner_url``: the base-url to display the partner
        (eg: if ``partner_url`` is ``/partners/``, when the user will click on
        a partner on the map, it will be redirected to <myodoo>.com/partners/<id>)

    In order to resize the map, simply resize the ``iframe`` with CSS
    directives ``width`` and ``height``.
    '''
    @http.route('/sp', auth='public')
    def save_new_point(self, *arg, **post):
        print 'Getting /sp'
        cr,uid,context=request.cr,request.uid, request.context
        pillar_obj=request.registry['uis.papl.pillar']
        g_pillar_id=post.get('id',"")
        g_pillar_lat=post.get('nltd',"")
        g_pillar_lng=post.get('nlng',"")
        domain=[("id","=",g_pillar_id)]
        pillar_id=pillar_obj.search(cr,uid,domain, context=context)
        print pillar_id
        for record in pillar_obj.browse(cr, uid, pillar_id, context=context):
            #print record.name
            record.latitude=g_pillar_lat
            record.longitude=g_pillar_lng
    
    @http.route('/st', auth='public')
    def save_new_trans_point(self, *arg, **post):
        print 'Getting /st'
        cr,uid,context=request.cr,request.uid, request.context
        trans_obj=request.registry['uis.papl.transformer']
        g_trans_id=post.get('id',"")
        g_trans_lat=post.get('nltd',"")
        g_trans_lng=post.get('nlng',"")
        domain=[("id","=",g_trans_id)]
        trans_id=trans_obj.search(cr,uid,domain, context=context)
        print trans_id
        for record in trans_obj.browse(cr, uid, trans_id, context=context):
            print record.name
            record.latitude=g_trans_lat
            record.longitude=g_trans_lng
            
    @http.route('/map',auth='public')
    def map(self,*arg,**post):
        print "Map Service v2"
        cr,uid,context=request.cr, request.uid, request.context
        isss=0
        isapl=0
        istap=0
        ispillar=0
        
    
    @http.route('/apl_map', auth='public')
    def apl_map(self, *arg, **post):
        print "Start Create maps"
        cr, uid, context = request.cr, request.uid, request.context
        pillar_obj = request.registry['uis.papl.pillar']
        apl_obj=request.registry['uis.papl.apl']
        trans_obj=request.registry['uis.papl.transformer']
        values=""
        clean_ids=[]
        for s in post.get('apl_ids',"").split(","):
            try:
                i=int(s)
                clean_ids.append(i)
                print i
            except ValueError:
                pass
        domain=[("id","in",clean_ids)]
        apl_ids=apl_obj.search(cr, uid, domain, context=context)
        #apl_ids=apl_obj.search(cr, SUPERUSER_ID, domain, context=context)
        pillar_data={
            "counter":0,
            "latitude":0,
            "longitude":0,
            "pillars":[]
        }
        lines_data={
            "counter":0,
            "taps":[]
        }
        ktp_data={
            "counter":0,
            "trans":[]
        }
        s_data={
            "counter":0
        }
        minlat=120
        maxlat=0
        minlong=120
        maxlong=0
        for apl_id in apl_obj.browse(cr, uid, apl_ids, context=context):
            print apl_id.name
            apl_id.pillar_id.sorted(key=lambda r: r.num_by_vl)
            for tap in apl_id.tap_ids:
                lines_data["counter"]=lines_data["counter"]+1
                line={
                    "counter":0,
                    "type":0,
                    "coord":[]
                }
                elevation={
                    "counter":0,
                    "values":[]
                }
                max_num=0
                for pillar in tap.pillar_ids:
                    if pillar.num_by_vl>max_num:
                        max_num=pillar.num_by_vl
                        end_pillar=pillar
                i=0
                np=end_pillar
                n_id=np.id
                pillar_cnt=tap.pillar_cnt
                print tap.name+"_"+str(pillar_cnt)
                while (n_id>0) and (pillar_cnt-i>=0):
                    print np.name
                    line["counter"]=line["counter"]+1
                    line["coord"].append({
                        'ltd':np.latitude,
                        'lng':np.longitude
                    })
                    elevation["counter"]=elevation["counter"]+1
                    elevation["values"].append({
                        'x':np.num_by_vl,
                        'elevation':np.elevation
                    })
                    np=np.parent_id
                    n_id=np.id
                    i=i+1
                    print i
                lines_data["taps"].append({
                    'id':tap.id,
                    'name': tap.name,
                    'apl':apl_id.name,
                    'apl_id':apl_id.name,
                    'line':line,
                    'elevation':elevation,
                })
                
            for pillar_id in apl_id.pillar_id:
                #print "Do pillar"+pillar_id.name
                pillar_data["counter"]=pillar_data["counter"]+1
                if pillar_id.latitude>maxlat:
                    maxlat=pillar_id.latitude
                if pillar_id.latitude<minlat:
                    minlat=pillar_id.latitude
                if pillar_id.longitude>maxlong:
                    maxlong=pillar_id.longitude
                if pillar_id.longitude<minlong:
                    minlong=pillar_id.longitude
                pillar_data["pillars"].append({
                    'id':pillar_id.id,
                    'name':pillar_id.name,
                    'apl':apl_id.name,
                    'apl_id':apl_id.id,
                    'tap_id':pillar_id.tap_id.id,
                    'elevation':pillar_id.elevation,
                    'latitude': escape(str(pillar_id.latitude)),
                    'longitude': escape(str(pillar_id.longitude)),
                    'num_by_vl':pillar_id.num_by_vl,
                    'prev_id':pillar_id.parent_id.id,
                    #'prevlatitude': escape(str(pillar_id.prev_latitude)),
                    #'prevlangitude': escape(str(pillar_id.prev_longitude))
                    })
            domain=[("apl_id","=",apl_id.id)]
            trans_ids=trans_obj.search(cr, uid, domain, context=context)
            for trans in trans_obj.browse(cr, uid, trans_ids, context=context):
                print trans.name
                ktp_data["counter"]=ktp_data["counter"]+1
                ktp_data["trans"].append({
                    'id':trans.id,
                    'name':trans.name,
                    'apl':trans.apl_id.name,
                    'apl_id':trans.apl_id.id,
                    'tap_id':trans.tap_id.id,
                    'state':trans.state,
                    'latitude': escape(str(trans.latitude)),
                    'longitude': escape(str(trans.longitude)),
                })
        medlat=(maxlat+minlat)/2
        medlong=(maxlong+minlong)/2
        pillar_data["latitude"]=medlat
        pillar_data["longitude"]=medlong
        values = {
            #'partner_url': post.get('partner_url'),
            'pillar_data': json.dumps(pillar_data),
            'lines_data': json.dumps(lines_data),
            'ktp_data': json.dumps(ktp_data),
            'apl_ids':json.dumps(clean_ids)
        }
        return request.render("uis_ag_google_maps.uis_google_map", values)
'''

        # search for partners that can be displayed on a map
        domain = [("id", "in", clean_ids), ('website_published', '=', True), ('is_company', '=', True)]
        partners_ids = partner_obj.search(cr, SUPERUSER_ID, domain, context=context)

        # browse and format data
        partner_data = {
        "counter": len(partners_ids),
        "partners": []
        }
        request.context.update({'show_address': True})
        for partner in partner_obj.browse(cr, SUPERUSER_ID, partners_ids, context=context):
            # TODO in master, do not use `escape` but `t-esc` in the qweb template.
            partner_data["partners"].append({
                'id': partner.id,
                'name': escape(partner.name),
                'address': escape('\n'.join(partner.name_get()[0][1].split('\n')[1:])),
                'latitude': escape(str(partner.partner_latitude)),
                'longitude': escape(str(partner.partner_longitude)),
                })

        # generate the map
        values = {
            'partner_url': post.get('partner_url'),
            'partner_data': json.dumps(partner_data)
        }
        return request.website.render("website_google_map.google_map", values)
'''
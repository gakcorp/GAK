# -*- coding: utf-8 -*-
from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import json

class maps_data_json(http.Controller):
    @http.route('/apiv1/pillar/newcoord', type="json", auth="public", csfr=False)
    def api_v1_pillar_data(self, *arg, **post):
        print 'POST Newcoord json data (PILLAR)'
        cr, uid, context=request.cr, request.uid, request.context
        pillar_obj = request.registry['uis.papl.pillar']
        data=json.loads(json.dumps(request.jsonrequest))
        pid=data['pillar_id']
        new_latitude=data['new_latitude']
        new_longitude=data['new_longitude']
        domain=[("id","in",[pid])]
        pillar_ids=pillar_obj.search(cr, uid, domain, context=context)
        for pil in pillar_obj.browse(cr, uid, pillar_ids, context=context):
            pil.latitude=new_latitude
            pil.longitude=new_longitude
        values ={
            'result':1
        }
        return values
    
    @http.route('/apiv1/pillar/data', type="json", auth="public", csfr=False)
    def api_v1_pillar_data(self, *arg, **post):
        print 'GET json data (PILLAR)'
        cr, uid, context=request.cr, request.uid, request.context
        pillar_obj = request.registry['uis.papl.pillar']
        apl_obj=request.registry['uis.papl.apl']
        data=json.loads(json.dumps(request.jsonrequest))
        clean_ids=[]
        for s in data['apl_ids']:
            try:
                i=int(s)
                clean_ids.append(i)
                print i
            except ValueError:
                pass
        pillar_data={
            "counter":0,
            "latitude":0,
            "longitude":0,
            "pillars":[]
        }
        minlat=120
        maxlat=0
        minlong=120
        maxlong=0
        domain=[("id","in",clean_ids)]
        apl_ids=apl_obj.search(cr, uid, domain, context=context)
        for apl_id in apl_obj.browse(cr, uid, apl_ids, context=context):
            apl_id.pillar_id.sorted(key=lambda r: r.num_by_vl)
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
        medlat=(maxlat+minlat)/2
        medlong=(maxlong+minlong)/2
        pillar_data["latitude"]=medlat
        pillar_data["longitude"]=medlong
        pillar_data["minlat"]=minlat
        pillar_data["maxlat"]=maxlat
        pillar_data["minlong"]=minlong
        pillar_data["maxlong"]=maxlong
        values ={
            'pillar_data':json.dumps(pillar_data)
        }
        return values
# -*- coding: utf-8 -*-
from openerp import http,api
from openerp.http import request
from openerp.tools import html_escape as escape
import json

class pillar_api(http.Controller):
    
    @http.route('/create_pillar', auth='public', type="http")
    def create_new_pillar(self, *arg, **post):
        print 'GET /CREATE_pillar'
        cr,uid,context=request.cr,request.uid,request.context
        pillar_obj=request.registry['uis.papl.pillar']
        pillar_material_obj=request.registry['uis.papl.pillar.material']
        pillar_type_obj=request.registry['uis.papl.pillar.type']
        apl_obj=request.registry['uis.papl.apl']
        tap_obj=request.registry['uis.papl.tap']
        val={'name':'create'}
        num=post.get('num',0)
        
        if num:
            val['num_by_vl']=num
        material_id=post.get('material',0)
        if material_id:
            domain=[("id","=",material_id)]
            material=pillar_material_obj.search(cr, uid, domain, context=context)
            if material:
                val['pillar_material_id']=material_id
        type_id=post.get('type',0)
        if type_id:
            domain=[("id","=",type_id)]
            ptype=pillar_type_obj.search(cr,uid,domain,context=context)
            if ptype:
                val['pillar_type_id']=type_id
        #ltd
        ltd=post.get('ltd',0)
        if ltd>0:
            val['latitude']=ltd
        #lng
        lng=post.get('lng',0)
        if lng>0:
            val['longitude']=lng
        
        #apl
        apl_id=post.get('apl',0)
        if apl_id:
            domain=[("id","=",apl_id)]
            apl=apl_obj.search(cr,uid,domain,context=context)
            if apl:
                val['apl_id']=apl_id
        #tap
        tap_id=post.get('tap',0)
        if tap_id:
            domain=[("id","=",apl_id)]
            tap=tap_obj.search(cr,uid,domain,context=context)
            if tap:
                val['tap_id']=tap_id
        #prev_id
        prev_id=post.get('pr',0)
        if prev_id:
            domain=[("id","=",prev_id)]
            prevpillar=pillar_obj.search(cr,uid,domain,context=context)
            if prevpillar:
                val['parent_id']=prev_id
        #print val
        newpillar=pillar_obj.create(cr,uid,val,context=context);
        #print newpillar
        #return {'newpillar':newpillar.id}
        #return {"newpillar_id": newpillar.id}
        
        '''name = fields.Char('Name', compute='_get_pillar_full_name')
            num_by_vl = fields.Integer()
            pillar_material_id=fields.Many2one('uis.papl.pillar.material', string="Material")
            pillar_type_id=fields.Many2one('uis.papl.pillar.type', string="Type")
            longitude=fields.Float(digits=(2,6))
            latitude=fields.Float(digits=(2,6))
            prev_longitude=fields.Float(digits=(2,6), compute='_pillar_get_len')
            prev_latitude=fields.Float(digits=(2,6), compute='_pillar_get_len')
            len_prev_pillar=fields.Float(digits=(5,2), compute='_pillar_get_len')
            azimut_from_prev=fields.Float(digits=(3,2), compute='_pillar_get_len')
            elevation=fields.Float(digits=(4,2), compute='_get_elevation')
            apl_id=fields.Many2one('uis.papl.apl', string='APL')
            tap_id=fields.Many2one('uis.papl.tap', string='Taps')
            parent_id=fields.Many2one('uis.papl.pillar', string='Prev pillar')'''
        
        
        '''cr,uid,context=request.cr,request.uid, request.context
        pillar_obj=request.registry['uis.papl.pillar']
        g_pillar_id=post.get('id',"")
        g_pillar_lat=post.get('nltd',"")
        g_pillar_lng=post.get('nlng',"")
        domain=[("id","=",g_pillar_id)]
        pillar_id=pillar_obj.search(cr,uid,domain, context=context)
        print pillar_id
        for record in pillar_obj.browse(cr, uid, pillar_id, context=context):
            print record.name
            record.latitude=g_pillar_lat
            record.longitude=g_pillar_lng'''
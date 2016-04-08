# -*- coding: utf-8 -*-
import math
import time
import datetime
from openerp import models, fields, api

class wizard_create_pillar(models.TransientModel):
    _name="uis.papl.wizard.create.pillars"
    _description="Create additional pillars between 2 pillars"
    pillar1_id=fields.Many2one('uis.papl.pillar', string='Start pillar')
    lat1=fields.Float(digits=(2,6))
    long1=fields.Float(digits=(2,6))
    pillar2_id=fields.Many2one('uis.papl.pillar',string="End pillar")
    lat2=fields.Float(digits=(2,6))
    long2=fields.Float(digits=(2,6))
    distance=fields.Float(digits=(6,2), compute='_get_distance_between_pillars')
    apl_id=fields.Many2one('uis.papl.apl', string="APL Name", compute='_change_master')
    tap_id=fields.Many2one('uis.papl.tap', string="Tap Name", compute='_change_master')
    count_pillar=fields.Integer(string="Count of Pillars")
    start_num=fields.Integer(string="Start number")
    calc_med_dist=fields.Float(digits=(6,2), compute='_get_med_distance')
     
    def save_create(self,cr,uid,ids,context=None):
        re_pillar=self.pool.get('uis.papl.pillar').browse(cr,uid,ids,context=context)
        print "Distance:"
        #print self.distance
        val=self.browse(cr,uid,ids,context=context)
        distance=val.distance
        count_pillar=val.count_pillar
        start_num=val.start_num
        pillar2_id=val.pillar2_id
        tap_id=val.tap_id
        apl_id=val.apl_id
        lat1=val.lat1
        lat2=val.lat2
        long1=val.long1
        long2=val.long2
        dlat=(lat2-lat1)/(count_pillar+1)
        dlong=(long2-long1)/(count_pillar+1)
        clat=lat1+dlat
        clong=long1+dlong
        cnum=start_num
        pnp=val.pillar1_id
        i=1
        while i<=count_pillar:
            now=datetime.datetime.now()
            print i
            np=re_pillar.create({'name':'test'+str(i)+'DT'+str(now)})
            np.latitude=clat
            np.longitude=clong
            np.num_by_vl=cnum
            np.tap_id=tap_id
            np.apl_id=apl_id
            np.parent_id=pnp
            pnp=np
            clat=clat+dlat
            clong=clong+dlong
            cnum=cnum+1
            i=i+1
        pillar2_id.parent_id=pnp
        pillar2_id.num_by_vl=cnum
        #self.create_pillars()
        #self.env['uis.papl.pillar'].create({'name':'test01'})
        #env['uis.papl.pillar'].create({'name':'test0'})
        #model=self.pool.get('uis.papl.pillar')
        #model.create({'name':'teso01'})
    
    @api.depends('count_pillar','distance')
    def _get_med_distance(self):
        self.calc_med_dist=self.distance/(1+self.count_pillar)
        pass
    
    @api.depends('pillar2_id','pillar1_id')
    def _change_master(self):
        self.apl_id=self.pillar2_id.apl_id
        self.tap_id=self.pillar2_id.tap_id
        pass
    
    @api.depends('pillar2_id','pillar1_id')
    def _get_distance_between_pillars(self):
        self.distance=0
        lat2=self.pillar2_id.latitude
        long2=self.pillar2_id.longitude
        lat1=self.pillar1_id.latitude
        long1=self.pillar1_id.longitude
        rad=6372795
        if (lat1>0) and (lat2>0) and (long1>0) and (long2>0):
            #Convert to radians
            self.lat1=lat1
            self.lat2=lat2
            self.long1=long1
            self.long2=long2
            la1=lat1*math.pi/180
            la2=lat2*math.pi/180
            lo1=long1*math.pi/180
            lo2=long2*math.pi/180
            #calculate sin and cos
            cl1=math.cos(la1)
            cl2=math.cos(la2)
            sl1=math.sin(la1)
            sl2=math.sin(la2)
            delta=lo2-lo1
            cdelta=math.cos(delta)
            sdelta=math.sin(delta)
            #calculate circle len
            y = math.sqrt(math.pow(cl2*sdelta,2)+math.pow(cl1*sl2-sl1*cl2*cdelta,2))
            x = sl1*sl2+cl1*cl2*cdelta
            ad = math.atan2(y,x)
            dist = ad*rad
            self.distance=dist
        pass
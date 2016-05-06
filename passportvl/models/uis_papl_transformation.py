# -*- coding: utf-8 -*-
import math, urllib, json, time
from openerp import models, fields, api
class uis_papl_transformation_type(models.Model):
	_name='uis.papl.transformer.type'
	_description='Transformer Types'
	name=fields.Char(string='Name')

class uis_papl_transformation(models.Model):
	_name='uis.papl.transformer'
	_description='Transformer'
	#Main data
	name=fields.Char(string='Name')
	apl_id=fields.Many2one('uis.papl.apl', string='APL Name', compute='_get_apl_tap_id')
	tap_id=fields.Many2one('uis.papl.tap', string='Tap Name', compute='_get_apl_tap_id')
	pillar_id=fields.Many2one('uis.papl.pillar',string='Pillar Name', domain="[('id','in',near_pillar_ids[0][2])]")
	
	#GEODATA
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')
	str_pillar_ids=fields.Char(string="pillar ids str", compute='_get_near_pillar')
	near_pillar_ids=fields.Many2many('uis.papl.pillar',
									 relation='near_pillar_ids',
									 column1='trans_id',
									 column2='pillar_id',
									 compute='_get_near_pillar'
									 )
	
	#Details data
	bld_year=fields.Integer(string='Build year')
	start_exp_year=fields.Integer(string='Start of operation')
	trans_type=fields.Many2one('uis.papl.transformer.type', string='Type of transformer')
	voltage=fields.Char(string="Voltage")
	manufacturer = fields.Many2one('res.company',string='construction installation company') #!!!Add domain for manufacturer
	manuf_num=fields.Char(string='Manufacturer code')
	climatic=fields.Char(string='Climatic')
	inv_num=fields.Char(string='Inv num')
	weight=fields.Float(digits=(4,2),string='Weight (kg)')
	code=fields.Integer(string='Code')
	full_code=fields.Char(string='UniCode', compute='_get_unicode')
							   
	#near_pillar_ids=fields.function(_get_near_pillar_ids,type='many2one',obj="uis.papl.pillar",method=True,string='Near pillars id'),
	
	@api.depends('code')
	def _get_unicode(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			trans.full_code=str(trans.tap_id.full_code)+'.'+str(trans.code)
			
	@api.depends('pillar_id')
	def _get_apl_tap_id(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			trans.apl_id=trans.pillar_id.apl_id
			trans.tap_id=trans.pillar_id.tap_id
		
	@api.depends('latitude','longitude')
	def _get_near_pillar(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			lat1=trans.latitude
			long1=trans.longitude
			delta=0.01
			nstr=''
			max_dist=200
			pillars = self.pool.get('uis.papl.pillar').search(cr,uid,[('latitude','>',lat1-delta),('latitude','<',lat1+delta),('longitude','>',long1-delta),('longitude','<',long1+delta)],context=context)
			near_pillars=[]
			near_pillars_ids=[]
			for pid in pillars:
				pillar=self.pool.get('uis.papl.pillar').browse(cr,uid,[pid],context=context)
				if pillar:
					lat2=pillar.latitude
					long2=pillar.longitude
					dist=0
					if (lat1<>0) and (long1<>0) and (lat2<>0) and (long2<>0) and (abs(lat1-lat2)<0.1) and (abs(long1-long2)<0.1):
						rad=6372795
						#Convert to radians
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
					if (dist<max_dist) and (dist>0):
						near_pillars.append(pillar)
						near_pillars_ids.append(pillar.id)
						trans.near_pillar_ids=[(4,pillar.id,0)]
						if (nstr==''):
							nstr=str(pillar.id)
						if (nstr!=''):
							nstr=nstr+','+str(pillar.id)
							print str(pillar.id)+':'+nstr
			nstr='['+nstr+']'
			trans.str_pillar_ids=nstr
			print trans.str_pillar_ids

			

# -*- coding: utf-8 -*-
import math, urllib, json, time, logging
import uismodels
from openerp import models, fields, api
import openerp

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

distance2points=uismodels.distance2points
distangle2points=uismodels.distangle2points

cv_trans_abbr_transformer=openerp._('TRF')
cv_trans_empty_feed=openerp._('NF')
cv_trans_empty_number=openerp._('[0]')
cv_trans_empty_tap=openerp._('[0]')

class uis_papl_transformation_type(models.Model):
	_name='uis.papl.transformer.type'
	_description='Transformer Types'
	name=fields.Char(string='Name')

class uis_papl_transformation_t_type(models.Model):
	_name='uis.papl.transformer.t_type'
	_description='Transformer Types'
	name=fields.Char(string='Name')
	
class uis_papl_transformation(models.Model):
	STATE_SELECTION = [
		('draft', 'DRAFT'),
		('ready', 'READY TO EXPLOITATION'),
		('exploitation', 'EXPLOITATION'),
		('defect','DEFECT'),
		('maintenance', 'MAINTENANCE'),
		('repairs', 'REPAIRS'),
		('write-off','WRITE-OFF')]
	
	_name='uis.papl.transformer'
	_description='Transformer'
	
	def _name_search(self, operator, value):
		_logger.debug(self)
		ids=[]
		ktp_ids=self.search([])
		#_logger.debug(apl_ids)
		value_split=value.split()
		for ktp in ktp_ids:
			#_logger.debug(apl.name)
			for val in value_split:
				if (ktp.name) and (val.lower() in ktp.name.lower()):
					ids.append(ktp.id)
				if (ktp.apl_id) and (val.lower() in ktp.apl_id.name.lower()):
					ids.append(ktp.id)
		return [('id', 'in' , ids)]
	#Main data
	
	name=fields.Char(string='Name', compute='_get_full_name', search=_name_search)
	ind_disp_name=fields.Char(string='Individual dispatch name')
	state=fields.Selection(STATE_SELECTION,'Status',readonly=True,default='draft')
	apl_id=fields.Many2one('uis.papl.apl', string='APL Name', store=True, compute='_get_apl_tap_id')
	num_by_vl=fields.Integer(string='Number on the line', compute='_get_num_by_vl')
	len_start_apl=fields.Float(string='Distance to start APL', compute='_get_len_start_apl')
	tap_id=fields.Many2one('uis.papl.tap', string='Tap Name', store=True, compute='_get_apl_tap_id')
	
	pillar_id=fields.Many2one('uis.papl.pillar',string='Connected pillar (in)', domain="[('id','in',near_pillar_ids[0][2])]")
	pass_type=fields.Boolean(string='Pass type')
	pillar2_id=fields.Many2one('uis.papl.pillar',string='Connected pillar (out)', domain="[('id','in',near_pillar2_ids[0][2])]")
	#GEODATA
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')
	trans_stay_rotation=fields.Float(digits=(3,2), string="Stay rotation", compute='_get_trans_state_rotation')
	str_pillar_ids=fields.Char(string="pillar ids str", compute='_get_near_pillar')
	near_pillar_ids=fields.Many2many('uis.papl.pillar',
									 relation='near_pillar_ids',
									 column1='trans_id',
									 column2='pillar_id',
									 compute='_get_near_pillar'
									 )
	near_pillar2_ids=fields.Many2many('uis.papl.pillar',
									  relation='near_pillar2_ids',
									  column1='trans_id',
									  column2='pillar_id',
									  compute='_get_near_pillar2')
	#Details data
	bld_year=fields.Integer(string='Build year')
	start_exp_year=fields.Integer(string='Start of operation')
	trans_type=fields.Many2one('uis.papl.transformer.type', string='Type of transformer substation')
	voltage=fields.Char(string="Voltage")
	manufacturer = fields.Many2one('res.company',string='construction installation company') #!!!Add domain for manufacturer
	manuf_num=fields.Char(string='Manufacturer code')
	climatic=fields.Char(string='Climatic')
	inv_num=fields.Char(string='Inv num')
	weight=fields.Float(digits=(4,2),string='Weight (kg)')
	length=fields.Float(digits=(4,2),string='Length (m)')
	width=fields.Float(digits=(4,2),string='Width (m)')
	height=fields.Float(digits=(4,2),string='Height (m)')
	code=fields.Integer(string='Code')
	full_code=fields.Char(string='UniCode', compute='_get_unicode')
	
	#step-down Transformer 1 data
	t1_exist=fields.Boolean(string='Exist')
	t1_type=fields.Many2one('uis.papl.transformer.t_type', string='Transformer Type')
	t1_power=fields.Char(string='Power (kVA)')
	t1_manufacturer=fields.Many2one('res.company', string='Manufacturer')
	t1_manuf_num=fields.Char(string='Manufacturer code')
	t1_install_date=fields.Date(string='Install date')
	t1_manuf_date=fields.Date(string='Manufacturing date')
	t1_inv_num=fields.Char(string='Inventory num')
	t1_voltage=fields.Char(string='Rated voltage (kV)')
	t1_current=fields.Char(string='Rated current (A)')
	t1_conn_group=fields.Char(string='Connection group')
	t1_nl_current=fields.Char(string='No-load current')
	t1_sc_voltage=fields.Char(string='Short circuit voltage')
	t1_weight=fields.Float(digits=(4,2),string='Weight (kg)')
	t1_oil_weight=fields.Float(digits=(4,2),string='Oil weight (kg)')
	t1_out_weight=fields.Float(digits=(4,2), string='Outer weight (kg)')
	t1_reg_voltage=fields.Char(string='Voltage regulator')
	
		#step-down Transformer 2 data
	t2_exist=fields.Boolean(string='Exist')
	t2_type=fields.Many2one('uis.papl.transformer.t_type', string='Transformer Type')
	t2_power=fields.Char(string='Power (kVA)')
	t2_manufacturer=fields.Many2one('res.company', string='Manufacturer')
	t2_manuf_num=fields.Char(string='Manufacturer code')
	t2_install_date=fields.Date(string='Install date')
	t2_manuf_date=fields.Date(string='Manufacturing date')
	t2_inv_num=fields.Char(string='Inventory num')
	t2_voltage=fields.Char(string='Rated voltage (kV)')
	t2_current=fields.Char(string='Rated current (A)')
	t2_conn_group=fields.Char(string='Connection group')
	t2_nl_current=fields.Char(string='No-load current')
	t2_sc_voltage=fields.Char(string='Short circuit voltage')
	t2_weight=fields.Float(digits=(4,2),string='Weight (kg)')
	t2_oil_weight=fields.Float(digits=(4,2),string='Oil weight (kg)')
	t2_out_weight=fields.Float(digits=(4,2), string='Outer weight (kg)')
	t2_reg_voltage=fields.Char(string='Voltage regulator')
	#near_pillar_ids=fields.function(_get_near_pillar_ids,type='many2one',obj="uis.papl.pillar",method=True,string='Near pillars id'),
	
	@api.depends('num_by_vl','apl_id','pillar_id')
	def _get_full_name(self):
		#variables:
		#aktp = abbeviation of transformer
		#fn = feeder (apl) number
		#tn = tap number
		#ktpn = transformer number
		#indnm = individual name
		'''
		
		aktp+fn+tn+ktpn',openerp._('TRF020403')),
		('aktp+fn+ktpn+"("+indnm+")'''

		empapl=self.env.user.employee_papl_ids
		for trans in self:
			dname=''
			aktp=empapl.tr_code_abbr_transformer or cv_trans_abbr_transformer
			fn=empapl.tr_code_empty_feed_number or cv_trans_empty_feed
			tn=empapl.tr_code_empty_tap_number or cv_trans_empty_tap
			ktpn=empapl.tr_code_empty_trans_number or cv_trans_empty_number
			indnm=unicode(trans.ind_disp_name) or ''
			if (trans.num_by_vl>0):
				ktpn=str(trans.num_by_vl).zfill(2)
			if (trans.apl_id.feeder_num>0):
				fn=str(trans.apl_id.feeder_num).zfill(2)
			if (trans.tap_id.num_by_vl>0):
				tn=str(trans.tap_id.num_by_vl).zfill(2)
			if (trans.tap_id.is_main_line):
				tn='00'
			ex_frm=empapl.disp_trans_frm or ('aktp+fn+ktpn')
			dname=eval(ex_frm)
			trans.name=dname
			
	@api.depends('pillar_id','pillar_id.len_start_apl','apl_id.line_len_calc')
	def _get_len_start_apl(self):
		for ktp in self:
			if ktp.pillar_id:
				ktp.sudo().len_start_apl=ktp.sudo().pillar_id.len_start_apl
	def _get_num_by_vl(self):
		for ktp in self:
			if ktp.apl_id:
				ktp.apl_id.define_ktp_num()
				
	def _get_trans_state_rotation(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			rot=0
			if trans.pillar_id:
				dist,angl=uismodels.distangle2points(trans.pillar_id.latitude,trans.pillar_id.longitude,trans.latitude,trans.longitude)
				rot=angl
			trans.trans_stay_rotation=rot
	
	@api.depends('code')
	def _get_unicode(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			trans.full_code=str(trans.tap_id.full_code)+'.'+str(trans.code)
			
	@api.depends('pillar_id')
	def _get_apl_tap_id(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			trans.apl_id=trans.pillar_id.apl_id
			trans.tap_id=trans.pillar_id.tap_id
	
	#@api.onchange('pass_type')
	#def onchange_pass_type(self,cr,uid,ids,context=None):
	#	for trans in self:
	#		trans._get_near_pillar2(self,cr,uid,[trans.id],context=context)
		
	@api.depends('latitude','longitude','pillar_id','pass_type')
	def _get_near_pillar2(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			trans.near_pillar2_ids=[(5,0,0)]
			pils=[]
			if trans.pass_type:
				if trans.pillar_id:
					nxpils_ids = self.pool.get('uis.papl.pillar').search(cr,uid,[('parent_id','=',trans.pillar_id.id)],context=context)
					nxpils=self.pool.get('uis.papl.pillar').browse(cr,uid,nxpils_ids,context=context)
					for npil in nxpils:
						pils.append(npil)
					if trans.pillar_id.parent_id:
						pils.append(trans.pillar_id.parent_id)
					
			for pil in pils:
				trans.near_pillar2_ids=[(4,pil.id,0)]
				
	@api.depends('latitude','longitude')
	def _get_near_pillar(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			lat1=trans.latitude
			long1=trans.longitude
			if not(lat1):
				lat1=0
			if not (long1):
				long1=0
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
						dist=distance2points(lat1,long1,lat2,long2)
					if (dist<max_dist) and (dist>0):
						near_pillars.append(pillar)
						near_pillars_ids.append(pillar.id)
						trans.near_pillar_ids=[(4,pillar.id,0)]
						if (nstr==''):
							nstr=str(pillar.id)
						if (nstr!=''):
							nstr=nstr+','+str(pillar.id)
							#print str(pillar.id)+':'+nstr
			nstr='['+nstr+']'
			trans.str_pillar_ids=nstr
			#print trans.str_pillar_ids

	def ready_to_exploitation(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			trans.state='ready'
	def to_exploitation(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			trans.state='exploitation'
	def force_to_draft(self,cr,uid,ids,context=None):
		for trans in self.browse(cr,uid,ids,context=context):
			trans.state='draft'
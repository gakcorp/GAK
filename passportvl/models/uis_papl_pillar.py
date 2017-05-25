# -*- coding: utf-8 -*-
from uismodels import distance2points
from uismodels import distangle2points
import math, urllib, json, time, random
from openerp import models, fields, api
from . import uis_papl_logger
import logging
import datetime
import openerp
import googlemaps

try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

_ulog=uis_papl_logger.ulog
_logger=logging.getLogger(__name__)
_logger.setLevel(10)


cv_pillar_sep=openerp._('/')
cv_pillar_empty_num_vl=openerp._('*NONUM*')
cv_pillar_empty_tap=openerp._('*NOTAP*')
cv_pillar_empty_tap_num=openerp._('*NONUM*')
	
class uis_papl_pillar_type(models.Model):
	_name='uis.papl.pillar.type'
	_description='Type of pillar'
	name=fields.Char('Name')
	code=fields.Char('Code')
	base=fields.Boolean('Base pillar')
	auto_rotate=fields.Boolean('Auto rotate pillar')
	auto_rotate_delta=fields.Integer('Delta rotate (grad)')
	auto_rotate_formula=fields.Text(string="Def rotate formula", help="example: rotate=")
	

class uis_papl_pillar_material(models.Model):
	_name='uis.papl.pillar.material'
	_description='Materials of pillar'
	name=fields.Char('Name')
	code=fields.Char('Code')

class uis_papl_pillar_cut(models.Model):
    _name='uis.papl.pillar.cut'
    _description='Pillar cut'
    name=fields.Char('Pillar cut')
    code=fields.Char('Code')

def _name_search(self, operator, value):
		_logger.debug(self)
		ids=[]
		pil_ids=self.search([])
		#_logger.debug(apl_ids)
		value_split=value.split()
		for pil in pil_ids:
			#_logger.debug(apl.name)
			for val in value_split:
				if (pil.name) and (val.lower() in pil.name.lower()):
					ids.append(pil.id)
				if (pil.apl_id) and (val.lower() in pil.apl_id.name.lower()):
					ids.append(pil.id)
				if (pil.num_by_vl) and (val.lower() in str(pil.num_by_vl)):
					ids.append(pil.id)
		return [('id', 'in' , ids)]
	
class uis_papl_pillar(models.Model):
	_name='uis.papl.pillar'
	_description='Pillar models'
	name = fields.Char('Name', compute='_get_pillar_full_name', search=_name_search)
	num_by_vl = fields.Integer()
	pillar_material_id=fields.Many2one('uis.papl.pillar.material', string="Material")
	pillar_type_id=fields.Many2one('uis.papl.pillar.type', string="Type")
	pillar_cut_id=fields.Many2one('uis.papl.pillar.cut', string="Cut")
	pillar_stay_rotation=fields.Float(digits=(3,2), string="Stay_rotation")
	pillar_icon_code=fields.Char(string='Pillar icon code', compute='_pillar_icon_code')
	longitude=fields.Float(digits=(2,6))
	latitude=fields.Float(digits=(2,6))
	prev_longitude=fields.Float(digits=(2,6), compute='_pillar_get_len')
	prev_latitude=fields.Float(digits=(2,6), compute='_pillar_get_len')
	len_prev_pillar=fields.Float(digits=(5,2), compute='_pillar_get_len')
	fix_lpp=fields.Float(digits=(5,2), string="SysFixlen to prev pillar")
	azimut_from_prev=fields.Float(digits=(3,2), compute='_pillar_get_len')
	elevation=fields.Float(digits=(4,2), compute='_get_elevation', store=True)
	apl_id=fields.Many2one('uis.papl.apl', string='APL')
	tap_id=fields.Many2one('uis.papl.tap', string='Taps')
	parent_id=fields.Many2one('uis.papl.pillar', string='Prev pillar', domain="[('id','in',near_pillar_ids[0][2])]")
	prev_base_pillar_id=fields.Many2one('uis.papl.pillar',string='Prev base pillar', compute='_get_prev_base_pillar')
	next_base_pillar_id=fields.Many2one('uis.papl.pillar',string='Next base pillar')
	len_prev_base_pillar=fields.Float(digits=(5,2), compute='_get_len_to_prev_base')
	len_start_apl=fields.Float(digits=(5,2),compute='_get_len_start_apl')
	near_pillar_ids=fields.Many2many('uis.papl.pillar',
									 relation='near_pillar_ids',
									 column1='trans_id',
									 column2='pillar_id',
									 compute='_get_near_pillar'
									 )
	hash_summ=fields.Char(string='Hash summ', compute='_get_hash', store=True)
	
	def _get_len_start_apl(self):
		for pil in self:
			pp=pil.parent_id
			ltsapl=pil.len_prev_pillar
			while (pp) and (pp.parent_id):
				ltsapl+=pp.len_prev_pillar
				pp=pp.parent_id
			pil.len_start_apl=ltsapl
	@api.depends('prev_base_pillar_id','prev_base_pillar_id.latitude','prev_base_pillar_id.longitude','latitude','longitude')
	def _get_len_to_prev_base(self):
		for pil in self:
			ltpb=0
			lat1,lng1=pil.latitude,pil.longitude
			pbp=pil.prev_base_pillar_id
			if pbp:
				lat2,lng2=pbp.latitude,pbp.longitude
				if (lat1<>0) and (lng1<>0) and (lat2<>0) and (lng2<>0): 
					ltpb=distance2points(lat1,lng1,lat2,lng2)
			pil.len_prev_base_pillar=ltpb
	
	def _get_prev_base_pillar(self):
		# bppppppbppppPILpppppb
		for pil in self:
			pil=pil.sudo()
			bp_pils_ids=[]
			cp=None
			nb=None
			pb=None
			#_logger.debug('Start define prev pillar for pillar %r'%pil.name)
			if pil.parent_id:
				cp=pil.parent_id
				while cp and(cp.tap_id==pil.tap_id) and (cp.pillar_type_id.base==False):
					bp_pils_ids.append(cp.id)
					cp=cp.parent_id
				#_logger.debug('---> Prev pillar for pil %r is pillar %r'%(pil.name,cp.name))
				#_logger.debug('---> Next pillar for P pil %r is pillar %r'%(cp.name, cp.next_base_pillar_id))
				if pil.prev_base_pillar_id<>cp:				
					pil.prev_base_pillar_id=cp
				if pil.pillar_type_id.base==True:
					if pil.tap_id==cp.tap_id:
						if pil.prev_base_pillar_id.next_base_pillar_id and (pil.prev_base_pillar_id.next_base_pillar_id!=pil):
							if pil.next_base_pillar_id<>pil.prev_base_pillar_id.next_base_pillar_id:
								pil.next_base_pillar_id=pil.prev_base_pillar_id.next_base_pillar_id
						pil.prev_base_pillar_id.write({'next_base_pillar_id':pil.id})
					nb=pil
					#_logger.debug('--->---> For P Pil %r write next_pillar_id %r'%(pil.prev_base_pillar_id.name,pil.name))
				if pil.pillar_type_id.base==False:
					if pil.prev_base_pillar_id.next_base_pillar_id:
						if pil.tap_id==cp.tap_id:
							pil.next_base_pillar=nb
						nb=pil.prev_base_pillar_id.next_base_pillar_id
				if nb:
					bp_pils=self.browse(bp_pils_ids).sudo()
					#_logger.debug('--->---> bp_pils is %r'%bp_pils)
					bp_pils.write({'next_base_pillar_id':nb.id})
				if not(nb):
					tap_pils=self.browse(pil.tap_id.pillar_ids.mapped('id')).sudo()
					tap_pils.sorted(key=lambda r: r.num_by_vl,reverse=True)
					#tap_pils._get_prev_base_pillar()
					#_logger.debug('--->--->---> next pillar not defined search in list %r'%tap_pils)
			if not(pil.parent_id):
				pil.write({'prev_base_pillar_id':None})
			#pil.write({'next_base_pillar_id':None})
			

	@api.depends('longitude','latitude','name','num_by_vl','pillar_material_id','pillar_type_id','pillar_cut_id','pillar_stay_rotation','parent_id')
	def _get_hash(self):
		for pil in self:
			str_to_hash='%r%r%r%r%r%r%r%r%r'%(pil.name,pil.num_by_vl,pil.pillar_material_id.name,pil.pillar_type_id.name,pil.pillar_cut_id.name,pil.pillar_stay_rotation,pil.longitude,pil.longitude,pil.parent_id.name)
			pil.hash_summ=hash(str_to_hash)
	
	@api.depends('num_by_vl','tap_id','apl_id')
	def _get_pillar_full_name(self):
		#variables
		#cv_pillar_sep=openerp._('/')
		#cv_pillar_empty_num_vl=openerp._('*NONUM*')
		#cv_pillar_empty_tap=openerp._('*NOTAP*')

		empapl=self.env.user.employee_papl_ids
		for pil in self:
			dname=''
			sp=empapl.pv_pillar_sep or cv_pillar_sep
			pn=empapl.pv_pillar_empty_num_vl or cv_pillar_empty_num_vl
			tn=empapl.pv_pillar_empty_tap or cv_pillar_empty_tap
			if (pil.num_by_vl>0):
				pn=str(pil.num_by_vl)
			an=''
			tcpn=''
			tnum=''
			if pil.apl_id:
				an=unicode(pil.apl_id.name)
			if pil.tap_id:
				tn=unicode(pil.tap_id.name)
				tcpn=str(pil.tap_id.conn_pillar_id.num_by_vl)
				tcpname=unicode(pil.tap_id.conn_pillar_id.name)
				#_logger.debug('tap connected pillar for define pillar name is %r (pillar %r)'%(tcpname,pil.tap_id.conn_pillar_id))
				tnum=str(pil.tap_id.num_by_vl)
			def_frm_mp=empapl.disp_mp_frm or ('pn+sp+an')
			def_frm_tp=empapl.disp_tp_frm or ('"("+tnum+")"+sp+pn+sp+an')
			ex_frm=def_frm_tp
			if pil.tap_id.is_main_line:
				ex_frm=def_frm_mp

			try:
				dname=eval(ex_frm)
			except:
				pass
			pil.name=dname
			
	@api.depends('pillar_type_id')
	def on_change_pillar_type_id(self):
		for pil in self:
			tlr=_ulog(self,code='CHNG_PILTP_PL',lib=__name__,desc='Changes pillar type for pillar [%r]'%pil.id)
			if pil.apl_id:
				tlr.add_comment('[1] Start update pillar type for APL (statistic) %r'%(pillar.apl_id.id))
				pil.apl_id.get_pil_type_ids()
			tlr.fix_end()
			
	def create_new_child(self, tap_id=False, parent_id=False,latlngdelta=0.0001,pillar_type_id=False, pillar_cut_id=False, latitude=0, longitude=0, num_by_vl=-1):
		tlr=_ulog(self,code='ADD_NE_PIL_CHLD',lib=__name__,desc='Create new child for pillar')
		_logger.debug('1. start for pil in self %r'%self)
		for pil in self:
			tlr.add_comment('[*] New child for pillar id:[%r]'%pil.id)
			nlat,nlng=latitude,longitude
			if (nlat==0) or (nlng==0):
				nlat,nlng=pil.latitude+latlngdelta,pil.longitude+latlngdelta
			tlr.add_comment('[--*] with new latitude,longitude (%r,%r)'%(nlat,nlng))
			now=datetime.datetime.now()
			_logger.debug('2. Start create new pillar for lat=%r, lng=%r'%(nlat,nlng))
			np=self.create({'name':'NewCNC PIllar DT'+str(now)})
			_logger.debug('3. Create pillar with id %r'%np.id)
			np.latitude,np.longitude=nlat,nlng
			np.tap_id=pil.tap_id
			np.apl_id=pil.apl_id
			if tap_id:
				np.tap_id=tap_id
				np.apl_id=tap_id.apl_id
			np.parent_id=pil
			if parent_id:
				np.parent_id=parent_id
			np.num_by_vl=pil.num_by_vl+1
			if num_by_vl>0:
				np.num_by_vl=num_by_vl
			if pillar_type_id:
				np.pillar_type_id=pillar_type_id
			if pillar_cut_id:
				np.pillar_cut_id=pillar_cut_id
			_logger.debug(np)
			np.tap_id.act_normalize_num()
		tlr.fix_end()
		return np
	
	def sys_fix_lpp(self):
		for pil in self:
			pil.fix_lpp=pil.len_prev_pillar
	
	@api.depends('pillar_type_id','pillar_cut_id')
	def _pillar_icon_code(self,cr,uid,ids,context=None):
		pi_obj=self.pool.get('uis.icon.settings.pillar')
		for pil in self.browse(cr,uid,ids,context=context):
			res=str(pil.pillar_type_id.id)+'_'+str(pil.pillar_cut_id.id)
			domain=[("pillar_icon_code","in",[res])]
			pi_ids=pi_obj.search(cr,uid,domain,context=context)
			if not(pi_ids):
				res="DEF"
			#Add additional conf. If res(code) ambsence in model uis_settings_pillar_icon then return Default
			pil.pillar_icon_code=res

	@api.depends('latitude','longitude')
	def _get_near_pillar(self,cr,uid,ids,context=None):
		tlr=_ulog(self,code='CALC_NR_PL_PL',lib=__name__,desc='Calculate near pillars for pillar')
		for pil in self.browse(cr,uid,ids,context=context):
			tlr.add_comment('[~] define new near pillar for id:[%r]'%pil.id)
			lat1=pil.latitude
			long1=pil.longitude
			delta=0.001
			max_dist=200
			npillars = self.pool.get('uis.papl.pillar').search(cr,uid,[('latitude','>',lat1-delta),('latitude','<',lat1+delta),('longitude','>',long1-delta),('longitude','<',long1+delta)],context=context)
			near_pillars=[]
			near_pillars_ids=[]
			for pid in npillars:
				npil=self.pool.get('uis.papl.pillar').browse(cr,uid,[pid],context=context)
				if npil:
					if npil.id != pil.id:
						lat2=npil.latitude
						long2=npil.longitude
						dist=0
						if (lat1<>0) and (long1<>0) and (lat2<>0) and (long2<>0): # and (abs(lat1-lat2)<delta) and (abs(long1-long2)<delta):
							dist=distance2points(lat1,long1,lat2,long2)
						if (dist<max_dist) and (dist>0):
							near_pillars.append(npil)
							near_pillars_ids.append(npil.id)
							pil.near_pillar_ids=[(4,npil.id,0)]
		tlr.fix_end()
	
	@api.depends('longitude','latitude')
	def _get_elevation(self):
		hcode_key='AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI'
		key= self.env['uis.global.settings'].get_value('uis_google_api_key') or hcode_key
		client=googlemaps.Client(key)
		for pil in self:
			lat,lng=pil.latitude,pil.longitude
			#el=0
			if (lat<>0) and (lng<>0):
				try:
					res=client.elevation((lat, lng))
					_logger.debug('result google api elevation %r'%res)
				except googlemaps.exceptions.ApiError:
					pass
				for item in res:
					elv=item['elevation']
					pil.elevation = elv
			
	#@api.depends('longitude','latitude','parent_id')
	def _pillar_get_len(self):
		for record in self:
			lat2=record.latitude
			long2=record.longitude
			lat1=record.parent_id.latitude
			long1=record.parent_id.longitude
			record.prev_longitude=long1
			record.prev_latitude=lat1
			dist=0
			angledeg=0
			dist,angledeg=distangle2points(lat1,long1,lat2,long2)
			record.len_prev_pillar=dist
			record.azimut_from_prev=angledeg

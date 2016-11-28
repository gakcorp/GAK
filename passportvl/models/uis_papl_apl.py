# -*- coding: utf-8 -*-
import math, urllib, json, time, random
from openerp import models, fields, api
from PIL import Image, ImageDraw
from . import schemeAPL
from . import schemeAPL_v2
from . import uis_papl_logger
import logging
import datetime
import openerp

try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

_ulog=uis_papl_logger.ulog
_logger=logging.getLogger(__name__)
_logger.setLevel(10)

cv_apl_def_type=openerp._('*NT*')

class uis_papl_apl(models.Model):
	_name ='uis.papl.apl'
	name = fields.Char(string="Name", compute="_get_apl_name")
	short_name=fields.Char(string="Short name")
	locality=fields.Char(string="Locality")
	apl_type=fields.Char(string="Type APL")
	feeder_num=fields.Integer(string="Feeder")
	voltage=fields.Integer(string="Voltage (kV)")
	inv_num = fields.Char()
	department_id=fields.Many2one('uis.papl.department', string="Department")
	department_id_as_substation=fields.Boolean(string="As at the substation")
	department_id_save=fields.Many2one('uis.papl.department', string="Saved Department")
	bld_year =fields.Char(string="Building year")
	startexp_date = fields.Date(string="Start operations date")
	build_company = fields.Many2one('res.company',string='construction installation company')
	cable_ids=fields.Many2many('uis.papl.apl.cable',
								relation='cable_ids',
								column1='apl_id',
								column2='cable_id'
								)
	line_len=fields.Float(digits=(3,2))
	line_len_calc=fields.Float(digits=(6,2), compute='_apl_get_len')
	prol_max_len=fields.Float(digits=(2,2), compute='_apl_get_len')
	prol_med_len=fields.Float(digits=(2,2), compute='_apl_get_len')
	prol_min_len=fields.Float(digits=(2,2), compute='_apl_get_len')
	sag_max=fields.Float(digits=(3,2), string="Sag maximum")
	sag_med=fields.Float(digits=(3,2), string="Sag medium")
	sag_min=fields.Float(digits=(3,2), string="Sag minimum")
	count_circ=fields.Char(string="Number of circuits")
	climatic_conditions=fields.Char(string="Climatic conditions")
	sw_point=fields.Char(string="Switching point")
	pillar_id=fields.One2many('uis.papl.pillar','apl_id', string ="Pillars")
	apl_pil_type_ids=fields.One2many('uis.papl.apl.pil_type', 'apl_id', string="Pillar types", compute='get_pil_type_ids')
	#compute='_get_pil_type_ids',
	apl_pil_material_ids=fields.One2many('uis.papl.apl.pil_materials','apl_id', string="Pillar materials", compute='_get_pil_material_ids')
	cnt_pillar_wo_tap=fields.Integer(compute='_get_cnt_pillar_wo_tap', string="Pillars wo TAP")
	tap_ids=fields.One2many('uis.papl.tap', 'apl_id', string="Taps")
	sup_substation_id=fields.Many2one('uis.papl.substation', string="Supply substation")
	transformer_ids=fields.One2many('uis.papl.transformer','apl_id', string="Transformers")
	tap_text=fields.Html(compute='_get_tap_text_for_apl', string="Taps")
	code_maps=fields.Text()
	status=fields.Char()
	url_maps=fields.Char(compute='_apl_get_url_maps')
	url_scheme=fields.Char(compute='_apl_get_url_scheme')  #NUPD Old use. Need delete
	image_file=fields.Char(string="Scheme File Name", compute='_get_scheme_image_file_name')
	scheme_image=fields.Binary(string="Scheme", compute='_get_scheme_image_2')
	#scheme_image_old=fields.Binary(string="SchemeOld", compute='_get_scheme_image')
	
	@api.one
	def get_pil_type_ids(self):
		for apl in self:
			apt_ids=self.env['uis.papl.apl.pil_type'].calc_def_apl(apl)
			apl.apl_pil_type_ids=[(6,0,apt_ids)]
			#_logger.debug(apl.apl_pil_type_ids)
			
	
	@api.one		
	def _get_pil_material_ids(self):
		for apl in self:
			apm_ids=self.env['uis.papl.apl.pil_materials'].calc_def_apl(apl)
			apl.apl_pil_material_ids=[(6,0,apm_ids)]
			
		
	def add_ml(self, cr,uid,ids,context=None):
		tlr=_ulog(self,code='ADD_NE_ML_F_APL',lib=__name__,desc='Add main line for APL)')
		re_tap=self.pool.get('uis.papl.tap').browse(cr,uid,ids,context=context)
		ntap=re_tap.create({'name':False})
		ntap.is_main_line=True
		#napl=self.pool.get('uis.papl.apl').create(cr,uid,{'name':apl_name},context=context)
		tlr.set_qnt(1)
		for apl in self.browse(cr,uid,ids,context=context):
			tlr.add_comment('[*] Add new tap (%r) to APL (%r)'%(ntap.id,apl.id))
			apl.tap_ids=[(4, ntap.id,0)]
		tlr.fix_end()
		return ntap
	
	def _get_scheme_image_2(self,cr,uid,ids,context=None):
		tlr=_ulog(self,code='CALC_APL_SCHM',lib=__name__,desc='Calculate scheme images for apl')
		i=0
		for apl in self.browse(cr,uid,ids,context=context):
			i=i+1
			tlr.add_comment('[%r] Generate image for APL id %r'%(i,apl.id))
			img = Image.new("RGBA", (schemeAPL_v2.scheme_width,schemeAPL_v2.scheme_height), (255,255,255,0))
			draw = schemeAPL_v2.drawScheme(img,apl)
			background_stream=StringIO.StringIO()
			img.save(background_stream, format="PNG")
			apl.scheme_image=background_stream.getvalue().encode('base64')
		tlr.set_qnt(i)
		tlr.fix_end()
	
	@api.onchange('department_id_as_substation')
	def _get_set_department_id(self):
		for apl in self:
			res_dep=None
			if apl.department_id_as_substation:
				apl.department_id_save=apl.department_id
				res_dep=apl.sup_substation_id.department_id
			if not(apl.department_id_as_substation):
				res_dep=apl.department_id_save
			apl.department_id=res_dep
			#apl.write({})
	
	@api.onchange('department_id')
	def _redef_as_sup_department(self):
		for apl in self:
			if apl.department_id != apl.sup_substation_id.department_id:
				apl.department_id_as_substation = False
			if apl.department_id == apl.sup_substation_id.department_id:
				apl.department_id_as_substation = True
	
	@api.onchange('sup_substation_id')
	def _redef_department_by_substation(self):
		for apl in self:
			if apl.department_id_as_substation:
				apl.department_id=apl.sup_substation_id.department_id
				
	@api.depends('short_name','apl_type','feeder_num','voltage','sup_substation_id')
	def _get_apl_name(self):
		for apl in self:
			nname=''
			#work with defined rpython consts
			#cv_apl_def_type - 	default type (if not defined =NT=)
			#cv_apl_voltage - 	default voltage code (if not defined = *0*)
			#cv_apl_feed	-	default code for feeder (if not defined ='*NFD*')
			#cv_apl_substation -default code for substation (if not defined ='*NPS*')
			#cv_apl_voltage	-	default abbreviation of vlotage (if not defined ='kV')
			#cv_feed_abbr	-	default abbreviation of feeder (if not defined ='F')
			
			
			str_apl_type=cv_apl_def_type
			if apl.apl_type:
				str_apl_type=unicode(apl.apl_type)
			str_voltage='*0*'
			if apl.voltage>0:
				str_voltage=str(apl.voltage)
			str_feeder_num='*NFD*'
			if apl.feeder_num>0:
				str_feeder_num=str(apl.feeder_num)
			str_ssn='*NPS*'
			if (apl.sup_substation_id):
				str_ssn=apl.sup_substation_id.name
			str_short_name=''
			if apl.short_name:
				str_short_name='('+unicode(apl.short_name)+')'
			nname=unicode(str_apl_type)+'-'+str_voltage+'kV'+' F.'+str_feeder_num+'-'+str_ssn+str_short_name
			_logger.debug(self.env.user)
			apl.name=nname
	
	@api.multi
	def define_taps_num(self):
		for apl in self:
			taps=[]
			cpillar=[]
			for tap in apl.tap_ids:
				if not(tap.is_main_line):
					taps.append(tap)
					conpil=-1
					for pil in tap.pillar_ids:
						if pil.tap_id<>pil.parent_id.tap_id:
							conpil=pil.parent_id.num_by_vl
							tap.conn_pillar_id=pil.parent_id
					cpillar.append(conpil)
			sortcpillar=sorted(cpillar)
			cn_tap=1
			i=0
			for num in sortcpillar:
				i=i+1
				if num>0:
					ind=cpillar.index(num)
					cpillar[ind]=-2
					taps[ind].num_by_vl=cn_tap
					cn_tap=cn_tap+1
				
	def _get_tap_text_for_apl(self):
		for apl in self:
			hres=''
			for tap in apl.tap_ids:
				if not(tap.is_main_line):
					taplen=tap.line_len_calc;
					hres=hres+str(tap.num_by_vl)+' ('+str(tap.conn_pillar_id.num_by_vl)+') - '+str(taplen)+ '(m); <br/>'
			apl.tap_text=hres
	
	@api.depends('tap_ids','pillar_id')
	def _get_cnt_pillar_wo_tap(self):
		for apl in self:
			cnt=0
			t_pillar=0
			for pillar in apl.pillar_id:
				if not (pillar.tap_id):
					cnt=cnt+1
			apl.cnt_pillar_wo_tap=cnt
			
	
	@api.multi
	def act_show_map(self):
		tlr=_ulog(self,code='STRT_SHW_MAP_APL',lib=__name__,desc='Start show map for APL id:[%r]'%self.id)
		tlr.fix_end()
		return{
			'name': 'Maps',
			'res_model':'ir.actions.act_url',
			'type':'ir.actions.act_url',
			'target':'new',
			'url':self.url_maps,
			}
	
	@api.multi
	def act_show_scheme(self):
		print "Debug info. Start Show_map"
		print self.url_maps
		return{
			'name': 'Scheme',
			'res_model':'ir.actions.act_url',
			'type':'ir.actions.act_url',
			'target':'new',
			'url':self.url_scheme,
			#'url':'http://www.yandex.ru'
			}
	
	@api.depends('pillar_id')
	def _apl_get_url_maps(self):
		for record in self:
			record.url_maps="/apl_map/?apl_ids="+unicode(str(record.id)) #NUPD from settings
	
	@api.depends('pillar_id')
	def _apl_get_url_scheme(self):
		for record in self:
			record.url_scheme="/apl_scheme/?apl_ids="+unicode(str(record.id)) #NUPD from settings

	def _apl_get_len(self):
		for record in self:
			vsum=0
			vmin=1000
			vmax=0
			vmed=0
			vcnt=0
			for pil in record.pillar_id:
				vcnt=vcnt+1
				lpp=pil.len_prev_pillar
				if lpp>0:
					vsum=vsum+lpp
					vmed=vsum/vcnt
					if lpp<vmin:
						vmin=lpp
					if lpp>vmax:
						vmax=lpp
			record.line_len_calc=vsum
			record.prol_max_len=vmax
			record.prol_min_len=vmin
			record.prol_med_len=vmed
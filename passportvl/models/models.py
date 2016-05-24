# -*- coding: utf-8 -*-
import math
from openerp import models, fields, api
from PIL import Image, ImageDraw

try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

class uis_papl_substation(models.Model):
	_name='uis.papl.substation'
	_description='Substation model'
	name=fields.Char()
	apl_id=fields.One2many('uis.papl.apl','sup_substation_id', string="APLs")

class uis_papl_pillar_type(models.Model):
	_name='uis.papl.pillar.type'
	_description='Type of pillar'
	name=fields.Char('Name')

class uis_papl_pillar_material(models.Model):
	_name='uis.papl.pillar.material'
	_description='Materials of pillar'
	name=fields.Char('Name')

class uis_papl_pillar(models.Model):
	_name='uis.papl.pillar'
	_description='Pillar models'
	name = fields.Char('Name')
	num_by_vl = fields.Integer()
	pillar_material_id=fields.Many2one('uis.papl.pillar.material', string="Material")
	pillar_type_id=fields.Many2one('uis.papl.pillar.type', string="Type")
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')
	prev_longitude=fields.Float(digits=(2,6), compute='_pillar_get_len')
	prev_latitude=fields.Float(digits=(2,6), compute='_pillar_get_len')
	len_prev_pillar=fields.Float(digits=(5,2), compute='_pillar_get_len')
	azimut_from_prev=fields.Float(digits=(3,2), compute='_pillar_get_len')
	apl_id=fields.Many2one('uis.papl.apl', string='APL')
	tap_id=fields.Many2one('uis.papl.tap', string='Taps')
	parent_id=fields.Many2one('uis.papl.pillar', string='Prev pillar')
	
	@api.depends('longitude','latitude','parent_id')
	def _pillar_get_len(self):
		for record in self:
			lat2=record.latitude
			long2=record.longitude
			lat1=record.parent_id.latitude
			long1=record.parent_id.longitude
			record.prev_longitude=lat1
			record.prev_latitude=lat2
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
			#calculate start azimut
			x = (cl1*sl2) - (sl1*cl2*cdelta)
			y = sdelta*cl2
			z = math.degrees(math.atan(-y/x))
			if (x < 0):
				z = z+180.
			z2 = (z+180.) % 360. - 180.
			z2 = - math.radians(z2)
			anglerad2 = z2 - ((2*math.pi)*math.floor((z2/(2*math.pi))) )
			angledeg = (anglerad2*180.)/math.pi
			if (lat1==0) or (long1==0) or (lat2==0) or (long2==0):
				dist=0
				azimut_from_prev=0
			record.len_prev_pillar=dist
			record.azimut_from_prev=angledeg


class uis_papl_tap(models.Model):
	_name = 'uis.papl.tap'
	name=fields.Char()
	full_name=fields.Char()
	apl_id=fields.Many2one('uis.papl.apl', string='APL')
	pillar_ids=fields.One2many('uis.papl.pillar','tap_id',string='Pillars')
	
class uis_papl_apl(models.Model):
	_name ='uis.papl.apl'
	name = fields.Char()
	full_name=fields.Char()
	inv_num = fields.Char()
	bld_year =fields.Char(string="Building year")
	startexp_date = fields.Date(string="Start operations date")
	line_len=fields.Float(digits=(3,2))
	line_len_calc=fields.Float(digits=(6,2), compute='_apl_get_len')
	prol_max_len=fields.Float(digits=(2,2), compute='_apl_get_len')
	prol_med_len=fields.Float(digits=(2,2), compute='_apl_get_len')
	prol_min_len=fields.Float(digits=(2,2), compute='_apl_get_len')
	pillar_id=fields.One2many('uis.papl.pillar','apl_id', string ="Pillars")
	tap_ids=fields.One2many('uis.papl.tap', 'apl_id', string="Taps")
	sup_substation_id=fields.Many2one('uis.papl.substation', string="Supply Substation")
	scheme_image=fields.binary(string="Scheme", compute='_get_scheme_image')
    image_file=fields.Char(string="Scheme File Name", compute='_get_scheme_image_file_name')
    code_maps=fields.Text()
	status=fields.Char()
	
    def _get_scheme_image_file_name(mo)
	def _get_scheme_image(self,cr,uid,ids,context=None):
		for apl in self.browse(cr,uid,ids,context=context):
			trans.full_code=str(trans.tap_id.full_code)+'.'+str(trans.code)
			img = Image.new("RGBA", (800,400), (0,0,0,0))
			draw = ImageDraw.Draw(image)
			draw.ellipse ((190,90,210,110),fill="red", outline="blue")
			background_stream=StringIO.StringIO()
			image.save(background_stream, 'JPG')
			apl.scheme_image=background_stream.getvalue().encode(encoding)


	#@api.depends('pillar_id')
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
			
# class passportvl(models.Model):
#     _name = 'passportvl.passportvl'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         self.value2 = float(self.value) / 100

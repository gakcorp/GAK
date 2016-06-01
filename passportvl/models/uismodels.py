# -*- coding: utf-8 -*-
import math, urllib, json, time
from openerp import models, fields, api
from PIL import Image, ImageDraw
from . import schemeAPL

try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

class uis_papl_substation(models.Model):
	_name='uis.papl.substation'
	_description='Substation model'
	name=fields.Char()
	apl_id=fields.One2many('uis.papl.apl','sup_substation_id', string="APLs")
	url_maps=fields.Char(compute='_ss_get_url_maps')
	department_id=fields.Many2one('uis.papl.department', string="Department")
	
	@api.depends('apl_id')
	def _ss_get_url_maps(self):
		for record in self:
			url="/apl_map/?apl_ids="
			for apl in record.apl_id:
				url=url+unicode(str(apl.id))+","
			record.url_maps=url

	@api.multi
	def act_show_map(self):
		print "Debug info. Start Show_map for substation"
		print self.url_maps
		return{
			'name': 'Maps',
			'res_model':'ir.actions.act_url',
			'type':'ir.actions.act_url',
			'target':'new',
			'url':self.url_maps
			}
	
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
	name = fields.Char('Name', compute='_get_pillar_full_name')
	num_by_vl = fields.Integer()
	pillar_material_id=fields.Many2one('uis.papl.pillar.material', string="Material")
	pillar_type_id=fields.Many2one('uis.papl.pillar.type', string="Type")
	longitude=fields.Float(digits=(2,6))
	latitude=fields.Float(digits=(2,6))
	prev_longitude=fields.Float(digits=(2,6), compute='_pillar_get_len')
	prev_latitude=fields.Float(digits=(2,6), compute='_pillar_get_len')
	len_prev_pillar=fields.Float(digits=(5,2), compute='_pillar_get_len')
	azimut_from_prev=fields.Float(digits=(3,2), compute='_pillar_get_len')
	elevation=fields.Float(digits=(4,2), compute='_get_elevation', store=True)
	apl_id=fields.Many2one('uis.papl.apl', string='APL')
	tap_id=fields.Many2one('uis.papl.tap', string='Taps')
	parent_id=fields.Many2one('uis.papl.pillar', string='Prev pillar')
	
	@api.multi
	@api.depends('longitude','latitude')
	def _get_elevation(self):
		for record in self:
			print 'Get Elevation for '+str(record.id)
			lat=record.latitude
			lng=record.longitude
			if (lat<>0) and (lng<>0):
				url="https://maps.googleapis.com/maps/api/elevation/json?locations="+str(lat)+","+str(lng)+"&key=AIzaSyBISxqdmShLk0Lca8RC_0AZgZcI5xhFriE"
				print url
				el=0
				response = urllib.urlopen(url)
				data = json.loads(response.read())
				print data
				if data["status"]=="OK":
					el=data["results"][0]["elevation"]
				else:
					print '!!!!!!!!!!!!!!!PAUSE!!!!!!!!!!!!!!!!!!!!!!!!!'
					time.sleep (100.0 / 1000.0)
					response = urllib.urlopen(url)
					data = json.loads(response.read())
					print data
					if data["status"]=="OK":
						el=data["results"][0]["elevation"]
				record.elevation=el
			
	@api.depends('num_by_vl','tap_id','apl_id')
	def _get_pillar_full_name(self):
		for record in self:
			new_name=str(record.num_by_vl)
			#tap_name=record.tap_id.name
			#apl_name=record.apl_id.name
			str_tap_num_by_vl=str(record.tap_id.num_by_vl)
			if (record.tap_id.is_main_line):
				str_tap_num_by_vl='ML'
			tap_name='T('+str_tap_num_by_vl+')_Feed'+str(record.apl_id.feeder_num)
			mname=new_name+"."+unicode(tap_name)
			record.name=mname
		
	@api.depends('longitude','latitude','parent_id')
	def _pillar_get_len(self):
		for record in self:
			lat2=record.latitude
			long2=record.longitude
			lat1=record.parent_id.latitude
			long1=record.parent_id.longitude
			record.prev_longitude=lat1
			record.prev_latitude=lat2
			dist=0
			azimut_from_prev=0
			angledeg=0
			if (lat1<>0) and (long1<>0) and (lat2<>0) and (long2<>0):
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
	name=fields.Char(string="Name", compute='_get_tap_full_name')
	full_name=fields.Char()
	apl_id=fields.Many2one('uis.papl.apl', string='APL')
	cnt_np=fields.Integer(compute='_get_cnt_np', string='Pillars wo prev')
	pillar_cnt=fields.Integer(compute='_get_cnt_np', string='Total pillars')
	pillar_ids=fields.One2many('uis.papl.pillar','tap_id',string='Pillars')
	line_len_calc=fields.Float(digits=(6,2), compute='_tap_get_len')
	is_main_line=fields.Boolean(string='is main line')
	num_by_vl=fields.Integer(string='Number', compute='_get_num_by_vl')
	conn_pillar_id=fields.Many2one('uis.papl.pillar', string='Connect Pilar', compute='_get_num_by_vl')
	code=fields.Integer(string='Code', compute='_get_unicode')
	full_code=fields.Char(string='UniCode', compute='_get_unicode')
	
	@api.depends('code')
	def _get_unicode(self,cr,uid,ids,context=None):
		for tap in self.browse(cr,uid,ids,context=context):
			tap.full_code='XTR.'+str(tap.code)
			tap.code=tap.num_by_vl
	
	@api.depends('num_by_vl','apl_id','conn_pillar_id')
	def _get_tap_full_name(self):
		for tap in self:
			nname=''
			str_apl_name='NOAPL'
			if (tap.apl_id):
				str_apl_name=unicode(tap.apl_id.name)
			if tap.is_main_line:
				nname='ML.'+str_apl_name
			if not(tap.is_main_line):
				str_num_by_vl='NC'
				if tap.num_by_vl>0:
					str_num_by_vl=str(tap.num_by_vl)
				str_conn_pillar='NCON'
				if tap.conn_pillar_id:
					str_conn_pillar=str(tap.conn_pillar_id.num_by_vl)
				nname='O.'+str_num_by_vl+'.('+str_conn_pillar+').'+str_apl_name
			tap.name=nname
			
	def _get_num_by_vl(self):
		for tap in self:
			print tap.name
			tap.apl_id.define_taps_num()
			print tap.apl_id.name
	
	def _tap_get_len(self):
		for tap in self:
			vsum=0
			vmin=1000
			vmax=0
			vmed=0
			vcnt=0
			for pil in tap.pillar_ids:
				vcnt=vcnt+1
				lpp=pil.len_prev_pillar
				vsum=vsum+lpp
				vmed=vsum/vcnt
				if lpp<vmin:
					vmin=lpp
				if lpp>vmax:
					vmax=lpp
			tap.line_len_calc=vsum
			#record.prol_max_len=vmax
			#record.prol_min_len=vmin
			#record.prol_med_len=vmed
			
	@api.depends('apl_id','pillar_ids')
	def _get_cnt_np(self):
		for tap in self:
			cnt=0
			t_pillar=0
			for pillar in tap.pillar_ids:
				t_pillar=t_pillar+1
				if not(pillar.parent_id):
					cnt=cnt+1
			tap.cnt_np=cnt
			tap.pillar_cnt=t_pillar
			
			
	@api.multi
	def get_elevation(self):
		for tap in self:
			for record in tap.pillar_ids:
				print 'Request _get_elevation'
				if record.elevation==0:
					print 'Get Elevation for '+str(record.id)
					lat=record.latitude
					lng=record.longitude
					if (lat<>0) and (lng<>0):
						url="https://maps.googleapis.com/maps/api/elevation/json?locations="+str(lat)+","+str(lng)+"&key=AIzaSyBISxqdmShLk0Lca8RC_0AZgZcI5xhFriE"
						el=0
						response = urllib.urlopen(url)
						data = json.loads(response.read())
						if data["status"]=="OK":
							el=data["results"][0]["elevation"]
						else:
							print '!!!!!!!!!!!!!!!PAUSE!!!!!!!!!!!!!!!!!!!!!!!!!'
							time.sleep (0.5)
							response = urllib.urlopen(url)
							data = json.loads(response.read())
							print data
							if data["status"]=="OK":
								el=data["results"][0]["elevation"]
						record.elevation=el
	
	@api.multi
	def act_normalize_num(self):
		print "Start normalize process to Tap id="+str(self.id)
		max_num=0
		max_id=0
		pillar_cnt=0
		for pillar in self.pillar_ids:
			pillar_cnt=pillar_cnt+1
			if pillar.num_by_vl>max_num:
				max_num=pillar.num_by_vl
				max_id=pillar.id
				last_pillar=pillar
				print last_pillar
				print max_num
		if pillar_cnt>0:
			i=0
			cp=last_pillar
			np=last_pillar.parent_id
			n_id=np.id
			while (n_id>0) and (pillar_cnt-i>=1):
				print "Set to Pillar id:"+str(cp.id)+" num_by_vl value is "+str(pillar_cnt-i)
				cp.num_by_vl=pillar_cnt-i
				np=cp.parent_id
				n_id=np.id
				if n_id>0:
					#if np.
					cp=np
				i=i+1
			
class uis_papl_apl_cable(models.Model):
	_name='uis.papl.apl.cable'
	name=fields.Char(string="Name")

    
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
	cnt_pillar_wo_tap=fields.Integer(compute='_get_cnt_pillar_wo_tap', string="Pillars wo TAP")
	tap_ids=fields.One2many('uis.papl.tap', 'apl_id', string="Taps")
	sup_substation_id=fields.Many2one('uis.papl.substation', string="Supply substation")
	transformer_ids=fields.One2many('uis.papl.transformer','apl_id', string="Transformers")
	tap_text=fields.Html(compute='_get_tap_text_for_apl', string="Taps")
	code_maps=fields.Text()
	status=fields.Char()
	url_maps=fields.Char(compute='_apl_get_url_maps')
	url_scheme=fields.Char(compute='_apl_get_url_scheme')
	image_file=fields.Char(string="Scheme File Name", compute='_get_scheme_image_file_name')
	scheme_image=fields.Binary(string="Scheme", compute='_get_scheme_image')
	
	def _get_scheme_image(self,cr,uid,ids,context=None):
		for apl in self.browse(cr,uid,ids,context=context):
			img = Image.new("RGBA", (schemeAPL.scheme_width,schemeAPL.scheme_height), (255,255,255,0))
			#draw = ImageDraw.Draw(img)
			draw = schemeAPL.drawScheme(img,apl)
			#draw.ellipse ((190,90,210,110),fill="red", outline="blue")
			background_stream=StringIO.StringIO()
			img.save(background_stream, format="PNG")
			apl.scheme_image=background_stream.getvalue().encode('base64')
	
	@api.depends('short_name','apl_type','feeder_num','voltage','sup_substation_id')
	def _get_apl_name(self):
		for apl in self:
			nname=''
			str_apl_type='*NT*'
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
			print taps
			print cpillar
			sortcpillar=sorted(cpillar)
			print sortcpillar
			cn_tap=1
			i=0
			for num in sortcpillar:
				i=i+1
				if num>0:
					ind=cpillar.index(num)
					print ind
					cpillar[ind]=-2
					taps[ind].num_by_vl=cn_tap
					cn_tap=cn_tap+1
					print 'current num by vl for tap'+str(cn_tap)
				print num
			#tap.num_by_vl=0
				
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
		print "Debug info. Start Show_map"
		print self.url_maps
		return{
			'name': 'Maps',
			'res_model':'ir.actions.act_url',
			'type':'ir.actions.act_url',
			'target':'new',
			'url':self.url_maps,
			#'url':'http://www.yandex.ru'
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
			record.url_maps="/apl_map/?apl_ids="+unicode(str(record.id))
	
	@api.depends('pillar_id')
	def _apl_get_url_scheme(self):
		for record in self:
			record.url_scheme="/apl_scheme/?apl_ids="+unicode(str(record.id))

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

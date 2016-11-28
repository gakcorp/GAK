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

#nulo=uis_papl_logger.uis_logger()
#_logger.debug(nulo)
#nulog=nulo.add_log(code='LOADMODULE',desc='Load modele %r'%(__name__),lib=__name__)
#nulog.fix_delay(delay=0)

UNI_STATE_SELECTION = [
		('draft', 'DRAFT'),
		('ready', 'READY TO EXPLOITATION'),
		('exploitation', 'EXPLOITATION'),
		('defect','DEFECT'),
		('maintenance', 'MAINTENANCE'),
		('repairs', 'REPAIRS'),
		('write-off','WRITE-OFF')]
	
def distance2points(lat1,long1,lat2,long2):
	dist=-1
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
	return dist
def distangle2points(lat1,long1,lat2,long2):
	dist=0
	angle=0
	dist=distance2points(lat1,long1,lat2,long2)
	if (lat1<>0) and (long1<>0) and (lat2<>0) and (long2<>0):
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
		#calculate start azimut
		x = (cl1*sl2) - (sl1*cl2*cdelta)
		y = sdelta*cl2
		try:
			z = math.degrees(math.atan(-y/x))
		except ZeroDivisionError:
			z=0
		if (x < 0):
			z = z+180.
		z2 = (z+180.) % 360. - 180.
		z2 = - math.radians(z2)
		anglerad2 = z2 - ((2*math.pi)*math.floor((z2/(2*math.pi))) )
		angle = (anglerad2*180.)/math.pi
	return dist,angle

class uis_papl_substation(models.Model):

	_name='uis.papl.substation'
	_description='Substation model'
	name=fields.Char()
	url_maps=fields.Char(compute='_ss_get_url_maps')
	department_id=fields.Many2one('uis.papl.department', string="Department")
	latitude=fields.Float(digits=(2,6))
	longitude=fields.Float(digits=(2,6))
	latlng=fields.Float(digits=(2,6),compute='_get_latlng',string="LatxLng")
	photo=fields.Binary(string='Photo')
	image_scheme=fields.Binary(string='Principal Scheme')
	apl_scheme=fields.Binary(string="APLs Scheme", compute='_get_apl_scheme')
	state=fields.Selection(UNI_STATE_SELECTION,'Status',readonly=True,default='draft')
	apl_id=fields.One2many('uis.papl.apl','sup_substation_id',string='APLs')
	conn_pillar_ids=fields.Many2many('uis.papl.pillar',
									 relation='ss_conn_pillar_ids',
									 column1='substation_id',
									 column2='pillar_id',
									 #domain="[('id','in',near_pillar_ids[0][2])]",
									 domain="[('id','in',near_pillar_ids[0][2])]",
									 string="Connected pollars")
	near_pillar_ids=fields.Many2many('uis.papl.pillar',
									 relation='ss_near_pillar_ids',
									 column1='substation_id',
									 column2='pillar_id',
									 compute='_get_near_pillar',
									 string='Near pillars'
									 )
	
	def _get_scheme_image_2(self,cr,uid,ids,context=None):
		for ss in self.browse(cr,uid,ids,context=context):
			img = Image.new("RGBA", (schemeAPL_v2.scheme_width,schemeAPL_v2.scheme_height), (255,255,255,0))
			##Need codeS	
	@api.depends('latitude','longitude')
	def _get_latlng(self):
		for ss in self:
			ss.latlng=ss.latitude*ss.longitude
		return True
	
	def add_apl(self, cr,uid,ids,context=None, apl_name='NDEF', fid=0, apl_type='ВЛ', klass=6):
		re_apl=self.pool.get('uis.papl.apl').browse(cr,uid,ids,context=context)
		#napl=self.pool.get('uis.papl.apl').create(cr,uid,{'name':apl_name},context=context)
		tlen=len(self.browse(cr,uid,[],context=context))
		apls=[]
		for ss in self.browse(cr,uid,ids,context=context):
			tlr=_ulog(self,code='ADD_NE',lib=__name__,desc='Create new APL for substation id=%r'%(ss.id))
			napl=re_apl.create({'name':apl_name})
			napl.feeder_num=fid
			napl.apl_type=apl_type
			napl.voltage=klass
			ntap=napl.add_ml()
			nlatitude,nlongitude=0,0
			nlatitude2,nlongitude2=0,0
			base_ang=random.randint(0,360)
			rad=random.randint(2,5)
			delta=0.0001
			if not(ss.latitude==0):
				nlatitude=ss.latitude+delta*math.cos(math.radians(base_ang*(tlen+1)))
				nlatitude2=ss.latitude+rad*delta*math.cos(math.radians(base_ang*(tlen+1)))
			if not(ss.longitude==0):
				nlongitude=ss.longitude+delta*math.sin(math.radians(base_ang*(tlen+1)))
				nlongitude2=ss.longitude+rad*delta*math.sin(math.radians(base_ang*(tlen+1)))
			fpil=ntap.add_pillar(num_by_vl=1,latitude=nlatitude,longitude=nlongitude)
			spil=fpil.create_new_child(tap_id=False, parent_id=fpil,latitude=nlatitude2,longitude=nlongitude2, num_by_vl=2)
			fpil.pillar_type_id=1
			spil.pillar_type_id=1
			tlr.add_comment('APL %r, Tap %r, Pillar 1 %r , Pillar 2 %r '%(napl,ntap,fpil,spil))
			tlr.fix_end()		
			ss.apl_id=[(4, napl.id,0)]
			apls.append(napl.id)
		return apls
			
			
	def _get_near_pillar(self,cr,uid,ids,context=None):
		for ps in self.browse(cr,uid,ids,context=context):
			tlr=_ulog(self,code='CALC_NR_PL_PS',lib=__name__,desc='Calculate near pillars for substation [%r]'%ps.id)
			lat1=ps.latitude
			long1=ps.longitude
			tlr.add_comment('[1] Start define near pillars (ids)')
			tlr.add_comment('[2] Substation latitude|longitude %r|%r'%(lat1,long1))
			ps.near_pillar_ids=[(5,None,None)]
			if (lat1>0) and (long1>0):
				delta=0.01 #NUPD Change to get settings
				max_dist=200 #NUPD Change to get settings
				pillars = self.pool.get('uis.papl.pillar').search(cr,uid,[('latitude','>',lat1-delta),('latitude','<',lat1+delta),('longitude','>',long1-delta),('longitude','<',long1+delta)],context=context)
				near_pillars=[]
				near_pillars_ids=[]
				ps.near_pillar_ids=[(5,None,None)]
				for pid in pillars:
					pillar=self.pool.get('uis.papl.pillar').browse(cr,uid,[pid],context=context)
					if pillar:
						lat2=pillar.latitude
						long2=pillar.longitude
						dist=-1
						if (lat1<>0) and (long1<>0) and (lat2<>0) and (long2<>0) and (abs(lat1-lat2)<0.1) and (abs(long1-long2)<0.1):
							dist=distance2points(lat1,long1,lat2,long2)
							tlr.add_comment('[3] Pillar %r distance %r to parent_id is %r'%(pillar.id,dist,pillar.parent_id))
						if (dist<max_dist) and (dist>=0) and not(pillar.parent_id):
							near_pillars.append(pillar)
							near_pillars_ids.append(pillar.id)
							ps.near_pillar_ids=[(4,pillar.id,0)]
			tlr.fix_end()
		return True
		
	@api.depends('apl_id')
	def _ss_get_url_maps(self):
		for record in self:
			url="/apl_map/?apl_ids="
			for apl in record.apl_id:
				url=url+unicode(str(apl.id))+","
			record.url_maps=url

	@api.multi
	def act_show_map(self):
		tlr=_ulog(self,code='STRT_SHW_MAP_PS',lib=__name__,desc='Start show map for Power substation [%r]'%self.id)
		tlr.fix_end()
		#print self.url_maps
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
    
class uis_papl_pillar(models.Model):
	_name='uis.papl.pillar'
	_description='Pillar models'
	name = fields.Char('Name', compute='_get_pillar_full_name')
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
	near_pillar_ids=fields.Many2many('uis.papl.pillar',
									 relation='near_pillar_ids',
									 column1='trans_id',
									 column2='pillar_id',
									 compute='_get_near_pillar'
									 )
	
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
		for pil in self:
			tlr.add_comment('[*] New child for pillar id:[%r]'%pil.id)
			nlat,nlng=latitude,longitude
			if (nlat==0) or (nlng==0):
				nlat,nlng=pil.latitude+latlngdelta,pil.longitude+latlngdelta
			tlr.add_comment('[--*] with new latitude,longitude (%r,%r)'%(nlat,nlng))
			now=datetime.datetime.now()
			np=self.create({'name':'NewCNC PIllar DT'+str(now)})
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
			tlr.add_comment('[~] define new pillar for id:[%r]'%pil.id)
			lat1=pil.latitude
			long1=pil.longitude
			delta=0.01
			max_dist=300
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
						if (lat1<>0) and (long1<>0) and (lat2<>0) and (long2<>0) and (abs(lat1-lat2)<delta) and (abs(long1-long2)<delta):
							dist=distance2points(lat1,long1,lat2,long2)
						if (dist<max_dist) and (dist>0):
							near_pillars.append(npil)
							near_pillars_ids.append(npil.id)
							pil.near_pillar_ids=[(4,npil.id,0)]
		tlr.fix_end()

	@api.multi
	@api.depends('longitude','latitude')
	def _get_elevation(self):
		for record in self:
			#print 'Get Elevation for '+str(record.id)
			lat=record.latitude
			lng=record.longitude
			el=0
			if (lat<>0) and (lng<>0):
				url="https://maps.googleapis.com/maps/api/elevation/json?locations="+str(lat)+","+str(lng)+"&key=AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI" #NUPD Value from settings
				#print url
				response = urllib.urlopen(url)
				data = json.loads(response.read())
				#print data
				if data["status"]=="OK":
					el=data["results"][0]["elevation"]
				else:
					tlr=_ulog(self,code='WRN_GMAPS_API_PAUSE',lib=__name__,desc='Create pause for request to google elevation API')
					time.sleep (100.0 / 1000.0)
					response = urllib.urlopen(url)
					data = json.loads(response.read())
					#print data
					if data["status"]=="OK":
						el=data["results"][0]["elevation"]
					tlr.fix_end()
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
			tap_name='T('+str_tap_num_by_vl+')_Feed'+str(record.apl_id.feeder_num) #NUPD Change to mask for user
			mname=new_name+"."+unicode(tap_name)
			record.name=mname

	#@api.depends('longitude','latitude','parent_id')
	def _pillar_get_len(self):
		for record in self:
			lat2=record.latitude
			long2=record.longitude
			lat1=record.parent_id.latitude
			long1=record.parent_id.longitude
			record.prev_longitude=lat1
			record.prev_latitude=lat2
			dist=0
			angledeg=0
			dist,angledeg=distangle2points(lat1,long1,lat2,long2)
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
	
	def add_pillar(self, cr,uid,ids,context=None,latitude=0,longitude=0,num_by_vl=0,parent_id=False):
		tlr=_ulog(self,code='ADD_NE_PLR_TO_TP',lib=__name__,desc='Create new pillar for TAP')
		re_pillar=self.pool.get('uis.papl.pillar').browse(cr,uid,ids,context=context)
		for tap in self.browse(cr,uid,ids,context=context):
			tlr.add_comment('[*] Tap id = %r',tap.id)	
			npil=re_pillar.create({'name':False})
			if not(latitude==0):
				npil.latitude=latitude
			if not(longitude==0):
				npil.longitude=longitude
			if not(num_by_vl==0):
				npil.num_by_vl=num_by_vl
			if not(parent_id):
				npil.parent_id=parent_id
			npil.is_main_line=True
			npil.apl_id=tap.apl_id
			tap.pillar_ids=[(4, npil.id,0)]
		tlr.fix_end();
		return npil
	
	def create_new_tap(self):
		for tap in self:
			now=datetime.datetime.now()
			nt=self.create({'name':'NewCNC PIllar DT'+str(now)})
			nt.apl_id=self.apl_id
		return nt
		
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
			#print tap.name
			tap.apl_id.define_taps_num()
			#print tap.apl_id.name
	
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
						url="https://maps.googleapis.com/maps/api/elevation/json?locations="+str(lat)+","+str(lng)+"&key=AIzaSyBISxqdmShLk0Lca8RC_0AZgZcI5xhFriE" #NUPD From settings
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
	def do_pillar_apl_id_by_tap(self):
		for pillar in self.pillar_ids:
			if pillar.apl_id != self.apl_id:
				pillar.apl_id=self.apl_id
				
	@api.multi
	def act_normalize_num(self):
		tlr=_ulog(self,code='CALC_NORMALIZE_NUM_TAP',lib=__name__,desc='Start normalize num by APL (by TAP id=%r)'%(self.id))
		max_num=0
		max_id=0
		pillar_cnt=0
		for pillar in self.pillar_ids:
			pillar_cnt=pillar_cnt+1
			if pillar.num_by_vl>max_num:
				max_num=pillar.num_by_vl
				max_id=pillar.id
				last_pillar=pillar
				tlr.add_comment('[1] Last pillar is %r'%last_pillar.id)
				tlr.add_comment('[2] Max number is %r'%max_num)
		tlr.set_qnt(pillar_cnt)
		if pillar_cnt>0:
			i=0
			cp=last_pillar
			np=last_pillar.parent_id
			n_id=np.id
			while (n_id>0) and (pillar_cnt-i>=1) and (cp.tap_id==np.tap_id):
				#print "Set to Pillar id:"+str(cp.id)+" num_by_vl value is "+str(pillar_cnt-i)
				cp.num_by_vl=pillar_cnt-i
				np=cp.parent_id
				n_id=np.id
				if n_id>0:
					#if np.
					cp=np
				i=i+1
		tlr.fix_end()

	def sys_pil_fix_lpp(self):
		for tap in self:
			for pil in tap.pillar_ids:
				pil.sys_fix_lpp()
	
	@api.multi
	def do_normal_magni(self,cr,uid,ids,context=None):
		for tap in self:
			tap.act_normalize_num()
			#basepillars_ids=tap.pillar_ids.search(cr,uid,[],context=context)
			tlr=_ulog(self,code='CLC_DO_NRML_MGNF_TAP',lib=__name__,desc='Start normalize for magnify for TAP id=%r)'%(tap.id))
			base_pills=[]
			for pil in tap.pillar_ids.filtered(lambda r: r.pillar_type_id.base == True).sorted(key=lambda r: r.num_by_vl, reverse=True):
				base_pills.append(pil)
			if tap.conn_pillar_id:
				base_pills.append(tap.conn_pillar_id)
			cnt_base_pills=len(base_pills)
			tlr.set_qnt(cnt_base_pills)
			for i in range(0,cnt_base_pills-1):
				cp=base_pills[i]
				tdist=0
				while not(cp==base_pills[i+1]):
					if cp.fix_lpp:
						tdist=tdist+cp.fix_lpp
					if not(cp.fix_lpp):
						tdist=tdist+cp.len_prev_pillar
					cp=cp.parent_id
				d=distance2points(base_pills[i].latitude,base_pills[i].longitude,base_pills[i+1].latitude,base_pills[i+1].longitude)
				k=d/tdist
				tdlat=base_pills[i+1].latitude-base_pills[i].latitude
				tdlng=base_pills[i+1].longitude-base_pills[i].longitude
				tdlatpm=tdlat/d
				tdlngpm=tdlng/d
				cp=base_pills[i]
				cdist=0
				while not(cp==base_pills[i+1]):
					if cp.fix_lpp:
						cdist=cdist+cp.fix_lpp
					if not(cp.fix_lpp):
						cdist=cdist+cp.len_prev_pillar
					latitude=base_pills[i].latitude+tdlatpm*cdist*k
					longitude=base_pills[i].longitude+tdlngpm*cdist*k
					cp.parent_id.latitude=latitude
					cp.parent_id.longitude=longitude
					cp=cp.parent_id
			tap.sys_pil_fix_lpp()
			tlr.fix_end()
class uis_papl_apl_cable(models.Model):
	_name='uis.papl.apl.cable'
	name=fields.Char(string="Name")

class uis_papl_apl_pil_type(models.Model):
	_name='uis.papl.apl.pil_type'
	name=fields.Char(string="Name")
	apl_id=fields.Many2one('uis.papl.apl', string='APL')
	#apl_id_nom=fields.Integer(string="aplid")
	pillar_type_id=fields.Many2one('uis.papl.pillar.type', string="Type")
	cnt=fields.Integer(string="Pillar counts")
	numbers=fields.Char(string="Pillars numbers")

	def calc_def_apl(self,apl):
		types={}
		napt_ids=[]
		for pil in apl.pillar_id.sorted(key=lambda r:str(r.tap_id.id).zfill(3)+"_"+str(r.num_by_vl).zfill(3), reverse=False):
			tid=pil.pillar_type_id.id
			if not(tid):
				tid=0
			if not(tid in types):
				types[tid]={}
				types[tid]["cnt"]=0
				types[tid]["type"]=False
				if tid>0:
					types[tid]["type"]=pil.pillar_type_id
				types[tid]["str"]=str(pil.num_by_vl)
			else:
				types[tid]["str"]+=", "+str(pil.num_by_vl)
			if not(pil.tap_id.is_main_line):
				types[tid]["str"]+="("+str(pil.tap_id.num_by_vl)+")"
			types[tid]["cnt"] +=1
		domain=[("apl_id.id","=",apl.id)]
		for apt in self.sudo().search(domain):
			atid=apt.pillar_type_id.id
			if not(atid):
				atid=0
			if atid in types:
				napt_ids.append(apt.id)
				apt.write({
					'numbers':types[atid]["str"],
					'cnt':types[atid]["cnt"]
				})
				del types[atid]
			else:
				apt.unlink()
		for t in types:
			if not(types[t]["type"]):
				ptid=None
			else:
				ptid=types[t]["type"].id
			napt=self.sudo().create({
							  'cnt':types[t]["cnt"],
							  'numbers':types[t]["str"],
							  'pillar_type_id':ptid,
							  'apl_id':apl.id})
			napt.write({})
		return napt_ids

class uis_papl_apl_pil_materials(models.Model):
	_name='uis.papl.apl.pil_materials'
	name=fields.Char(string="Name")
	apl_id=fields.Many2one('uis.papl.apl', string='APL')
	pillar_material_id=fields.Many2one('uis.papl.pillar.material', string="Material")
	cnt=fields.Integer(string="Pillar counts")
	numbers=fields.Char(string="Pillars numbers")
	
	def calc_def_apl(self,apl):
		materials={}
		napm_ids=[]
		for pil in apl.pillar_id.sorted(key=lambda r:str(r.tap_id.id).zfill(3)+"_"+str(r.num_by_vl).zfill(3), reverse=False):
			mid=pil.pillar_material_id.id
			if not(mid):
				mid=0
			if not(mid in materials):
				materials[mid]={}
				materials[mid]["cnt"]=0
				materials[mid]["material"]=False
				if mid>0:
					materials[mid]["material"]=pil.pillar_material_id
				materials[mid]["str"]=str(pil.num_by_vl)
			else:
				materials[mid]["str"]+=", "+str(pil.num_by_vl)
			if not(pil.tap_id.is_main_line):
				materials[mid]["str"]+="("+str(pil.tap_id.num_by_vl)+")"
			materials[mid]["cnt"] +=1
		domain=[("apl_id.id","=",apl.id)]
		for apm in self.sudo().search(domain):
			amid=apm.pillar_material_id.id
			if not(amid):
				amid=0
			if amid in materials:
				napm_ids.append(apm.id)
				apm.write({
					'numbers':materials[amid]["str"],
					'cnt':materials[amid]["cnt"]
				})
				del materials[amid]
			else:
				apm.unlink()
		for m in materials:
			if not(materials[m]["material"]):
				pmid=None
			else:
				pmid=materials[m]["material"].id
			napm=self.sudo().create({
							  'cnt':materials[m]["cnt"],
							  'numbers':materials[m]["str"],
							  'pillar_material_id':pmid,
							  'apl_id':apl.id})
			napm.write({})
		return napm_ids
#pillar_material_id=fields.Many2one('uis.papl.pillar.material', string="Material")


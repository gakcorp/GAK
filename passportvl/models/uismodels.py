# -*- coding: utf-8 -*-
import math, urllib, json, time, random
from openerp import models, fields, api
from PIL import Image, ImageDraw
from . import schemeAPL
from . import schemeAPL_v2
from scheme_apl_v3 import drawscheme
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
	apl_scheme=fields.Binary(string="APLs Scheme", compute='_get_scheme_image')
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
	
	def _get_scheme_image(self):
		for ss in self:
			ss.apl_scheme=drawscheme(ss.apl_id, drawTS=True, drawPS=True, drawScale=True, sizeTS=10, annotateTS=False)
			
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
	def act_show_new_map(self):
		return{
			'name': 'Maps',
			'res_model':'ir.actions.act_url',
			'type':'ir.actions.act_url',
			'target':'new',
			'url':'/maps'
			}

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

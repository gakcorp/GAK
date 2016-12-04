# -*- coding: utf-8 -*-
import math, urllib, json, time, random
from openerp import models, fields, api
from openerp.osv import osv
from PIL import Image, ImageDraw
from . import schemeAPL
from . import schemeAPL_v2
from . import uis_papl_logger
from . import uismodels
import logging
import datetime
import openerp
import googlemaps
import json
import numpy as np
#from plotly.offline import download_plotlyjs, init_notebook_mode, iplot, plot
#from plotly.graph_objs import *
import matplotlib as mpl
mpl.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import cm
import StringIO
import cStringIO



distance2points=uismodels.distance2points
distangle2points=uismodels.distangle2points

_ulog=uis_papl_logger.ulog
_logger=logging.getLogger(__name__)
_logger.setLevel(10)

cv_tap_empty_apl=openerp._('*NOAPL*')
cv_tap_empty_conn_pillar=openerp._('*NOPIL*')
cv_tap_empty_num_vl=openerp._('*NONUM*')
cv_tap_abbr_ml=openerp._('ML')
cv_tap_abbr_tap=openerp._('T')

class uis_papl_tap_elevation(models.Model):
	_name = 'uis.papl.tap.elevation'
	tap_id=fields.Many2one('uis.papl.tap', string='TAP')
	dist=fields.Float(digits=(6,2), string="Distance from start")
	latitude=fields.Float(digits=(2,6), string="Latitude")
	longitude=fields.Float(digits=(2,6), string="Longitude")
	elevation=fields.Float(digits=(2,6), string="Elevation")
	resolution=fields.Float(digits=(2,6), string="Resolution")
	
	def add_ne(self,tap):
		key='AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI' #NUPD load from settings
		client=googlemaps.Client(key)
		qnt_point_perpil=3 #NUPD Load from settings
		_logger.debug(tap.id)
		_logger.debug('Start for tap %r'%unicode(tap.name))
		qnt_point=qnt_point_perpil*tap.pillar_cnt
		res=[]
		try:
			res=googlemaps.client.elevation_along_path(client,str(tap.tap_encode_path),qnt_point)
		except googlemaps.exceptions.ApiError:
			_logger.debug('error')
		dd=tap.line_len_calc/qnt_point
		el_ids=[]
		i=0
		for item in res:
				resol=item['resolution']
				elv=item['elevation']
				lat=item['location']['lat']
				lng=item['location']['lng']
				dist=i*dd
				i+=1
				nelv=self.sudo().create({
							'tap_id':tap.id,
							'dist':dist,
							'latitude':lat,
							'longitude':lng,
							'elevation':elv,
							'resolution':resol
				})
				nelv.write({})
				el_ids.append(nelv)
				_logger.debug(nelv)
		return el_ids
		

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
	tap_encode_path=fields.Text(string='Google API pillar path decode', compute='_get_pillar_path')
	tap_elevation_json=fields.Text(string='Elevation data', compute='_get_tap_elv_txt')
	tap_pillar_elevation_json=fields.Text(string='Pillar elevation data', compute='_get_pillar_path')
	#tap_elevation_ids=fields.One2many('uis.papl.tap.elevation', 'tap_id', string="Elevations", compute='_get_tap_elevations')
	profile_image=fields.Binary(string="Profile", compute='_get_profile')
	
	@api.depends('tap_elevation_json','tap_pillar_elevation_json')
	def _get_profile(self):
		tlr=_ulog(self, code='CALC_TAP_PRFL', lib=__name__, desc='Calculate elevation profile for tap')
		for tap in self:
			tlr.add_comment('[%r] Calculete for tap %r'%(tap.id, tap.name))
			#init_notebook_mode()
			N=500
			x=[]
			y=[]
			#_logger.debug(json.dump())
			for dt in json.loads(tap.tap_elevation_json):
				x.append(dt['d'])
				y.append(dt['e'])
			px,py=[],[]
			for dt in json.loads(tap.tap_pillar_elevation_json):
				px.append(dt['d'])
				py.append(dt['e'])
				px.append(dt['d'])
				py.append(dt['e']+dt['h'])
			wx,wy=[],[]
			for dt in json.loads(tap.tap_pillar_elevation_json):
				wx.append(dt['d'])
				wy.append(dt['e']+dt['h'])
			#myarray=x+y
			
			#fig=plt.figure()
			#ax=fig.add_subplot(111)
			#ax.plot(range(10))
			
			'''x = np.linspace(0, 2 * np.pi, 900)
			y = np.linspace(0, 2 * np.pi, 600).reshape(-1, 1)
			myarray = np.sin(x) + np.cos(y)'''
			
			#p=plt()
			#x = np.linspace(0, 10)
			line, = plt.plot(x, y, '-', linewidth=2)

			#dashes = [10, 5, 100, 5]  # 10 points on, 5 off, 100 on, 5 off
			#line.set_dashes(dashes)
			background_stream = StringIO.StringIO()
			#fig=plt.figure()
			plt.show()
			plt.savefig(background_stream)
			#image1 = Image.fromarray(np.uint8(cm.gist_earth(myarray)*255))
			
			#image1.save(background_stream, format="PNG")
			tap.profile_image=background_stream.getvalue().encode('base64')
			#_logger.debug(d)
		tlr.fix_end()
	@api.depends('tap_encode_path')
	def _get_tap_elv_txt(self):
		tlr=_ulog(self,code='CALC_TAP_ELTX', lib=__name__,desc='Calculate tap elevations to text')
		key='AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI' #NUPD load from settings
		client=googlemaps.Client(key)
		for tap in self:
			tlr.add_comment('[%r] Get elevation'%tap.id)
			qnt_point_perpil=10 #NUPD Load from settings
			qnt_point=min(512,qnt_point_perpil*tap.pillar_cnt)
			
			res=[]
			try:
				res=googlemaps.client.elevation_along_path(client,str(tap.tap_encode_path),qnt_point)
			except googlemaps.exceptions.ApiError:
				_logger.debug('error')
				tlr.add_comment('[E] error for tap (%r)%r'%(tap.id,tap.name))
			dd=tap.line_len_calc/qnt_point
			cd=dd
			elvs=[]
			for it in res:
				elv={
					'd':cd,
					'lat':it['location']['lat'],
					'lng':it['location']['lng'],
					'e':it['elevation'],
				}
				cd+=dd
				elvs.append(elv)
			#tap.tap_elevation_ids.unlink()
			tap.tap_elevation_json=json.dumps(elvs)
		tlr.fix_end()
		
	def _get_pillar_path(self):
		tlr=_ulog(self,code='CALC_TAP_PATH',lib=__name__,desc='Calculate encode polyline for tap')
		i=0
		for tap in self:
			i+=1
			points=[]
			tlr.add_comment('[%r] Calculate path for tap id %r'%(i,tap.id))
			ep=None
			elvs=[]
			cd=0
			if tap.pillar_cnt>0:
				for pil in tap.pillar_ids.sorted(key=lambda r:r.num_by_vl, reverse=False):
					point={
						'lat':pil.latitude,
						'lng':pil.longitude
					}
					points.append(point)
					ep=pil
					cd+=pil.len_prev_pillar
					elv={
						'd':cd,
						'lat':pil.latitude,
						'lng':pil.longitude,
						'e':pil.elevation,
						'h':10
					}
					elvs.append(elv)
					
					
				
				if ep.parent_id:
					point={
						'lat':ep.parent_id.latitude,
						'lng':ep.parent_id.longitude
					}
					points.append(point)
				path=googlemaps.convert.encode_polyline(points)
				tap.tap_encode_path=path
				tap.tap_pillar_elevation_json=json.dumps(elvs)
				#NUPD delete
		tlr.set_qnt(i)
		tlr.fix_end()
		
		
		
	@api.depends('num_by_vl','apl_id','conn_pillar_id')
	def _get_tap_full_name(self):
		#variables:
		#tn = num tap on APL
		#aml = abbriviation of main line
		#atp = abbriviation of tap
		#an = APL Name
		#cp = num connected pillar

		empapl=self.env.user.employee_papl_ids
		for tap in self:
			dname=''
			atp=empapl.code_abbr_tap or cv_tap_abbr_tap
			aml=empapl.code_abbr_ml or cv_tap_abbr_ml
			tn=empapl.code_empty_tap_num_vl or cv_tap_empty_num_vl
			cp=empapl.code_empty_tap_conn_pillar or cv_tap_empty_conn_pillar
			an=empapl.code_empty_tap_apl or cv_tap_empty_apl
			if (tap.num_by_vl>0):
				tn=str(tap.num_by_vl)
			if tap.conn_pillar_id:
				cp=str(tap.conn_pillar_id.num_by_vl)
			if tap.apl_id:
				an=unicode(tap.apl_id.name)
			def_frm_tap=empapl.disp_tap_frm or ('atp+"."+tn+"."+cp+"."+an')
			def_frm_ml=empapl.disp_ml_frm or ('aml+"."+an')
			ex_frm=def_frm_tap
			if tap.is_main_line:
				ex_frm=def_frm_ml
			dname=eval(ex_frm)
			tap.name=dname
			
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
		tlr.fix_end()
		return npil
	
	def create_new_tap(self):
		tlr=_ulog(self,code='ADD_NE_TP',lib=__name__,desc='Create new TAP')
		for tap in self:
			now=datetime.datetime.now()
			nt=self.create({'name':'NewCNC PIllar DT'+str(now)})
			nt.apl_id=self.apl_id
			tlr.add_comment('[*] Add new tap id=%r',nt.id)
		tlr.fix_end()
		return nt
		
	@api.depends('code')
	def _get_unicode(self,cr,uid,ids,context=None):
		for tap in self.browse(cr,uid,ids,context=context):
			tap.full_code='XTR.'+str(tap.code)
			tap.code=tap.num_by_vl
	
	def _get_num_by_vl(self):
		for tap in self:
			tap.apl_id.define_taps_num()
	
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
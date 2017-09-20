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
import matplotlib as mpl
mpl.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import cm
from mpl_toolkits.mplot3d import Axes3D
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
	spec_name=fields.Char(string="Special Name")
	full_name=fields.Char()
	apl_id=fields.Many2one('uis.papl.apl', string='APL')
	cnt_np=fields.Integer(compute='_get_cnt_np', string='Pillars wo prev')
	pillar_cnt=fields.Integer(compute='_get_cnt_np', string='Total pillars')
	pillar_ids=fields.One2many('uis.papl.pillar','tap_id',string='Pillars')
	line_len_calc=fields.Float(digits=(6,2), compute='_tap_get_len', string="Tap lenght")
	is_main_line=fields.Boolean(string='is main line')
	num_by_vl=fields.Integer(string='Number', compute='_get_num_by_vl')
	conn_pillar_id=fields.Many2one('uis.papl.pillar', string='Connect Pilar', compute='_get_conn_pillar_id')
	code=fields.Integer(string='Code', compute='_get_unicode')
	full_code=fields.Char(string='UniCode', compute='_get_unicode')
	tap_encode_path=fields.Text(string='Google API pillar path decode', compute='_get_pillar_path')
	tap_elevation_json=fields.Text(string='Elevation data', compute='_get_tap_elv_txt')
	tap_pillar_elevation_json=fields.Text(string='Pillar elevation data', compute='_get_pillar_path')
	tap_surface_elevation_json=fields.Text(string='Tap surface elevation data', compute='_get_surface_data')
	#tap_elevation_ids=fields.One2many('uis.papl.tap.elevation', 'tap_id', string="Elevations", compute='_get_tap_elevations')
	profile_image=fields.Binary(string="Profile", compute='get_profile')
	profile_3d_image=fields.Binary(string="3D profile", compute='get_profile')
	rotate_x_3d=fields.Integer(string="x rotate 3D plot")
	rotate_y_3d=fields.Integer(string="y rotate #D plot")
	
	def reverse_tap(self):
		for tap in self:
			pillar_ids=tap.pillar_ids
			_logger.debug(pillar_ids)
			rev_pillar_ids=reversed(pillar_ids)
			_logger.debug(rev_pillar_ids)
			for pil in rev_pillar_ids:
				_logger.debug(pil.id)
				
	@api.depends('tap_encode_path')
	def _get_surface_data(self):
		point_per_ax=22
		hcode_key='AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI' #NUPD load from settings
		key= self.env['uis.global.settings'].get_value('uis_google_api_key') or hcode_key
		client=googlemaps.Client(key)
		for tap in self:
			tej=json.loads(tap.tap_elevation_json)
			minlat,minlng=1000,1000
			maxlat,maxlng=0,0
			for el in tej:
				lat=el['lat']
				lng=el['lng']
				if lat<minlat:
					minlat=lat
				if lat>maxlat:
					maxlat=lat
				if lng<minlng:
					minlng=lng
				if lng>maxlng:
					maxlng=lng
			_logger.debug('values %r,%r,%r,%r'%(minlat,maxlat,minlng,maxlng))
			clat=minlat
			clnn=minlng
			dlat=(maxlat-minlat)/point_per_ax
			dlng=(maxlng-minlng)/point_per_ax
			points=[]
			while clat<maxlat:
				point={
						'lat':clat,
						'lng':minlng
					}
				points.append(point)
				point={
						'lat':clat,
						'lng':maxlng
					}
				points.append(point)
				clat+=dlat
			path=googlemaps.convert.encode_polyline(points)
			res=[]
			try:
				res=googlemaps.client.elevation_along_path(client,str(path),512)
			except googlemaps.exceptions.ApiError:
				_logger.debug('error')
				tlr.add_comment('[E] error for tap (%r)%r'%(tap.id,tap.name))
			elvs=[]
			
			for it in res:
				elv={
					'lat':it['location']['lat'],
					'lng':it['location']['lng'],
					'e':it['elevation'],
				}
				elvs.append(elv)
			tap.tap_surface_elevation_json=json.dumps(elvs)
			

	@api.depends('tap_elevation_json','tap_pillar_elevation_json')
	def get_profile(self):
		tlr=_ulog(self, code='CALC_TAP_PRFL', lib=__name__, desc='Calculate elevation profile for tap')
		for tap in self:
			tlr.add_comment('[%r] Calculete for tap %r'%(tap.id, tap.name))
			#init_notebook_mode()
			N=500
			x=[]
			y=[]
			#_logger.debug(json.dump())
			if tap.pillar_cnt>1:
				for dt in json.loads(tap.tap_elevation_json):
					x.append(dt['d'])
					y.append(dt['e'])
				px,py=[],[]
				for dt in json.loads(tap.tap_pillar_elevation_json):
					px.append(dt['d'])
					py.append(dt['e'])
					#px.append(dt['d'])
					#py.append(dt['e']+dt['h'])
				wx,wy=[],[]
				for dt in json.loads(tap.tap_pillar_elevation_json):
					wx.append(dt['d'])
					wy.append(dt['e']+dt['h'])
				
				mx=max(x)
				my=max(wy)
				
				fig, ax = plt.subplots(figsize=(math.ceil(mx/200),math.ceil(my/30)))
				fig,ax=plt.subplots(figsize=(20,10))
				ax.plot(x,y,'b-')
				ax.plot(px,py,'ro')
				#ax.plot(wx,wy,'g--')
				ax.set_xlim((0,mx))
				ax.spines['top'].set_visible(False)
				ax.spines['right'].set_visible(False)
				background_stream = StringIO.StringIO()
				fig.savefig(background_stream, format='png', dpi=100, transparent=True)
				tap.profile_image=background_stream.getvalue().encode('base64')
				#3D
				fig3d=plt.figure()
				ax3d=fig3d.gca(projection='3d')
				px3,py3,pz3=[],[],[]
				for pp in json.loads(tap.tap_elevation_json):
					px3.append(pp['lat'])
					py3.append(pp['lng'])
					pz3.append(pp['e'])
				pex3,pey3,pez3,pez3h=[],[],[],[]
				for pep in json.loads(tap.tap_pillar_elevation_json):
					pex3.append(pep['lat'])
					pey3.append(pep['lng'])
					pez3.append(pep['e'])
					pez3h.append(pep['e']+pep['h'])
				sx,sy,sz=[],[],[]
				for sp in json.loads(tap.tap_surface_elevation_json):
					sx.append(sp['lat'])
					sy.append(sp['lng'])
					sz.append(sp['e'])
				#_logger.debug(sz)
				
				n_angles = 36
				n_radii = 8
				
				# An array of radii
				# Does not include radius r=0, this is to eliminate duplicate points
				radii = np.linspace(0.125, 1.0, n_radii)
				
				# An array of angles
				angles = np.linspace(0, 2*np.pi, n_angles, endpoint=False)
				
				# Repeat all angles for each radius
				angles = np.repeat(angles[..., np.newaxis], n_radii, axis=1)
				
				# Convert polar (radii, angles) coords to cartesian (x, y) coords
				# (0, 0) is added here. There are no duplicate points in the (x, y) plane
				x = np.append(0, (radii*np.cos(angles)).flatten())
				y = np.append(0, (radii*np.sin(angles)).flatten())
				
				# Pringle surface
				z = np.sin(-x*y)
				#ax3d.plot_trisurf(x, y, z, cmap=cm.jet, linewidth=0.2)
				ax3d.scatter(sx,sy,sz,c='g',marker='.',s=2)
				ax3d.plot(px3,py3,pz3,label="3d profile")
				ax3d.scatter(pex3,pey3,pez3,c='b',marker='+')
				#ax3d.scatter(pex3,pey3,pez3h,c='r',marker='o')
				#surf=ax3d.plot_surface(x, y, z, rstride=1, cstride=1, cmap=cm.coolwarm,linewidth=1, antialiased=False)
				#_logger.debug(surf)
				
				#ax3d.plot_trisurf(X=sx,Y=sy,Z=sz)
				
				#ax3d.view_init(tap.rotate_x_3d, tap.rotate_y_3d)
				ax3d.set_xticks([]) 
				ax3d.set_yticks([])
				
				#ax.plot_trisurf(x, y, z, cmap=cm.jet, linewidth=0.2)
				
				background_stream_3d = StringIO.StringIO()
				fig3d.savefig(background_stream_3d, format='png', dpi=100, transparent=True)
				#plt.savefig(background_stream)
				tap.profile_3d_image=background_stream_3d.getvalue().encode('base64')
		tlr.fix_end()
	
	@api.onchange('rotate_x_3d','rotate_y_3d')
	def onchange_rotate(self):
		for tap in self:
			tap.get_profile(tap)
	@api.multi
	def act_rx_plus(self):
		for tap in self:
			tap.rotate_x_3d+=5
	
	@api.multi
	def act_rx_minus(self):
		for tap in self:
			tap.rotate_x_3d-=5
	@api.multi
	def act_ry_plus(self):
		for tap in self:
			tap.rotate_y_3d+=5
	
	@api.multi
	def act_ry_minus(self):
		for tap in self:
			tap.rotate_y_3d-=5
	
	@api.onchange('tap_encode_path')
	def onchangetapencodepath(self):
		for tap in self:
			_logger.debug('NUPD')
			
	@api.depends('tap_encode_path')
	def _get_tap_elv_txt(self):
		tlr=_ulog(self,code='CALC_TAP_ELTX', lib=__name__,desc='Calculate tap elevations to text')
		key='AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI' #NUPD load from settings
		client=googlemaps.Client(key)
		for tap in self:
			tlr.add_comment('[%r] Get elevation'%tap.id)
			qnt_point_perpil=10 #NUPD Load from settings
			qnt_point=min(512,qnt_point_perpil*tap.pillar_cnt)
			
			_logger.debug('tap points %r is %r qnt_points is %r'%(tap,tap.pillar_cnt,qnt_point))
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
					
					if pil.parent_id:
						if pil.parent_id.tap_id!=tap:
							point={'lat':pil.parent_id.latitude,
								   'lng':pil.parent_id.longitude}
							points.append(point)
					point={
						'lat':pil.latitude,
						'lng':pil.longitude
					}
					points.append(point)
					#ep=pil
					cd+=pil.len_prev_pillar
					elv={
						'd':cd,
						'lat':pil.latitude,
						'lng':pil.longitude,
						'e':pil.elevation,
						'h':6
					}
					elvs.append(elv)
				path=googlemaps.convert.encode_polyline(points)
				tap.tap_encode_path=path
				tap.tap_pillar_elevation_json=json.dumps(elvs)
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
			cpn=empapl.code_empty_tap_conn_pillar or cv_tap_empty_conn_pillar
			an=empapl.code_empty_tap_apl or cv_tap_empty_apl
			if (tap.num_by_vl>0):
				tn=str(tap.num_by_vl)
			if tap.conn_pillar_id:
				cp=str(tap.conn_pillar_id.num_by_vl)
				cpn=unicode(tap.conn_pillar_id.name)
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
			tlr.add_comment('[*] Tap id = %r'%tap.id)	
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
			#tlr.add_comment('[*] Add new tap id=%r'%nt.id)
		tlr.fix_end()
		return nt
		
	@api.depends('code')
	def _get_unicode(self,cr,uid,ids,context=None):
		for tap in self.browse(cr,uid,ids,context=context):
			tap.full_code='XTR.'+str(tap.code)
			tap.code=tap.num_by_vl
	
	def _get_conn_pillar_id(self):
		for tap in self:
			pils=tap.pillar_ids.filtered(lambda r: r.parent_id.tap_id <> tap)
			if pils:
				for pil in pils:
					tap.conn_pillar_id=pil.parent_id
			
	def _get_num_by_vl(self):
		for tap in self:
			tap.apl_id.define_taps_num()
			_logger.debug('Tap %r is connected to pillar %r'%(tap.name,tap.conn_pillar_id.name))
	
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
				#_logger.debug(t_pillar)
				if not(pillar.parent_id):
					cnt=cnt+1
			tap.cnt_np=cnt
			tap.pillar_cnt=t_pillar
			
	
	@api.multi
	def get_elevation(self):
		for tap in self:
			tap.pillar_ids._get_elevation()

	@api.multi
	def do_pillar_apl_id_by_tap(self):
		for pillar in self.pillar_ids:
			if pillar.apl_id != self.apl_id:
				pillar.apl_id=self.apl_id
	
	@api.multi
	def act_normalize_num(self):
		tlr=_ulog(self,code='CALC_NRML_NUM_TAP', lib=__name__,desc='Start normalize num by tap (for tap id=%r)'%(self.id))
		max_num=0
		for tap in self:
			pillars=tap.pillar_ids
			pillar_cnt=len(pillars)
			max_num=max(pillars.mapped('num_by_vl'))
			#cp=filter(lambda pil: pil.num_by_vl == max_num, pillars)
			lp=pillars.filtered(lambda r: r.num_by_vl == max_num)
			tlr.add_comment('[1] Last pillar is %r'%lp.id)
			tlr.add_comment('[2] Max number is %r'%max_num)
			if pillars and lp:
				cp=lp
				num=pillar_cnt
				while cp and (num>0) and (cp.tap_id==tap):
					if cp.num_by_vl<>num:
						cp.num_by_vl=num
					num-=1
					cp=cp.parent_id
					#_logger.debug("Set to Pillar id: %r num_by_vl value is %r"%(cp.id,num))
		tlr.set_qnt(pillar_cnt)
		tlr.fix_end()
	@api.multi #NUPD Сhange define last_pillar, pillar_cnt and p
	
	def sys_pil_fix_lpp(self):
		for tap in self:
			for pil in tap.pillar_ids:
				pil.sys_fix_lpp()
	
	@api.multi
	def do_normal_magni(self,cr,uid,ids,context=None,pillar=None):
		for tap in self:
			if not(pillar):
				tap.act_normalize_num()
			#basepillars_ids=tap.pillar_ids.search(cr,uid,[],context=context)
			tlr=_ulog(self,code='CLC_DO_NRML_MGNF_TAP',lib=__name__,desc='Start normalize for magnify for TAP id=%r)'%(tap.id))
			base_pills=[]
			if not(pillar):
				for pil in tap.pillar_ids.filtered(lambda r: r.pillar_type_id.base == True).sorted(key=lambda r: r.num_by_vl, reverse=True):
					base_pills.append(pil)
				if tap.conn_pillar_id:
					base_pills.append(tap.conn_pillar_id)
			if pillar:
				if pillar.next_base_pillar_id:
					base_pills.append(pillar.next_base_pillar_id)
				base_pills.append(pillar)
				if pillar.prev_base_pillar_id:
					base_pills.append(pillar.prev_base_pillar_id)
			cnt_base_pills=len(base_pills)
			tlr.set_qnt(cnt_base_pills)
			for i in range(0,cnt_base_pills-1):
				cp=base_pills[i]
				tdist=0
				while cp and not(cp==base_pills[i+1]):
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
					if cp.parent_id.latitude<>latitude:
						cp.parent_id.latitude=latitude
					if cp.parent_id.longitude<>longitude:
						cp.parent_id.longitude=longitude
					cp=cp.parent_id
			tap.sys_pil_fix_lpp()
			tlr.fix_end()
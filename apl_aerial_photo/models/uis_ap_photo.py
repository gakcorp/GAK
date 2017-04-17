# -*- coding: utf-8 -*-
import openerp
import math, urllib, json, time, random
import os, exifread
import re
from PIL import Image
import base64
import psycopg2
from openerp import models, fields, api, tools
from datetime import datetime
import logging
import matplotlib as mpl
mpl.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from shapely.geometry import Point
from shapely.geometry.polygon import Polygon
import googlemaps
from openerp.addons.passportvl.models.uismodels import distance2points
from openerp.addons.passportvl.models.uismodels import distangle2points
from libxmp.utils import file_to_dict
import cv2
import numpy as np

'''try:
    import cStringIO as StringIO
except ImportError:'''
import StringIO
import cStringIO
from openerp.addons.passportvl.models import uis_papl_logger
_ulog=uis_papl_logger.ulog

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

def dms2dd(degrees,minutes,seconds, direction):
	dd=float(degrees)+float(minutes)/60+float(seconds)/(60*60)
	if direction == 'S' or direction =='W':
		dd *=-1
	#_logger.debug('For deg,min,sec,dir (%r,%r,%r,%r) coordinate is (%r)'%(degrees,minutes,seconds,direction,dd))
	return dd

def parse_dms(dms,direction):
	parts=re.split('[^\d\w]+',dms)
	p1=parts[1]
	p2=parts[2]
	p3=parts[3]
	p4=parts[4]
	if p1=='':
		p1=0
	if p2=='':
		p2=0
	if p3=='':
		p3=0
	if p4=='':
		p4=1
	#_logger.debug('Parts of dms %r is %r,%r,%r,%r'%(dms,p1,p2,p3,p4))
	dd=dms2dd(p1,p2,float(p3)/float(p4),direction)
	#_logger.debug('Parts of coordinates %s'%parts);
	return dd

def parse_date(str_date):
	parts=re.findall(r"[\d']+", str_date)
	rdate= datetime.strptime(str(str_date),'%Y:%m:%d %H:%M:%S')
	return rdate

def strdiv(strdiv):
	#print strdiv
	parts=re.findall(r"[\d']+",str(strdiv))
	#print parts
	rval=float(parts[0])/float(parts[1])
	return rval

def point_in_triangle(lat,lng,tripoints):
	return 0
def latlng_from_point(lat,lng,direction=0,distance=0):
	R=6378.1
	latr,lngr=-1,-1
	dirm=math.radians(direction)
	lat0=math.radians(lat)
	lng0=math.radians(lng)
	d=distance/1000
	latr=math.asin(math.sin(lat0)*math.cos(d/R)+math.cos(lat0)*math.sin(d/R)*math.cos(dirm))
	lngr =lng0+math.atan2(math.sin(dirm)*math.sin(d/R)*math.cos(lat0),math.cos(d/R)-math.sin(lat0)*math.sin(latr))
	return math.degrees(latr),math.degrees(lngr)
def get_vis_points(lat,lng,l1,l2,yaw,ang,segments):
	points=[]
	dangle=ang/segments
	cur_angle=yaw-ang/2
	i=1
	kk=1
	#_logger.debug('Get visual data for point lat=%r lng=%r'%(lat,lng))
	while i<=segments:
		latp,lngp=latlng_from_point(lat,lng,cur_angle,l1)
		datap={'lat':latp,'lng':lngp}
		points.append(datap)
		cur_angle+=dangle
		#_logger.debug('%r get values lat lng for visible area angle=%r (lat=%r, lng=%r)'%(i,cur_angle,latp,lngp))
		i+=1
	i=1
	if (l1*l2<0):
		kk=-1
		cur_angle=yaw-ang/2
	while i<=segments:
		latp,lngp=latlng_from_point(lat,lng,cur_angle,l2)
		datap={
			'lat':latp,
			'lng':lngp}
		points.append(datap)
		#_logger.debug(points)
		cur_angle-=dangle*kk
		#_logger.debug('%r get values lat lng for visible area angle=%r (lat=%r, lng=%r)'%(i,cur_angle,latp,lngp))
		i+=1
	if (l1*l2<0):
		cur_angle=yaw-ang/2
	latp,lngp=latlng_from_point(lat,lng,cur_angle,l1)
	datap={'lat':latp,'lng':lngp}
	points.append(datap)
	return points
def triangle_points(lat,lng,direction,angle,distance):
	#points=[]
	#R=6378.1
	#dirm=math.radians(direction)
	#dir1=math.radians(direction-angle/2)
	#dir2=math.radians(direction+angle/2)
	#d=distance/1000
	#lat0=math.radians(lat)
	#lng0=math.radians(lng)
	#latm,lngm=latlng_from_point(lat,lng,direction,distance)
	#lat1,lng1=latlng_from_point(lat,lng,direction-angle/2,distance)
	#lat2,lng2=latlng_from_point(lat,lng,direction+angle/2,distance)
	#latm=math.asin(math.sin(lat0)*math.cos(d/R)+math.cos(lat0)*math.sin(d/R)*math.cos(dirm))
	#lngm =lng0+math.atan2(math.sin(dirm)*math.sin(d/R)*math.cos(lat0),math.cos(d/R)-math.sin(lat0)*math.sin(latm))
	#lat1=math.asin(math.sin(lat0)*math.cos(d/R)+math.cos(lat0)*math.sin(d/R)*math.cos(dir1))
	#lng1 =lng0+math.atan2(math.sin(dir1)*math.sin(d/R)*math.cos(lat0),math.cos(d/R)-math.sin(lat0)*math.sin(lat1))
	#lat2=math.asin(math.sin(lat0)*math.cos(d/R)+math.cos(lat0)*math.sin(d/R)*math.cos(dir2))
	#lng2 =lng0+math.atan2(math.sin(dir2)*math.sin(d/R)*math.cos(lat0),math.cos(d/R)-math.sin(lat0)*math.sin(lat2))
	#rval=[{'lat':lat,'lng':lng},
	#	{'lat':lat1,'lng':lng1},
	#	{'lat':latm,'lng':lngm},
	#	{'lat':lat2,'lng':lng2},
	#	{'lat':lat,'lng':lng}]
	rval=get_vis_points(lat,lng,15,distance,direction,angle,7)
	#yaw,ang,segments
	#_logger.debug(rval)
	return rval
def point_in_poly(lat,lng,poly):
	point = Point(lat, lng)
	poly_array=[]
	for d in poly:
		poly_array.append((d['lat'],d['lng']))
	polygon = Polygon(poly_array)
	res=polygon.contains(point)
	#_logger.debug(res)
	return res


class uis_ap_photo(models.Model):
	_name='uis.ap.photo'
	_description='Photo_apl'
	_order='image_date desc'
	name=fields.Char('Name')
	image=fields.Binary(string='Image')
	image_length=fields.Integer(string='Image Length')
	image_width=fields.Integer(string='Image Width')
	image_800=fields.Binary(string='Image800', compute='_get_800_img', store=True)
	image_400=fields.Binary(string='Image400', compute='_get_400_img', store=True)
	image_edge=fields.Binary(string='ImageEdge', compute='_get_edge_img')
	image_scheme=fields.Binary(string='Scheme position', compute='_get_scheme_position',store=True)
	focal_length=fields.Float(digits=(2,2), string="Focal Length")
	thumbnail=fields.Binary(string="Thumbnail")
	image_filename=fields.Char(string='Image file name')
	image_date=fields.Datetime(string='Image date')
	load_hist_id=fields.One2many('uis.ap.photo.load_hist','photo_ids','Load data')
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')
	altitude=fields.Float(digits=(2,2), string='Altitude')
	elevation_point=fields.Float(digits=(2,2), string="Ground Elevation", compute='_get_photo_elev', store=True)
	rotation=fields.Float(digits=(2,2),string='Rotation')
	view_distance=fields.Float(digits=(2,0), string='View distance', default=100)
	focal_angles=fields.Float(digits=(2,0), string='Focal angle', default=60)
	hash_summ=fields.Char(string='Hash summ', compute='_get_hash', store=True)
	xmp_data_json=fields.Text(string='XMP data')
	vd_min=fields.Float(digits=(2,0), string='Near visibility distance',default=10)
	vd_max=fields.Float(digits=(2,0), string='Distant visibility distance ',default=100)
	relative_altitude=fields.Float(digits=(2,0),string='Relative Altitude', default=12)
	visable_view_json=fields.Text(string='Visibility area', compute='_get_visable_view_json')
	vert_angle=fields.Float(digits=(2,0), string='Vertical angle', default=45)
	hori_angle=fields.Float(digits=(2,0), string='Horizontal angle', default=60)
	pillar_ids=fields.Many2many('uis.papl.pillar',
								relation='photo_pillar_rel',
								column1='photo_id',
								column2='pillar_id',
								compute='_get_photo_pillar')
	near_pillar_ids=fields.Many2many('uis.papl.pillar',
									 relation='photo_near_pillar',
									 column1='photo_id',
									 column2='pillar_id',
									 compute='_get_near_photo_pillar'
									 )
	next_photo_ids=fields.Many2many('uis.ap.photo',
								   realation='next_photo_ids',
								   column1='photo_id',
								   column2='next_photo_id',
								   compute='_get_next_photo')
	apl_ids=fields.Many2many('uis.papl.apl',
							 relation='photo_apl_rel',
							 column1='photo_id',
							 column2='apl_id',
							 compute='_get_photo_apl',
							 store=True
							 )
	near_apl_ids=fields.Many2many('uis.papl.apl',
							 relation='photo_near_apl',
							 column1='photo_id',
							 column2='apl_id',
							 compute='_get_near_photo_apl')
	near_transformer_ids=fields.Many2many('uis.papl.transformer',
										  relation='photo_near_trans',
										  column1='photo_id',
										  column2='transformer_id',
										  compute='_get_near_trans_ids')
	transformer_ids=fields.Many2many('uis.papl.transformer',
							relation='photo_trans_rel',
							column1='photo_id',
							column2='transformer_id',
							compute='_get_photo_trans')
	
	@api.onchange('latitude','longitude','rotation','vd_min','vd_max', 'relative_altitude', 'vert_angle', 'hori_angle')
	def _get_visable_view_json(self):
		for ph in self:
			lat=ph.latitude
			lng=ph.longitude
			l1=ph.vd_min
			l2=ph.vd_max
			yaw=ph.rotation
			ang_o=ph.hori_angle
			#_logger.debug('Get PS value (visibility area for lat=%r, lng=%r, minview=%r,maxview=%r,yaw=%r,ang_o=%r'%(lat,lng,l1,l2,yaw,ang_o))
			ps=get_vis_points(lat,lng,l1,l2,yaw,ang_o,7) #NUPD
			ph.visable_view_json=json.dumps(ps)
	def set_from_xmp_data(self):
		for ph in self:
			xmp=json.loads(ph.xmp_data_json)
			h,l0,l1,l2,a0,a1,a2=0,0,0,0,0,0,0
			ang_a,ang_b,ang_g,ang_d,ang_o=0,0,0,ph.vert_angle,ph.hori_angle
			if xmp:
				yaw=xmp['GimbalYawDegree']
				ph.rotation=yaw
				h=xmp['RelativeAltitude']
				ph.relative_altitude=h
				ang_a = math.radians(-xmp['GimbalPitchDegree']-xmp['FlightPitchDegree'])
				#insert code for define ang_d from xmp data
				ang_d=math.radians(ang_d)
				l1=h*math.tan(math.pi/2-ang_a-ang_d/2)
				ang=min(math.pi/2-0.001,math.pi/2-ang_a+ang_d/2)
				#_logger.debug(ang_d)
				l2=min(200,h*math.tan(ang)) #NUPD 200 to config
				ph.vd_min=l1
				ph.vd_max=l2
				l0=h*math.tan(math.pi/2-ang_a)
				
	def get_xmp_data(self):
		for ph in self:
			#_logger.debug('Load XMP data for photo %r'%ph.name)
			d = ph.with_context(bin_size=False).image.decode('base64')
			xmp_start = d.find('<x:xmpmeta')
			xmp_end = d.find('</x:xmpmeta')
			xmp_str = d[xmp_start:xmp_end+12]
			xmp_dict={}
			regex=r"drone-dji\:((?:[a-z][a-z0-9_]*))\=\"([+-]?\d*\.\d+)(?![-+0-9\.])\""
			xmp_atrs=re.finditer(regex,xmp_str,re.IGNORECASE)
			for matchNum, match in enumerate(xmp_atrs):
				vname,vv=match.groups()
				xmp_dict[vname]=float(vv)
			#_logger.debug(xmp_dict)
			ph.xmp_data_json=json.dumps(xmp_dict)
			'''
			{'FlightYSpeed': 0.6,
			'FlightRollDegree': 0.2,
			'GimbalYawDegree': 95.7,
			'RelativeAltitude': 13.2,
			'GimbalRollDegree': 0.0,
			'FlightYawDegree': 96.3,
			'FlightXSpeed': 0.4,
			'GimbalPitchDegree': -32.4,
			'FlightZSpeed': 0.0,
			'AbsoluteAltitude': 195.02,
			'FlightPitchDegree': 2.2}

			'''
			#	for groupNum in range(0, len(match.groups())):
			#		groupNum = groupNum + 1
			#		print ("Group {groupNum} found at {start}-{end}: {group}".format(groupNum = groupNum, start = match.start(groupNum), end = match.end(groupNum), group = match.group(groupNum)))
	@api.multi
	def action_get_xmp_data(self):
		self.get_xmp_data()
	
	@api.multi
	def action_set_from_xmp_data(self):
		self.set_from_xmp_data()
		
	@api.model
	def scheduler_rec_scheme(self):
		photo_ids=self.env['uis.ap.photo'].search([])
		for ph_id in random.sample(photo_ids,50):
			if not(ph_id.xmp_data_json):
				_logger.debug('Photo %r (%r) does not contain data from xmp meta '%(ph_id.name,ph_id.id))
				ph_id.get_xmp_data()
				ph_id.set_from_xmp_data()
			ph_id._get_scheme_position()
			ph_id._get_photo_apl()
			self.env.cr.commit()
			#_logger.debug(ph_id)
	
	@api.model		
	def scheduler_rec_scheme_old(self, cr, uid, context=None):
		#tlr=_ulog(self,code='CALC_PH_SHACT',lib=__name__,desc='Scheduled action for photos')
		photo_obj = self.pool.get(cr,uid,'uis.ap.photo',context=context)
		#Contains all ids for the model uis.ap.photo
		photo_ids = self.pool.get('uis.ap.photo').search(cr, uid, [])   
		#Loops over every record in the model uis.ap.photo
		i=1
		for ph_id in random.sample(photo_ids,100):
			i+=1
			ph=photo_obj.browse(cr, uid,ph_id ,context=context)
			#tlr.add_comment('[%r] Generate new scheme position for photo'%ph.id)
			ph._get_scheme_position()
			#tlr.add_comment('[%r] Recalculate apls for photo'%ph.id)
			ph._get_photo_apl()
			cr.commit()
		#tlr.set_qnt(i)
		#tlr.fix_end()
			
	@api.multi
	def rotate_plus(self):
		for ph in self:
			ph.rotation+=5
		
	@api.multi
	def rotate_minus(self):
		for ph in self:
			ph.rotation-=5

	@api.multi
	def generate_snap(self):
		for ph in self:
			ph._get_scheme_position()
			ph._get_photo_elev()
			ph._get_near_photo_apl()

	@api.depends('latitude','longitude')
	def _get_hash(self):
		for ph in self:
			res=None
			ph.hash_summ=res
		
	@api.depends('latitude','longitude')
	def _get_photo_elev(self):
		key='AIzaSyClGM7fuqSCiIXgp35PiKma2-DsSry3wrI' #NUPD load from settings uis_google_api_key
		client=googlemaps.Client(key)
		for ph in self:
			try:
				res=client.elevation((ph.latitude, ph.longitude))
				#_logger.debug('result google api elevation %r'%res)
			except googlemaps.exceptions.ApiError:
				pass
			for item in res:
				elv=item['elevation']
				ph.elevation_point = elv
		return True
	@api.depends('latitude','longitude','rotation','view_distance','focal_angles','near_pillar_ids','visable_view_json')
	def _get_scheme_position(self):
		#_logger.debug('Start')
		sch_w, sch_h,sch_dpi=8,6,200
		ms=14
		for photo in self:
			lines=[]
			fig, ax = plt.subplots(figsize=(sch_w,sch_h))
			pil_points=[]
			tr_points=[]
			near_pil_ids=[]
			for pil in photo.near_pillar_ids:
				ins=False
				if pil in photo.pillar_ids:
					ins=True
				pil_point={
					'lat':pil.latitude,
					'lng':pil.longitude,
					'n':pil.num_by_vl,
					'd':pil.azimut_from_prev,
					'ins':ins
				}
				if pil.parent_id:
					
					line={
						'lat1':pil.latitude,
						'lng1':pil.longitude,
						'lat2':pil.parent_id.latitude,
						'lng2':pil.parent_id.longitude
					}
					#_logger.debug(line)
					lines.append(line)
				pil_points.append(pil_point)
				near_pil_ids.append(pil.id)
			to_pils=self.env['uis.papl.pillar'].search([('parent_id','in', near_pil_ids),('id','not in', near_pil_ids)])
			for pil in to_pils:
				line={
					'lat1':pil.latitude,
					'lng1':pil.longitude,
					'lat2':pil.parent_id.latitude,
					'lng2':pil.parent_id.longitude
				}
				lines.append(line)
			for tr in photo.near_transformer_ids:
				ins=False
				if tr in photo.near_transformer_ids: #nupd transformer_ids
					ins=True
				tr_point={
					'lat':tr.latitude,
					'lng':tr.longitude,
					'd':tr.trans_stay_rotation,
					'ins':ins
				}
				if tr.pillar_id:
					for pil in tr.pillar_id:
						line={
							'lat1':pil.latitude,
							'lng1':pil.longitude,
							'lat2':tr.latitude,
							'lng2':tr.longitude
						}
						lines.append(line)
				tr_points.append(tr_point)	
			for line in lines:
				ax.plot([line['lng1'],line['lng2']],[line['lat1'],line['lat2']],'b-',color = '0.75')
			bpx=[d['lng'] for d in pil_points]
			bpy=[d['lat'] for d in pil_points]
			btx=[d['lng'] for d in tr_points] #get x points for transformers dict
			bty=[d['lat'] for d in tr_points] #get y points for transformers dict
			bpn=[d['n'] for d in pil_points]
			bpin=[d['ins'] for d in pil_points]
			ax.plot(btx,bty,'ws', markersize=ms)
			ax.plot(bpx,bpy,'wo', markersize=ms)
			
			for i,txt in enumerate(bpn):
				clr='black'
				if bpin[i]:
					clr='red'
				ax.annotate(txt,(bpx[i],bpy[i]),va="center",ha="center", size=8, color=clr)
			ax.plot(photo.longitude,photo.latitude,marker=(1,2,-photo.rotation),markersize=ms*1.5, markerfacecolor="white", markeredgecolor='red')
			ax.plot(photo.longitude,photo.latitude,'o',markersize=ms//2, markerfacecolor="white",markeredgecolor='red')
			ph_points=[]
			for ph in photo.next_photo_ids:
				ph_point={
					'lat':ph.latitude,
					'lng':ph.longitude,
					'd':ph.rotation
				}
				ph_points.append(ph_point)
				#tri_points=get_vis_points(ph.latitude,ph.longitude,15,ph.view_distance,ph.rotation,ph.focal_angles,7)
				#try:
				tri_points=json.loads(ph.visable_view_json)
				#except:
				#	_logger.debug('json error')
				ax.plot([d['lng'] for d in tri_points],[d['lat'] for d in tri_points],'--', color='#cccccc')
			
			ppx=[d['lng'] for d in ph_points]
			ppy=[d['lat'] for d in ph_points]
			ppa=[d['d'] for d in ph_points]
			for d in ph_points:
				ax.plot(d['lng'],d['lat'],marker=(1,2,-d['d']),markersize=ms*1.5, markerfacecolor="white", markeredgecolor='blue')
				ax.plot(d['lng'],d['lat'],marker='o', markersize=ms//2, markerfacecolor="white", markeredgecolor='blue')
			#ax.scatter(ppx,ppy,c='blue', angles=ppa)
			pil_points=[]
			#tri_points=triangle_points(photo.latitude,photo.longitude,photo.rotation,photo.focal_angles,photo.view_distance)
			#try:
			tri_points=json.loads(photo.visable_view_json)
			#_logger.debug(tri_points)
			#except:
			#	_logger.debug('json error')
			ax.plot([d['lng'] for d in tri_points],[d['lat'] for d in tri_points],'r-')
			ax.spines['top'].set_visible(False)
			ax.spines['right'].set_visible(False)
			ax.axis('off')
			ax.axis('equal')
			background_stream = StringIO.StringIO()
			fig.savefig(background_stream, format='png', dpi=sch_dpi, transparent=True)
			photo.image_scheme=background_stream.getvalue().encode('base64')
		return True
	@api.depends('image')
	def _get_800_img(self,cr,uid,ids,context=None):
		#tlr=_ulog(self,code='CALC_PH_GEN800',lib=__name__,desc='Generate (render) photo 800 px')
		i=0
		for ph in self.browse(cr,uid,ids,context=context):
			#_logger.debug(ph.id)
			#tlr.add_comment('[*] Generate image for photo id[%r]'%ph.id)
			img=tools.image.image_resize_image(ph.with_context(bin_size=False).image, size=(800,600))
			ph.image_800=img
			i=i+1
		#tlr.set_qnt(i)
		#tlr.fix_end()
		return True
	@api.depends('image')
	def _get_400_img(self,cr,uid,ids,context=None):
		#tlr=_ulog(self,code='CALC_PH_GEN400',lib=__name__,desc='Generate (render) photo 400 px')
		i=0
		for ph in self.browse(cr,uid,ids,context=context):
			#ph.image_400=tools.image.image_resize_image(ph.with_context(bin_size=False).image, size=(400,300))
			#ph.image_400=img
			#_logger.debug(ph.id)
#<<<<<<< HEAD
			#image = Image.open(StringIO.StringIO(ph.with_context(bin_size=False).image.decode('base64')))
			img=tools.image.image_resize_image(ph.with_context(bin_size=False).image, size=(400,300))
			##background_stream = StringIO.StringIO()
			#image.thumbnail((800,600))
			##image.thumbnail ((400,300), Image.ANTIALIAS)
			##image.save(background_stream, format="PNG")
			ph.image_400=img
#=======
#			if ph.image_800:
#				image = Image.open(StringIO.StringIO(ph.with_context(bin_size=False).image_800.decode('base64')))
#				background_stream = StringIO.StringIO()
				#image.thumbnail((800,600))
#				image.thumbnail ((400,300), Image.ANTIALIAS)
#				image.save(background_stream, format="PNG")
#				ph.image_400=background_stream.getvalue().encode('base64')
#>>>>>>> a04f42a3b5556ed840cb49b9e186b7e842211a2d
			
			# Use cv2 for resize image
			'''or_image=ph.with_context(bin_size=False).image.decode('base64')
			array=np.fromstring(or_image,np.uint8)
			ocvimg=cv2.imdecode(array,cv2.CV_LOAD_IMAGE_COLOR)
			res_image=cv2.resize(ocvimg,(400,300))
			ph.image_400=cv2.imencode('.jpg',res_image)[1].tostring().encode('base64')'''
			# end code
			
			#tlr.add_comment('[~] Generate for %r'%ph.id)
			i=i+1
		#tlr.set_qnt(i)
		#tlr.fix_end()
		return True
	
	 
	def _get_edge_img(self,cr,uid,ids,context=None):
		tlr=_ulog(self,code='CALC_PH_WIRE',lib=__name__,desc='Generate wire on photo')
		'''for ph in self.browse(cr,uid,ids,context=context):
			img=ph.with_context(bin_size=False).image.decode('base64')
			array=np.fromstring(img,np.uint8)
			ocvimg=cv2.imdecode(array,cv2.CV_LOAD_IMAGE_COLOR)
			grey=cv2.cvtColor(ocvimg,cv2.COLOR_BGR2GRAY)			
			edges=cv2.Canny(grey,200,230,apertureSize=3)
			minLineLength = 30
			maxLineGap = 8
			lines = cv2.HoughLinesP(edges,1,np.pi/180,230,minLineLength,maxLineGap,2)
			if lines is not None:
				for x1,y1,x2,y2 in lines[0]:
					cv2.line(ocvimg,(x1,y1),(x2,y2),(0,0,255),5)
			imedg=cv2.imencode('.jpg',ocvimg)[1].tostring().encode('base64')
			ph.image_edge=imedg
		tlr.fix_end()
		return True'''
	def _get_edge_img_cornes(self,cr,uid,ids,context=None):
		for ph in self.browse(cr,uid,ids,context=context):
			img=ph.with_context(bin_size=False).image_800.decode('base64')
			array=np.fromstring(img,np.uint8)
			ocvimg=cv2.imdecode(array,cv2.CV_LOAD_IMAGE_COLOR)
			fast=cv2.FastFeatureDetector()
			kp=fast.detect(ocvimg,None)
			oimg=cv2.drawKeypoints(ocvimg,kp, color=(255,0,0))
			imedg=cv2.imencode('.jpg',oimg)[1].tostring().encode('base64')
			ph.image_edge=imedg
		return True
	def _get_edge_img_corners(self,cr,uid,ids,context=None):
		for ph in self.browse(cr,uid,ids,context=context):
			img=ph.with_context(bin_size=False).image_800.decode('base64')
			#ib64=image.encode('base64')
			#_logger.debug(img)
			array=np.fromstring(img,np.uint8)
			#_logger.debug('array: %r'%array)
			ocvimg=cv2.imdecode(array,cv2.CV_LOAD_IMAGE_COLOR)
			grey=cv2.cvtColor(ocvimg,cv2.COLOR_BGR2GRAY)
			corners=cv2.goodFeaturesToTrack(grey,25,0.01,10)
			corners = np.int0(corners)
			for i in corners:
				x,y=i.ravel()
				cv2.circle(ocvimg,(x,y),4,255,-1)
				#_logger.debug(x,y)
			#_logger.debug(type(ocvimg))
			#_logger.debug(ocvimg)
			#edges=cv2.Canny(ocvimg,100,200)
			#_logger.debug(edges)
			
			#imedg=cv2.imencode('.jpg',edges)[1].tostring().encode('base64')
			imedg=cv2.imencode('.jpg',ocvimg)[1].tostring().encode('base64')
			#ocvimg=np.array(img)
			#ocvimg=ocvimg[:,:,::-1].copy()
			#edges=cv2.Canny(ocvimg,100,200)
			ph.image_edge=imedg
		return True
	
	@api.depends('latitude', 'longitude')
	def _get_next_photo(self,cr,uid,ids,context=None):
		#empapl=uid.employee_papl_ids
		delta=0.01
		max_dist=150
		for photo in self.browse(cr,uid,ids,context=context):
			lat1, lng1=photo.latitude, photo.longitude
			domain_np=[('latitude','>',lat1-delta),('latitude','<',lat1+delta),('longitude','>',lng1-delta),('longitude','<',lng1+delta)]
			pos_next_photo_ids=self.pool.get('uis.ap.photo').search(cr,openerp.SUPERUSER_ID,domain_np,context=context)
			#next_photo=[]
			#next_photo_ids=[]
			for pid in pos_next_photo_ids:
				nph=self.pool.get('uis.ap.photo').browse(cr,uid,[pid],context=context)
				if nph:
					if nph.id != photo.id:
						lat2,lng2=nph.latitude,nph.longitude
						dist=0
						if (lat1<>0) and (lng1<>0) and (lat2<>0) and (lng2<>0) and (abs(lat1-lat2)<delta) and (abs(lng1-lng2)<delta):
							dist=distance2points(lat1,lng1,lat2,lng2)
						if (dist<max_dist) and (dist>0):
							#next_photo.append(nph)
							#next_photo_ids.append(nph.i)
							photo.next_photo_ids=[(4,nph.id,0)]
		return True
	@api.depends('latitude', 'longitude')
	def _get_near_trans_ids(self,cr,uid,ids,context=None):
		for photo in self.browse(cr,uid,ids,context=context):
			lat1=photo.latitude
			long1=photo.longitude
			delta=0.01
			nstr=''
			max_dist=150
			trans = self.pool.get('uis.papl.transformer').search(cr,openerp.SUPERUSER_ID,[('latitude','>',lat1-delta),('latitude','<',lat1+delta),('longitude','>',long1-delta),('longitude','<',long1+delta)],context=context)
			near_pillars=[]
			near_pillars_ids=[]
			for tr in trans:
				transformer=self.pool.get('uis.papl.transformer').browse(cr,openerp.SUPERUSER_ID,[tr],context=context)
				if transformer:
					lat2=transformer.latitude
					long2=transformer.longitude
					dist=0
					if (lat1<>0) and (long1<>0) and (lat2<>0) and (long2<>0) and (abs(lat1-lat2)<0.1) and (abs(long1-long2)<0.1):
						dist=distance2points(lat1,long1,lat2,long2)
					if (dist<max_dist) and (dist>0):
						photo.near_transformer_ids=[(4,transformer.id,0)]
		
	@api.depends('near_pillar_ids','latitude','longitude')
	def _get_near_photo_apl(self,cr,uid,ids,context=None):
		for photo in self.browse(cr,openerp.SUPERUSER_ID,ids,context=context):
			apl_ids=[]
			for pil in photo.near_pillar_ids:
				if pil.apl_id.id not in apl_ids:
					apl_ids.append(pil.apl_id.id)
					photo.near_apl_ids=[(4,pil.apl_id.id,0)]
			
	@api.depends('pillar_ids','near_apl_ids','visable_view_json')
	def _get_photo_apl(self,cr,uid,ids,context=None):
		for photo in self.browse(cr,uid,ids,context=context):
			apl_ids=[]
			
			for pil in photo.pillar_ids:
				if pil.apl_id.id not in apl_ids:
					apl_ids.append(pil.apl_id.id)
					photo.apl_ids=[(4,pil.apl_id.id,0)]
					
	@api.depends('latitude','longitude','rotation','view_distance','vd_min','vd_max','focal_angles','near_pillar_ids','visable_view_json')
	def _get_photo_pillar(self,cr,uid,ids,context=None):
		for photo in self.browse(cr,uid,ids,context=context):
			lat=photo.latitude
			lng=photo.longitude
			tri_points=json.loads(photo.visable_view_json)
			#tri_points=triangle_points(photo.latitude,photo.longitude,photo.rotation,photo.focal_angles,photo.view_distance)
			#try:
			#	tri_points=json.loads(ph.visable_view_json)
			#except:
			#	_logger.debug('je')
				
			for pil in photo.near_pillar_ids:
				inpoint=point_in_poly(pil.latitude,pil.longitude,tri_points)
				#_logger.debug('For PH %r Pilar %r is %r'%(photo.name,pil.name,inpoint))
				if inpoint:
					photo.pillar_ids=[(4,pil.id,0)]
	#@api.depends('latitude','longitude')
	def _get_near_photo_pillar(self,cr,uid,ids,context=None):
		for photo in self.browse(cr,uid,ids,context=context):
			#photo.generate_snap()
			#_logger.debug('!!!!!!!!!!!')
			lat1=photo.latitude
			long1=photo.longitude
			delta=0.01
			nstr=''
			max_dist=150
			pillars = self.pool.get('uis.papl.pillar').search(cr,openerp.SUPERUSER_ID,[('latitude','>',lat1-delta),('latitude','<',lat1+delta),('longitude','>',long1-delta),('longitude','<',long1+delta)],context=context)
			near_pillars=[]
			near_pillars_ids=[]
			for pid in pillars:
				pillar=self.pool.get('uis.papl.pillar').browse(cr,openerp.SUPERUSER_ID,[pid],context=context)
				if pillar:
					lat2=pillar.latitude
					long2=pillar.longitude
					dist=0
					if (lat1<>0) and (long1<>0) and (lat2<>0) and (long2<>0) and (abs(lat1-lat2)<0.1) and (abs(long1-long2)<0.1):
						dist=distance2points(lat1,long1,lat2,long2)
					#print "[uis_ap_photo.get_near_photo_pillar] Photo (%r) to pillar %r (%r, APL=%r) distance=%r)" % (photo.name, pillar.id, pillar.name, pillar.apl_id,dist)
					if (dist<max_dist) and (dist>0):
						near_pillars.append(pillar)
						near_pillars_ids.append(pillar.id)
						photo.near_pillar_ids=[(4,pillar.id,0)]
						#if (nstr==''):
						#	nstr=str(pillar.id)
						#if (nstr!=''):
						#	nstr=nstr+','+str(pillar.id)
						#	print str(pillar.id)+':'+nstr
	@api.depends('latitude','longitude','rotation','view_distance','focal_angles','near_transformer_ids')
	def _get_photo_trans(self,cr,uid,ids,context=None):
		for photo in self.browse(cr,uid,ids,context=context):
			lat=photo.latitude
			lng=photo.longitude
			tri_points=triangle_points(lat,lng,photo.rotation,photo.focal_angles,photo.view_distance)
			for trans in photo.near_transformer_ids:
				inpoint=point_in_poly(trans.latitude,trans.longitude,tri_points)
				#_logger.debug('For PH %r Trans %r is %r'%(photo.name,trans.name,inpoint))
				if inpoint:
					photo.transformer_ids=[(4,trans.id,0)]
		
class uis_ap_photo_load_hist(models.Model):
	_name='uis.ap.photo.load_hist'
	_description='Photo_apl_hist'
	name=fields.Char('Name')
	load_date=fields.Date(string='Load date')
	photo_count=fields.Integer(string='Photo_count')
	photo_ids=fields.Many2one('uis.ap.photo', string='Photos')
	folder_name=fields.Char(string='Folder')
	
	def load_photos(self, cr,uid,ids,context=None):
		re_photos=self.pool.get('uis.ap.photo').browse(cr,uid,ids,context=context)
		#_logger.debug("Start load photos")
		path='/home'
		i=1
		val=self.browse(cr,uid,ids,context=context)
		if val.folder_name != '':
			path=val.folder_name
		for filen in os.listdir(path):
			if filen.endswith(".JPG"):
				
				_logger.debug('___________________[%r] file %r'%(i,filen))
				img=file(path+'/'+filen,'rb').read().encode('base64')
				with open(path+'/'+filen,'rb') as f:
					#_logger.debug('______________________Load photo from file %r'%filen)
					tags=exifread.process_file(f)
					dms_longitude=tags["GPS GPSLongitude"]
					_logger.debug('Lonngitude from exif is %r'%dms_longitude)
					dms_longitude_ref=tags["GPS GPSLongitudeRef"]
					plong=parse_dms(str(dms_longitude),dms_longitude_ref)
					dms_latitude=tags["GPS GPSLatitude"]
					_logger.debug('Latitude from exif is %r'%dms_latitude)
					dms_latitude_ref=tags["GPS GPSLatitudeRef"]
					plat=parse_dms(str(dms_latitude),dms_latitude_ref)
					idate=tags["Image DateTime"]
					
					#EXIF ExifImageWidth, value 4000
					ciw=str(tags["EXIF ExifImageWidth"])
					#EXIF ExifImageLength, value 3000
					cil=str(tags["EXIF ExifImageLength"])
					#EXIF FocalLength, value 361/100
					try:
						cfl=strdiv(tags["EXIF FocalLength"])
					except:
						_logger.debug('error in Exif FocalLenght tag=%r'%tags["EXIF FocalLength"])
						cfl=-1
					#GPS GPSAltitude, value 181921/1000
					try:
						calt=strdiv(tags["GPS GPSAltitude"])
					except:
						_logger.debug('Error in EXIF GPS Altitude tag=%r'%tags["GPS GPSAltitude"])
						calt=-1
					#for tag in tags.keys():
					#	if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
					#		_logger.debug("Key: %s, value %s" % (tag, tags[tag]))
					idate=parse_date(str(idate))
					# !!!! Need validate name file
					np=re_photos.create({'name':str(idate.year)+'_'+str(idate.month)+'_'+str(idate.day)+'_'+str(filen)})
					np.latitude=plat
					np.longitude=plong
					np.image_filename=filen
					np.image=img
					np.image_date=idate
					np.image_length=int(cil)
					np.image_width=int(ciw)
					np.focal_length=cfl
					np.altitude=calt
					#np.load_hist_id=val.id
					#np.image_date.from_string(idate)
					_logger.debug('End loading file %r (%r)'%(i,filen))
					i+=1
				
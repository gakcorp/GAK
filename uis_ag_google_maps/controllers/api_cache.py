# -*- coding: utf-8 -*-
from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import datetime
import logging
import base64
import urllib
import math
import requests
import shutil
from PIL import Image, ImageDraw, ImageFont
'''try:
    import cStringIO as StringIO
except ImportError:
    import StringIO'''
import StringIO

fontPath ="/usr/share/fonts/truetype/verdana/verdana.ttf"
font12= ImageFont.truetype (fontPath,12)
font10= ImageFont.truetype (fontPath,10)
font8= ImageFont.truetype (fontPath,8)
font6= ImageFont.truetype (fontPath,6)

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

def tile2long(x,z):
	n=2.0**z
	res=x/n * 360.0-180.0
	return res

def tile2lat(y,z):
    n=math.pi-2*math.pi*y/pow(2,z);
    return (180/math.pi*math.atan(0.5*(math.exp(n)-math.exp(-n))))

class maps_data_json(http.Controller):
	def _check_cache(self, lname='',z=0,x=0,y=0):
		cr, uid,context=request.cr,request.uid,request.context
		cache_obj=request.registry['uis.cache.layers']
		needupdate=True
		exist=False
		image=False
		domain=[("layer_name","=",lname),("z","=",z),("x","=",x),("y","=",y)]
		cache_ids=cache_obj.search(cr, uid, domain, context=context)
		for cache in cache_obj.browse(cr, uid, cache_ids, context=context):
			exist=True
			image=cache.tile.decode('base64')
			rc=cache.req_cnt
			cache.req_cnt=rc+1
			_logger.info('CEL= %r ; NW= %r'%(cache.cache_end_life,datetime.datetime.now()))
			'''if cache.cache_end_life:
				if cache.cache_end_life<datetime.datetime.now():
					needupdate=False'''
		return exist,needupdate,image
	def _download_cache(self,lname='',z=0,x=0,y=0):
		cr, uid,context=request.cr,request.uid,request.context
		cache_obj=request.registry['uis.cache.layers']
		layer_obj=request.registry['uis.settings.layers']
		domain=[("name","=",lname)]
		layers_ids=layer_obj.search(cr,uid,domain,context=context)
		lr=[]
		for layer in layer_obj.browse(cr,uid,layers_ids,context=context):
			lr=layer
		img = Image.new("RGBA", (256,256), (255,255,255,0))
		draw=ImageDraw.Draw(img)
		draw.text((0, 220), 'Tile %r (%r/%r/%r)'%(str(lname),z,x,y), font=font12, fill=(0,0,0,255))
		url=''
		base_url=lr.url_base
		code_def_url=lr.url_code
		exec code_def_url
		if (z<=lr.maxzoom):
			_logger.info('Get url %r'%str(url))
			#draw.text((0, 240), '(url) : %r'%str(url), font=font6, fill=(0,0,0,255))
			#print urllib.urlopen(str(url)).read()
			#r = requests.post(url,'')
			#print r
			f=StringIO.StringIO(urllib.urlopen(url).read())
			print urllib.urlopen(url).read();
			has_error=False
			try:
				img=Image.open(f)
			except IOError:
				_logger.error('Read error')
				has_error=True
			if not(has_error):
				nc=cache_obj.browse(cr,uid,[],context=context).create({'z':z})
				nc.layer=lr
				nc.x=x
				nc.y=y
				background_stream=StringIO.StringIO()
				img.save(background_stream, format="PNG")
				image=background_stream.getvalue()
				ib64=image.encode('base64')
				nc.tile=ib64
				nc.cache_end_life=datetime.datetime.now()+datetime.timedelta(days=lr.cache_life_day)
				nc.cache_date=datetime.datetime.now()
				nc.is_stretch_tile=False
				nc.origin_url=url
		if (z>lr.maxzoom):
			dz=z-lr.maxzoom
			divz=pow(2,dz)
			zx=x//divz
			zy=y//divz
			czdx=(x%divz)
			czdy=(y%divz)
			_logger.info('divz=%r; zx=%r; zy=%r; czdx=%r; czdy=%r'%(divz,zx,zy,czdx,czdy))
			url=''
			base_url=lr.url_base
			oz,ox,oy=z,x,y
			z,x,y=lr.maxzoom,zx,zy
			exec code_def_url
			f=StringIO.StringIO(urllib.urlopen(url).read())
			img=Image.open(f)
			d=256/divz
			img=img.crop((czdx*d,czdy*d,(czdx+1)*d,(czdy+1)*d))
			img=img.resize((256,256),Image.ANTIALIAS)
			nc=cache_obj.browse(cr,uid,[],context=context).create({'z':oz})
			nc.layer=lr
			nc.x=ox
			nc.y=oy
			background_stream=StringIO.StringIO()
			img.save(background_stream, format="PNG")
			image=background_stream.getvalue()
			ib64=image.encode('base64')
			nc.tile=ib64
			nc.cache_end_life=datetime.datetime.now()+datetime.timedelta(days=lr.cache_life_day)
			nc.cache_date=datetime.datetime.now()
			nc.is_stretch_tile=True
			nc.origin_url=url
		background_stream=StringIO.StringIO()
		img.save(background_stream, format="PNG")
		image=background_stream.getvalue()
		ib64=image.encode('base64')
		return image
	def _update_cache(self,lname='',z=0,x=0,y=0):
		cr, uid,context=request.cr,request.uid,request.context
		cache_obj=request.registry['uis.cache.layers']
		#Add code for update
	@http.route('/maps/<string:lname>/<int:z>/<int:x>/<int:y>',type='http', auth="public")
	def _get_tile_image(self,lname='',x=0,y=0,z=0):
		start=datetime.datetime.now()
		_logger.info('Get tile for %r (%r/%r/%r)'%(lname,z,x,y))
		#
		exc,nuc,img=self._check_cache(lname,z,x,y)
		if not(exc):
			img=self._download_cache(lname,z,x,y)
		if nuc:
			self._update_cache(lname,z,x,y)
		#.encode('base64')
		headers=[]
		headers.append(('Content-Length', len(img)))
		headers.append(('Content-Type','image/png'))
		response = request.make_response(img, headers)
		#response.status_code = status
		#
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate TAP elevation data in %r seconds'%elapsed.total_seconds())
		return response
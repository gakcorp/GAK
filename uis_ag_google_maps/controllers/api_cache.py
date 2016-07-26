# -*- coding: utf-8 -*-
from openerp import http
from openerp.http import request
from openerp.tools import html_escape as escape
import datetime
import logging
import base64
from PIL import Image, ImageDraw, ImageFont
try:
    import cStringIO as StringIO
except ImportError:
    import StringIO

fontPath ="/usr/share/fonts/truetype/verdana/verdana.ttf"
font12= ImageFont.truetype (fontPath,12)
font10= ImageFont.truetype (fontPath,10)

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

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
			if cache.cache_life_day<datetime.datetime.now():
				needupdate=False
		return exist,needupdate,image
	def _download_cache(self,lname='',z=0,x=0,y=0):
		img = Image.new("RGBA", (256,256), (255,255,255,0))
		draw=ImageDraw.Draw(img)
		draw.text((0, 220), 'Tile %r (%r/%r/%r)'%(str(lname),z,x,y), font=font12, fill=(0,0,0,255))
		url='notset'
		draw.text((0, 240), 'Tile %r (url) : %r'%(str(lname),str(url)), font=font12, fill=(0,0,0,255))
		background_stream=StringIO.StringIO()
		img.save(background_stream, format="PNG")
		image=background_stream.getvalue()
		ib64=image.encode('base64')
		return image
	@http.route('/maps/<string:lname>/<int:z>/<int:x>/<int:y>',type='http', auth="public")
	def _get_tile_image(self,lname='',x=0,y=0,z=0):
		start=datetime.datetime.now()
		_logger.info('Get tile for %r (%r/%r/%r)'%(lname,z,x,y))
		#
		exc,nuc,img=self._check_cache(lname,z,x,y)
		if not(exc):
			img=self._download_cache(lname,z,x,y)
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
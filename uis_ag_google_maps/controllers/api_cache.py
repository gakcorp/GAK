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
	@http.route('/maps/<string:lname>/<int:z>/<int:x>/<int:y>',type='http', auth="public")
	def _get_tile_image(self,lname='',x=0,y=0,z=0):
		start=datetime.datetime.now()
		_logger.info('Get tile for %r (%r/%r/%r)'%(lname,z,x,y))
		#
		img = Image.new("RGBA", (256,256), (255,255,255,0))
		draw=ImageDraw.Draw(img)
		draw.text((100, 100), 'Demo tile from cache', font=font12, fill=(0,0,0,128))
		background_stream=StringIO.StringIO()
		img.save(background_stream, format="PNG")
		image_base64=background_stream.getvalue().encode('base64')
		headers=[]
		headers.append(('Content-Length', len(image_base64)))
		response = request.make_response(image_base64, headers)
		#response.status_code = status
		#
		stop=datetime.datetime.now()
		elapsed=stop-start
		_logger.info('Generate TAP elevation data in %r seconds'%elapsed.total_seconds())
		return response
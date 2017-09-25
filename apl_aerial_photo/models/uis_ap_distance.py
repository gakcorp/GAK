#System libruary
import logging
import json
#AGBase lib
from openerp import models, fields, api, tools
from openerp.addons.passportvl.models import uis_papl_logger
from openerp.addons.passportvl.models.uismodels import distance2points
from openerp.addons.passportvl.models.uismodels import distangle2points
from PIL import Image, ImageDraw
import StringIO
import cStringIO

_ulog=uis_papl_logger.ulog

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_ap_photo_mod_distance(models.Model):
	_inherit='uis.ap.photo'
	len_start_apl=fields.Float(digits=(2,2), string='Distance from start APL', compute='_get_len_start_apl', store=True)
	
	@api.depends('vis_objects_ids','latitude','longitude','pillar_ids','near_pillar_ids')
	def _get_len_start_apl(self):
		for ph in self:
			rval=0
			if ph.vis_objects_ids:
				vo=ph.vis_objects_ids.sorted(key=lambda r:r.distance_from_photo_point)[0]
				if vo.pillar_id:
					vodsa=vo.pillar_id.len_start_apl
				if vo.transformer_id:
					vodsa=vo.transformer_id.len_start_apl
				rval=vo.distance_from_photo_point+vodsa
			if not(ph.vis_objects_ids):
				if ph.pillar_ids:
					mp=ph.pillar_ids.sorted(key=lambda r:r.num_by_vl)[0]
					rval=mp.len_start_apl
				if not(ph.pillar_ids):
					if ph.near_pillar_ids:
						mp=ph.near_pillar_ids.sorted(key=lambda r:r.num_by_vl)[0]
						rval=mp.len_start_apl
			ph.len_start_apl=rval
	
	@api.depends('latitude', 'longitude')
	def _get_next_photo(self,cr,uid,ids,context=None):
		#empapl=uid.employee_papl_ids
		delta=0.01
		max_dist=150
		for photo in self.browse(cr,uid,ids,context=context):
			lat1, lng1=photo.latitude, photo.longitude
			domain_np=[('latitude','>',lat1-delta),('latitude','<',lat1+delta),('longitude','>',lng1-delta),('longitude','<',lng1+delta)]
			pos_next_photo_ids=self.pool.get('uis.ap.photo').search(cr,uid,domain_np,context=context)
			#next_photo=[]
			#next_photo_ids=[]
			for pid in pos_next_photo_ids:
				nph=self.pool.get('uis.ap.photo').browse(cr,uid,[pid],context=context).sorted(key=lambda r:r.len_start_apl, reverse=True)
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
					if nph.id == photo.id:
						photo.next_photo_ids=[(4, nph.id,0)]
		return True
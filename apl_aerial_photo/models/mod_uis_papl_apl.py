# -*- coding: utf-8 -*-

from openerp import models, fields, api, tools
from openerp.tools.translate import _
from shapely.geometry import Point
from shapely.geometry.polygon import Polygon
from uis_ap_photo import point_in_poly
import math, urllib, json, time, random
import logging

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_photo_mod_uis_papl_apl(models.Model):
	_inherit = 'uis.papl.apl'
	_name = 'uis.papl.apl'
	photo_count=fields.Integer(string="Photo count", compute='_get_photo_count')
	photo_ids=fields.Many2many(string="Photos", comodel_name="uis.ap.photo", relation="photo_apl_rel", column1="apl_id", column2="photo_id")
	heatmap_photo_data=fields.Text(string='Heatmap photo data', compute='_get_heatmap_photo_data')

	
	def _get_photo_count(self):
		for apl in self:
			apl.photo_count=len(apl.photo_ids)
	
	def _get_heatmap_photo_data(self):
		for apl in self:
			dlat,dlng=0.0005,0.0005
			heat_photo_data=[]
			for ph in apl.photo_ids:
				vv=json.loads(ph.visable_view_json)
				
				latmin=min([d['lat'] for d in vv])
				lngmin=min([d['lng'] for d in vv])
				latmax=max([d['lat'] for d in vv])
				lngmax=max([d['lng'] for d in vv])
				#fv=any( for d in heat_photo_data)
				
				
				curlat,curlng=latmin,lngmin
				while curlat<=latmax:
					curlng=lngmin
					while curlng<=lngmax:
						pip=point_in_poly(curlat,curlng,vv)
						if pip:
							rlat,rlng=round(curlat,5),round(curlng,5)
							vl=0
							fv=next((d for d in heat_photo_data if ((d['lat']==rlat) and (d['lng']==rlng))), None)
							if fv:
								vl=fv['cnt']
								_logger.debug(fv)
								heat_photo_data[:]=[d for d in heat_photo_data if not((d['lat']==rlat) and (d['lng']==rlng))]
							heat_photo_data.append({
								'lat':rlat,
								'lng':rlng,
								'cnt':vl+1})
						curlng+=dlng
					curlat+=dlat
				#_logger.debug('min/max lat = %r/%r min/max lng = %r/%r'%(latmin,latmax,lngmin,lngmax))
			apl.heatmap_photo_data=json.dumps(heat_photo_data)
				#define min lat
				#define max lat
				#define minlng
				#define max lng
				#Cycle for grid
				#if point in vv then need add current latitude and longitude to array
	
	@api.multi
	def action_view_photos(self):
		#_logger.debug('Request photos for apl ids = %r'%ids)
		ids=[]
		for apl in self:
			ids.append(apl.id)
		return {
			'domain': "[('apl_ids','in',[" + ','.join(map(str, ids)) + "])]",
			'name': _('Photos'),
			'view_type': 'kanban',
			'view_mode': 'kanban',
			'res_model': 'uis.ap.photo',
			'type': 'ir.actions.act_window',
			'target': 'current'
		}
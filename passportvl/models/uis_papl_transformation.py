# -*- coding: utf-8 -*-
import math, urllib, json, time
from openerp import models, fields, api
class uis_papl_transformation(models.Model):
	_name='uis.papl.transformer'
	_description='Transformer'
	name=fields.Char(string='Name')
	apl_id=fields.Many2one('uis.papl.apl', string='APL Name')
	tap_id=fields.Many2one('uis.papl.tap', string='Tap Name')
	pillar_id=fields.Many2one('uis.papl.pillar',string='Pillar Name')
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')
	near_pillar_ids_str=fields.Char(string='near pillars ids' compute='_get_near_pillar_ids')
	
	def _get_near_pillar_ids(self):
		for trans in self:
			np_str='1,2,3,54,32,345'
			print trans.near_pillar_ids_str=np_str
			
			

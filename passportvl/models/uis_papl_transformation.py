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
	near_pillar_ids=fields.Many2one('uis.papl.pillar', string='Near pillars ids', compute='_get_near_pillar_ids')
	
	def _get_near_pillar_ids(self):
		for trans in self:
			np=[]
			pillars_obj=self.env['uis.papl.pillar']
			#browse(cr, uid, ids, context=context):
			#pillars=pillars_obj.browse(cr,uid,pillars_obj.search([]),context=context)
			#for pillar in pillars:
			#	if pillar.id<10:
			#		np.append(pillar)		
			#trans.near_pillar_ids=pillars
					
			
			

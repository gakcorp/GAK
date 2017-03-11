# -*- coding: utf-8 -*-
'''from openerp.osv import fields, osv
from openerp.tools.translate import _

class uis_ag_google_maps_mod_uis_papl_apl(osv.Model):
	_name = 'uis.papl.apl'
	_inherit = 'uis.papl.apl'
	_columns = {
		'rec_layer_id':fields.many2one('uis.settings.layers', string="Recomended Layer")
	}'''
	
from openerp import models, fields, api

class uis_ag_maps_mod_uis_papl_apl(models.Model):
	_inherit='uis.papl.apl'
	
	rec_layer_id=fields.Many2one('uis.settings.layers', string="Recomended maps layer")
	url_maps=fields.Char(string="System cartography URL", compute='_get_apl_url_maps')
	
	def _get_apl_url_maps(self):
		for apl in self:
			apl.url_maps="/apl_map/?apl_ids="+unicode(str(apl.id))
		
		
	@api.multi #NUPD to cartography module
	def act_show_map(self):
		return{
			'name': 'Maps',
			'res_model':'ir.actions.act_url',
			'type':'ir.actions.act_url',
			'target':'new',
			'url':self.url_maps
			}
	
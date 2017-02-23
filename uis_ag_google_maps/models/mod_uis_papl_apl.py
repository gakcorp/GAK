# -*- coding: utf-8 -*-
from openerp.osv import fields, osv
from openerp.tools.translate import _

class uis_ag_google_maps_mod_uis_papl_apl(osv.Model):
	_name = 'uis.papl.apl'
	_inherit = 'uis.papl.apl'
	_columns = {
		'rec_layer_id':fields.many2one('uis.settings.layers', string="Recomended Layer")
	}
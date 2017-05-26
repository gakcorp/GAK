# -*- coding: utf-8 -*-

from openerp.tools.translate import _
import math, urllib, json, time, random
from openerp import models, fields, api, tools
import logging

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_apl_mro_mod_uis_papl_apl_defects(models.Model):
	_inherit = 'uis.papl.apl'
	_name = 'uis.papl.apl'
	
	all_defect_ids=fields.One2many(string="All defects", comodel_name="uis.papl.mro.defect", inverse_name="apl_id")
	all_defect_count=fields.Integer(string="All defect count", compute='_get_defect_count')
	mro_count=fields.Integer(string="All maintenance count", compute='_get_mro_count')
	
	def _get_mro_count(self):
		for apl in self:
			apl.mro_count=0
			
	def _get_defect_count(self):
		for apl in self:
			apl.all_defect_count=len(apl.all_defect_ids)

	@api.multi
	def action_view_defect(self):
		ids=[]
		for apl in self:
			ids.append(apl.id)
		return {
			'domain': "[('apl_id','in',[" + ','.join(map(str, ids)) + "])]",
			'name': _('All Defects'),
			'view_type': 'form',
			'view_mode': 'tree,form',
			'res_model': 'uis.papl.mro.defect',
			'type': 'ir.actions.act_window',
			'target': 'current',
		}

	@api.multi
	def action_view_maintenance(self):
		ids=[]
		for apl in self:
			ids.append(apl.id)
		return {
			'domain': "[('apl_id','in',[" + ','.join(map(str, ids)) + "])]",
			'name': _('Maintenance Orders'),
			'view_type': 'form',
			'view_mode': 'tree,form',
			'res_model': 'uis.papl.mro.order',
			'type': 'ir.actions.act_window',
			'target': 'current',
		}
	
'''class uis_mro_mod_uis_papl_apl(osv.Model):
    _name = 'uis.papl.apl'
    _inherit = 'uis.papl.apl'

    def _apl_mro_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        maintenance = self.pool['uis.papl.mro.order']
        for apl in self.browse(cr, uid, ids, context=context):
            res[apl.id] = maintenance.search_count(cr,uid, [('apl_id', '=', apl.id)], context=context)
        return res

    _columns = {
        'mro_count': fields.function(_apl_mro_count, string='# Maintenance', type='integer'),
    }

    '''
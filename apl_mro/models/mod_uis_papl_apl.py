# -*- coding: utf-8 -*-
from openerp.osv import fields, osv
from openerp.tools.translate import _


class uis_mro_mod_uis_papl_apl(osv.Model):
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

    def action_view_maintenance(self, cr, uid, ids, context=None):
        return {
            'domain': "[('apl_id','in',[" + ','.join(map(str, ids)) + "])]",
            'name': _('Maintenance Orders'),
            'view_type': 'form',
            'view_mode': 'tree,form',
            'res_model': 'mro.order',
            'type': 'ir.actions.act_window',
            'target': 'current',
        }
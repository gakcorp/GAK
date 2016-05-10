# -*- coding: utf-8 -*-
from openerp.osv import fields, osv
from openerp.tools.translate import _


class uis_mro_mod_uis_papl_transformer(osv.Model):
    _name = 'uis.papl.transformer'
    _inherit = 'uis.papl.transformer'

    def _transformer_mro_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        maintenance = self.pool['uis.papl.mro.order']
        for trans in self.browse(cr, uid, ids, context=context):
            res[trans.id] = maintenance.search_count(cr,uid, [('transformer_id', '=', trans.id)], context=context)
        return res

    _columns = {
        'mro_count': fields.function(_transformer_mro_count, string='# Maintenance', type='integer'),
    }

    def action_view_maintenance(self, cr, uid, ids, context=None):
        return {
            'domain': "[('transformer_id','in',[" + ','.join(map(str, ids)) + "])]",
            'name': _('Maintenance Orders'),
            'view_type': 'form',
            'view_mode': 'tree,form',
            'res_model': 'uis.papl.mro.order',
            'type': 'ir.actions.act_window',
            'target': 'current',
        }
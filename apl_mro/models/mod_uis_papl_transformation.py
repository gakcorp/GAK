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
            maintenance_count=maintenance.search_count(cr,uid, [('transformer_ids', '=', trans.id)], context=context)
            if maintenance_count>0:
                trans.state='maintenance'
            res[trans.id] = maintenance_count
        return res
    
    def _transformer_defect_count(self,cr,uid,ids,field_name,arg,context=None):
    
        defects=self.pool['uis.papl.mro.defect']
        for trans in self.browse(cr,uid,ids,context=context):
            res = dict.fromkeys(ids,0)
            defect_count=defects.search_count(cr,uid,[('transformer_ids','=',trans.id)], context=context)
            if defect_count>0:
                print trans.state
                trans.state='defect'
                print trans.state
            res[trans.id]=defect_count
        return res
    
    _columns = {
        'mro_count': fields.function(_transformer_mro_count, string='# Maintenance', type='integer'),
        'defect_count':fields.function(_transformer_defect_count, string='Defect count', type='integer'),
        'defect_ids':fields.one2many('uis.papl.mro.defect', 'transformer_ids', string="Taps")
    }

    def action_view_maintenance(self, cr, uid, ids, context=None):
        return {
            'domain': "[('transformer_ids','in',[" + ','.join(map(str, ids)) + "])]",
            'name': _('Maintenance Orders'),
            'view_type': 'form',
            'view_mode': 'tree,form',
            'res_model': 'uis.papl.mro.order',
            'type': 'ir.actions.act_window',
            'target': 'current'
        }
    def action_view_defect(self,cr,uid,ids,context=None):
        return{
            'domain': "[('transformer_ids','in',[" + ','.join(map(str, ids)) + "])]",
            'name': _('Defects'),
            'view_type': 'form',
            'view_mode': 'tree,form',
            'res_model': 'uis.papl.mro.defect',
            'type': 'ir.actions.act_window',
            'target': 'current'
        }
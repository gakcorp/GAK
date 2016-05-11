import time

from openerp.osv import fields, osv
import openerp.addons.decimal_precision as dp
from openerp.tools.translate import _
from openerp import netsvc

class apl_mro_defect(osv.osv):
    """
    Defects
    """
    _name = 'uis.papl.mro.defect'
    _description = 'Defects'
    _inherit = ['mail.thread', 'ir.needaction_mixin']

    STATE_SELECTION = [
        ('draft', 'DRAFT'),
        ('confirmed', 'CONFIRMED'),
        ('planed', 'PLANED'),
        ('work', 'WORK'),
        ('DONE', 'DONE')
    ]

    DEFECT_CATEGORY = [
        ('0', 'Not Critical'),
        ('1', 'Level 1'),
        ('2', 'Level 2'),
        ('3', 'Level 3'),
        ('4', 'Level 4'),
        ('5','Critical')
    ]
  
    _columns = {
        'name': fields.char('Name of defects', size=64),
        'apl_id': fields.many2one('uis.papl.apl', 'Air power line', required=False, readonly=True, states={'draft': [('readonly', False)]}),
        'tap_id': fields.many2one('uis.papl.tap', 'Tap of APL', required=False, readonly=True, states={'draft':[('readonly',False)]}),
        'pillar_id': fields.many2one('uis.papl.pillar', 'Pillar',required=False, readonly=True, states={'draft':[('readonly',False)]}),
        'transformer_id': fields.many2one('uis.papl.transformer','Transformer',required=False, readonly=True, states={'draft':[('readonly',False)]}),
        'unicode': fields.char('UniCode'),
        'state': fields.selection(STATE_SELECTION, 'Status', readonly=True),
        'labor_cost':fields.integer('Labor Cost'),
        'defect_description': fields.text('Defect Description'),
    }
    _defaults = {
        'state': lambda *a: 'draft'
    }
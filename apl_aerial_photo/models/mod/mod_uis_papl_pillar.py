from openerp.osv import fields, osv
from openerp.tools.translate import _
import logging

_logger=logging.getLogger(__name__)
_logger.setLevel(10)
class uis_apl_aerial_photo_mod_uis_papl_pillar(osv.Model):
	_name = 'uis.papl.pillar'
	_inherit = 'uis.papl.pillar'

	def _pillar_photo_count(self, cr, uid, ids, field_name, arg, context=None):
		res = dict.fromkeys(ids, 0)
		photo = self.pool['uis.ap.photo']
		_logger.debug('Request for count of photo for pillar %r'%ids)
		_logger.debug(self.browse(cr, uid, ids, context=context))
		for pil in self.browse(cr, uid, ids, context=context):
			_logger.debug('Pillar is %r'%pil)
			pids=photo.search(cr,uid,[('near_pillar_ids','in',[pil.id])])
			pc=len(pids)
			res[pil.id] = pc
		return res
	
	def _get_photo_ids(self, cr, uid, ids, field_name, arg, context=None):
		res=dict.fromkeys(ids,0)
		return res
		
	_columns = {
		'photo_count': fields.function(_pillar_photo_count, string='# Photo', type='integer'),
		'photo_ids':fields.many2many('uis.ap.photo',rel='photo_near_pillar', id1='pillar_id', id2='photo_id',string="Photos")
	}

	def action_view_photos(self, cr, uid, ids, context=None):
		_logger.debug('Request photos for pillar ids = %r'%ids)
		return {
			'domain': "[('near_pillar_ids','in',[" + ','.join(map(str, ids)) + "])]",
			'name': _('Photos'),
			'view_type': 'kanban',
			'view_mode': 'kanban',
			'res_model': 'uis.ap.photo',
			'type': 'ir.actions.act_window',
			'target': 'current'
		}
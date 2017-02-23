# -*- coding: utf-8 -*-
from openerp.osv import fields, osv
from openerp.tools.translate import _
import logging

_logger=logging.getLogger(__name__)
_logger.setLevel(10)
class uis_apl_aerial_photo_mod_uis_papl_apl(osv.Model):
	_name = 'uis.papl.apl'
	_inherit = 'uis.papl.apl'

	def _apl_photo_count_old(self, cr, uid, ids, field_name, arg, context=None):
		res = dict.fromkeys(ids, 0)
		photo = self.pool['uis.ap.photo']
		_logger.debug('Request for count of photo for APL %r'%ids)
		_logger.debug(self.browse(cr, uid, ids, context=context))
		for apl in self.browse(cr, uid, ids, context=context):
			_logger.debug('APL is %r'%apl)
			pids=photo.search(cr,uid,[('near_apl_ids','in',[apl.id])])
			pc=len(pids)
			res[apl.id] = pc
		return res
	def _apl_photo_count(self,cr,uid,ids,field_name, arg, context=None):
		res=dict.fromkeys(ids,0)
		for apl in self.browse(cr,uid,ids,context=context):
			_logger.debug ('Photo for apl id[%r] is %r'%(apl.id,apl.photo_ids))
			for ph in apl.photo_ids:
				_logger.debug('[_apl_photo_count] debug ingormation = %r'%ph.id)
			photo_count=len(apl.photo_ids)
			res[apl.id] = photo_count
		return res
	def _get_photo_ids(self, cr, uid, ids, field_name, arg, context=None):
		res=dict.fromkeys(ids,0)
		return res
		
	_columns = {
		'photo_count': fields.function(_apl_photo_count, string='# Photo', type='integer'),
		'photo_ids':fields.many2many('uis.ap.photo',rel='photo_apl_rel', id1='apl_id', id2='photo_id',string="Photos")
	}

	def action_view_photos(self, cr, uid, ids, context=None):
		_logger.debug('Request photos for apl ids = %r'%ids)
		return {
			'domain': "[('near_apl_ids','in',[" + ','.join(map(str, ids)) + "])]",
			'name': _('Photos'),
			'view_type': 'kanban',
			'view_mode': 'kanban',
			'res_model': 'uis.ap.photo',
			'type': 'ir.actions.act_window',
			'target': 'current'
		}
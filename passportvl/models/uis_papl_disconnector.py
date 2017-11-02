#System libruary
import logging
#AGBase lib
from openerp import models, fields, api, tools
from openerp.addons.passportvl.models import uis_papl_logger
_ulog=uis_papl_logger.ulog


_logger=logging.getLogger(__name__)
_logger.setLevel(10)
class uis_papl_disconnector_type(models.Model):
	_name='uis.papl.disconnector.type'
	_description='Type of disconnector'
	name=fields.Char('Disconnector type')
	
class uis_papl_disconnector(models.Model):
	CONNECT_STATE_SELECTION = [
		('on', 'ON'),
		('off', 'OFF')]
	
	_name='uis.papl.disconnector'
	_description='Disconnectors of APL'
	name=fields.Char("Disconnector name")
	pillar1_id=fields.Many2one('uis.papl.pillar', string='Pillar from')
	pillar2_id=fields.Many2one('uis.papl.pillar', string='Pillar to')
	
	trans_ids= fields.Many2many('uis.papl.transformer', string="Connected transformer")
	apl_id=fields.Many2one('uis.papl.apl', string="APL")
	type_id=fields.Many2one('uis.papl.disconnector.type', string='Disconnector type')
	depends_pillar_ids=fields.Many2many('uis.papl.pillar', string='Depends pillars')
	depends_trans_ids=fields.Many2many('uis.papl.transformer', string='Depends transformers')
	#trans_ids=fields.One2Many()
	#fields.One2many('uis.papl.pillar','apl_id', string ="Pillars")
	mount_on_pillar_b=fields.Boolean(string='Mounted on pillar')
	mount_on_pillar_id=fields.Many2one('uis.papl.pillar',string='Linear disconnector on pillar')
	#(string="Scheme", compute='_get_scheme_image_3')
	
	longitude=fields.Float(digits=(2,6), string='Longitude', compute='_get_coordinates')
	latitude=fields.Float(digits=(2,6), string='Latitude', compute='_get_coordinates')
	
	@api.onchange('apl_id')
	def onchange_apl_id(self):
		res={}
		if self.apl_id:
			ids=self.apl_id.pillar_id
			res['domain']={
				'pillar1_id':[('id','in',ids.mapped('id'))]
			}
			#if len(ids)==1:
			#	self.to_pillar_id=ids[0]
			#else:
			#	self.to_pillar_id=None
		return res
	@api.onchange('pillar1_id')
	def onchange_from_pillar_id(self):
		res={}
		delta=0.0001
		if self.pillar1_id:
			lat1,lng1=self.pillar1_id.latitude,self.pillar1_id.longitude
			ids=self.pillar1_id.apl_id.pillar_id.search([('parent_id','=',self.pillar1_id.id)])
			domain_np_oapl=[('latitude','>',lat1-delta),('latitude','<',lat1+delta),('longitude','>',lng1-delta),('longitude','<',lng1+delta),('apl_id','!=', self.pillar1_id.apl_id.id)]
			pos_pillar_oapl_ids=self.pool.get('uis.papl.pillar').search(cr,uid,domain_np_oapl,context=context)
			ids+=pos_pillar_oapl_ids
			res['domain']={
				'pillar2_id':[('id','in',ids.mapped('id'))]
			}
			if len(ids)==1:
				self.pillar2_id=ids[0]
			else:
				self.pillar2_id=None
		return res
	
	@api.onchange('pillar1_id','pillar2_id','trans_id','mount_on_pillar_b','mount_on_pillar_id')
	def _get_coordinates(self):
		for lr in self:
			r_ltd,r_lng=0,0
			if lr.mount_on_pillar_id:
				r_ltd,r_lng=lr.mount_on_pillar_id.latitude,mount_on_pillar_id.longitude
			else:
				if lr.mount_on_pillar_b:
					if lr.pillar1_id:
						r_ltd,r_lng=lr.pillar1_id.latitude,lr.pillar1_id.longitude
				else:
					if (lr.pillar1_id) and (lr.pillar2_id):
						r_ltd,r_lng=(lr.pillar1_id.latitude+lr.pillar2_id.latitude)/2,(lr.pillar1_id.longitude+lr.pillar2_id.longitude)/2
			lr.latitude,lr.longitude=r_ltd,r_lng
				
#System libruary
import logging
#AGBase lib
from openerp import models, fields, api, tools
from openerp.addons.passportvl.models import uis_papl_logger
_ulog=uis_papl_logger.ulog


_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_papl_disconnector(models.Model):
	CONNECT_STATE_SELECTION = [
		('on', 'ON'),
		('off', 'OFF')]
	
	_name='uis.papl.disconector'
	_description='Disconnectors of APL'
	name=fields.Char("Disconnector name")
	pillar1_id=fields.Many2one('uis.papl.pillar', string='Pillar from')
	pillar2_id=fields.Many2one('uis.papl.pillar', string='Pillar to')
	trans_ids= fields.Many2many('uis.papl.transformer', string="Connected transformer")
	apl_id=fields.Many2one('uis.papl.apl'. compute="_getapl_id"
	#trans_ids=fields.One2Many()
	#fields.One2many('uis.papl.pillar','apl_id', string ="Pillars")
	mount_on_pillar=fields.Boolean(string='Linear disconnector on pillar')
	#(string="Scheme", compute='_get_scheme_image_3')
	
	longitude=fields.Float(digits=(2,6), string='Longitude', compute='_get_coordinates')
	latitude=fields.Float(digits=(2,6), string='Latitude', compute='_get_coordinates')
	
	def _get_coordinates(self):
		for lr in self:
			
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
	longitude=fields.Float(digits=(2,6), string='Longitude')
	latitude=fields.Float(digits=(2,6), string='Latitude')

#System libruary
import logging
#AGBase lib
from openerp import models, fields, api, tools
from openerp.addons.passportvl.models import uis_papl_logger
_ulog=uis_papl_logger.ulog

_logger=logging.getLogger(__name__)
_logger.setLevel(10)

class uis_ap_vis_object(models.Model):
	STATE_SELECTION = [
		('draft', 'DRAFT'),
		('correct', 'CORRECT'),
		('incorrect', 'INCORRECT')]
	
	_name='uis.ap.vis_object'
	_description='Detected visual objects on the photo'
	name=fields.Char("Visual object name")
	state=fields.Selection(STATE_SELECTION,'Status',readonly=True,default='draft')
	photo_id=fields.Many2one('uis.ap.photo', string='Photo')
	rect_coordinate_json=fields.Text(string='Visual Object Rectangle')
	color=fields.Char("Color of selection")
	image=fields.Binary(string='Image')
	auto_detected=fields.Boolean(string='Auto Detected')
	distance_from_photo_point=fields.Float(digits=(2,2), string='Distance from photo point')
	
class uis_ap_photo_mod_Vis_object(models.Model):
	_inherit='uis.ap.photo'
	vis_objects_ids=fields.One2many('uis.ap.vis_object','photo_id','Visual objects')
	image_vis_obj=fields.Binary(string='Image with visual objects')
	image_vis_obj_800=fields.Binary(string='Image (800px) wuth visual objects')
	
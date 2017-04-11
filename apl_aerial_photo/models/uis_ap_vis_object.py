
#System libruary
import logging
import json
#AGBase lib
from openerp import models, fields, api, tools
from openerp.addons.passportvl.models import uis_papl_logger
from PIL import Image, ImageDraw
import StringIO
import cStringIO

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
	pillar_id=fields.Many2one('uis.papl.pillar', string='Pillar')
	transformer_id=fields.Many2one('uis.papl.transformer', string='Transformer')
	rect_coordinate_json=fields.Text(string='Visual Object Rectangle')
	color=fields.Char("Color of selection")
	image=fields.Binary(string='Image', compute='_get_vo_img')
	auto_detected=fields.Boolean(string='Auto Detected')
	distance_from_photo_point=fields.Float(digits=(2,2), string='Distance from photo point')
	@api.model
	def create_update_vis_object(self,PhotoID, ObjName, ObjID, ObjType, JSON, IMG):
		visObject=None;
		if (ObjType=='uis.papl.pillar'):
			obj_mas=self.search([('photo_id.id','=',PhotoID),('pillar_id.id','=',ObjID)])
			if (len(obj_mas)>0):
				visObject=obj_mas[0]
		if (ObjType=='uis.papl.transformer'):
			obj_mas=self.search([('photo_id.id','=',PhotoID),('transformer_id.id','=',ObjID)])
			if (len(obj_mas)>0):
				visObject=obj_mas[0]
		if (visObject is None):
			visObject=self.create({'name':ObjName})
		visObject.photo_id=int(PhotoID)
		visObject.rect_coordinate_json=JSON
		visObject.image=IMG
		if (ObjType=='uis.papl.pillar'):
			visObject.pillar_id=int(ObjID)
		if (ObjType=='uis.papl.transformer'):
			visObject.transformer_id=int(ObjID)
	@api.model
	def delete_objects(self,PhotoID,ObjType,Ref_Object_IDs):
		if (ObjType=='uis.papl.pillar'):
			obj_mas=self.search([('photo_id.id','=',PhotoID),('pillar_id.id','not in',Ref_Object_IDs)])
			for obj in obj_mas:
				obj.unlink()
		if (ObjType=='uis.papl.transformer'):
			obj_mas=self.search([('photo_id.id','=',PhotoID),('transformer_id.id','not in',Ref_Object_IDs)])
			for obj in obj_mas:
				obj.unlink()

	
	@api.depends('rect_coordinate_json')
	def _get_vo_img(self):
		for vo in self:
			rect_data= json.loads(vo.rect_coordinate_json)
			_logger.debug(rect_data)
			_logger.debug('cw= %r, ch=%r'%(rect_data['canvaswidth'],rect_data['canvasheight']))
			image = Image.open(StringIO.StringIO(vo.photo_id.with_context(bin_size=False).image.decode('base64')))
			or_width, or_height = vo.photo_id.image_width,vo.photo_id.image_length
			kw=float(or_width)/rect_data['canvaswidth']
			kh=float(or_height)/rect_data['canvasheight']
			_logger.debug('ow= %r, oh= %r'%(or_width,or_height))
			_logger.debug('cw= %r, ch=%r'%(rect_data['canvaswidth'],rect_data['canvasheight']))
			_logger.debug('kw= %r, kh=%r'%(kw,kh))
			lp=int(rect_data['groupleft']*kw)
			rp=int(lp+rect_data['rectwidth']*kw)
			tp=int(rect_data['grouptop']*kh)
			bp=int(tp+rect_data['rectheight']*kh)
			_logger.debug('lp= %r, tp= %r , rp= %r, bp=%r'%(lp,tp,rp,bp))
			#dr=ImageDraw.Draw(image)
			image=image.crop((lp,tp,rp,bp))
			#dr.rectangle(((lp,tp),(rp,bp)),fill="blue", outline="black")
			background_stream = StringIO.StringIO()
			image.save(background_stream, format="PNG")
			vo.image=background_stream.getvalue().encode('base64')
	
	@api.model
	def create_update_vis_object(self,PhotoID, ObjName, ObjID, ObjType, JSON, IMG):
		visObject=None;
		if (ObjType=='uis.papl.pillar'):
			obj_mas=self.search([('photo_id.id','=',PhotoID),('pillar_id.id','=',ObjID)])
			if (len(obj_mas)>0):
				visObject=obj_mas[0]
		if (ObjType=='uis.papl.transformer'):
			obj_mas=self.search([('photo_id.id','=',PhotoID),('transformer_id.id','=',ObjID)])
			if (len(obj_mas)>0):
				visObject=obj_mas[0]
		if (visObject is None):
			visObject=self.create({'name':ObjName})
		visObject.photo_id=int(PhotoID)
		visObject.rect_coordinate_json=JSON
		visObject.image=IMG
		if (ObjType=='uis.papl.pillar'):
			visObject.pillar_id=int(ObjID)
		if (ObjType=='uis.papl.transformer'):
			visObject.transformer_id=int(ObjID)
	@api.model
	def delete_objects(self,PhotoID,ObjType,Ref_Object_IDs):
		if (ObjType=='uis.papl.pillar'):
			obj_mas=self.search([('photo_id.id','=',PhotoID),('pillar_id.id','not in',Ref_Object_IDs)])
			for obj in obj_mas:
				obj.unlink()
		if (ObjType=='uis.papl.transformer'):
			obj_mas=self.search([('photo_id.id','=',PhotoID),('transformer_id.id','not in',Ref_Object_IDs)])
			for obj in obj_mas:
				obj.unlink()

	
class uis_ap_photo_mod_vis_object(models.Model):
	_inherit='uis.ap.photo'
	vis_objects_ids=fields.One2many('uis.ap.vis_object','photo_id','Visual objects')
	image_vis_obj=fields.Binary(string='Image with visual objects')
	image_vis_obj_800=fields.Binary(string='Image (800px) wuth visual objects')
	
from openerp import models, fields, api

class apl_mro_defect(models.Model):
	DEFECT_CATEGORY = [('1', 'Minor'),('2', 'Major'),('3', 'Pre-fault'),('4', 'Emergency')]
	STATE_SELECTION = [('draft', 'DRAFT'),('confirmed', 'CONFIRMED'),('planed', 'PLANED'),('work', 'WORK'),('done', 'DONE'),('cancel', 'CANCELED')]
	OBJECT_SELECTION = [('pillar','Pillar'),('transformer','Transformer'),('tap','Tap')]
	 
	_name='uis.papl.mro.defect'
	_description='Defects'
	name=fields.Char('Defect name', size=64,required=True)
	description=fields.Text('Defect Description')
	apl_id=fields.Many2one('uis.papl.apl',string='Air power line',required=True)
	pillar_id=fields.Many2many('uis.papl.pillar', relation='defect_pillar_rel',column1='defect_id', column2='pillar_id')
	pillar_id_2=fields.Many2many('uis.papl.pillar', store=False,compute='_get_pillar')
	tap_id=fields.Many2many('uis.papl.tap', relation='defect_tap_rel',column1='defect_id', column2='tap_id')
	tap_id_2=fields.Many2many('uis.papl.tap', store=False, compute='_get_tap')
	transformer_id=fields.Many2many('uis.papl.transformer',relation='defect_transformer_rel',column1='defect_id', column2='transformer_id')
	transformer_id_2=fields.Many2many('uis.papl.transformer',store=False,compute='_get_transformer')
	state=fields.Selection(STATE_SELECTION, 'Status', readonly=True, default='draft')
	category=fields.Selection(DEFECT_CATEGORY,'Category',default='1')
	defect_photo_area=fields.Text('Defect Photo Area')
	photo_id=fields.Many2one('uis.ap.photo', string='Photo', readonly=True)
	image_800=fields.Binary(string='Image800', store=False,related='photo_id.image_800')
	longitude=fields.Float(digits=(2,6), string='Longitude', readonly=True)
	latitude=fields.Float(digits=(2,6), string='Latitude', readonly=True)
	def_object_type=fields.Selection(OBJECT_SELECTION,'Defect Object Type')
	@api.model
	def create_defect(self,DName, AplID, ObjType, ObjIDS, DCat, DDesc, PhotoID, Longitude, Latitude, DJSON):
		defect=self.create({'name':DName,'apl_id':int(AplID)})
		if (ObjType=='uis.papl.pillar'):
			defect.def_object_type='pillar'
			for pillarID in ObjIDS:
				defect.pillar_id=[(4,int(pillarID),0)]
		if (ObjType=='uis.papl.transformer'):
			defect.def_object_type='transformer'
			for transID in ObjIDS:
				defect.transformer_id=[(4,int(transID),0)]
		defect.category=DCat
		defect.description=DDesc
		defect.photo_id=int(PhotoID)
		defect.longitude=Longitude
		defect.latitude=Latitude
		defect.defect_photo_area=DJSON
		return defect.id
	@api.depends('pillar_id')
	def _get_pillar(self):
		for defect in self:
			for pillar in defect.pillar_id:
				defect.pillar_id_2=[(4,pillar.id,0)]
	@api.depends('tap_id')
	def _get_tap(self):
		for defect in self:
			for tap in defect.tap_id:
				defect.tap_id_2=[(4,tap.id,0)]
	@api.depends('transformer_id')
	def _get_transformer(self):
		for defect in self:
			for transfomer in defect.transformer_id:
				defect.transformer_id_2=[(4,transfomer.id,0)]
	@api.onchange('apl_id','def_object_type')
	def change_def_object(self):
		self.transformer_id=[]
		self.pillar_id=[]
		self.tap_id=[]
	@api.multi
	def create_defect_from_wizard(self):
		return
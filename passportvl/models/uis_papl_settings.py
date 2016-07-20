class uis_licenses(models.Model):
	_name='uis.licenses'
	_description='Licenses of AG System'
	name=fields.Char('Name')
	lic_type=fields.Char('Type')
	
class uis_settings(models.Model):
	_name='uis.settings'
	_description='Settings of AG application'
	uid=fields.Many2one('res.users', string='User')
	auto_normalize_tap=fields.Boolean(string='Auto normalize tap', default=True)
	auto_magnetic_pillar_to_tap=fields.Boolean(string='Auto magnetic pillar to line of tap', default=True)
	google_elevation_API=fields.Char(string='Google elevation API')

class uis_settings_pillar_icon(models.Model):
	_name='uis.settings.pillar.cut'
	_description='Icons and SVG path for pillars'
	def_icon=fields.Boolean(string='Default icon')
	pillar_type_id=fields.Many2one('uis.papl.pillar.type', string="Type")
	pillar_cut_id=fields.Many2one('uis.papl.pillar.cut', string="Cut")
	pillar_icon_code=fields.Char(string="Icon code", compute="_def_icon_code")
	
	def _def_icon_code(self):
		for spi in self:
			spi.pillar_icon_code=str(spi.pillar_type_id.id)+'_'+str(spi.pillar_cut_id.id)
			if spi.def_icon:
				spi.pillar_icon_code="DEF"
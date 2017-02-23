# -*- coding: utf-8 -*-
from openerp import models, fields, api

class uis_licenses(models.Model):
	_name='uis.licenses'
	_description='Licenses of AG System'
	name=fields.Char('Name')
	lic_type=fields.Char('Type')

class uis_global_settings(models.Model):
	_name='uis.global.settings'
	_description='Global settings'
	name=fields.Char(string='Name')
	var=fields.Char(string='Variable')
	desc=fields.Text(string='Description')
	char_value=fields.Text(string='Value', compute='_get_char_value')
	value=fields.Text(string='Value')
	enabled=fields.Boolean(string="Enabled")
	
	@api.depends('value')
	def _get_char_value(self):
		for gs in self:
			chstr=gs.value
			if len(chstr)>100:
				chstr=chstr[:100]+'...'
			gs.char_value=chstr
		return True
	
class uis_settings(models.Model):
	_name='uis.settings'
	_description='Settings of AG application'
	user_ids=fields.Many2one('res.users', string='Users')
	auto_normalize_tap=fields.Boolean(string='Auto normalize tap', default=True)
	auto_magnetic_pillar_to_tap=fields.Boolean(string='Auto magnetic pillar to line of tap', default=True)
	google_elevation_API=fields.Char(string='Google elevation API')
	
	_sql_constraints = [('uid_unique', 'unique(uid)', 'Settings for this user already exists')]

class uis_settings_apl_view(models.Model):
	_name='uis.papl.view.settings.apl'
	_description='Settings foe view apl lines'
	def_show=fields.Boolean(string='Default_view')
	line_code=fields.Char(string="Line code", compute="_def_line_code", store=True)
	stroke_width=fields.Integer(string='Stroke width')
	stroke_color=fields.Char(string="Stroke color")
	symbol_path=fields.Char(string="Symbol path")
	symbol_repeat=fields.Integer(string="Symbol repeat")
	voltage=fields.Integer(string="Voltage")
	apl_type=fields.Char(string="Type of APL")
	add_attribute=fields.Char(string="add atribute")
	enabled=fields.Boolean(string="Enabled")
	
	@api.depends('voltage','apl_type')
	def _def_line_code(self):
		for sav in self:
			atype="ND"
			avolt="ND"
			if sav.apl_type:
				atype=sav.apl_type
			if sav.voltage:
				avolt=str(sav.voltage)
			sav.line_code=avolt+'_'+atype
			if sav.def_show:
				sav.line_code="DEF"
	
class uis_settings_pillar_icon(models.Model):
	_name='uis.icon.settings.pillar'
	_description='Icons and SVG path for pillars'
	def_icon=fields.Boolean(string='Default icon')
	pillar_type_id=fields.Many2one('uis.papl.pillar.type', string="Type")
	pillar_cut_id=fields.Many2one('uis.papl.pillar.cut', string="Cut")
	pillar_icon_code=fields.Char(string="Icon code", compute="_def_icon_code", store=True)
	pillar_icon_path=fields.Char(string="Icon SVG path")
	fill_path=fields.Boolean(string="Fill Path")
	fill_color=fields.Char(string="Fill Color")
	stroke_width=fields.Integer(string="Stroke width")
	stroke_color=fields.Char(string="Stroke Color")
	add_zoom=fields.Float(digits=(6,2), string="additional zoom", default=1)
	anchor=fields.Char(string="Anchor Point")
	
	@api.depends('pillar_type_id','pillar_cut_id')
	def _def_icon_code(self):
		for spi in self:
			spi.pillar_icon_code=str(spi.pillar_type_id.id)+'_'+str(spi.pillar_cut_id.id)
			if spi.def_icon:
				spi.pillar_icon_code="DEF"
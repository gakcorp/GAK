# -*- coding: utf-8 -*-
from openerp import models, fields, api

class uis_settings_layers(models.Model):
	_name='uis.settings.layers'
	_description='Layers for maps'
	name=fields.Char(string="Name")
	icon=fields.Binary(string="Icon image")
	enabled=fields.Boolean(string="enabled")
	shown=fields.Boolean(string="show layer")
	order=fields.Integer(string="order")
	maxzoom=fields.Integer(string="Layer Max Zoom")
	minzoom=fields.Integer(string="Layer Min Zoom")
	auto_stretch_mz=fields.Boolean(string="Stretch tile after maxzoom")
	cache=fields.Boolean(string="Cashed layer")
	url_code=fields.Text(string="Get Tule URL function")
	cache_life_day=fields.Integer(string="Cache Live time")

class uis_cache_layers(models.Model):
	_name='uis.cache.layers'
	_descrition='Cache'
	name=fields.Char(string="name" compute="_def_cache_name", store=True)
	layer=fields.Many2one('uis.settings.layers', string="Layer")
	x=fields.Integer(string="X tile")
	y=fields.integer(string="Y tile")
	z=fields.Integer(string="zoom layer")
	origin_url=fields.Char(string="origin URL string")
	cache_date=fields.Date(string="Cache date")
	cache_end_life=fields.Date(string="Cache end life date")
	is_stretch_tile=fields.Boolean(string="is stretch tile")
	
	@api.depends('pillar_type_id','pillar_cut_id')
	def _def_cache_name(self):
		for cl in self:
			cl.name=cl.layer.name+'/'+str(sl.z)+'/'+str(sl.x)+'/'+str(sl.y)
			if spi.def_icon: